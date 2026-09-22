"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, Truck, Phone, Search, Calendar } from "lucide-react";
import { TicketPrint } from "@/components/admin/TicketPrint";
import type { Order } from "@/data/types";
import { STATUS_FLOW, STATUS_COLORS } from "@/data/types";
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

export function AdminOrdersTab({
  orders, pendingCount, onUpdateStatus
}: {
  orders: Order[];
  pendingCount: number;
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
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
      <div className="flex flex-wrap gap-1.5 mb-3">
        <StatCard label="Total" count={orders.length} color="text-white" />
        <StatCard label="En attente" count={pendingCount} color="text-yellow-400" />
        <StatCard label="En prépa" count={orders.filter(o => o.status === "preparing").length} color="text-orange-400" />
        <StatCard label="Prêtes" count={orders.filter(o => o.status === "ready").length} color="text-green-400" />
        <StatCard label="En route" count={orders.filter(o => o.status === "en-route").length} color="text-indigo-400" />
        <StatCard label="Livrées" count={orders.filter(o => o.status === "delivered").length} color="text-emerald-400" />
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
          {STATUS_FLOW.map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold ${filterStatus === s ? "bg-white/15 text-white" : "bg-white/5 text-white/40"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2 pb-12">
        <AnimatePresence>
          {filteredOrders.map((order) => (
            <motion.div key={order.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={`rounded-xl p-3 border ${order.status === "pending" ? "bg-yellow-500/5 border-yellow-500/20" : "bg-white/[0.03] border-white/5"}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{MODE_ICONS[order.mode || ""] || "📦"}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-heading tracking-wider truncate">#{order.id} — {order.customer_name || "Anonyme"}</p>
                    <p className="text-[9px] text-white/30 flex items-center gap-1">
                      <Clock className="h-2 w-2" />{new Date(order.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {order.scheduled_time && (
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[7px] font-bold flex items-center gap-0.5">
                      <Calendar className="h-2 w-2" />{order.scheduled_time}
                    </span>
                  )}
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold border ${STATUS_COLORS[order.status] || "bg-white/10"}`}>
                    {order.status === "pending" ? "En attente" : order.status === "confirmed" ? "Confirmée" : order.status === "preparing" ? "En prépa" : order.status === "ready" ? "Prête" : order.status === "en-route" ? "En route 🛵" : order.status === "delivered" ? "Livrée" : order.status}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 mb-1.5">
                {order.order_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] text-white/50">
                    <span className="truncate">{item.quantity}x {item.item_name}
                      {item.customization ? <span className="text-white/20 ml-1">[{item.customization.substring(0, 25)}]</span> : ""}</span>
                    <span className="shrink-0 ml-2">{item.subtotal.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                  {order.customer_phone && (
                    <a href={`tel:${order.customer_phone}`} className="hover:text-white/70"><Phone className="h-2.5 w-2.5 inline mr-0.5" />{order.customer_phone}</a>
                  )}
                  <span className={order.is_paid ? "text-green-400" : "text-yellow-400"}>{order.is_paid ? "✅" : "⏳"}</span>
                  <span className="font-semibold text-white/50">{order.total.toFixed(2)}€</span>
                </div>
                <div className="flex gap-1">
                  {order.status === "pending" && (<>
                    <button onClick={() => onUpdateStatus(order.id, "confirmed")} className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 text-[8px] font-bold hover:bg-blue-500/25"><CheckCircle className="h-2 w-2 inline mr-0.5" />Confirmer</button>
                    <button onClick={() => onUpdateStatus(order.id, "cancelled")} className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 text-[8px] font-bold hover:bg-red-500/25">Annuler</button>
                  </>)}
                  {order.status === "confirmed" && <button onClick={() => onUpdateStatus(order.id, "preparing")} className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 text-[8px] font-bold hover:bg-orange-500/25">En prepa</button>}
                  {order.status === "preparing" && <button onClick={() => onUpdateStatus(order.id, "ready")} className="px-2 py-0.5 rounded-md bg-green-500/15 text-green-300 text-[8px] font-bold hover:bg-green-500/25">Prêt</button>}
                  {order.status === "ready" && <button onClick={() => onUpdateStatus(order.id, "delivered")} className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[8px] font-bold hover:bg-emerald-500/25"><Truck className="h-2 w-2 inline mr-0.5" />Livré</button>}
                  <TicketPrint order={order} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
