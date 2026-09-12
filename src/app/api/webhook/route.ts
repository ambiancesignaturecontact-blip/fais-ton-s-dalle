import { NextRequest, NextResponse } from "next/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ demo: true });
    }

    const stripe = await import("stripe").then((m) => new m.default(STRIPE_SECRET_KEY));
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature || "", process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = event.data.object as any;

      // Envoyer notification Discord
      if (DISCORD_WEBHOOK && SUPABASE_URL && SUPABASE_KEY) {
        const embed = {
          embeds: [{
            title: `🛵 Paiement confirmé #${session.id.slice(-6)}`,
            color: 0x22c55e,
            fields: [
              { name: "Total", value: `${(session.amount_total / 100).toFixed(2)}€`, inline: true },
              { name: "Client", value: session.metadata?.customer_name || "Anonyme", inline: true },
              { name: "Mode", value: session.metadata?.mode === "livraison" ? "🚚 Livraison" : "🥡 À emporter", inline: true },
              { name: "Email", value: session.customer_details?.email || "Non renseigné", inline: true },
            ],
            timestamp: new Date().toISOString(),
          }],
        };
        await fetch(DISCORD_WEBHOOK, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(embed),
        }).catch(() => {});
      }

      // Marquer la commande comme payée dans Supabase
      if (SUPABASE_URL && SUPABASE_KEY && session.metadata?.order_id) {
        await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${session.metadata.order_id}`, {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_paid: true, payment_id: session.id, status: "confirmed" }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
