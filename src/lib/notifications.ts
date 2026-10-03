"use client";

/**
 * Notification push navigateur pour commande prête
 * Utilise l'API Notification + Service Worker déjà présent
 */
export function requestPushPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") return;
  if (Notification.permission === "denied") return;
  Notification.requestPermission();
}

export function notifyOrderReady(orderId: number, customerName: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification("🍔 Commande prête !", {
      body: `#${orderId} — ${customerName}`,
      icon: "/images/logo-192.png",
      badge: "/images/favicon.jpg",
      tag: `order-${orderId}`,
    });
  } catch {}
}

export function notifyOnTheWay(orderId: number, customerName: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification("🛵 En route !", {
      body: `La commande #${orderId} — ${customerName} est en livraison !`,
      icon: "/images/logo-192.png",
      badge: "/images/favicon.jpg",
      tag: `en-route-${orderId}`,
    });
    n.onclick = () => window.focus();
  } catch {}
}

export function notifyNewOrder(orderId: number, customerName: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification("🛵 Nouvelle commande !", {
      body: `#${orderId} — ${customerName}`,
      icon: "/images/logo-192.png",
      badge: "/images/favicon.jpg",
      tag: `new-order-${orderId}`,
    });
    n.onclick = () => window.focus();
  } catch {}
}
