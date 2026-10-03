import { NextRequest, NextResponse } from "next/server";

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Les avis Google sont facturés au tier "Enterprise + Atmosphere"
// (1 000 requêtes gratuites/mois). On met donc TOUJOURS en cache
// pendant 12 h : ~60 appels/mois au lieu de plusieurs milliers.
const CACHE_HOURS = 12;

interface GoogleReview {
  authorAttribution?: { displayName?: string; photoUri?: string };
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
}

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

async function readCache() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await sb("google_reviews_cache?id=eq.1&select=*&limit=1");
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    const row = rows[0];
    const age = (Date.now() - new Date(row.updated_at).getTime()) / 3600000;
    if (age > CACHE_HOURS) return null;
    return row.payload;
  } catch {
    return null;
  }
}

async function writeCache(payload: unknown) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await sb("google_reviews_cache", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        id: 1,
        payload,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch {
    /* le cache est optionnel */
  }
}

/**
 * GET /api/reviews/google
 * Avis de la fiche Google Business, mis en cache 12 h.
 * ?force=1 avec X-Admin-Auth pour rafraîchir immédiatement.
 */
export async function GET(request: NextRequest) {
  const force =
    request.nextUrl.searchParams.get("force") === "1" &&
    request.headers.get("X-Admin-Auth") ===
      (process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD);

  // 1. Cache
  if (!force) {
    const cached = await readCache();
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }
  }

  // 2. Configuration absente → réponse vide (l'app masque la section)
  if (!GOOGLE_KEY || !PLACE_ID) {
    return NextResponse.json({
      reviews: [],
      rating: null,
      total: 0,
      configured: false,
    });
  }

  // 3. Appel Google Places API (New)
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=fr`,
      {
        headers: {
          "X-Goog-Api-Key": GOOGLE_KEY,
          "X-Goog-FieldMask":
            "displayName,rating,userRatingCount,reviews,googleMapsUri",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const stale = await readCache();
      if (stale) return NextResponse.json({ ...stale, stale: true });
      return NextResponse.json({ reviews: [], rating: null, total: 0 });
    }

    const data = await res.json();

    const reviews = ((data.reviews ?? []) as GoogleReview[])
      .filter((r) => (r.rating ?? 0) >= 4) // on met en avant les bons avis
      .map((r) => ({
        author_name: r.authorAttribution?.displayName ?? "Client Google",
        author_photo: r.authorAttribution?.photoUri ?? null,
        rating: r.rating ?? 5,
        text: (r.text?.text ?? r.originalText?.text ?? "").slice(0, 400),
        relative_time_description: r.relativePublishTimeDescription ?? "",
        publish_time: r.publishTime ?? null,
      }))
      .filter((r) => r.text.length > 15);

    const payload = {
      reviews,
      rating: data.rating ?? null,
      total: data.userRatingCount ?? 0,
      maps_url: data.googleMapsUri ?? null,
      configured: true,
      fetched_at: new Date().toISOString(),
    };

    await writeCache(payload);
    return NextResponse.json(payload);
  } catch {
    const stale = await readCache();
    if (stale) return NextResponse.json({ ...stale, stale: true });
    return NextResponse.json({ reviews: [], rating: null, total: 0 });
  }
}
