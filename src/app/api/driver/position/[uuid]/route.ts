import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * GET /api/driver/position/[uuid]
 * Position du livreur pour une commande, lue par le client.
 *
 * ⚠️ CONFIDENTIALITÉ
 *  · L'UUID de commande sert de jeton d'accès (non devinable)
 *  · La position n'est renvoyée QUE si la commande est "en-route"
 *  · Aucune information sur le livreur n'est exposée (ni nom, ni
 *    téléphone, ni identifiant) — uniquement des coordonnées
 *  · L'enregistrement est supprimé à la livraison
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
    if (!isUuid) {
      return NextResponse.json({ error: "Référence invalide" }, { status: 400 });
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // 1. La commande doit être réellement en cours de livraison
    const oRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?uuid=eq.${encodeURIComponent(uuid)}&select=status&limit=1`,
      { headers, cache: "no-store" }
    );
    if (!oRes.ok) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 502 });
    }
    const orders = await oRes.json();
    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    if (orders[0].status !== "en-route") {
      // Pas encore partie, ou déjà livrée : rien à partager
      return NextResponse.json({ error: "Suivi indisponible" }, { status: 404 });
    }

    // 2. Dernière position connue
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/driver_positions?order_uuid=eq.${encodeURIComponent(uuid)}&select=lat,lng,updated_at&limit=1`,
      { headers, cache: "no-store" }
    );
    if (!pRes.ok) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 502 });
    }
    const rows = await pRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Position non disponible" }, { status: 404 });
    }

    const { lat, lng, updated_at } = rows[0];
    return NextResponse.json(
      { lat, lng, updated_at },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
