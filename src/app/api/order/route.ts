import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

/** Prix forfaitaires côté serveur (évite la falsification client) */
const ITEM_PRICES: Record<string, number> = {
  "Menu Léger": 6.9, "Menu Classique": 7.9, "Menu Gourmand": 9.9, "Menu Royal": 15.9,
  "Bowl Léger": 10.9, "Bowl Classique": 11.9, "Bowl Gourmand": 13.9, "Bowl Royal": 18.9,
  "Tiramisu": 3.0, "Milkshake": 5.0,
  "Coca-Cola": 1.5, "Coca Zero": 1.5, "Coca-Cola Cherry": 1.5,
  "Oasis Tropical": 1.5, "Ice Tea": 1.5, "Orangina": 1.5,
  "Cristaline": 1.5, "San Pellegrino": 1.5,
};

const INGREDIENT_PRICE = 1.0;
const DELIVERY_FEE = 2.9;

function calculerTotal(items: { name: string; price?: number; qty?: number; custom?: string | null }[], mode: string): number {
  let total = 0;
  for (const item of items) {
    const name = item.name || "";
    // Prix de base : menu/produit connu
    const basePrice = ITEM_PRICES[name] || 0;

    // Suppléments ingrédients (viande/crudité/sauce/supplément seul)
    if (basePrice === 0 && item.price === INGREDIENT_PRICE) {
      total += INGREDIENT_PRICE * (item.qty || 1);
      continue;
    }

    // Calcul des extras depuis la personnalisation
    let extras = 0;
    if (item.custom) {
      // Compter les ingrédients supplémentaires (format: "Viande: Tenders | Viande: Pastrami")
      const viandeCount = (item.custom.match(/Viande\s*(?:supplément)?/gi) || []).length;
      const cruditeCount = (item.custom.match(/Crudité/gi) || []).length;
      const sauceCount = (item.custom.match(/Sauce/gi) || []).length;
      const suppCount = (item.custom.match(/Supplément/gi) || []).length;

      // Déduire les inclus selon le menu
      // Menu Léger (cs=1): 1 viande, 2 crudités, 2 sauces, 1 supp
      // Menu Classique/Gourmand/Royal (cs=4,5,7): 1 viande, 3 crudités, 2 sauces, 1 supp
      extras = Math.max(0, viandeCount - 1) * INGREDIENT_PRICE
             + Math.max(0, cruditeCount - 2) * INGREDIENT_PRICE
             + Math.max(0, sauceCount - 2) * INGREDIENT_PRICE
             + Math.max(0, suppCount - 1) * INGREDIENT_PRICE;
    }

    total += (basePrice + extras) * (item.qty || 1);
  }

  if (mode === "livraison") total += DELIVERY_FEE;
  return Math.round(total * 100) / 100;
}

async function notifyDiscord(order: Record<string, unknown>) {
  if (!DISCORD_WEBHOOK) return;
  try {
    const itemsList = (order.order_items as Array<Record<string, unknown>>) || [];
    const items = itemsList.map((i: Record<string, unknown>) =>
      `${i.quantity}x ${i.item_name}${i.customization ? ` (${i.customization})` : ""}`
    ).join("\n") || "Aucun article";

    const embed = {
      embeds: [{
        title: `🛵 Nouvelle commande #${order.id}`,
        color: 0xd43d2b,
        fields: [
          { name: "Client", value: (order.customer_name as string) || "Anonyme", inline: true },
          { name: "Total", value: `${order.total}€`, inline: true },
          { name: "Mode", value: order.mode === "livraison" ? "🚚 Livraison" : "🥡 À emporter", inline: true },
          { name: "Téléphone", value: (order.customer_phone as string) || "Non renseigné", inline: true },
          { name: "Adresse", value: (order.address as string) || "Non renseignée", inline: true },
          { name: "Articles", value: items },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "FAIS TON S'DALLE — Commandes" },
      }],
    };
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embed),
    });
  } catch {
    console.error("❌ Discord notification failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerName, customerPhone, notes, source, mode, address, scheduledTime } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // 🔥 SÉCURITÉ : Recalculer le total côté serveur
    const calculatedTotal = calculerTotal(items, mode || "livraison");
    if (calculatedTotal <= 0) {
      return NextResponse.json({ error: "Total invalide" }, { status: 400 });
    }

    // Mode démo (pas de Supabase configuré)
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      const demoOrder = {
        id: Math.floor(Math.random() * 1000),
        uuid: `demo-${Date.now()}`,
        customer_name: customerName || "Client",
        total: calculatedTotal,
        mode: mode || "livraison",
        address: address || "",
        customer_phone: customerPhone || "",
        order_items: items.map((i: Record<string, unknown>) => ({
          item_name: i.name,
          quantity: (i.qty as number) || 1,
          customization: (i.custom as string) || null,
        })),
      };
      await notifyDiscord(demoOrder);
      return NextResponse.json({ success: true, orderId: demoOrder.id, uuid: demoOrder.uuid, demo: true });
    }

    // 1. Créer la commande AVEC le total recalculé
    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "pending",
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        total: calculatedTotal, // ← Sécurité : on utilise NOTRE calcul
        notes: notes || null,
        source: source || "web",
        mode: mode || "livraison",
        address: address || null,
        scheduled_time: scheduledTime || null,
        is_paid: false,
      }),
    });

    if (!orderRes.ok) throw new Error(`Supabase error: ${orderRes.status}`);
    const [order] = await orderRes.json();

    // 2. Insérer les lignes
    const orderItems = items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      item_name: item.name,
      item_price: ITEM_PRICES[item.name as string] || INGREDIENT_PRICE,
      quantity: (item.qty as number) || 1,
      customization: (item.custom as string) || null,
    }));

    await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderItems),
    });

    // 3. Notifier Discord
    await notifyDiscord({
      id: order.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      total: calculatedTotal,
      mode,
      address,
      order_items: orderItems,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      uuid: order.uuid,
      message: "Commande enregistrée !",
    });
  } catch (err) {
    console.error("❌ Order error:", err);
    return NextResponse.json({ error: "Erreur lors de la création de la commande" }, { status: 500 });
  }
}
