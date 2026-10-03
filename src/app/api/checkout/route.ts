import { NextRequest, NextResponse } from "next/server";
import { MENU_ITEMS, DRINK_OPTIONS } from "@/data/menu";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Remise en centimes pour un code, relue en base.
 * Renvoie 0 si le code n'existe pas, est expiré, épuisé, ou
 * personnel (ceux-là se valident à la commande, pas ici).
 */
async function remisePourCode(code: string, totalCentimes: number): Promise<number> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(code)}` +
        `&active=eq.true&select=discount,type,max_uses,uses,expires_at&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return 0;
    const [p] = await res.json();
    if (!p) return 0;
    if (p.expires_at && new Date(p.expires_at).getTime() < Date.now()) return 0;
    if (p.max_uses !== null && Number(p.uses ?? 0) >= Number(p.max_uses)) return 0;

    const valeur = Number(p.discount) || 0;
    const brut =
      p.type === "percent"
        ? Math.round(totalCentimes * (valeur / 100))
        : Math.round(valeur * 100);
    return Math.max(0, Math.min(brut, totalCentimes - 50)); // jamais 0 €
  } catch {
    return 0;
  }
}
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
    const codePromo = String(body?.promoCode ?? "").trim().toUpperCase();

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

    // ─── Code promo : validé en base, jamais sur parole ───────
    // Sans ça, le site encaissait le plein tarif pendant que le
    // panier affichait une remise : le client payait plus que
    // ce qu'il avait lu.
    let remiseCentimes = 0;
    if (codePromo && SUPABASE_URL && SUPABASE_KEY) {
      remiseCentimes = await remisePourCode(codePromo, recalculatedTotal);
    }

    const totalForDisplay = (recalculatedTotal - remiseCentimes) / 100;

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

    // La remise passe par un coupon Stripe à usage unique : les
    // lignes du panier restent détaillées sur le reçu, et le montant
    // encaissé est le bon.
    let discounts: Array<{ coupon: string }> | undefined;
    if (remiseCentimes > 0) {
      try {
        const coupon = await stripeClient.coupons.create({
          amount_off: remiseCentimes,
          currency: "eur",
          duration: "once",
          name: `Code ${codePromo}`,
          max_redemptions: 1,
        });
        discounts = [{ coupon: coupon.id }];
      } catch {
        // Coupon impossible : on préfère annuler le paiement plutôt
        // que de faire payer le plein tarif à un client à qui on a
        // promis une remise.
        return NextResponse.json(
          { error: "Remise impossible à appliquer. Réessayez dans un instant." },
          { status: 502 }
        );
      }
    }

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      ...(discounts ? { discounts } : {}),
      success_url: `${SITE_URL}/success?payment=success&total=${totalForDisplay.toFixed(2)}&mode=${mode || "livraison"}&addr=${encodeURIComponent(address || "")}`,
      cancel_url: `${SITE_URL}/echec`,
      locale: "fr",
      metadata: {
        customer_name: customerName || "Anonyme",
        mode: mode || "livraison",
        address: address || "",
        total: totalForDisplay.toString(),
        promo_code: codePromo || "",
        scheduled_time: scheduledTime || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 500 });
  }
}
