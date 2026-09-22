import { NextRequest, NextResponse } from "next/server";
import { scryptSync, randomBytes } from "crypto";

// ─── Inscription par e-mail et mot de passe ────────────────────
//
// POURQUOI CETTE ROUTE EXISTE
//
// L'application appelait `/api/auth/send-confirmation` pour créer un
// compte. Or cette route ne crée RIEN : elle se contente d'envoyer un
// e-mail de confirmation, et elle exige un champ `token` que
// l'application n'envoie pas (il était généré par le site web).
//
// Résultat, constaté en production :
//
//     POST /api/auth/send-confirmation
//       { email, name, password, phone }
//     → 400  { "error": "Paramètres manquants" }
//
// Aucun compte ne pouvait être créé depuis l'application. Le message
// « Paramètres manquants » est celui que voyaient les clients.
//
// Cette route fait le vrai travail : elle crée l'utilisateur dans
// Supabase Auth (que `/api/auth/login` interroge) ET la fiche dans la
// table `customers`, puis déclenche l'e-mail de bienvenue.

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Même format que `/api/auth/reset` : `sel:scrypt` */
function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function sb(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE!,
      Authorization: `Bearer ${SUPABASE_SERVICE}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const name = String(body?.name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();

    // ─── Contrôles ─────────────────────────────────────────────
    // Chaque message dit CE QUI manque : « Paramètres manquants »
    // ne permettait ni au client ni à nous de comprendre.
    if (!email) {
      return NextResponse.json({ error: "E-mail requis" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "E-mail invalide" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 8 caractères" },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE) {
      return NextResponse.json(
        { error: "Service indisponible" },
        { status: 503 }
      );
    }

    // ─── Compte déjà existant ? ────────────────────────────────
    const dejaRes = await sb(
      `customers?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
    );
    if (dejaRes.ok) {
      const rows = await dejaRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet e-mail" },
          { status: 409 }
        );
      }
    }

    // ─── Téléphone déjà utilisé ? ──────────────────────────────
    // La colonne `phone` porte un index UNIQUE (idx_customers_phone).
    // Sans ce contrôle, l'insertion échouait en base avec une erreur
    // PostgreSQL 23505, et la route répondait « Création impossible
    // pour le moment » (502) — un message que personne ne pouvait
    // interpréter.
    //
    // Constaté en production : toute inscription réutilisant un
    // numéro existant échouait sans explication.
    if (phone) {
      const telRes = await sb(
        `customers?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`
      );
      if (telRes.ok) {
        const rows = await telRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return NextResponse.json(
            { error: "Ce numéro de téléphone est déjà utilisé" },
            { status: 409 }
          );
        }
      }
    }

    // ─── 1. Utilisateur Supabase Auth ──────────────────────────
    // C'est CE compte que `/api/auth/login` vérifie. Sans lui, la
    // connexion échouerait juste après l'inscription.
    //
    // `email_confirm: true` : nous validons l'adresse par notre
    // propre e-mail de bienvenue. Sans cela, Supabase bloquerait la
    // connexion tant que son lien à lui n'est pas cliqué, et le
    // client resterait coincé.
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE,
        Authorization: `Bearer ${SUPABASE_SERVICE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone },
      }),
    });

    if (!authRes.ok) {
      const txt = await authRes.text();
      // 422 = l'adresse existe déjà côté Auth, sans fiche client
      if (authRes.status === 422 || txt.includes("already been registered")) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet e-mail" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Création impossible pour le moment" },
        { status: 502 }
      );
    }

    // ─── 2. Fiche client ───────────────────────────────────────
    // Elle porte le profil, la fidélité et les adresses.
    const token = randomBytes(24).toString("hex");
    const cliRes = await sb("customers", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        email,
        name,
        phone: phone || null,
        password_hash: hashPassword(password),
        is_verified: true,
        verification_token: token,
      }),
    });

    if (!cliRes.ok) {
      // On lit le motif exact renvoyé par PostgreSQL avant d'annuler.
      // Un 502 muet est indébogable, aussi bien pour le client que
      // pour nous.
      const detail = await cliRes.text().catch(() => "");
      const doublon = detail.includes("23505");
      const surTelephone = detail.includes("phone");

      // L'utilisateur Auth existe mais pas sa fiche : on annule tout
      // plutôt que de laisser un compte à moitié créé, impossible à
      // recréer ensuite (l'e-mail serait « déjà pris »).
      const users = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            apikey: SUPABASE_SERVICE,
            Authorization: `Bearer ${SUPABASE_SERVICE}`,
          },
        }
      );
      if (users.ok) {
        const d = await users.json();
        const id = d?.users?.[0]?.id;
        if (id) {
          await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
            method: "DELETE",
            headers: {
              apikey: SUPABASE_SERVICE,
              Authorization: `Bearer ${SUPABASE_SERVICE}`,
            },
          }).catch(() => {});
        }
      }
      if (doublon) {
        return NextResponse.json(
          {
            error: surTelephone
              ? "Ce numéro de téléphone est déjà utilisé"
              : "Un compte existe déjà avec ces informations",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Création impossible pour le moment" },
        { status: 502 }
      );
    }

    // ─── 3. E-mail de bienvenue ────────────────────────────────
    //
    // ⚠️ Cet appel DOIT être attendu.
    //
    // Sans `await`, la fonction rend sa réponse et Vercel met fin à
    // l'exécution immédiatement : la requête HTTP en cours est tuée
    // avant d'atteindre Resend. Le compte est créé, mais l'e-mail ne
    // part jamais — exactement le symptôme constaté.
    //
    // C'est le piège classique du « fire and forget » en
    // environnement serverless : le code paraît juste, et il l'est
    // sur un serveur classique. Pas ici.
    //
    // On attend donc, tout en gardant l'envoi non bloquant : si
    // Resend échoue, le compte reste utilisable et on le signale
    // dans la réponse.
    let emailEnvoye = false;
    try {
      const origine = new URL(request.url).origin;
      const mailRes = await fetch(`${origine}/api/auth/send-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, token }),
      });
      emailEnvoye = mailRes.ok;
    } catch {
      emailEnvoye = false;
    }

    return NextResponse.json({
      success: true,
      name,
      email,
      phone,
      verified: true,
      // Permet à l'application d'adapter son message : inutile de
      // promettre un e-mail qui n'est jamais parti.
      emailEnvoye,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** Sonde de disponibilité utilisée par l'application */
export async function GET() {
  return NextResponse.json({ available: true });
}
