import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const { endpoint, p256dh, auth, orderId, email } = await request.json();

    if (!endpoint || !p256dh || !auth || !orderId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      // Mode demo
      console.log("📡 Push subscription (demo):", { orderId, email });
      return NextResponse.json({ success: true, demo: true });
    }

    // Upsert la subscription push (vérifier si l'endpoint existe déjà)
    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&select=id`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const existingData = await existing.json();

    if (existingData && existingData.length > 0) {
      // Mettre à jour la subscription existante
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${existingData[0].id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          p256dh,
          auth,
          order_id: parseInt(orderId),
          email: email || null,
        }),
      });
    } else {
      // Créer une nouvelle subscription
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          endpoint,
          p256dh,
          auth,
          order_id: parseInt(orderId),
          email: email || null,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Push subscribe error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
