"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, MessageCircle, Clock, Truck, MapPin, Copy } from "lucide-react";
import { buildOrderMessage, openWhatsApp } from "@/data/whatsapp";
import { trackOrder } from "@/lib/analytics";
import { hoursFooterLine } from "@/components/hours/HoursText";
import { toast } from "sonner";

interface RawCartItem {
  name?: string; n?: string; price?: number; p?: number;
  qty?: number; quantity?: number; q?: number;
  customization?: string; cu?: string;
}

function normalizeItems(items: RawCartItem[]) {
  return items.map((i) => ({
    name: i.name || i.n || "",
    price: i.price || i.p || 0,
    qty: i.qty || i.quantity || i.q || 1,
    customization: i.customization || i.cu || null,
  }));
}

export function SuccessContent() {
  const searchParams = useSearchParams();
  const sent = useRef(false);
  
  // Générer un numéro de commande unique (lazy initializer, hors render)
  const [orderNumber] = useState(() => {
    const ts = Date.now();
    const short = String(ts).slice(-5);
    const prefix = String(Math.floor(Math.random() * 90) + 10);
    return prefix + short;
  });

  useEffect(() => {
    if (searchParams.get("payment") === "success" && !sent.current) {
      sent.current = true;

      // Sauvegarder le numéro de commande dans sessionStorage pour le suivi
      try { sessionStorage.setItem("ftsd_last_order_id", orderNumber); } catch {}

      const processOrder = async (items: RawCartItem[], total: number, mode: string, address: string, name: string) => {
        const deliveryFee = mode === "livraison" ? 2.9 : 0;
        const msg = buildOrderMessage({
          items: normalizeItems(items),
          total, customerName: name || "Client",
          mode: (mode === "livraison" ? "livraison" : "emporter") as "livraison" | "emporter",
          address: address || "", isPaid: true, deliveryFee,
        });
        openWhatsApp(msg);

        try {
          const orderItems = normalizeItems(items);
          const estimatedTime = new Date(Date.now() + 30 * 60000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          // On relit les réglages au moment d'envoyer : l'email garde
          // les horaires courants même si la page vient de s'ouvrir.
          const { fetchSettings, DEFAULT_SETTINGS } = await import("@/lib/hours");
          const fresh = await fetchSettings();
          const hoursLine = hoursFooterLine(
            (fresh ?? DEFAULT_SETTINGS).hours
          );
          const emailHtml = (await import("@/components/email/OrderConfirmationEmail")).buildOrderConfirmationHtml({
            customerName: name || "Client",
            orderId: parseInt(orderNumber),
            items: orderItems,
            total,
            mode: mode === "livraison" ? "livraison" : "emporter",
            address: address || undefined,
            estimatedDelivery: estimatedTime,
            hoursLine,
          });
          fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: "contact@faistonsdalle.com",
              subject: `✅ Commande #${orderNumber} confirmée - FAIS TON S'DALLE`,
              html: emailHtml,
            }),
          });
        } catch {}

        try {
          trackOrder(normalizeItems(items).map(i => ({ name: i.name, qty: i.qty })), total);
        } catch {}

        try {
          const recent = JSON.parse(localStorage.getItem("ftsd_recent_orders") || "[]");
          recent.unshift({
            id: orderNumber,
            items: items.map((i: RawCartItem) => ({ id: i.name || "", name: i.name || "", price: i.price || 0, customization: i.customization, image: "" })),
            total, date: new Date().toISOString(), mode
          });
          localStorage.setItem("ftsd_recent_orders", JSON.stringify(recent.slice(0, 5)));
        } catch {}
      };

      try {
        const sessionData = sessionStorage.getItem("ftsd_last_order");
        if (sessionData) {
          const { items, total, mode, address, name } = JSON.parse(sessionData);
          processOrder(items, total, mode, address, name);
          return;
        }

        const cartRaw = localStorage.getItem("ftsd_cart");
        if (cartRaw) {
          const { items, mode, address, name } = JSON.parse(cartRaw);
          if (items && items.length > 0) {
            const normalized = normalizeItems(items);
            const subtotal = normalized.reduce((s, i) => s + i.price * i.qty, 0);
            const deliveryFee = mode === "livraison" ? 2.9 : 0;
            processOrder(items, subtotal + deliveryFee, mode, address || "", name || "");
          }
        }
      } catch {}
    }
  }, [searchParams, orderNumber]);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    toast.success("Numéro copié !");
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 mb-6">
          <CheckCircle className="h-12 w-12 text-green-400" />
        </motion.div>

        <h1 className="font-heading text-3xl tracking-wider text-white mb-3">Paiement accepté ! 🎉</h1>
        <p className="text-white/70 text-sm mb-1">Ta commande a été envoyée au resto via WhatsApp.</p>
        <p className="text-white/50 text-xs mb-6">Prépare-toi, on s&apos;occupe de tout.</p>

        {/* 🔥 Numéro de commande affiché */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-white/40 text-xs mb-1">Numéro de commande</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-heading text-3xl tracking-wider text-brand-red drop-shadow-[0_0_20px_rgba(212,61,43,0.3)]">
              #{orderNumber}
            </span>
            <button onClick={copyOrderNumber}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              title="Copier le numéro">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-white/30 text-[10px] mt-2">Garde ce numéro pour suivre ta commande</p>
        </div>

        {/* Timer livraison */}
        <TimerDisplay />

        <div className="flex flex-col gap-3 items-center">
          <Link href={"/suivi?id=" + orderNumber}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-800/30 hover:scale-105 transition-all duration-200 border border-indigo-400/20">
            <MapPin className="h-4 w-4" /> Suivre ma commande
          </Link>
          <Link href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold text-sm shadow-lg shadow-brand-red/20 hover:scale-105 transition-all duration-200">
            Retour au menu
          </Link>
          <a href="https://wa.me/33672044875" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:scale-105 transition-all duration-200">
            <MessageCircle className="h-4 w-4" /> Contacter le resto
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function TimerDisplay() {
  const [timeLeft, setTimeLeft] = useState({ minutes: 30, seconds: 0 });
  const [times, setTimes] = useState({ now: "", livraison: "" });

  useEffect(() => {
    const now = new Date();
    const livraison = new Date(now.getTime() + 30 * 60000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimes({
      now: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      livraison: livraison.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    });

    const end = new Date();
    end.setMinutes(end.getMinutes() + 30);

    const interval = setInterval(() => {
      const diff = Math.floor((end.getTime() - Date.now()) / 1000);
      if (diff <= 0) { clearInterval(interval); setTimeLeft({ minutes: 0, seconds: 0 }); return; }
      setTimeLeft({ minutes: Math.floor(diff / 60), seconds: diff % 60 });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {timeLeft.minutes > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-white/60 text-xs mb-2">
          <Truck className="h-4 w-4 text-green-400 animate-pulse" />
          <span>Livraison estimée dans <strong className="text-white">{timeLeft.minutes}min{timeLeft.seconds > 0 ? ` ${timeLeft.seconds}s` : ""}</strong></span>
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-1.5 text-white/40 text-[10px] mb-6">
        <Clock className="h-3 w-3" />
        <span>Commandé avant {times.now}, livraison prévue avant {times.livraison}</span>
      </motion.div>
    </>
  );
}
