import { NextRequest, NextResponse } from "next/server";
import { stockKey } from "@/lib/stock-key";

// Jamais de cache côté route : la valeur est relue en direct.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

interface StockRow {
  id: number;
  item_name: string;
  category: string | null;
  quantity: number | null;
  unlimited: boolean | null;
  updated_at: string | null;
}

/**
 * GET /api/stock
 *
 * Sans authentification → format compact, consommé par l'application
 * pour griser les ingrédients épuisés.
 *
 * Avec X-Admin-Auth → liste complète avec id, catégorie et date de
 * mise à jour, pour l'écran de gestion.
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ stock: {} });
  }

  const admin = request.headers.get("X-Admin-Auth");
  const res = await sb(
    "stock?select=id,item_name,category,quantity,unlimited,updated_at&order=category.asc,item_name.asc"
  );
  if (!res.ok) return NextResponse.json({ stock: {} });
  const rows = (await res.json()) as StockRow[];

  // ─── Vue admin ────────────────────────────────────────────
  if (admin && admin === ADMIN_PASSWORD) {
    return NextResponse.json({ items: rows });
  }

  // ─── Vue publique ─────────────────────────────────────────
  //
  // On renvoie DEUX cartes :
  //   stock  — clés telles qu'en base, pour compatibilité ascendante
  //   keyed  — clés normalisées (sans accents ni suffixe de prix),
  //            seule forme fiable pour comparer un libellé affiché
  //
  // Un même nom peut apparaître deux fois en base (« Oreo » existe en
  // dessert ET en parfum de milkshake) : la ligne la plus restrictive
  // l'emporte, pour ne jamais proposer un article réellement épuisé.
  type Cell = { quantity: number; unlimited: boolean };
  const stock: Record<string, Cell> = {};
  const keyed: Record<string, Cell> = {};

  const merge = (dst: Record<string, Cell>, k: string, cell: Cell) => {
    const prev = dst[k];
    if (
      !prev ||
      (prev.unlimited && !cell.unlimited) ||
      (!prev.unlimited && !cell.unlimited && cell.quantity < prev.quantity)
    ) {
      dst[k] = cell;
    }
  };

  for (const r of rows) {
    const cell: Cell = {
      quantity: Number(r.quantity ?? 0),
      unlimited: r.unlimited !== false,
    };
    merge(stock, r.item_name, cell);
    merge(keyed, stockKey(r.item_name), cell);
  }

  // Aucune mise en cache : une rupture déclarée en cuisine doit être
  // visible immédiatement sur le site comme dans l'application.
  // L'ancien « s-maxage=20 » faisait croire que la synchronisation
  // était cassée pendant 20 secondes après chaque changement.
  return NextResponse.json(
    { stock, keyed, updatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    }
  );
}

/**
 * Retrouve les lignes correspondant à un libellé, en ignorant les
 * accents et les suffixes de prix.
 *
 * Indispensable : l'application envoie « Samouraï », « Menu Léger »,
 * « Carottes râpées » alors que la base contient les versions sans
 * accent. Un `item_name=eq.Samouraï` renvoyait 0 ligne → l'admin
 * affichait « Article introuvable » sans que rien ne change.
 *
 * Renvoie tous les identifiants concernés (« Oreo » apparaît deux
 * fois : dessert et parfum de milkshake, les deux doivent basculer).
 */
async function resolveIds(itemName: string): Promise<number[]> {
  const res = await sb("stock?select=id,item_name");
  if (!res.ok) return [];
  const rows = (await res.json()) as { id: number; item_name: string }[];
  const want = stockKey(itemName);
  return rows.filter((r) => stockKey(r.item_name) === want).map((r) => r.id);
}

/**
 * PATCH /api/stock — modification d'un article (admin)
 *
 * Corps accepté :
 *   { itemName, quantity?, unlimited? }
 *   { id, quantity?, unlimited? }
 *
 * ⚠️ L'ancienne version ne touchait jamais à `unlimited` : passer une
 * quantité à 0 ne suffisait donc pas à marquer un produit épuisé,
 * puisque `unlimited: true` l'emportait toujours. C'est corrigé ici.
 */
export async function PATCH(request: NextRequest) {
  const pw = request.headers.get("X-Admin-Auth");
  if (!pw || pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const b = await request.json();
    const id = Number(b?.id);
    const itemName = String(b?.itemName ?? b?.item_name ?? "").trim();

    if (!Number.isInteger(id) && !itemName) {
      return NextResponse.json({ error: "id ou itemName requis" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof b?.unlimited === "boolean") {
      patch.unlimited = b.unlimited;
      // Repasser en illimité doit remettre un stock plein, sinon
      // l'article reste affiché à 0 alors qu'il est disponible.
      if (b.unlimited && b?.quantity === undefined) patch.quantity = 999;
    }

    if (b?.quantity !== undefined) {
      const q = Math.max(0, Math.min(9999, Number(b.quantity) || 0));
      patch.quantity = q;
      // Une quantité chiffrée implique un suivi : on sort de l'illimité
      if (typeof b?.unlimited !== "boolean") patch.unlimited = false;
    }

    // Raccourci « épuisé » : un seul geste dans l'interface
    if (b?.soldOut === true) {
      patch.quantity = 0;
      patch.unlimited = false;
    }
    if (b?.soldOut === false) {
      patch.quantity = 999;
      patch.unlimited = true;
    }

    let filter: string;
    if (Number.isInteger(id)) {
      filter = `id=eq.${id}`;
    } else {
      // Correspondance insensible aux accents et au suffixe de prix
      const ids = await resolveIds(itemName);
      if (!ids.length) {
        return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
      }
      filter = `id=in.(${ids.join(",")})`;
    }

    const res = await sb(`stock?${filter}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

    const rows = (await res.json()) as StockRow[];
    if (!rows.length) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    // Trace des mouvements, pour comprendre les ruptures a posteriori
    try {
      await sb("stock_history", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          item_name: rows[0].item_name,
          quantity: rows[0].quantity,
          reason: b?.soldOut === true ? "rupture" : "ajustement manuel",
        }),
      });
    } catch { /* l'historique ne doit jamais bloquer la mise à jour */ }

    return NextResponse.json({ success: true, item: rows[0] });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

/**
 * POST /api/stock — actions groupées (admin)
 *   { action: "reset_all" }                → tout remet en illimité
 *   { action: "bulk", names: [], soldOut } → plusieurs articles d'un coup
 */
export async function POST(request: NextRequest) {
  const pw = request.headers.get("X-Admin-Auth");
  if (!pw || pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const b = await request.json();
    const action = String(b?.action ?? "");

    if (action === "reset_all") {
      const res = await sb("stock?id=gt.0", {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          quantity: 999,
          unlimited: true,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
      return NextResponse.json({ success: true });
    }

    if (action === "bulk") {
      const names: string[] = Array.isArray(b?.names) ? b.names.slice(0, 60) : [];
      if (!names.length) {
        return NextResponse.json({ error: "Aucun article" }, { status: 400 });
      }
      const soldOut = Boolean(b?.soldOut);
      // Résolution par clé normalisée : « Samouraï » doit atteindre la
      // ligne « Samourai ». L'ancien filtre littéral en ratait 5 sur 53.
      const all = await sb("stock?select=id,item_name");
      if (!all.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
      const rows = (await all.json()) as { id: number; item_name: string }[];
      const wanted = new Set(names.map(stockKey));
      const ids = rows.filter((r) => wanted.has(stockKey(r.item_name))).map((r) => r.id);
      if (!ids.length) {
        return NextResponse.json({ error: "Aucun article correspondant" }, { status: 404 });
      }
      const res = await sb(`stock?id=in.(${ids.join(",")})`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          quantity: soldOut ? 0 : 999,
          unlimited: !soldOut,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
      return NextResponse.json({ success: true, count: ids.length });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}
