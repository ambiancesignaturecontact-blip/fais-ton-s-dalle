import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

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
    if (admin !== ADMIN_PASSWORD) {
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
            { error: "Tu as déjà laissé un avis récemment. Merci !" },
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
        order_uuid: body?.orderUuid ?? null,
        is_approved: false,
        is_rejected: false,
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

    return NextResponse.json({
      success: true,
      message: "Merci ! Ton avis sera publié après vérification.",
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
  if (!admin || admin !== ADMIN_PASSWORD) {
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
