"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, CheckCircle, MapPin, Phone, AlertTriangle, Bell, BellOff } from "lucide-react";
import { getOrderHistory } from "@/lib/auth";
import { subscribeToPush, isPushSubscribed } from "@/lib/push";
import DeliveryCodeCard from "@/components/DeliveryCodeCard";
import { toast } from "sonner";

const STATUS_FLOW = [
  { key: "pending", label: "Commande reçue", desc: "Nous avons bien reçu votre commande." },
  { key: "confirmed", label: "Confirmée", desc: "Votre commande est confirmée ✅" },
  { key: "preparing", label: "En préparation", desc: "Nous préparons votre commande." },
  { key: "ready", label: "Prête", desc: "Votre commande est prête !" },
  { key: "en-route", label: "En livraison", desc: "Votre commande est en route ! 🛵" },
  { key: "delivered", label: "Livraison effectuée", desc: "Livraison effectuée avec succès ! 🎉" },
];

const STATUS_MAP: Record<string, { label: string; desc: string }> = {};
STATUS_FLOW.forEach(s => { STATUS_MAP[s.key] = s; });

function getStatusIndex(key: string): number {
  return STATUS_FLOW.findIndex(s => s.key === key);
}

function SuiviContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("id") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "pending");
  const initialOrder = (() => {
    if (typeof window === "undefined") return null;
    const sid = searchParams.get("id");
    if (!sid) return null;
    const history = getOrderHistory();
    return history.find((o: any) => String(o.id) === sid) || null;
  })();
  const [orderData, setOrderData] = useState<any>(initialOrder);
  const [searched, setSearched] = useState(!!initialOrder);
  const [loading, setLoading] = useState(false);
  // Le numéro de commande est devinable (42, 43, 44…). Le téléphone
  // sert de preuve de possession pour afficher le code de remise.
  const [tel, setTel] = useState("");
  const [erreur, setErreur] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSubscribing, setPushSubscribing] = useState(false);

  const currentIdx = getStatusIndex(status);

  const fetchOrder = async () => {
    if (!orderId.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // ─── Route publique dédiée ────────────────────────────────
      // Avant : cette page appelait /api/admin/orders avec un en-tête
      // bidon « X-Admin-Auth: client-request ». Deux problèmes :
      //
      //  1. La route répond 401 depuis que l'authentification admin
      //     est appliquée. Le `catch {}` vide avalait l'erreur : la
      //     page affichait « commande introuvable » pour TOUS les
      //     numéros, y compris les bons.
      //  2. Si elle avait répondu, elle aurait renvoyé les 200
      //     dernières commandes — noms, téléphones et adresses de
      //     tous les clients — au navigateur de n'importe quel
      //     visiteur.
      //
      // /api/suivi ne renvoie QU'UNE commande, sans donnée nominative.
      const q = new URLSearchParams({ ref: orderId.trim() });
      if (tel.trim()) q.set("tel", tel.trim());
      const res = await fetch(`/api/suivi?${q}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.id) {
        setOrderData(data);
        setStatus(data.status);
        setErreur("");
      } else {
        setOrderData(null);
        // On affiche le motif au lieu de l'avaler en silence.
        setErreur(data?.error || "Commande introuvable");
      }
    } catch {
      setOrderData(null);
      setErreur("Connexion impossible. Réessayez dans un instant.");
    }
    setLoading(false);
  };

  // Polling auto toutes les 15s
  useEffect(() => {
    if (!searched || !orderData) return;
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, orderData?.id]);

  // Vérifier si déjà abonné aux push pour cette commande
  useEffect(() => {
    if (orderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPushEnabled(isPushSubscribed(orderId));
    }
  }, [orderId]);

  // Mise à jour quand orderId change (recherche dans l'historique)
  useEffect(() => {
    if (!orderId || searched) return;
    const history = getOrderHistory();
    const found = history.find((o: any) => String(o.id) === orderId);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (found) { setOrderData(found); setSearched(true); }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // S'abonner aux notifications push
  const handlePushToggle = async () => {
    if (pushEnabled) {
      setPushEnabled(false);
      toast.info("Notifications désactivées");
      return;
    }
    if (!orderId) {
      toast.error("Entre d'abord un numéro de commande");
      return;
    }
    setPushSubscribing(true);
    const ok = await subscribeToPush(orderId);
    setPushSubscribing(false);
    if (ok) {
      setPushEnabled(true);
      toast.success("🔔 Notifications activées ! Tu seras prévenu en temps réel.");
    } else {
      toast.error("Impossible d'activer les notifications. Vérifie les permissions navigateur.");
    }
  };

  const recentOrders = getOrderHistory().slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0d0808] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">← Retour au site</Link>
        <h1 className="font-heading text-3xl md:text-4xl tracking-wider text-white mb-2">Suivi de commande</h1>
        <p className="text-white/50 text-sm mb-8">Entre ton numéro de commande pour suivre son avancement</p>

        <div className="flex gap-2 mb-3">
          <input type="text" placeholder="Numéro de commande (ex: 42)" value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchOrder()}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
          <button onClick={fetchOrder} disabled={loading || !orderId.trim()}
            className="px-6 py-3 rounded-xl bg-brand-red text-white font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading ? "..." : "Suivre"}
          </button>
        </div>

        {/* Le téléphone est facultatif pour voir l'avancement, mais
            obligatoire pour afficher le code de remise : sans lui,
            n'importe qui devinant le numéro obtiendrait le code. */}
        <input type="tel" inputMode="tel"
          placeholder="Téléphone (facultatif — requis pour le code de remise)"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchOrder()}
          className="w-full px-4 py-2.5 mb-6 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />

        {/* Avant, l'échec était avalé par un catch vide et l'écran
            restait muet. On dit maintenant ce qui ne va pas. */}
        {erreur && !loading && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-bold">{erreur}</p>
              <p className="text-white/40 text-xs mt-1">
                Vérifiez le numéro figurant sur votre confirmation de
                commande. Besoin d&apos;aide ?{" "}
                <a href="tel:+33672044875" className="underline hover:text-white/70">
                  06 72 04 48 75
                </a>
              </p>
            </div>
          </div>
        )}

        {(searched || status) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-6 w-6 text-brand-red" />
              <div>
                <h2 className="font-heading text-lg text-white">
                  {orderData ? "Commande #" + orderData.id : "Statut actuel"}
                </h2>
                {orderData?.customer_name && (
                  <p className="text-white/40 text-xs">{orderData.customer_name}</p>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {/* Bouton notification push */}
                {orderData && (
                  <button onClick={handlePushToggle} disabled={pushSubscribing}
                    className={`p-2 rounded-lg transition-all border ${
                      pushEnabled
                        ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                        : "bg-white/5 text-white/30 border-white/10 hover:bg-white/10 hover:text-white/50"
                    }`}
                    title={pushEnabled ? "Notifications activées" : "Activer les notifications"}>
                    {pushSubscribing ? (
                      <span className="h-4 w-4 block animate-pulse">⏳</span>
                    ) : pushEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </button>
                )}
                <span className={"px-2.5 py-1 rounded-full text-[10px] font-bold border " + (
                  status === "pending" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                  status === "confirmed" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                  status === "preparing" ? "bg-orange-500/20 text-orange-300 border-orange-500/30" :
                  status === "en-route" ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" :
                  status === "ready" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                  status === "delivered" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                  "bg-white/10 text-white"
                )}>
                  {STATUS_MAP[status]?.label || status}
                </span>
              </div>
            </div>

            {/* Code de remise : n'apparaît que si le téléphone fourni
                correspond à la commande (contrôlé côté serveur). */}
            {orderData?.delivery_code && (
              <DeliveryCodeCard
                code={orderData.delivery_code}
                status={status}
                mode={orderData.mode}
              />
            )}

            {/* Notification push info */}
            {pushEnabled && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-2.5 rounded-lg bg-green-500/5 border border-green-500/10 flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-green-400" />
                <p className="text-[10px] text-green-300">Notifications activées — tu seras prévenu dès que le statut change !</p>
              </motion.div>
            )}

            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/10" />
              <div className="space-y-0">
                {STATUS_FLOW.map((step, i) => {
                  const isActive = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  const isPast = i < currentIdx;
                  return (
                    <motion.div key={step.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative flex items-start gap-4 pb-6 last:pb-0"
                    >
                      <div className={"relative z-10 w-[16px] h-[16px] rounded-full mt-0.5 shrink-0 border-2 transition-all duration-500 " + (
                        isPast ? "bg-emerald-500 border-emerald-500" :
                        isCurrent ? "bg-brand-red border-brand-red shadow-lg shadow-brand-red/50 scale-125" :
                        "bg-transparent border-white/20"
                      )}>
                        {isPast && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                        {isCurrent && (
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -inset-2 rounded-full bg-brand-red/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={"text-sm font-bold " + (isActive ? "text-white" : "text-white/30")}>
                          {step.label}
                        </p>
                        <p className={"text-[11px] " + (isActive ? "text-white/60" : "text-white/20")}>
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {orderData && (
              <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">Détails</p>
                {orderData.customer_phone && (
                  <a href={"tel:" + orderData.customer_phone} className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {orderData.customer_phone}
                  </a>
                )}
                {orderData.address && (
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="h-3.5 w-3.5 text-brand-red" /> {orderData.address}
                  </p>
                )}
                <p className="text-sm text-white/40">
                  {orderData.mode === "livraison" ? "🚚 Livraison" : "🥡 À emporter"}
                  {orderData.scheduled_time ? " · 🕐 " + orderData.scheduled_time : ""}
                </p>
              </div>
            )}

            {!orderData && searched && (
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <p className="text-sm text-amber-300">Commande non trouvée. Vérifie le numéro ou réessaie plus tard.</p>
              </div>
            )}

            {!orderData && recentOrders.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-white/40 mb-2">Tes dernières commandes :</p>
                {recentOrders.map((o: any) => (
                  <button key={o.id} onClick={() => { setOrderId(String(o.id)); setSearched(true); setOrderData(o); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 mb-1.5 text-left">
                    <Package className="h-4 w-4 text-brand-red shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">#{o.id} — {o.items?.map((i: any) => i.name).join(", ")}</p>
                      <p className="text-[10px] text-white/40">{o.total?.toFixed(2)}€ · {new Date(o.date).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Call to action notification */}
        {!searched && (
          <div className="bg-gradient-to-r from-brand-red/10 to-indigo-500/10 border border-brand-red/20 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-brand-red" />
              <div>
                <p className="text-white font-bold text-sm">🔔 Notifications temps réel</p>
                <p className="text-white/40 text-[10px]">Active les notifications push pour être prévenu instantanément du changement de statut.</p>
              </div>
            </div>
          </div>
        )}

        <Link href="/" className="block text-center text-white/30 hover:text-white/50 text-xs mt-6">← Retour au site</Link>
      </div>
    </div>
  );
}

export default function SuiviPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0808] flex items-center justify-center"><p className="text-white/50">Chargement...</p></div>}>
      <SuiviContent />
    </Suspense>
  );
}
