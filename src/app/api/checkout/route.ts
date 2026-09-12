import { NextRequest, NextResponse } from "next/server";
import { MENU_ITEMS, DRINK_OPTIONS } from "@/data/menu";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://faistonsdalle.com";

// Prix fixes côté serveur (jamais faire confiance au client)
const PRICE_MAP = new Map<string, number>();

// Construire la map des prix depuis les vraies données
function buildPriceMap() {
  for (const item of MENU_ITEMS) {
    PRICE_MAP.set(item.id, item.price * 100); // en centimes
    PRICE_MAP.set(item.name, item.price * 100);
  }
  for (const drink of DRINK_OPTIONS) {
    PRICE_MAP.set(drink.id, drink.price * 100);
    PRICE_MAP.set(drink.name, drink.price * 100);
  }
  PRICE_MAP.set("🚚 Livraison", 290); // 2,90€ en centimes
}
buildPriceMap();

function getServerPrice(name: string): number {
  return PRICE_MAP.get(name) || PRICE_MAP.get(name.replace("🚚 ", "")) || 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, customerName, mode, address, scheduledTime } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // Recalculer TOUT le total côté serveur
    let recalculatedTotal = 0;
    const validatedItems: { name: string; price: number; qty: number; custom: string | null }[] = [];

    for (const item of items) {
      const name = item.name as string;
      const qty = (item.qty as number) || 1;
      if (qty <= 0 || qty > 99) {
        return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
      }
      const serverPrice = getServerPrice(name);
      if (serverPrice <= 0) {
        return NextResponse.json({ error: `Produit inconnu : ${name}` }, { status: 400 });
      }
      recalculatedTotal += serverPrice * qty;
      validatedItems.push({
        name,
        price: serverPrice,
        qty,
        custom: (item.custom as string) || null,
      });
    }

    // Vérifier que le total client correspond (tolérance 0,50€)
    const clientTotalCents = Math.round(total * 100);
    if (Math.abs(recalculatedTotal - clientTotalCents) > 50) {
      return NextResponse.json({ error: "Erreur de calcul du total" }, { status: 400 });
    }

    const totalForDisplay = recalculatedTotal / 100;

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({
        url: `${SITE_URL}/success?payment=success&total=${totalForDisplay.toFixed(2)}&mode=${mode || "livraison"}`,
        demo: true,
      });
    }

    let stripeModule;
    try {
      stripeModule = await import("stripe");
    } catch {
      return NextResponse.json({
        url: `${SITE_URL}/success?payment=success&total=${totalForDisplay.toFixed(2)}&mode=${mode || "livraison"}`,
        demo: true,
      });
    }
    const stripeClient = new stripeModule.default(STRIPE_SECRET_KEY);

    const lineItems = validatedItems.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          description: item.custom ? item.custom.substring(0, 100) : undefined,
        },
        unit_amount: item.price,
      },
      quantity: item.qty,
    }));

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${SITE_URL}/success?payment=success&total=${totalForDisplay.toFixed(2)}&mode=${mode || "livraison"}&addr=${encodeURIComponent(address || "")}`,
      cancel_url: `${SITE_URL}/echec`,
      locale: "fr",
      metadata: {
        customer_name: customerName || "Anonyme",
        mode: mode || "livraison",
        address: address || "",
        total: totalForDisplay.toString(),
        scheduled_time: scheduledTime || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 500 });
  }
}
