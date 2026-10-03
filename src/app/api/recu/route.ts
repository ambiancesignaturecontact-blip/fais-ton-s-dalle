import { NextRequest, NextResponse } from "next/server";
import { genererRecu, type LigneRecu } from "@/lib/recu-pdf";
import { estAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sb(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}` },
    cache: "no-store",
  });
}

/**
 * GET /api/recu?uuid=…&token=…
 *
 * Renvoie le reçu PDF d'une commande.
 *
 * Accès : il faut prouver qu'on est bien le client.
 *   · `token`  = guest_token enregistré à la commande (l'app l'envoie) ;
 *   · ou le téléphone exact de la commande (`tel=`) ;
 *   · ou le mot de passe admin.
 * Sans preuve, 401 — sinon n'importe qui lirait le nom, l'adresse et
 * le téléphone d'un client en essayant des identifiants.
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const uuid = (request.nextUrl.searchParams.get("uuid") ?? "").trim();
  const token = (request.nextUrl.searchParams.get("token") ?? "").trim();
  const tel = (request.nextUrl.searchParams.get("tel") ?? "").replace(/\D/g, "");
  const admin = request.headers.get("X-Admin-Auth");

  if (!/^[0-9a-f-]{36}$/i.test(uuid)) {
    return NextResponse.json({ error: "Référence invalide" }, { status: 400 });
  }

  const res = await sb(
    `orders?uuid=eq.${encodeURIComponent(uuid)}` +
      `&select=id,uuid,created_at,customer_name,customer_phone,mode,address,total,` +
      `delivery_fee,discount_applied,tip,payment_method,guest_token,status,is_paid,` +
      `order_items(item_name,quantity,item_price,customization)&limit=1`
  );
  if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

  const [o] = (await res.json()) as Array<Record<string, unknown>>;
  if (!o) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const autorise =
    (admin && (await estAdmin(admin))) ||
    (token && token === String(o.guest_token ?? "")) ||
    (tel && tel === String(o.customer_phone ?? "").replace(/\D/g, ""));

  if (!autorise) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const lignes: LigneRecu[] = (
    (o.order_items as Array<Record<string, unknown>>) ?? []
  ).map((i) => ({
    nom: String(i.item_name ?? "Article"),
    quantite: Number(i.quantity ?? 1),
    prixUnitaire: Number(i.item_price ?? 0),
    personnalisation: (i.customization as string) ?? null,
  }));

  const pdf = await genererRecu({
    reference: `#${o.id}`,
    date: String(o.created_at ?? new Date().toISOString()),
    client: String(o.customer_name ?? "Client"),
    telephone: (o.customer_phone as string) ?? null,
    mode: String(o.mode ?? "livraison"),
    adresse: (o.address as string) ?? null,
    lignes,
    fraisLivraison: Number(o.delivery_fee ?? 0),
    remise: Number(o.discount_applied ?? 0),
    pourboire: Number(o.tip ?? 0),
    total: Number(o.total ?? 0),
    moyenPaiement: (o.payment_method as string) ?? null,
  });

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recu-${o.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
