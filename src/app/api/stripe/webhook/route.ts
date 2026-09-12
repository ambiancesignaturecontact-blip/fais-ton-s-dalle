import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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

/**
 * Vérifie la signature Stripe sans dépendre du SDK.
 * En-tête reçu : `t=1786…,v1=abc…`
 */
function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(
      header.split(",").map((p) => p.split("=") as [string, string])
    );
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) return false;

    // Rejeu : on refuse tout ce qui a plus de 5 minutes
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false;

    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * POST /api/stripe/webhook
 *
 * ⚠️ CE FICHIER CORRIGE UNE FAILLE MÉTIER GRAVE.
 *
 * Jusqu'ici, la commande était enregistrée avec `is_paid = false`
 * AVANT le paiement, et rien ne remettait ce champ à jour ensuite.
 * Le client payait par carte, mais le livreur voyait toujours
 * « À ENCAISSER » et redemandait l'argent — double paiement.
 *
 * Stripe appelle cette route dès qu'un paiement aboutit : c'est le
 * seul moyen fiable de savoir qu'une commande est réglée. On ne peut
 * pas se fier à l'application, qui peut planter, perdre le réseau ou
 * être fermée juste après le paiement.
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const raw = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  // Sans secret configuré, on refuse : accepter n'importe quel appel
  // permettrait à quiconque de marquer des commandes comme payées.
  if (!WEBHOOK_SECRET) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET absent");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  }
  if (!verifyStripeSignature(raw, sig, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  let event: {
    type: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const obj = event.data?.object ?? {};
  const metadata = (obj.metadata ?? {}) as Record<string, string>;
  const orderUuid = metadata.orderUuid || metadata.order_uuid || "";
  const paymentId = String(obj.id ?? "");

  // ─── Paiement réussi ────────────────────────────────────────
  if (
    event.type === "payment_intent.succeeded" ||
    event.type === "checkout.session.completed"
  ) {
    if (!orderUuid) {
      // Pas d'uuid : on accuse réception pour que Stripe ne réessaie
      // pas indéfiniment, mais on trace le problème.
      console.warn("[stripe] paiement sans orderUuid :", paymentId);
      return NextResponse.json({ received: true, warning: "orderUuid absent" });
    }

    const res = await sb(`orders?uuid=eq.${encodeURIComponent(orderUuid)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        is_paid: true,
        payment_id: paymentId,
        payment_method: "stripe",
        updated_at: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      const rows = await res.json();
      const order = Array.isArray(rows) ? rows[0] : null;

      // On prévient le restaurant : la commande est payée, on peut lancer
      if (order) {
        try {
          const tRes = await sb("expo_push_tokens?audience=eq.admin&select=token&limit=10");
          if (tRes.ok) {
            const tokens = ((await tRes.json()) as Array<{ token: string }>)
              .map((r) => r.token).filter(Boolean);
            if (tokens.length) {
              await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                  tokens.map((to) => ({
                    to, sound: "default", channelId: "commandes", priority: "high",
                    title: "Paiement reçu 💳",
                    body: `Commande #${order.id} — ${Number(order.total ?? 0).toFixed(2)} €`,
                    data: { orderId: order.id, type: "paid" },
                  }))
                ),
              });
            }
          }
        } catch { /* la notification ne doit jamais bloquer le webhook */ }
      }
    }

    return NextResponse.json({ received: true });
  }

  // ─── Paiement échoué ou expiré ──────────────────────────────
  if (
    event.type === "payment_intent.payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    if (orderUuid) {
      await sb(`orders?uuid=eq.${encodeURIComponent(orderUuid)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          is_paid: false,
          notes: "⚠️ Paiement en ligne échoué — à encaisser sur place",
          updated_at: new Date().toISOString(),
        }),
      });
    }
    return NextResponse.json({ received: true });
  }

  // ─── Remboursement ──────────────────────────────────────────
  if (event.type === "charge.refunded") {
    if (orderUuid) {
      await sb(`orders?uuid=eq.${encodeURIComponent(orderUuid)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          is_paid: false,
          status: "cancelled",
          cancel_reason: "Remboursé",
          cancelled_at: new Date().toISOString(),
        }),
      });
    }
    return NextResponse.json({ received: true });
  }

  // Tout autre événement : accusé de réception, sans traitement
  return NextResponse.json({ received: true });
}
