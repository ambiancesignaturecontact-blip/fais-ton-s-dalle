import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

/** Valide le jeton de session et renvoie l'id client */
async function auth(request: NextRequest): Promise<number | null> {
  const token = request.headers.get("X-Customer-Token") ?? "";
  if (!token) return null;
  const res = await sb(
    `customer_sessions?token=eq.${encodeURIComponent(token)}&revoked=eq.false` +
      `&select=customer_id,expires_at&limit=1`
  );
  if (!res.ok) return null;
  const rows = await res.json();
  const row = rows?.[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return Number(row.customer_id);
}

/**
 * GET /api/customer
 * Profil complet : infos, adresses, favoris, historique, fidélité.
 * C'est ce qui permet de retrouver son compte sur un autre téléphone.
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  const id = await auth(request);
  if (!id) return NextResponse.json({ error: "Session expirée" }, { status: 401 });

  const [cRes, aRes, fRes, oRes] = await Promise.all([
    sb(`customers?id=eq.${id}&select=id,name,email,phone,address,fidelity_menu_count,fidelity_discount_active,fidelity_total_savings&limit=1`),
    sb(`customer_addresses?customer_id=eq.${id}&select=*&order=is_default.desc,created_at.desc`),
    sb(`customer_favorites?customer_id=eq.${id}&select=*&order=created_at.desc&limit=50`),
    sb(`orders?customer_id=eq.${id}&select=id,uuid,status,mode,total,created_at,delivered_at,order_items(item_name,quantity,item_price,customization,note)&order=created_at.desc&limit=30`),
  ]);

  if (!cRes.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
  const customer = (await cRes.json())?.[0];
  if (!customer) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? null,
      address: customer.address ?? null,
      fidelity: {
        menuCount: customer.fidelity_menu_count ?? 0,
        discountActive: customer.fidelity_discount_active ?? false,
        totalSavings: Number(customer.fidelity_total_savings ?? 0),
      },
    },
    addresses: aRes.ok ? await aRes.json() : [],
    favorites: fRes.ok ? await fRes.json() : [],
    orders: oRes.ok ? await oRes.json() : [],
  });
}

/**
 * POST /api/customer — actions sur le compte
 *  { action: "update_profile", name?, email? }
 *  { action: "add_address", label, address, details?, isDefault? }
 *  { action: "delete_address", addressId }
 *  { action: "sync_favorites", favorites: [...] }
 *  { action: "cancel_order", uuid, reason? }
 *  { action: "delete_account" }
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  const id = await auth(request);
  if (!id) return NextResponse.json({ error: "Session expirée" }, { status: 401 });

  try {
    const b = await request.json();
    const action = String(b?.action ?? "");

    if (action === "update_profile") {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof b?.name === "string") patch.name = b.name.trim().slice(0, 60);
      if (typeof b?.email === "string") patch.email = b.email.trim().slice(0, 120) || null;
      if (typeof b?.address === "string") patch.address = b.address.trim().slice(0, 200);
      const r = await sb(`customers?id=eq.${id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 502 });
      return NextResponse.json({ success: true });
    }

    if (action === "add_address") {
      const label = String(b?.label ?? "").trim().slice(0, 30) || "Adresse";
      const address = String(b?.address ?? "").trim().slice(0, 200);
      if (!address) return NextResponse.json({ error: "Adresse requise" }, { status: 400 });

      if (b?.isDefault) {
        await sb(`customer_addresses?customer_id=eq.${id}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ is_default: false }),
        });
      }
      const r = await sb("customer_addresses", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          customer_id: id, label, address,
          details: String(b?.details ?? "").slice(0, 120) || null,
          is_default: Boolean(b?.isDefault),
        }),
      });
      if (!r.ok) return NextResponse.json({ error: "Ajout impossible" }, { status: 502 });
      return NextResponse.json({ success: true, address: (await r.json())[0] });
    }

    if (action === "delete_address") {
      const aid = Number(b?.addressId);
      if (!Number.isInteger(aid)) {
        return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
      }
      await sb(`customer_addresses?id=eq.${aid}&customer_id=eq.${id}`, { method: "DELETE" });
      return NextResponse.json({ success: true });
    }

    // Fusion des favoris locaux avec le serveur (à la connexion)
    if (action === "sync_favorites") {
      const list = Array.isArray(b?.favorites) ? b.favorites.slice(0, 50) : [];
      if (list.length) {
        await sb("customer_favorites", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify(
            list.map((f: Record<string, unknown>) => ({
              customer_id: id,
              item_id: String(f.id ?? f.item_id ?? ""),
              customization: f.customization ?? null,
              name: f.name ?? null,
              price: f.price ?? null,
              image: f.image ?? null,
              category: f.category ?? null,
            })).filter((f: { item_id: string }) => f.item_id)
          ),
        });
      }
      const r = await sb(`customer_favorites?customer_id=eq.${id}&select=*`);
      return NextResponse.json({ success: true, favorites: r.ok ? await r.json() : [] });
    }

    if (action === "delete_favorite") {
      const itemId = String(b?.itemId ?? "");
      const custom = b?.customization ?? null;
      let q = `customer_favorites?customer_id=eq.${id}&item_id=eq.${encodeURIComponent(itemId)}`;
      q += custom === null ? "&customization=is.null" : `&customization=eq.${encodeURIComponent(String(custom))}`;
      await sb(q, { method: "DELETE" });
      return NextResponse.json({ success: true });
    }

    // Annulation par le client, uniquement avant préparation
    if (action === "cancel_order") {
      const uuid = String(b?.uuid ?? "");
      if (!uuid) return NextResponse.json({ error: "Référence requise" }, { status: 400 });

      const oRes = await sb(
        `orders?uuid=eq.${encodeURIComponent(uuid)}&customer_id=eq.${id}&select=id,status&limit=1`
      );
      const order = oRes.ok ? (await oRes.json())?.[0] : null;
      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

      if (!["pending", "confirmed"].includes(order.status)) {
        return NextResponse.json(
          { error: "Trop tard : la préparation a commencé. Appelle le restaurant." },
          { status: 409 }
        );
      }

      await sb(`orders?id=eq.${order.id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: String(b?.reason ?? "Annulée par le client").slice(0, 120),
        }),
      });
      return NextResponse.json({ success: true });
    }

    // RGPD : suppression définitive
    if (action === "delete_account") {
      await sb(`customer_sessions?customer_id=eq.${id}`, { method: "DELETE" });
      await sb(`customer_addresses?customer_id=eq.${id}`, { method: "DELETE" });
      await sb(`customer_favorites?customer_id=eq.${id}`, { method: "DELETE" });
      // Les commandes sont conservées (obligation comptable) mais anonymisées
      await sb(`orders?customer_id=eq.${id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          customer_id: null, customer_name: "Compte supprimé",
          customer_phone: null, customer_email: null, address: null,
        }),
      });
      await sb(`customers?id=eq.${id}`, { method: "DELETE" });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
