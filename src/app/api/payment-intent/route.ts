import { NextRequest, NextResponse } from "next/server";
import { MENU_ITEMS, DRINK_OPTIONS } from "@/data/menu";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// ─── Prix serveur (jamais faire confiance au client) ────────────
const PRICE_MAP = new Map<string, number>();
for (const item of MENU_ITEMS) {
  PRICE_MAP.set(item.name, Math.round(item.price * 100));
}
for (const d of DRINK_OPTIONS) {
  PRICE_MAP.set(d.name, Math.round(d.price * 100));
}
const INGREDIENT_CENTS = 100; // supplément unitaire : 1,00 €
const DELIVERY_CENTS = 290;

/**
 * POST /api/payment-intent
 * Crée un PaymentIntent Stripe pour Apple Pay natif dans l'application.
 *
 * Body : { items[], mode, customerName }  → { clientSecret }
 *
 * ⚠️ Le montant est TOUJOURS recalculé côté serveur à partir des
 * articles. Le champ `amount` envoyé par le client est ignoré.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? body.items : [];
    const mode = body?.mode === "livraison" ? "livraison" : "emporter";
    const customerName = String(body?.customerName ?? "Anonyme").slice(0, 80);

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Paiement non configuré" }, { status: 503 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // ─── Recalcul serveur ─────────────────────────────────────────
    let cents = 0;
    for (const it of items) {
      const name = String(it?.name ?? "");
      const qty = Number(it?.qty ?? 1);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
      }

      const base = PRICE_MAP.get(name);
      if (base === undefined) {
        return NextResponse.json({ error: `Produit inconnu : ${name}` }, { status: 400 });
      }

      // Suppléments déduits de la personnalisation
      let extras = 0;
      const custom = typeof it?.custom === "string" ? it.custom : "";
      if (custom) {
        const count = (re: RegExp) => (custom.match(re) || []).length;
        const viandes = count(/Viande\s*:/gi) ? custom.split("Viande:")[1]?.split("•")[0]?.split(",").length ?? 0 : 0;
        const crudites = custom.includes("Crudités:") ? custom.split("Crudités:")[1]?.split("•")[0]?.split(",").length ?? 0 : 0;
        const sauces = custom.includes("Sauces:") ? custom.split("Sauces:")[1]?.split("•")[0]?.split(",").length ?? 0 : 0;
        const supps = custom.includes("Suppléments:") ? custom.split("Suppléments:")[1]?.split("•")[0]?.split(",").length ?? 0 : 0;
        const toppings = custom.includes("Topping:") ? custom.split("Topping:")[1]?.split("•")[0]?.split(",").length ?? 0 : 0;

        extras =
          Math.max(0, viandes - 1) * INGREDIENT_CENTS +
          Math.max(0, crudites - 3) * INGREDIENT_CENTS +
          Math.max(0, sauces - 2) * INGREDIENT_CENTS +
          Math.max(0, supps - 1) * INGREDIENT_CENTS +
          toppings * INGREDIENT_CENTS;
      }

      cents += (base + extras) * qty;
    }

    if (mode === "livraison") cents += DELIVERY_CENTS;

    // Garde-fous
    if (cents < 100 || cents > 50000) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    // ─── Création du PaymentIntent ────────────────────────────────
    const stripeModule = await import("stripe");
    const stripe = new stripeModule.default(STRIPE_SECRET_KEY);

    const intent = await stripe.paymentIntents.create({
      amount: cents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      description: `Commande ${customerName} — ${mode}`,
      metadata: {
        customer_name: customerName,
        mode,
        source: "ios-app",
        items_count: String(items.length),
        // Indispensable au webhook : sans cet uuid, Stripe confirme le
        // paiement mais on ne sait pas à quelle commande le rattacher.
        orderUuid: String(body?.orderUuid ?? ""),
      },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      amount: cents / 100,
    });
  } catch {
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 500 });
  }
}
