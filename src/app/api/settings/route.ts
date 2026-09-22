import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

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


/** Siège (tous les locaux) ou gérant (le sien uniquement) */
async function whoAmI(
  request: NextRequest
): Promise<{ ok: false } | { ok: true; siege: boolean; franchiseId: number | null }> {
  const pw = request.headers.get("X-Admin-Auth");
  if (!pw) return { ok: false };
  if (ADMIN_PASSWORD && pw === ADMIN_PASSWORD) {
    return { ok: true, siege: true, franchiseId: null };
  }
  const res = await sb(
    `franchises?admin_pin=eq.${encodeURIComponent(pw)}&active=eq.true&select=id&limit=1`
  );
  if (!res.ok) return { ok: false };
  const rows = (await res.json()) as { id: number }[];
  if (!rows.length) return { ok: false };
  return { ok: true, siege: false, franchiseId: rows[0].id };
}

/** Local visé. Par défaut : l'établissement historique. */
function franchiseDemandee(request: NextRequest): number {
  const v = Number(request.nextUrl.searchParams.get("franchise"));
  return Number.isInteger(v) && v > 0 ? v : 1;
}

/** Horaires par défaut : 7j/7, 11h30 → 03h00 */
const DEFAULT_HOURS: Record<string, { open: string; close: string } | null> = {
  "0": { open: "11:30", close: "03:00" },
  "1": { open: "11:30", close: "03:00" },
  "2": { open: "11:30", close: "03:00" },
  "3": { open: "11:30", close: "03:00" },
  "4": { open: "11:30", close: "03:00" },
  "5": { open: "11:30", close: "03:00" },
  "6": { open: "11:30", close: "03:00" },
};

const DEFAULTS = {
  closed_now: false,
  closed_message: "",
  closed_until: null as string | null,
  accepts_delivery: true,
  accepts_pickup: true,
  accepts_onsite: true,
  prep_minutes: 20,
  hours: DEFAULT_HOURS,
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Valide les horaires reçus de l'admin.
 *
 * On refuse tout ce qui n'est pas exactement 7 jours au format
 * « HH:MM » : une saisie bancale afficherait « Fermé » à tort et
 * ferait perdre une soirée entière de commandes.
 *
 * `null` pour un jour = fermé ce jour-là (jour de repos).
 */
function parseHours(
  input: unknown
): Record<string, { open: string; close: string } | null> | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const out: Record<string, { open: string; close: string } | null> = {};

  for (let d = 0; d < 7; d++) {
    const raw = src[String(d)];
    if (raw === null) { out[String(d)] = null; continue; }
    if (!raw || typeof raw !== "object") return null;
    const { open, close } = raw as { open?: unknown; close?: unknown };
    if (typeof open !== "string" || typeof close !== "string") return null;
    if (!HHMM.test(open) || !HHMM.test(close)) return null;
    // open === close serait une plage vide ou 24 h : ambigu, on refuse
    if (open === close) return null;
    out[String(d)] = { open, close };
  }
  return out;
}

/**
 * GET /api/settings — état du restaurant, lu par l'application.
 *
 * Les horaires étaient figés dans le code : fermer un jour férié ou
 * partir en vacances imposait de republier l'app sur l'App Store.
 * Ils sont maintenant pilotés depuis l'espace restaurateur.
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(DEFAULTS);
  }
  try {
    // Chaque local a sa propre ligne de réglages : horaires,
    // fermeture exceptionnelle et temps de préparation.
    const franchiseId = franchiseDemandee(request);
    const res = await sb(
      `settings?franchise_id=eq.${franchiseId}&select=*&limit=1`
    );
    if (!res.ok) return NextResponse.json(DEFAULTS);
    const row = (await res.json())?.[0];
    if (!row) return NextResponse.json(DEFAULTS);

    // Une fermeture temporaire expire toute seule
    let closed = Boolean(row.closed_now);
    if (closed && row.closed_until) {
      if (new Date(row.closed_until).getTime() < Date.now()) {
        closed = false;
        await sb(`settings?franchise_id=eq.${franchiseId}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ closed_now: false, closed_until: null }),
        }).catch(() => {});
      }
    }

    // Les horaires sont stockés en JSON. Une valeur corrompue ne doit
    // jamais fermer le restaurant : on retombe sur les horaires connus.
    let hours = DEFAULT_HOURS;
    if (row.hours) {
      const raw = typeof row.hours === "string" ? safeParse(row.hours) : row.hours;
      const ok = parseHours(raw);
      if (ok) hours = ok;
    }

    return NextResponse.json(
      {
        closed_now: closed,
        closed_message: row.closed_message ?? "",
        closed_until: closed ? row.closed_until : null,
        accepts_delivery: row.accepts_delivery ?? true,
        accepts_pickup: row.accepts_pickup ?? true,
        accepts_onsite: row.accepts_onsite ?? true,
        prep_minutes: row.prep_minutes ?? 20,
        hours,
      },
      // Aucun cache : changer un horaire ou fermer en urgence doit
      // se voir tout de suite, sur le site comme dans l'application.
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          "CDN-Cache-Control": "no-store",
          "Vercel-CDN-Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

/** PATCH /api/settings — modification depuis l'admin */
export async function PATCH(request: NextRequest) {
  const who = await whoAmI(request);
  if (!who.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const franchiseId = !who.siege && who.franchiseId
    ? who.franchiseId
    : franchiseDemandee(request);
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const b = await request.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof b?.closedNow === "boolean") patch.closed_now = b.closedNow;
    if (typeof b?.closedMessage === "string") {
      patch.closed_message = b.closedMessage.slice(0, 160);
    }
    if ("closedUntil" in b) {
      patch.closed_until = b.closedUntil ? String(b.closedUntil) : null;
    }
    if (typeof b?.acceptsDelivery === "boolean") patch.accepts_delivery = b.acceptsDelivery;
    if (typeof b?.acceptsPickup === "boolean") patch.accepts_pickup = b.acceptsPickup;
    if (typeof b?.acceptsOnsite === "boolean") patch.accepts_onsite = b.acceptsOnsite;
    if (Number.isInteger(b?.prepMinutes)) {
      patch.prep_minutes = Math.max(5, Math.min(120, Number(b.prepMinutes)));
    }

    // Horaires hebdomadaires — refusés en bloc si mal formés, pour ne
    // jamais enregistrer un état qui afficherait « Fermé » à tort.
    if ("hours" in b) {
      const parsed = parseHours(b.hours);
      if (!parsed) {
        return NextResponse.json(
          { error: "Horaires invalides — format attendu HH:MM pour les 7 jours" },
          { status: 400 }
        );
      }
      patch.hours = parsed;
    }

    const res = await sb(`settings?franchise_id=eq.${franchiseId}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

    const rows = await res.json();
    // Première utilisation : la ligne n'existe pas encore
    if (!Array.isArray(rows) || rows.length === 0) {
      await sb("settings", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ franchise_id: franchiseId, ...patch }),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}
