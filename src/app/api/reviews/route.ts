import { NextRequest, NextResponse } from "next/server";
import { estAdmin } from "@/lib/admin-auth";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sb(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

// ─── Récompense d'avis ────────────────────────────────────────
//
// L'app promettait « -10 % avec le code MERCI10 » après un avis…
// mais ce code n'existait nulle part en base : le client arrivait au
// panier, saisissait MERCI10, et payait plein tarif. Promesse non
// tenue, et personne ne s'en rendait compte.
//
// Désormais le serveur crée un code PERSONNEL, utilisable UNE fois,
// valable 30 jours, rattaché à la commande notée. Deux avis sur la
// même commande renvoient le même code : impossible d'en collectionner.

/** Format UUID v1-v5 — la colonne order_uuid n'accepte rien d'autre */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RECOMPENSE_POURCENT = 10;
const RECOMPENSE_JOURS = 30;

/** Alphabet sans caractères confondables (0/O, 1/I, 8/B) */
const ALPHABET = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";

function genererCode(): string {
  const octets = crypto.getRandomValues(new Uint8Array(6));
  let s = "";
  for (const o of octets) s += ALPHABET[o % ALPHABET.length];
  return `MERCI-${s}`;
}

export type Recompense = { code: string; discount: number; expiresAt: string };

/**
 * Crée (ou retrouve) le code de remerciement d'une commande.
 * Renvoie null si quoi que ce soit échoue : mieux vaut ne rien
 * promettre que promettre un code qui ne marche pas.
 */
async function recompenserAvis(orderUuid: string): Promise<Recompense | null> {
  const etiquette = `avis:${orderUuid}`;

  // Propriétaire du code : le client qui a passé la commande notée.
  // Sans ça, un code personnel qui traîne sur une capture d'écran
  // pourrait être utilisé par n'importe qui.
  let ownerEmail: string | null = null;
  let ownerPhone: string | null = null;
  try {
    const cmd = await sb(
      `orders?uuid=eq.${encodeURIComponent(orderUuid)}&select=customer_email,customer_phone&limit=1`
    );
    if (cmd.ok) {
      const [o] = await cmd.json();
      ownerEmail = o?.customer_email ? String(o.customer_email).toLowerCase() : null;
      ownerPhone = o?.customer_phone ? String(o.customer_phone).replace(/\D/g, "") : null;
    }
  } catch { /* code sans propriétaire plutôt que pas de code */ }

  try {
    // Déjà récompensé ? On renvoie le même code.
    const deja = await sb(
      `promo_codes?label=eq.${encodeURIComponent(etiquette)}&select=code,discount,expires_at&limit=1`
    );
    if (deja.ok) {
      const [row] = await deja.json();
      if (row?.code) {
        return {
          code: row.code,
          discount: Number(row.discount) || RECOMPENSE_POURCENT,
          expiresAt: row.expires_at,
        };
      }
    }

    const expiresAt = new Date(
      Date.now() + RECOMPENSE_JOURS * 86_400_000
    ).toISOString();

    // Deux tentatives : le tirage peut (très rarement) tomber sur un
    // code déjà pris, la clé primaire refuserait alors l'insertion.
    for (let essai = 0; essai < 2; essai++) {
      const code = genererCode();
      const ligne: Record<string, unknown> = {
        code,
        discount: RECOMPENSE_POURCENT,
        type: "percent",
        label: etiquette,
        max_uses: 1,
        uses: 0,
        active: true,
        expires_at: expiresAt,
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
      };

      let res = await sb("promo_codes", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(ligne),
      });

      // Colonnes « propriétaire » pas encore créées : on enregistre
      // quand même le code, sans elles. Mieux vaut un code valable
      // pour tout le monde que pas de cadeau du tout.
      if (!res.ok) {
        delete ligne.owner_email;
        delete ligne.owner_phone;
        res = await sb("promo_codes", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(ligne),
        });
      }
      if (res.ok) {
        return { code, discount: RECOMPENSE_POURCENT, expiresAt };
      }
    }
  } catch {
    // silencieux : l'avis est déjà enregistré, c'est le principal
  }
  return null;
}

/**
 * GET /api/reviews
 *
 * ⚠️ CONFIDENTIALITÉ (RGPD)
 * L'ancienne version renvoyait `email`, `device_id` et `order_uuid`
 * à tout le monde : le fichier d'adresses e-mail des clients était
 * téléchargeable publiquement. On ne sélectionne désormais QUE les
 * colonnes réellement nécessaires à l'affichage.
 *
 * Header X-Admin-Auth → renvoie aussi les avis en attente de validation.
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const admin = request.headers.get("X-Admin-Auth");

  // ─── Vue admin : modération ───────────────────────────────
  if (admin) {
    if (!(await estAdmin(admin))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const res = await sb(
      "reviews?select=id,name,email,rating,comment,is_approved,is_rejected,created_at,approved_at,order_uuid,device_id&order=created_at.desc"
    );
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
    return NextResponse.json({ reviews: await res.json() });
  }

  // ─── Vue publique : avis approuvés, sans donnée personnelle ─
  const res = await sb(
    "reviews?is_approved=eq.true&is_rejected=eq.false" +
      "&select=id,name,rating,comment,created_at" +
      "&order=created_at.desc&limit=50"
  );
  if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

  const rows = (await res.json()) as Array<{
    id: number; name: string | null; rating: number | null;
    comment: string | null; created_at: string;
  }>;

  // Le prénom seul suffit : « Jean Dupont » → « Jean D. »
  const reviews = rows.map((r) => {
    const parts = String(r.name ?? "Client").trim().split(/\s+/);
    const shortName =
      parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
        : parts[0] || "Client";
    return {
      id: r.id,
      name: shortName,
      author_name: shortName, // compatibilité app
      rating: r.rating ?? 5,
      comment: r.comment ?? "",
      created_at: r.created_at,
    };
  });

  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  return NextResponse.json(
    { reviews, count: reviews.length, average: avg },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}

/**
 * POST /api/reviews — dépôt d'un avis (non publié tant que non validé)
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim().slice(0, 60);
    const rating = Number(body?.rating);
    const comment = String(body?.comment ?? "").trim().slice(0, 1000);
    const email = String(body?.email ?? "").trim().slice(0, 120) || null;
    const deviceId = String(body?.deviceId ?? body?.device_id ?? "").slice(0, 64) || null;

    if (!name || !comment) {
      return NextResponse.json({ error: "Nom et commentaire requis" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Note invalide" }, { status: 400 });
    }

    const brut = String(body?.orderUuid ?? body?.order_uuid ?? "").trim();
    const uuidValide = UUID_RE.test(brut) ? brut : null;

    // Un seul avis par appareil toutes les 24 h (anti-spam)
    if (deviceId) {
      const since = new Date(Date.now() - 86_400_000).toISOString();
      const dup = await sb(
        `reviews?device_id=eq.${encodeURIComponent(deviceId)}&created_at=gt.${since}&select=id&limit=1`
      );
      if (dup.ok) {
        const rows = await dup.json();
        if (Array.isArray(rows) && rows.length) {
          return NextResponse.json(
            { error: "Vous avez déjà laissé un avis récemment. Merci !" },
            { status: 429 }
          );
        }
      }
    }

    const res = await sb("reviews", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        name, email, rating, comment,
        device_id: deviceId,
        // Un identifiant mal formé faisait échouer TOUT l'avis
        // (colonne de type uuid) : le client voyait « Erreur » et son
        // avis partait à la poubelle. On l'ignore plutôt.
        order_uuid: uuidValide,
        is_approved: false,
        is_rejected: false,
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

    // Récompense : uniquement pour un avis rattaché à une vraie
    // commande. Un avis anonyme depuis le site ne donne rien —
    // sinon le code se distribuerait à l'infini.
    const reward = uuidValide ? await recompenserAvis(uuidValide) : null;

    return NextResponse.json({
      success: true,
      message: "Merci ! Votre avis sera publié après vérification.",
      reward,
    });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

/**
 * PATCH /api/reviews — modération (admin)
 * Body : { id, action: "approve" | "reject" }
 */
export async function PATCH(request: NextRequest) {
  const admin = request.headers.get("X-Admin-Auth");
  if (!admin || !(await estAdmin(admin))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    // On accepte `reviewId` (format de l'ancienne route déployée) et `id`
    const id = Number(body?.reviewId ?? body?.id);
    const action = String(body?.action ?? "");
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // "delete" supprime définitivement — conservé pour compatibilité
    if (action === "delete") {
      const del = await sb(`reviews?id=eq.${id}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      if (!del.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
      return NextResponse.json({ success: true, deleted: id });
    }

    const patch =
      action === "approve"
        ? { is_approved: true, is_rejected: false, approved_at: new Date().toISOString() }
        : action === "reject" || action === "hide"
        ? { is_approved: false, is_rejected: true }
        : null;

    if (!patch) return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

    const res = await sb(`reviews?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}
