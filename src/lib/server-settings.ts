// ─── Lecture des réglages côté serveur (SEO, JSON-LD, emails) ───
//
// Même table `settings` que /api/settings et que l'application mobile.
// Utilisée au rendu des pages (titres, données structurées) et lors de
// l'envoi des emails : les horaires affichés en dur n'existent plus.
//
// React `cache()` : dédoublonné par requête (layout + generateMetadata).

import { cache } from "react";
import {
  DEFAULT_SETTINGS,
  parseHours,
  type RestaurantSettings,
} from "@/lib/hours";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export const getServerSettings = cache(async (): Promise<RestaurantSettings> => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return DEFAULT_SETTINGS;
  try {
    // Revalidation courte : un horaire modifié apparaît en moins de
    // 2 min dans le SEO/JSON-LD sans rendre toutes les pages dynamiques.
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/settings?id=eq.1&select=*&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 120, tags: ["settings"] },
      }
    );
    if (!res.ok) return DEFAULT_SETTINGS;
    const row = (await res.json())?.[0];
    if (!row) return DEFAULT_SETTINGS;

    let closed = Boolean(row.closed_now);
    if (closed && row.closed_until && new Date(row.closed_until).getTime() < Date.now()) {
      closed = false;
    }

    let hours = DEFAULT_SETTINGS.hours;
    if (row.hours) {
      const raw =
        typeof row.hours === "string" ? safeParse(row.hours) : row.hours;
      const ok = parseHours(raw);
      if (ok) hours = ok;
    }

    return {
      closed_now: closed,
      closed_message: row.closed_message ?? "",
      closed_until: closed ? row.closed_until ?? null : null,
      accepts_delivery: row.accepts_delivery ?? true,
      accepts_pickup: row.accepts_pickup ?? true,
      prep_minutes: row.prep_minutes ?? 20,
      hours,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

// ─── Note et avis Google réels (cache Supabase, table alimentée
// par /api/reviews/google) ───────────────────────────────────────

export type GoogleRating = {
  rating: number;
  total: number;
  mapsUrl: string | null;
  reviews: {
    author_name: string;
    rating: number;
    text: string;
    publish_time: string | null;
  }[];
};

export const getGoogleRating = cache(async (): Promise<GoogleRating | null> => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/google_reviews_cache?id=eq.1&select=*&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        // Cache identique à l'API avis : 12 h
        next: { revalidate: 43200, tags: ["google-reviews"] },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const payload = rows?.[0]?.payload;
    if (!payload || typeof payload !== "object") return null;
    const rating = Number(payload.rating);
    const total = Number(payload.total);
    if (!rating || !total) return null;

    const reviews = Array.isArray(payload.reviews)
      ? payload.reviews
          .filter(
            (r: { rating?: number; text?: string; author_name?: string }) =>
              typeof r?.text === "string" &&
              r.text.length > 15 &&
              (r.rating ?? 0) >= 4
          )
          .slice(0, 5)
          .map(
            (r: {
              author_name?: string;
              rating?: number;
              text: string;
              publish_time?: string | null;
            }) => ({
              author_name: r.author_name || "Client Google",
              rating: r.rating ?? 5,
              text: r.text.slice(0, 400),
              publish_time: r.publish_time ?? null,
            })
          )
      : [];

    return {
      rating,
      total,
      mapsUrl: typeof payload.maps_url === "string" ? payload.maps_url : null,
      reviews,
    };
  } catch {
    return null;
  }
});
