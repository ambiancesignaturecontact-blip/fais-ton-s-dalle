"use client";

// ─────────────────────────────────────────────────────────────────
//  src/app/admin/page.tsx — VERSION CORRIGÉE
//
//  4 corrections par rapport à ta version :
//
//  1. `Clock` n'était pas importé de lucide-react
//     → "Clock is not defined", le build échoue
//
//  2. L'onglet avait id "clock" mais le rendu testait "hours"
//     → l'onglet s'affichait, mais cliquer dessus ne montrait RIEN
//       (page vide : aucune condition ne correspondait)
//
//  3. Le type du useState ne connaissait pas "hours"
//     → erreur TypeScript au build
//
//  4. `StockManagement` était encore importé mais plus utilisé
//     → avertissement de lint, import mort
//
//  Les lignes modifiées sont marquées « ← CORRIGÉ ».
// ─────────────────────────────────────────────────────────────────

import HoursPanel from "@/components/HoursPanel";
import StockPanel from "@/components/StockPanel";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
// ← CORRIGÉ : ajout de Clock (sinon "Clock is not defined")
import {
  Package, Bell, AlertTriangle, TrendingUp, ShoppingBag,
  Timer, RefreshCw, History, Clock,
} from "lucide-react";
import { requestPushPermission, notifyNewOrder, notifyOnTheWay } from "@/lib/notifications";
import { AdminOrdersTab } from "@/components/admin/tabs/OrdersTab";
import { AdminHistoryTab } from "@/components/admin/tabs/HistoryTab";
import { AdminAnalyticsTab } from "@/components/admin/tabs/AnalyticsTab";
// ← CORRIGÉ : StockManagement supprimé, remplacé par StockPanel
import { AdminToolsTab } from "@/components/admin/tabs/ToolsTab";
import type { Order } from "@/data/types";
import { toast } from "sonner";

const TABS = [
  { id: "orders" as const, label: "Commandes", icon: ShoppingBag },
  { id: "history" as const, label: "Historique", icon: History },
  { id: "analytics" as const, label: "Analytics", icon: TrendingUp },
  { id: "stock" as const, label: "Stock", icon: Package },
  // ← CORRIGÉ : id "hours" (pas "clock") pour correspondre au rendu,
  //   et libellé « Horaires » — « Clock » ne veut rien dire pour toi
  { id: "hours" as const, label: "Horaires", icon: Clock },
  { id: "tools" as const, label: "Outils", icon: Timer },
];

// ← CORRIGÉ : le type est déduit de TABS, impossible qu'ils divergent
type TabId = (typeof TABS)[number]["id"];

function playNotificationSound() {
  try {
    const Ctx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [800, 1000, 1200].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1);
      g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
      o.start(ctx.currentTime + i * 0.1);
      o.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  } catch {}
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  // ← CORRIGÉ : TabId au lieu d'une liste écrite à la main où
  //   "hours" manquait (erreur TypeScript au build)
  const [activeTab, setActiveTab] = useState<TabId>("orders");
  const prevOrdersRef = useRef<Order[]>([]);
  const prevPendingRef = useRef(0);

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/orders", { headers: { "X-Admin-Auth": password } });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      const newOrders: Order[] = data.orders || [];
      if (newOrders.length > prevOrdersRef.current.length) {
        const np = newOrders.filter((o) => o.status === "pending").length;
        if (np > prevPendingRef.current) {
          playNotificationSound();
          notifyNewOrder(newOrders[0]?.id || 0, newOrders[0]?.customer_name || "Client");
        }
      }
      prevOrdersRef.current = newOrders;
      prevPendingRef.current = newOrders.filter((o) => o.status === "pending").length;
      setOrders(newOrders);
    } catch { setError("Impossible de charger"); } finally { setLoading(false); }
  }, [password]);

  const updateStatus = useCallback(async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Auth": password },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la mise à jour");
        return;
      }
      toast.success(`Commande #${orderId} → ${newStatus}`);
      if (newStatus === "en-route") {
        const order = orders.find(o => o.id === orderId);
        if (order) notifyOnTheWay(order.id, order.customer_name || "Client");
      }
      fetchOrders();
    } catch { toast.error("Erreur réseau"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password, fetchOrders]);

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { setAuthenticated(true); fetchOrders(); }
      else setError("Mot de passe incorrect");
    } catch { setError("Erreur de connexion"); }
  };

  useEffect(() => {
    if (!authenticated || !autoRefresh) return;
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, [authenticated, autoRefresh, fetchOrders]);

  useEffect(() => { requestPushPermission(); }, []);

  if (!authenticated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <Package className="h-10 w-10 text-brand-red mx-auto mb-3" />
          <h1 className="font-heading text-2xl tracking-wider text-white">Admin <span className="text-brand-red">FTSD</span></h1>
          <p className="text-white/40 text-xs mt-1 mb-6">Gestion & analytics</p>
          <input type="password" placeholder="Mot de passe admin" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-red/50 transition-colors" autoFocus />
          {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
          <button onClick={handleLogin} className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold text-sm shadow-lg">Connexion</button>
          <Link href="/" className="block text-white/30 hover:text-white/50 text-xs mt-4">← Retour au site</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0808] text-white">
      <header className="sticky top-0 z-50 bg-[#0d0808]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-brand-red" />
            <h1 className="font-heading text-lg tracking-wider"><span className="text-brand-red">FTSD</span> Admin</h1>
            {pendingCount > 0 && (
              <motion.span key={pendingCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] font-bold">
                <AlertTriangle className="h-2.5 w-2.5" />{pendingCount}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPushEnabled(!pushEnabled)}
              className={`p-1.5 rounded-lg transition-colors ${pushEnabled ? "text-green-400" : "text-white/30"}`} title="Notifications push">
              <Bell className="h-4 w-4" />
            </button>
            <button onClick={fetchOrders} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <label className="flex items-center gap-1 text-[9px] text-white/30 cursor-pointer">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="accent-brand-red w-3 h-3" /> Auto
            </label>
            <Link href="/" className="text-[9px] text-white/30 hover:text-white/60 ml-1">Site →</Link>
          </div>
        </div>
        {/* ← CORRIGÉ : overflow-x-auto — avec 6 onglets ça déborde sur téléphone */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              aria-current={activeTab === t.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${activeTab === t.id ? "bg-brand-red text-white" : "text-white/50 hover:bg-white/5"}`}>
              <t.icon className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === "orders" && <AdminOrdersTab orders={orders} pendingCount={pendingCount} onUpdateStatus={updateStatus} />}
      {activeTab === "history" && <AdminHistoryTab orders={orders.filter(o => o.status === "delivered" || o.status === "cancelled")} />}
      {activeTab === "analytics" && <AdminAnalyticsTab />}

      {activeTab === "stock" && (
        <div className="max-w-7xl mx-auto px-4 py-3 pb-12">
          <StockPanel adminPassword={password} />
        </div>
      )}

      {/* ← CORRIGÉ : "hours" correspond maintenant à l'id de TABS */}
      {activeTab === "hours" && (
        <div className="max-w-7xl mx-auto px-4 py-3 pb-12">
          <HoursPanel adminPassword={password} />
        </div>
      )}

      {activeTab === "tools" && <AdminToolsTab orders={orders} adminPassword={password} />}
    </div>
  );
}
