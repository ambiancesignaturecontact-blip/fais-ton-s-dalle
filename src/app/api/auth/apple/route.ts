import { NextRequest, NextResponse } from "next/server";
import { createHash, createPublicKey, verify as verifySig } from "crypto";

// ─── Connexion avec Apple ──────────────────────────────────────
//
// L'application envoie l'`identityToken` renvoyé par iOS. C'est un
// JWT signé par Apple qui contient l'identifiant du compte et,
// éventuellement, l'e-mail.
//
// ⚠️ Ce jeton est fourni par le CLIENT : on ne peut pas lui faire
// confiance sans vérifier sa signature. N'importe qui pourrait sinon
// forger un jeton et se connecter au compte de quelqu'un d'autre.
//
// La vérification se fait avec les clés publiques d'Apple
// (https://appleid.apple.com/auth/keys), en contrôlant :
//   · la signature RSA ;
//   · l'émetteur (`iss`) : appleid.apple.com ;
//   · le destinataire (`aud`) : notre Bundle ID ;
//   · la date d'expiration (`exp`).
//
// ─── Le piège de l'e-mail masqué ───────────────────────────────
//
// Apple permet de « Masquer mon e-mail ». Le client fournit alors une
// adresse de relais en `@privaterelay.appleid.com`. Elle fonctionne
// pour les e-mails, mais elle est propre à CETTE application.
//
// Surtout : Apple n'envoie le nom et l'e-mail qu'à la TOUTE PREMIÈRE
// connexion. Ensuite, seul le `sub` (identifiant stable) est présent.
// C'est donc `sub` — et non l'e-mail — qui identifie le compte.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Bundle ID de l'application — destinataire attendu du jeton */
const BUNDLE_ID = process.env.APPLE_BUNDLE_ID || "com.faistonsdalle.app";

const APPLE_ISS = "https://appleid.apple.com";
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

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

/** base64url → Buffer */
function b64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

interface AppleKey {
  kid: string; n: string; e: string; alg: string; kty: string;
}

// Les clés d'Apple changent rarement : un cache d'une heure évite un
// appel réseau à chaque connexion, sans risquer de rater une rotation.
let cacheKeys: { at: number; keys: AppleKey[] } | null = null;

async function clesApple(): Promise<AppleKey[]> {
  if (cacheKeys && Date.now() - cacheKeys.at < 3_600_000) return cacheKeys.keys;
  const res = await fetch(APPLE_KEYS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Clés Apple indisponibles");
  const json = await res.json();
  const keys: AppleKey[] = json?.keys ?? [];
  cacheKeys = { at: Date.now(), keys };
  return keys;
}

interface Charge {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  is_private_email?: string | boolean;
  iss: string;
  aud: string;
  exp: number;
}

/**
 * Vérifie la signature du jeton et renvoie sa charge utile.
 * Lève une erreur au moindre doute — jamais de repli permissif.
 */
async function verifierJeton(token: string): Promise<Charge> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Jeton malformé");

  const entete = JSON.parse(b64url(parts[0]).toString("utf8"));
  const charge = JSON.parse(b64url(parts[1]).toString("utf8")) as Charge;

  if (entete.alg !== "RS256") throw new Error("Algorithme refusé");

  const cle = (await clesApple()).find((k) => k.kid === entete.kid);
  if (!cle) throw new Error("Clé Apple inconnue");

  // Reconstruit la clé publique RSA à partir du modulo et de l'exposant
  const publique = createPublicKey({
    key: { kty: "RSA", n: cle.n, e: cle.e } as never,
    format: "jwk",
  });

  const ok = verifySig(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    publique,
    b64url(parts[2])
  );
  if (!ok) throw new Error("Signature invalide");

  if (charge.iss !== APPLE_ISS) throw new Error("Émetteur inattendu");
  if (charge.aud !== BUNDLE_ID) throw new Error("Destinataire inattendu");
  if (charge.exp * 1000 < Date.now()) throw new Error("Jeton expiré");
  if (!charge.sub) throw new Error("Identifiant absent");

  return charge;
}

/**
 * POST /api/auth/apple
 *
 * Body : { identityToken, fullName?, email? }
 *        { probe: true }  → sonde de disponibilité
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body?.probe === true) {
      return NextResponse.json({ available: true });
    }

    const token = String(body?.identityToken ?? "");
    if (!token) {
      return NextResponse.json({ error: "Jeton requis" }, { status: 400 });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    let charge: Charge;
    try {
      charge = await verifierJeton(token);
    } catch (e) {
      // On ne détaille pas la raison au client : cela aiderait
      // quelqu'un qui cherche à forger un jeton.
      console.warn("[apple] jeton refusé :", (e as Error).message);
      return NextResponse.json({ error: "Connexion Apple refusée" }, { status: 401 });
    }

    // L'identifiant Apple est haché : même si la base fuitait, il ne
    // permettrait pas de retrouver le compte Apple d'origine.
    const appleId = createHash("sha256")
      .update(`ftsd-apple:${charge.sub}`)
      .digest("hex");

    const emailApple = (charge.email ?? "").trim().toLowerCase();
    const nomFourni = String(body?.fullName ?? "").trim().slice(0, 80);

    // ─── Le compte existe-t-il déjà ? ─────────────────────────
    // On cherche d'abord par identifiant Apple, puis par e-mail :
    // un client qui s'était inscrit par e-mail doit retrouver SON
    // compte, pas en créer un second.
    let client: Record<string, unknown> | null = null;

    const parId = await sb(
      `customers?apple_id=eq.${appleId}` +
        `&select=id,name,phone,address,email,fidelity_menu_count,fidelity_discount_active&limit=1`
    );
    if (parId.ok) {
      const rows = await parId.json();
      if (Array.isArray(rows) && rows.length) client = rows[0];
    }

    if (!client && emailApple) {
      const parMail = await sb(
        `customers?email=eq.${encodeURIComponent(emailApple)}` +
          `&select=id,name,phone,address,email,fidelity_menu_count,fidelity_discount_active&limit=1`
      );
      if (parMail.ok) {
        const rows = await parMail.json();
        if (Array.isArray(rows) && rows.length) {
          const trouve = rows[0] as Record<string, unknown>;
          client = trouve;
          // On rattache l'identifiant Apple au compte existant : à la
          // prochaine connexion, il sera reconnu même si Apple
          // n'envoie plus l'e-mail.
          await sb(`customers?id=eq.${trouve.id}`, {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ apple_id: appleId }),
          }).catch(() => {});
        }
      }
    }

    // ─── Création à la première connexion ─────────────────────
    if (!client) {
      const res = await sb("customers", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          apple_id: appleId,
          email: emailApple || null,
          // Apple n'envoie le nom qu'à la première connexion : si
          // on ne le garde pas maintenant, il est perdu à jamais.
          name: nomFourni || "Client",
        }),
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Création impossible" }, { status: 502 });
      }
      const rows = await res.json();
      client = Array.isArray(rows) ? rows[0] : null;
    } else if (nomFourni && (!client.name || client.name === "Client")) {
      // Le nom n'arrive qu'une fois : on le complète s'il manquait
      await sb(`customers?id=eq.${client.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ name: nomFourni }),
      }).catch(() => {});
      client.name = nomFourni;
    }

    if (!client) {
      return NextResponse.json({ error: "Compte indisponible" }, { status: 502 });
    }

    // Même forme de réponse que /api/auth/login : l'application
    // traite les deux parcours de la même façon.
    return NextResponse.json({
      success: true,
      name: (client.name as string) || "Client",
      phone: (client.phone as string) || "",
      address: (client.address as string) || "",
      email: (client.email as string) || "",
      // Apple a déjà vérifié l'adresse de son côté
      verified: true,
      // Prévient l'app que l'e-mail est un relais : inutile de lui
      // demander de le confirmer, et il ne faut pas s'y fier pour
      // reconnaître le client ailleurs.
      privateEmail:
        charge.is_private_email === true ||
        charge.is_private_email === "true" ||
        emailApple.endsWith("@privaterelay.appleid.com"),
      fidelity: {
        menuCount: Number(client.fidelity_menu_count ?? 0),
        discountActive: Boolean(client.fidelity_discount_active ?? false),
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** Sonde de disponibilité */
export async function GET() {
  return NextResponse.json({ available: true });
}
