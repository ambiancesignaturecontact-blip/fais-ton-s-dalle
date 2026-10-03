import { NextRequest, NextResponse } from "next/server";
import { estAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

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
 * POST /api/admin/refund — rembourser une commande payée en ligne
 *
 * { orderId, montant? }   montant en euros ; absent = total restant
 *
 * Pourquoi cette route existe : jusqu'ici, rembourser un client
 * imposait d'ouvrir le tableau de bord Stripe, de retrouver le
 * paiement à la main et d'espérer ne pas se tromper de commande.
 * En plein service, personne ne le fait — on offrait le repas.
 *
 * Trois garde-fous :
 *   · on ne rembourse jamais plus que ce qui a été encaissé ;
 *   · un remboursement déjà fait n'est pas rejouable (le cumul est
 *     comparé au total) ;
 *   · la commande passe en « cancelled » avec le motif, pour que la
 *     comptabilité reste juste.
 */
export async function POST(request: NextRequest) {
  const admin = request.headers.get("X-Admin-Auth");
  if (!admin || !(await estAdmin(admin))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const orderId = Number(body?.orderId);
    const motif = String(body?.motif ?? "").slice(0, 120);
    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Commande requise" }, { status: 400 });
    }

    // Les colonnes refunded_amount / refunded_at arrivent avec le
    // SQL de migration. Tant qu'elles manquent, PostgREST répond 400 :
    // on relit sans elles plutôt que de bloquer un remboursement.
    const champs = "id,uuid,total,payment_id,payment_method,is_paid,status";
    let res = await sb(`orders?id=eq.${orderId}&select=${champs},refunded_amount&limit=1`);
    let colonnesRemb = true;
    if (!res.ok) {
      colonnesRemb = false;
      res = await sb(`orders?id=eq.${orderId}&select=${champs}&limit=1`);
    }
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
    const [o] = await res.json();
    if (!o) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    const total = Number(o.total ?? 0);
    const dejaRembourse = Number(o.refunded_amount ?? 0);
    const restant = Math.max(0, Math.round((total - dejaRembourse) * 100) / 100);

    if (restant <= 0) {
      return NextResponse.json(
        { error: "Cette commande est déjà intégralement remboursée." },
        { status: 409 }
      );
    }

    const demande = Number(body?.montant);
    const montant = Number.isFinite(demande) && demande > 0
      ? Math.min(Math.round(demande * 100) / 100, restant)
      : restant;

    // ─── Paiement en espèces : rien à rembourser via Stripe ───
    if (!o.payment_id || o.payment_method === "cash") {
      await sb(`orders?id=eq.${orderId}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "cancelled",
          cancel_reason: `Remboursé en espèces : ${montant.toFixed(2)} €${motif ? " — " + motif : ""}`,
          cancelled_at: new Date().toISOString(),
          ...(colonnesRemb
            ? {
                refunded_amount: dejaRembourse + montant,
                refunded_at: new Date().toISOString(),
              }
            : {}),
        }),
      }).catch(() => {});
      return NextResponse.json({
        success: true,
        espece: true,
        montant,
        message: "Commande réglée en espèces : à rembourser de la main à la main.",
      });
    }

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe n'est pas configuré sur ce serveur." },
        { status: 503 }
      );
    }

    // ─── Remboursement Stripe ─────────────────────────────────
    let stripeModule;
    try {
      stripeModule = await import("stripe");
    } catch {
      return NextResponse.json({ error: "Stripe indisponible" }, { status: 503 });
    }
    const stripe = new stripeModule.default(STRIPE_SECRET_KEY);

    let remboursement;
    try {
      remboursement = await stripe.refunds.create({
        payment_intent: String(o.payment_id),
        amount: Math.round(montant * 100),
        reason: "requested_by_customer",
        metadata: { commande: String(orderId), motif },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Refus de Stripe";
      // On ne touche PAS à la commande si l'argent n'est pas parti.
      return NextResponse.json({ error: `Remboursement refusé : ${message}` }, { status: 502 });
    }

    const totalRembourse = Math.round((dejaRembourse + montant) * 100) / 100;
    const complet = totalRembourse >= total - 0.01;

    const patch: Record<string, unknown> = {
      ...(colonnesRemb
        ? { refunded_amount: totalRembourse, refunded_at: new Date().toISOString() }
        : {}),
    };
    await sb(`orders?id=eq.${orderId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        ...patch,
        ...(complet
          ? {
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
              cancel_reason: `Remboursé ${totalRembourse.toFixed(2)} €${motif ? " — " + motif : ""}`,
            }
          : {}),
      }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      montant,
      totalRembourse,
      complet,
      refundId: remboursement.id,
    });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}
