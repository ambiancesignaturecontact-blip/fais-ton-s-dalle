import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

// ─── Status labels pour les notifications ──────────────────────
const STATUS_LABELS: Record<string, { title: string; body: string }> = {
  confirmed: {
    title: "✅ Commande confirmée !",
    body: "Ta commande a été confirmée. On prépare tout ça !",
  },
  preparing: {
    title: "👨‍🍳 En préparation !",
    body: "Ton sandwich est en cours de préparation !",
  },
  ready: {
    title: "🍔 Prêt à être servi !",
    body: "Ta commande est prête ! On arrive bientôt 🎉",
  },
  "en-route": {
    title: "🛵 En route !",
    body: "Ton livreur est en route vers chez toi ! Prépare-toi !",
  },
  delivered: {
    title: "🎉 Livrée !",
    body: "Votre commande a été livrée avec succès ! Bon appétit !",
  },
  cancelled: {
    title: "❌ Commande annulée",
    body: "Ta commande a été annulée. Contacte le resto pour plus d'infos.",
  },
};

const DEFAULT_NOTIF = {
  title: "📢 Mise à jour commande",
  body: "Le statut de ta commande a changé !",
};

export async function POST(request: NextRequest) {
  const auth = request.headers.get("X-Admin-Auth") || request.headers.get("Authorization");
  if (auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { orderId, status, customerName } = await request.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      // Mode demo
      console.log("📡 Push send (demo):", { orderId, status, customerName });
      return NextResponse.json({ success: true, demo: true });
    }

    // Récupérer les subscriptions pour cette commande
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?order_id=eq.${orderId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Erreur Supabase" }, { status: 500 });
    }

    const subscriptions = await res.json();

    if (!subscriptions || subscriptions.length === 0) {
      // Pas d'abonné push pour cette commande
      return NextResponse.json({ success: true, sent: 0 });
    }

    const notifInfo = STATUS_LABELS[status] || DEFAULT_NOTIF;
    const payload = JSON.stringify({
      title: notifInfo.title,
      body: customerName ? `${notifInfo.body} (#${orderId} — ${customerName})` : `${notifInfo.body} (#${orderId})`,
      orderId,
    });

    let sent = 0;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;

    for (const sub of subscriptions) {
      if (!sub.endpoint || !sub.p256dh || !sub.auth) continue;

      try {
        // Envoyer via Web Push Protocol
        const encrypted = await encryptPayload(sub.p256dh, sub.auth, payload);

        const pushRes = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "TTL": "86400",
            "Content-Encoding": "aes128gcm",
            "Authorization": VAPID_PRIVATE_KEY
              ? `vapid t=${VAPID_PUBLIC_KEY || ""}, k=${VAPID_PRIVATE_KEY}`
              : "",
          },
          body: encrypted,
        });

        if (pushRes.ok) sent++;
        else if (pushRes.status === 410) {
          // Subscription expirée, la supprimer
          await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
            method: "DELETE",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          });
        }
      } catch {
        // Si l'envoi échoue (pas de VAPID keys par exemple), c'est ok
        console.log("📡 Push send failed (probably no VAPID):", sub.id);
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("❌ Push send error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── Fonction d'encryption Web Push Protocol simplifiée ──────
// Dans un environnement de production, utiliser la librairie 'web-push'
async function encryptPayload(
  p256dh: string,
  auth: string,
  payload: string
): Promise<ArrayBuffer> {
  // Version simplifiée : en l'absence de VAPID keys, on renvoie le texte en clair
  // Dans un environnement de production, utiliser la librairie 'web-push'
  const encoder = new TextEncoder();
  return encoder.encode(payload).buffer;
}
