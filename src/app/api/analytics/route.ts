import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const ALLOWED = new Set([
  "app_open", "view_menu", "view_product", "add_to_cart", "remove_from_cart",
  "view_cart", "begin_checkout", "purchase", "cart_abandoned",
  "promo_applied", "referral_shared",
]);

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
 * POST /api/analytics
 * Réception d'événements anonymes envoyés par lot.
 * AUCUNE donnée personnelle : pas de nom, email, téléphone ni adresse.
 * L'identifiant d'appareil est un UUID aléatoire, non lié à une personne.
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const events = Array.isArray(body?.events) ? body.events : [];
    const device = String(body?.device ?? "").slice(0, 64);

    if (events.length === 0) return NextResponse.json({ success: true, saved: 0 });
    if (events.length > 200) {
      return NextResponse.json({ error: "Trop d'événements" }, { status: 400 });
    }

    const rows = events
      .filter((e: any) => ALLOWED.has(String(e?.name)))
      .slice(0, 200)
      .map((e: any) => ({
        name: String(e.name),
        value: e.value != null ? Number(e.value) : null,
        label: e.label ? String(e.label).slice(0, 120) : null,
        device_id: device || null,
        platform: String(body?.platform ?? "ios").slice(0, 16),
        occurred_at: e.at ?? new Date().toISOString(),
      }));

    if (rows.length === 0) return NextResponse.json({ success: true, saved: 0 });

    const res = await sb("analytics_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

    return NextResponse.json({ success: true, saved: rows.length });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * GET /api/analytics?days=7  (admin uniquement)
 * Entonnoir de conversion global, tous appareils confondus.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get("X-Admin-Auth") !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get("days") ?? 7)));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  try {
    const res = await sb(
      `analytics_events?occurred_at=gte.${since}&select=name,value,label,device_id,platform&limit=20000`
    );
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
    const rows: any[] = await res.json();

    const count = (n: string) => rows.filter((r) => r.name === n).length;
    const devices = new Set(rows.map((r) => r.device_id).filter(Boolean)).size;

    const adds = count("add_to_cart");
    const purchases = count("purchase");
    const opens = count("app_open");

    const products = new Map<string, number>();
    for (const r of rows) {
      if (r.name === "add_to_cart" && r.label) {
        products.set(r.label, (products.get(r.label) ?? 0) + 1);
      }
    }

    const revenue = rows
      .filter((r) => r.name === "purchase")
      .reduce((s, r) => s + (Number(r.value) || 0), 0);

    return NextResponse.json({
      days,
      devices,
      opens,
      productViews: count("view_product"),
      addToCart: adds,
      checkouts: count("begin_checkout"),
      purchases,
      abandonRate: adds > 0 ? Math.round(((adds - purchases) / adds) * 100) : 0,
      conversionRate: opens > 0 ? Math.round((purchases / opens) * 100) : 0,
      revenue: Math.round(revenue * 100) / 100,
      avgBasket: purchases > 0 ? Math.round((revenue / purchases) * 100) / 100 : 0,
      topProducts: [...products.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


/**
 * DELETE /api/analytics — remet les statistiques à zéro (admin).
 * Après une phase de test, les commandes fictives faussent le panier
 * moyen et le taux d'abandon pendant des semaines.
 */
export async function DELETE(request: NextRequest) {
  const pw = request.headers.get("X-Admin-Auth");
  const ADMIN = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (!pw || pw !== ADMIN) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const U = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!U || !K) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const res = await fetch(`${U}/rest/v1/analytics_events?id=gt.0`, {
    method: "DELETE",
    headers: { apikey: K, Authorization: `Bearer ${K}`, Prefer: "return=minimal" },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Remise à zéro impossible" }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
