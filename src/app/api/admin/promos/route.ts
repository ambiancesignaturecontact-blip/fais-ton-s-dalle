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

function guard(request: NextRequest) {
  const pw = request.headers.get("X-Admin-Auth");
  if (!pw || pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  return null;
}

/**
 * GET /api/promos            → codes actifs (public, pour l'app)
 * GET /api/admin/promos      → tous les codes + compteurs (admin)
 */
export async function GET(request: NextRequest) {
  const bad = guard(request);
  if (bad) return bad;

  const res = await sb("promo_codes?select=*&order=created_at.desc");
  if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
  return NextResponse.json({ promos: await res.json() });
}

/** POST — créer un code */
export async function POST(request: NextRequest) {
  const bad = guard(request);
  if (bad) return bad;

  try {
    const b = await request.json();
    const code = String(b?.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
    const discount = Number(b?.discount);
    const type = b?.type === "fixed" ? "fixed" : "percent";
    const maxUses = b?.maxUses === null ? null : Number(b?.maxUses ?? 100);
    const label = String(b?.label ?? "").slice(0, 80);
    const expiresAt = b?.expiresAt ? String(b.expiresAt) : null;

    if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
      return NextResponse.json({ error: "Code invalide (3-20 caractères, A-Z 0-9)" }, { status: 400 });
    }
    if (!Number.isFinite(discount) || discount <= 0) {
      return NextResponse.json({ error: "Réduction invalide" }, { status: 400 });
    }
    if (type === "percent" && discount > 90) {
      return NextResponse.json({ error: "Maximum 90 %" }, { status: 400 });
    }

    const res = await sb("promo_codes", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        code, discount, type, max_uses: maxUses,
        label: label || (type === "percent" ? `-${discount} %` : `-${discount} €`),
        active: true, uses: 0, expires_at: expiresAt,
      }),
    });
    if (res.status === 409) {
      return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
    }
    if (!res.ok) return NextResponse.json({ error: "Création impossible" }, { status: 502 });
    const [promo] = await res.json();
    return NextResponse.json({ success: true, promo });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

/** PATCH — activer / désactiver */
export async function PATCH(request: NextRequest) {
  const bad = guard(request);
  if (bad) return bad;

  try {
    const b = await request.json();
    const code = String(b?.code ?? "").toUpperCase();
    if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

    const res = await sb(`promo_codes?code=eq.${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ active: Boolean(b?.active) }),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

/** DELETE ?code=XXX */
export async function DELETE(request: NextRequest) {
  const bad = guard(request);
  if (bad) return bad;

  const code = (request.nextUrl.searchParams.get("code") ?? "").toUpperCase();
  if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  const res = await sb(`promo_codes?code=eq.${encodeURIComponent(code)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  if (!res.ok) return NextResponse.json({ error: "Suppression impossible" }, { status: 502 });
  return NextResponse.json({ success: true, deleted: code });
}
