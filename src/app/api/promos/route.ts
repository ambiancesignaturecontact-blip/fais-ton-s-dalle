import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * GET /api/promos — codes promo actifs, pour l'application.
 * On n'expose ni le nombre d'utilisations restantes ni les codes
 * désactivés : uniquement ce qui est nécessaire pour valider une saisie.
 */
export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ promos: [] });
  }
  try {
    const now = new Date().toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/promo_codes?active=eq.true` +
        `&or=(expires_at.is.null,expires_at.gt.${now})` +
        `&select=code,discount,type,label,max_uses,uses`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return NextResponse.json({ promos: [] });
    const rows = (await res.json()) as Array<{
      code: string; discount: number; type: string; label: string;
      max_uses: number | null; uses: number;
    }>;
    // Un code épuisé n'est plus proposé
    const promos = rows
      .filter((r) => r.max_uses === null || r.uses < r.max_uses)
      .map((r) => ({ code: r.code, discount: r.discount, type: r.type, label: r.label }));

    return NextResponse.json(
      { promos },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ promos: [] });
  }
}
