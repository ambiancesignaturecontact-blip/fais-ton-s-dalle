"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp, Users, ShoppingBag, DollarSign, Star, Eye, MapPin } from "lucide-react";
import { SalesChart } from "@/components/admin/SalesChart";
import { getAnalytics, resetAnalytics } from "@/lib/analytics";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function Kpi({ icon: Icon, label, value, sub, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-[9px] text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[8px] text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

export function AdminAnalyticsTab() {
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"today" | "week" | "month">("month");
  const [analyticsData, setAnalyticsData] = useState(getAnalytics());

  useEffect(() => {
    const interval = setInterval(() => setAnalyticsData(getAnalytics()), 30000);
    return () => clearInterval(interval);
  }, []);

  const periodStats = analyticsData[analyticsPeriod];

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 space-y-4 pb-12">
      <div className="flex gap-1.5">
        {(["today", "week", "month"] as const).map((p) => (
          <button key={p} onClick={() => setAnalyticsPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${analyticsPeriod === p ? "bg-brand-red text-white" : "bg-white/5 text-white/50"}`}>
            {p === "today" ? "Aujourd'hui" : p === "week" ? "7 jours" : "30 jours"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Kpi icon={Eye} label="Visites" value={periodStats.visits.toLocaleString()} color="text-blue-400" />
        <Kpi icon={ShoppingBag} label="Commandes" value={String(periodStats.orders)} sub={`${periodStats.conversionRate}% conv.`} color="text-green-400" />
        <Kpi icon={DollarSign} label="CA" value={`${periodStats.revenue.toFixed(0)}€`} color="text-yellow-400" />
        <Kpi icon={Users} label="Panier moy." value={`${periodStats.avgCart.toFixed(2)}€`} color="text-brand-red" />
      </div>

      <section className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="h-3.5 w-3.5 text-yellow-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Top produits</h3>
        </div>
        <div className="space-y-1.5">
          {analyticsData.topProducts.map((p, i) => {
            const maxC = analyticsData.topProducts[0]?.count || 1;
            return (
              <div key={p.name} className="flex items-center gap-2">
                <span className="text-[9px] text-white/30 w-4 text-right font-mono">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="text-white/50 shrink-0 ml-2">{p.count}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(p.count / maxC) * 100}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-red to-amber-400" transition={{ duration: 0.6, delay: i * 0.05 }} />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-white/50 w-14 text-right">{p.revenue.toFixed(0)}€</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="h-3.5 w-3.5 text-brand-red" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Activit horaire</h3>
        </div>
        <div className="space-y-1.5">
          {analyticsData.hourlyActivity.map((h) => {
            const maxV = Math.max(...analyticsData.hourlyActivity.map(x => x.visits));
            return (
              <div key={h.hour} className="flex items-center gap-2">
                <span className="text-[9px] text-white/50 w-14 font-mono">{h.hour}</span>
                <div className="flex-1 h-5 rounded-md bg-white/5 overflow-hidden relative">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(h.visits / maxV) * 100}%` }}
                    className="h-full rounded-md bg-gradient-to-r from-indigo-500/40 to-brand-red/40" transition={{ duration: 0.5 }} />
                  <div className="absolute inset-0 flex items-center px-2">
                    <span className="text-[8px] text-white/80 font-medium">{h.visits} visites · {h.orders} commandes</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-amber-400 flex items-center gap-1">
          <TrendingUp className="h-2.5 w-2.5" /> Pic nocturne 23h-2h — 58% des commandes
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Top villes livr es</h3>
        </div>
        <div className="space-y-1.5">
          {analyticsData.topZones.map((z, i) => {
            const maxC = analyticsData.topZones[0]?.count || 1;
            return (
              <div key={z.ville} className="flex items-center gap-2">
                <span className="text-[9px] text-white/30 w-3 font-mono">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px]"><span>{z.ville}</span><span className="text-white/50">{z.count} cmd</span></div>
                  <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden mt-0.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(z.count / maxC) * 100}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" transition={{ duration: 0.4, delay: i * 0.05 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SalesChart period={analyticsPeriod} stats={periodStats} hourlyActivity={analyticsData.hourlyActivity} />

      <div className="flex justify-center pt-4">
        <button onClick={() => {
          if (confirm("Voulez-vous vraiment réinitialiser toutes les données analytics ? Cette action est irréversible.")) {
            resetAnalytics();
            setAnalyticsData(getAnalytics());
            toast.success("Données analytics réinitialisées");
          }
        }}
          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500/20 transition-colors">
          🗑 Réinitialiser les données
        </button>
      </div>
    </div>
  );
}
