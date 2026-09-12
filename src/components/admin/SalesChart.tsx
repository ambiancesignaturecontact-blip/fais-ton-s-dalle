"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface SalesChartProps {
  period: "today" | "week" | "month";
  stats: {
    visits: number;
    orders: number;
    revenue: number;
    avgCart: number;
    conversionRate: number;
  };
  hourlyActivity: { hour: string; visits: number; orders: number }[];
}

export function SalesChart({ period, stats, hourlyActivity }: SalesChartProps) {
  const maxRevenue = Math.max(...hourlyActivity.map(h => h.orders * (stats.avgCart || 10)), 1);

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
          Graphique des ventes
          <span className="ml-1.5 text-white/40 font-normal normal-case">
            {period === "today" ? "Aujourd'hui" : period === "week" ? "7 jours" : "30 jours"}
          </span>
        </h3>
        <span className="ml-auto text-[10px] font-bold text-white/50">
          {stats.revenue >= 1000 ? `${(stats.revenue / 1000).toFixed(1)}k` : stats.revenue.toFixed(0)}€ CA
        </span>
      </div>

      {/* Barres */}
      <div className="flex items-end gap-1.5 h-28 mb-1">
        {hourlyActivity.map((h, i) => {
          const barHeight = maxRevenue > 0 ? Math.max(4, (h.orders * (stats.avgCart || 10)) / maxRevenue * 100) : 4;
          const isHigh = h.orders > 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className={`w-full rounded-t-md ${isHigh ? "bg-gradient-to-t from-brand-red to-amber-400" : "bg-white/5"}`}
                style={{ minHeight: isHigh ? "4px" : "2px" }}
              />
              {h.orders > 0 && (
                <span className="text-[7px] text-white/60 font-bold leading-none">{h.orders}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende horaire */}
      <div className="flex justify-between mt-1">
        {hourlyActivity.map((h, i) => (
          <span key={i} className="text-[6px] text-white/30 font-mono">{h.hour.replace("h", "").split("-")[0]}</span>
        ))}
      </div>

      {/* Mini KPIs */}
      <div className="flex justify-between mt-3 pt-2 border-t border-white/5 text-[9px]">
        <span className="text-white/50">
          Commandes : <strong className="text-white">{stats.orders}</strong>
        </span>
        <span className="text-white/50">
          Visites : <strong className="text-white">{stats.visits}</strong>
        </span>
        <span className="text-white/50">
          Conv. : <strong className="text-white">{stats.conversionRate}%</strong>
        </span>
      </div>
    </div>
  );
}
