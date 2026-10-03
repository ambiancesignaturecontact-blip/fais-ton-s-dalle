import { NextRequest, NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;


// ─── 🔴 Rattrapage des comptes désynchronisés ─────────────────
//
// Panne signalée par le gérant : « e-mail ou mot de passe
// incorrect alors que c'est le bon ».
//
// Explication : `/api/auth/reset` n'écrivait le nouveau mot de
// passe que dans `customers.password_hash`, jamais dans Supabase
// Auth (corrigé depuis). Les comptes qui ont subi un « mot de
// passe oublié » avant ce correctif portent donc le BON mot de
// passe en base… et l'ANCIEN dans Supabase Auth.
//
// Corriger la route de réinitialisation ne suffit pas : ces
// comptes resteraient bloqués tant que leur propriétaire ne
// refait pas la manipulation. On répare donc à la volée, au
// moment de la connexion :
//
//   1. Supabase Auth refuse ;
//   2. mais le mot de passe correspond à `password_hash` ;
//   3. → on remet Supabase Auth d'aplomb avec CE mot de passe,
//        et on laisse entrer.
//
// Aucun risque : on ne laisse entrer que si le mot de passe
// correspond à une empreinte enregistrée par nos soins.

/** Vérifie un mot de passe contre une empreinte « sel:scrypt ». */
function motDePasseCorrespond(password: string, empreinte: string): boolean {
  try {
    const [sel, attendu] = String(empreinte).split(":");
    if (!sel || !attendu) return false;
    const calcule = scryptSync(password, sel, 64).toString("hex");
    const a = Buffer.from(calcule);
    const b = Buffer.from(attendu);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Remet le mot de passe de Supabase Auth en accord avec le nôtre. */
async function reparerCompteAuth(email: string, password: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) return false;
  const entetes = {
    apikey: SUPABASE_SERVICE,
    Authorization: `Bearer ${SUPABASE_SERVICE}`,
    "Content-Type": "application/json",
  };
  try {
    const liste = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers: entetes, cache: "no-store" }
    );
    const users = liste.ok ? (await liste.json())?.users ?? [] : [];
    const compte = users.find(
      (u: { email?: string }) => (u.email ?? "").toLowerCase() === email
    );

    const res = compte?.id
      ? await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${compte.id}`, {
          method: "PUT",
          headers: entetes,
          body: JSON.stringify({ password, email_confirm: true }),
        })
      : await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: entetes,
          body: JSON.stringify({ email, password, email_confirm: true }),
        });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * POST /api/auth/login
 * Connexion réelle vérifiée par Supabase Auth.
 * Utilisée par l'application iOS/Android.
 *
 * Body : { email, password }        → 200 { name, phone, address, verified }
 * Body : { probe: true }            → 200 { available: true }  (sonde de disponibilité)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Sonde utilisée par l'app pour savoir si le service existe
    if (body?.probe === true) {
      return NextResponse.json({ available: true });
    }

    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    // ─── Vérification du mot de passe par Supabase Auth ───────────
    const authRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    let auth: Record<string, unknown> = {};
    let repare = false;

    if (authRes.ok) {
      auth = await authRes.json();
    } else {
      // Supabase refuse. Avant de dire non, on regarde si le mot de
      // passe correspond à notre propre empreinte : si oui, c'est un
      // compte désynchronisé par un ancien « mot de passe oublié ».
      let empreinte = "";
      if (SUPABASE_SERVICE) {
        try {
          const cRes = await fetch(
            `${SUPABASE_URL}/rest/v1/customers?email=eq.${encodeURIComponent(email)}` +
              `&select=password_hash&limit=1`,
            {
              headers: {
                apikey: SUPABASE_SERVICE,
                Authorization: `Bearer ${SUPABASE_SERVICE}`,
              },
              cache: "no-store",
            }
          );
          if (cRes.ok) empreinte = (await cRes.json())?.[0]?.password_hash ?? "";
        } catch { /* on refusera simplement la connexion */ }
      }

      if (!empreinte || !motDePasseCorrespond(password, empreinte)) {
        return NextResponse.json(
          { error: "Email ou mot de passe incorrect" },
          { status: 401 }
        );
      }

      repare = await reparerCompteAuth(email, password);
      if (!repare) {
        return NextResponse.json(
          { error: "Connexion momentanément indisponible, réessayez" },
          { status: 503 }
        );
      }

      // Deuxième essai : cette fois Supabase connaît le bon mot de passe.
      const second = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      if (!second.ok) {
        return NextResponse.json(
          { error: "Email ou mot de passe incorrect" },
          { status: 401 }
        );
      }
      auth = await second.json();
    }

    const userMeta =
      ((auth?.user as Record<string, unknown>)?.user_metadata as Record<string, unknown>) ?? {};
    const emailConfirmed = Boolean(
      (auth?.user as Record<string, unknown>)?.email_confirmed_at
    );

    // ─── Profil complémentaire (table customers) ──────────────────
    let profile: Record<string, unknown> = {};
    if (SUPABASE_SERVICE) {
      try {
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=name,phone,address,fidelity_menu_count,fidelity_discount_active`,
          {
            headers: {
              apikey: SUPABASE_SERVICE,
              Authorization: `Bearer ${SUPABASE_SERVICE}`,
            },
          }
        );
        if (pRes.ok) {
          const rows = await pRes.json();
          if (Array.isArray(rows) && rows.length) profile = rows[0];
        }
      } catch {
        /* profil optionnel */
      }
    }

    // On ne renvoie JAMAIS de token d'accès à l'application :
    // elle n'en a pas besoin et cela réduit la surface d'attaque.
    return NextResponse.json({
      success: true,
      name: (profile.name as string) || (userMeta.name as string) || email.split("@")[0],
      phone: (profile.phone as string) || "",
      address: (profile.address as string) || "",
      verified: emailConfirmed,
      fidelity: {
        menuCount: Number(profile.fidelity_menu_count ?? 0),
        discountActive: Boolean(profile.fidelity_discount_active ?? false),
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** Permet à l'app de sonder la route sans envoyer d'identifiants */
export async function GET() {
  return NextResponse.json({ available: true });
}
