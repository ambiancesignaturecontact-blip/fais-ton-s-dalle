"use client";

/**
 * Gestion des abonnements push navigateur pour les notifications
 * de suivi de commande en temps réel.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("🔕 Push notifications non supportées");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.log("🔕 Service Worker registration failed:", err);
    return null;
  }
}

export async function subscribeToPush(orderId: string | number, email?: string): Promise<boolean> {
  try {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Demander la permission de notification
    if (Notification.permission === "denied") return false;
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;
    }

    // Créer l'abonnement push
    let subscription: PushSubscription | null = null;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY || undefined,
      });
    } catch {
      // En mode démo sans VAPID, on simule l'abonnement
      console.log("🔕 Push subscription (demo mode - no VAPID key)");
      return true;
    }

    if (!subscription) return false;

    const subJSON = subscription.toJSON();
    if (!subJSON.endpoint || !subJSON.keys) return false;

    // Sauvegarder dans Supabase via l'API
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth,
        orderId: String(orderId),
        email: email || null,
      }),
    });

    if (!res.ok) {
      console.log("🔕 Failed to save push subscription");
      return false;
    }

    // Marquer dans localStorage qu'on est abonné pour cette commande
    try {
      const subs = JSON.parse(localStorage.getItem("ftsd_push_subs") || "[]");
      if (!subs.includes(String(orderId))) {
        subs.push(String(orderId));
        localStorage.setItem("ftsd_push_subs", JSON.stringify(subs));
      }
    } catch {}

    return true;
  } catch (err) {
    console.log("🔕 Push subscription error:", err);
    return false;
  }
}

export function isPushSubscribed(orderId: string | number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const subs = JSON.parse(localStorage.getItem("ftsd_push_subs") || "[]");
    return subs.includes(String(orderId));
  } catch {
    return false;
  }
}

export function unsubscribeFromPush(orderId: string | number) {
  if (typeof window === "undefined") return;
  try {
    const subs = JSON.parse(localStorage.getItem("ftsd_push_subs") || "[]");
    const filtered = subs.filter((s: string) => s !== String(orderId));
    localStorage.setItem("ftsd_push_subs", JSON.stringify(filtered));
  } catch {}
}
