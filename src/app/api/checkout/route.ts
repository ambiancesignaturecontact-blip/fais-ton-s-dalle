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
      const basePrice = getServerPrice(name);
      if (basePrice <= 0) {
        return NextResponse.json({ error: `Produit inconnu : ${name}` }, { status: 400 });
      }

      // ─── Suppléments ────────────────────────────────────────
      // Le client peut ajouter viandes, crudités, sauces, fromages
      // ou coulis, à 1,00 € pièce. Le panier envoie donc un prix
      // unitaire SUPÉRIEUR au prix de base du menu.
      //
      // Avant, on ignorait ce prix et on comparait au seul prix de
      // base : dès qu'un client ajoutait un supplément, l'écart
      // dépassait la tolérance de 0,50 € et le paiement était refusé
      // avec « Erreur de calcul du total ». Un menu avec du cheddar
      // était donc IMPAYABLE.
      //
      // On accepte maintenant le prix annoncé, à deux conditions :
      // il doit être au moins égal au prix de base (jamais moins
      // cher), et l'écart doit rester plausible — au plus 10
      // suppléments, soit 10,00 €. Impossible de payer 1 € un menu
      // à 9,90 €.
      const prixAnnonce = Number(item.price);
      const MAX_SUPPLEMENTS_CENTIMES = 10 * 100;

      let unitPrice = basePrice;
      if (
        Number.isFinite(prixAnnonce) &&
        prixAnnonce >= basePrice &&
        prixAnnonce - basePrice <= MAX_SUPPLEMENTS_CENTIMES
      ) {
        unitPrice = Math.round(prixAnnonce);
      }

      recalculatedTotal += unitPrice * qty;
      validatedItems.push({
        name,
        price: unitPrice,
        qty,
        custom: (item.custom as string) || null,
      });
    }

    // Vérifier que le total client correspond (tolérance 0,50€)
    const clientTotalCents = Math.round(total * 100);
    if (Math.abs(recalculatedTotal - clientTotalCents) > 50) {
      return NextResponse.json(
        {
          error: "Le total ne correspond pas au panier. Rechargez la page.",
          attendu: (recalculatedTotal / 100).toFixed(2),
          recu: (clientTotalCents / 100).toFixed(2),
        },
        { status: 400 }
      );
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
