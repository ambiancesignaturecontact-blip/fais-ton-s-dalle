import { NextRequest, NextResponse } from "next/server";
import { signQr } from "@/lib/qr";
import { codeLivraison } from "@/lib/delivery-code";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * GET /api/order/[uuid]
 * Statut public d'une commande, pour le suivi en direct dans l'app.
 *
 * ⚠️ SÉCURITÉ : cette route est publique (l'UUID sert de jeton).
 * On n'expose donc QUE le strict nécessaire au suivi :
 * ni nom, ni téléphone, ni adresse, ni détail des articles.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    // Un UUID v4 valide est exigé : empêche l'énumération par id incrémental
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
    if (!isUuid) {
      return NextResponse.json({ error: "Référence invalide" }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?uuid=eq.${encodeURIComponent(uuid)}&select=uuid,status,created_at,mode,scheduled_time&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 502 });
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const o = rows[0];

    // ─── Bon de livraison ───────────────────────────────────────
    // La signature n'est fournie QUE lorsque la commande est prête ou
    // en route, et uniquement en livraison. Sans elle, l'app n'affiche
    // aucun QR : c'était le cas jusqu'ici, le client ne pouvait donc
    // jamais montrer son bon au livreur.
    //
    // `delivery_code` est le même secret, sous une forme dictable à
    // voix haute. Il est calculé ICI, côté serveur, et non déduit de
    // `qr_sig` par le navigateur : le site web n'a ainsi aucune règle
    // de dérivation à connaître, et la logique reste au même endroit
    // que sa vérification (POST /api/driver, action « deliver »).
    let qr_sig: string | null = null;
    let delivery_code: string | null = null;
    if (o.mode === "livraison" && (o.status === "ready" || o.status === "en-route")) {
      try {
        qr_sig = (await signQr(String(o.uuid))).sig;
        delivery_code = codeLivraison(qr_sig);
      } catch {
        qr_sig = null;
        delivery_code = null;
      }
    }

    return NextResponse.json(
      {
        uuid: o.uuid,
        status: o.status,
        created_at: o.created_at,
        mode: o.mode,
        scheduled_time: o.scheduled_time ?? null,
        qr_sig,
        delivery_code,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
