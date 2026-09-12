"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Phone, Search, Package } from "lucide-react";
import type { Order } from "@/data/types";
import { useState } from "react";

const MODE_ICONS: Record<string, string> = { livraison: "🚚", emporter: "🥡" };

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
      <span className={`text-xs font-bold ${color}`}>{count}</span>
      <span className="text-[9px] text-white/40">{label}</span>
    </div>
  );
}

export function AdminHistoryTab({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "delivered" | "cancelled">("all");

  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "delivered" && o.status !== "delivered") return false;
    if (filterStatus === "cancelled" && o.status !== "cancelled") return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (o.customer_name || "").toLowerCase();
      const phone = (o.customer_phone || "").toLowerCase();
      const id = String(o.id);
      if (!name.includes(q) && !phone.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-4 w-4 text-white/50" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Historique des commandes</h3>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <StatCard label="Livr&eacute;es" count={deliveredCount} color="text-emerald-400" />
        <StatCard label="Annul&eacute;es" count={cancelledCount} color="text-red-400" />
        <StatCard label="Total historique" count={orders.length} color="text-white" />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mb-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterStatus("all")}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold ${filterStatus === "all" ? "bg-white/15 text-white" : "bg-white/5 text-white/40"}`}>Toutes</button>
          <button onClick={() => setFilterStatus("delivered")}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold ${filterStatus === "delivered" ? "bg-green-500/20 text-green-300" : "bg-white/5 text-white/40"}`}>✅ Livr&eacute;es</button>
          <button onClick={() => setFilterStatus("cancelled")}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold ${filterStatus === "cancelled" ? "bg-red-500/20 text-red-300" : "bg-white/5 text-white/40"}`}>❌ Annul&eacute;es</button>
        </div>
      </div>
      <div className="space-y-2 pb-12">
        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">Aucune commande dans l&apos;historique</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <motion.div key={order.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="rounded-xl p-3 border bg-white/[0.02] border-white/5 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{MODE_ICONS[order.mode || ""] || "📦"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-heading tracking-wider truncate text-white/70">#{order.id} — {order.customer_name || "Anonyme"}</p>
                      <p className="text-[9px] text-white/20 flex items-center gap-1">
                        <Clock className="h-2 w-2" />{new Date(order.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {order.status === "delivered" ? (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">✅ Livr&eacute;e</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold border bg-red-500/10 text-red-300 border-red-500/20">❌ Annul&eacute;e</span>
                    )}
                    <span className="text-[9px] font-bold text-white/40">{order.total.toFixed(2)}€</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {order.order_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[9px] text-white/40">
                      <span className="truncate">{item.quantity}x {item.item_name}</span>
                      <span className="shrink-0 ml-2">{item.subtotal.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
                {order.customer_phone && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/5">
                    <a href={`tel:${order.customer_phone}`} className="text-[9px] text-blue-400 hover:underline flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" /> {order.customer_phone}
                    </a>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
