"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Star, Tag, ThumbsUp, ThumbsDown, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCard } from "@/components/qr/QRCodeCard";
import { ExportPDF } from "@/components/admin/ExportPDF";
import { ExportCSV } from "@/components/admin/ExportCSV";
import type { Order } from "@/data/types";
import { STATUS_COLORS } from "@/data/types";
import { getPromoCodes, savePromoCodes } from "@/data/promo-codes";
import type { PromoCode } from "@/data/promo-codes";

interface ReviewItem {
  id: number;
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  is_rejected: boolean;
  created_at: string;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "En attente", confirmed: "Confirmée", preparing: "En prépa",
    ready: "Prête", "en-route": "En route 🛵", delivered: "Livraison effectuée", cancelled: "Annulée",
  };
  return map[status] || status;
}

export function AdminToolsTab({ orders, adminPassword }: { orders: Order[]; adminPassword?: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(getPromoCodes());
  const [showNewPromo, setShowNewPromo] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState(10);
  const [newPromoType, setNewPromoType] = useState<"percent" | "fixed">("percent");
  const [newPromoMax, setNewPromoMax] = useState(100);
  const scheduledOrders = orders.filter(o => o.scheduled_time)
    .sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""));

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch("/api/reviews?all=true", {
        headers: { "X-Admin-Auth": adminPassword || "" },
      });
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch { toast.error("Erreur chargement avis"); }
    setReviewsLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReviews(); }, []);

  const handleReviewAction = async (reviewId: number, action: "approve" | "reject" | "delete") => {
    if (!adminPassword) {
      toast.error("Session admin expirée, reconnectez-vous");
      return;
    }
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Auth": adminPassword },
        body: JSON.stringify({ reviewId, action }),
      });
      if (res.ok) {
        toast.success(action === "approve" ? "Avis approuvé" : action === "reject" ? "Avis rejeté" : "Avis supprimé");
        fetchReviews();
      } else {
        toast.error("Action non autorisée");
      }
    } catch {}
  };

  const pendingReviews = reviews.filter(r => !r.is_approved && !r.is_rejected);
  const approvedReviews = reviews.filter(r => r.is_approved);
  const rejectedReviews = reviews.filter(r => r.is_rejected);

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 space-y-3 pb-12">
      <QRCodeCard />
      <ExportPDF />
      <ExportCSV orders={orders} />

      {/* ⭐ Modération des avis */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-yellow-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Avis clients — Modération
          </h3>
          {pendingReviews.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[8px] font-bold">
              {pendingReviews.length} en attente
            </span>
          )}
        </div>

        {reviewsLoading ? (
          <div className="p-4 text-center text-[10px] text-white/30">Chargement...</div>
        ) : reviews.length === 0 ? (
          <div className="p-3 rounded-lg bg-white/5 border border-dashed border-white/10 text-center">
            <p className="text-[10px] text-white/30 italic">Aucun avis pour le moment</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {/* Avis en attente */}
            {pendingReviews.map(r => (
              <div key={r.id} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-white">{r.name}</span>
                    <span className="text-yellow-400 text-[8px]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <span className="text-[8px] text-white/30">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <p className="text-[9px] text-white/60 mb-1.5 italic">&ldquo;{r.comment.substring(0, 100)}{r.comment.length > 100 ? "..." : ""}&rdquo;</p>
                <div className="flex gap-1">
                  <button onClick={() => handleReviewAction(r.id, "approve")}
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-green-500/15 text-green-300 text-[8px] font-bold hover:bg-green-500/25">
                    <ThumbsUp className="h-2.5 w-2.5" /> Approuver
                  </button>
                  <button onClick={() => handleReviewAction(r.id, "reject")}
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 text-[8px] font-bold hover:bg-red-500/25">
                    <ThumbsDown className="h-2.5 w-2.5" /> Rejeter
                  </button>
                </div>
              </div>
            ))}
            {/* Avis approuvés */}
            {approvedReviews.map(r => (
              <div key={r.id} className="p-2 rounded-lg bg-green-500/[0.02] border border-green-500/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-green-400 text-[10px]">✅</span>
                    <span className="text-[9px] text-white/70 truncate">{r.name} — {r.comment.substring(0, 60)}</span>
                  </div>
                  <button onClick={() => handleReviewAction(r.id, "delete")}
                    className="p-0.5 rounded text-red-400/50 hover:text-red-400 shrink-0">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            {/* Avis rejetés */}
            {rejectedReviews.map(r => (
              <div key={r.id} className="p-2 rounded-lg bg-red-500/[0.02] border border-red-500/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-red-400 text-[10px]">❌</span>
                    <span className="text-[9px] text-white/40 truncate">{r.name} — {r.comment.substring(0, 60)}</span>
                  </div>
                  <button onClick={() => handleReviewAction(r.id, "delete")}
                    className="p-0.5 rounded text-red-400/50 hover:text-red-400 shrink-0">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={fetchReviews}
          className="w-full mt-2 py-1.5 rounded-lg bg-white/5 text-white/40 text-[8px] font-bold hover:bg-white/10 transition-colors">
          ↻ Rafraîchir
        </button>
      </div>

      {/* Codes promo */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Codes promo
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px]">{promoCodes.length}</span>
          </h3>
          <button onClick={() => setShowNewPromo(!showNewPromo)}
            className="ml-auto p-1 rounded-lg hover:bg-white/5 text-purple-400">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {showNewPromo && (
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 mb-3 space-y-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Code (ex: PROMO20)" value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                className="flex-1 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs uppercase focus:outline-none focus:border-purple-500/50" />
              <input type="number" placeholder="% ou €" value={newPromoDiscount}
                onChange={(e) => setNewPromoDiscount(Number(e.target.value))} min={1} max={100}
                className="w-16 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs text-center focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setNewPromoType("percent")}
                className={`px-2 py-1 rounded text-[9px] font-bold ${newPromoType === "percent" ? "bg-purple-500/30 text-purple-200" : "bg-white/5 text-white/40"}`}>%</button>
              <button onClick={() => setNewPromoType("fixed")}
                className={`px-2 py-1 rounded text-[9px] font-bold ${newPromoType === "fixed" ? "bg-purple-500/30 text-purple-200" : "bg-white/5 text-white/40"}`}>€</button>
              <input type="number" placeholder="Max utilisations" value={newPromoMax}
                onChange={(e) => setNewPromoMax(Number(e.target.value))} min={1}
                className="w-20 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs text-center focus:outline-none focus:border-purple-500/50" />
              <button onClick={() => {
                if (!newPromoCode.trim()) { toast.error("Code requis"); return; }
                const codes = [...promoCodes, { code: newPromoCode.trim().toUpperCase(), discount: newPromoDiscount, type: newPromoType, uses: 0, maxUses: newPromoMax, active: true }];
                setPromoCodes(codes); savePromoCodes(codes);
                setShowNewPromo(false); setNewPromoCode(""); toast.success("Code promo ajouté !");
              }}
                className="px-3 py-1 rounded-lg bg-purple-600 text-white text-[9px] font-bold hover:bg-purple-700">Créer</button>
            </div>
          </div>
        )}

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {promoCodes.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-bold ${p.active ? "text-purple-300" : "text-white/30 line-through"}`}>{p.code}</span>
                <span className="text-[8px] text-white/40">{p.type === "percent" ? `${p.discount}%` : `${p.discount}€`}</span>
                <span className="text-[8px] text-white/30">{p.uses}/{p.maxUses} utilisations</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => {
                  const codes = [...promoCodes]; codes[i] = { ...codes[i], active: !codes[i].active };
                  setPromoCodes(codes); savePromoCodes(codes); toast.success(p.active ? "Désactivé" : "Activé");
                }}
                  className={`p-0.5 rounded text-[8px] ${p.active ? "text-green-400" : "text-red-400"}`}>{p.active ? "ON" : "OFF"}</button>
                <button onClick={() => {
                  const codes = promoCodes.filter((_, j) => j !== i);
                  setPromoCodes(codes); savePromoCodes(codes); toast.success("Supprimé");
                }}
                  className="p-0.5 rounded text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Commandes programmées
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px]">{scheduledOrders.length}</span>
          </h3>
        </div>

        {scheduledOrders.length > 0 ? (
          <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
            {scheduledOrders.map(order => (
              <ScheduledOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-white/5 border border-dashed border-white/10 text-center">
            <p className="text-[10px] text-white/30 italic">Aucune commande programmée</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduledOrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-indigo-500/10 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-3 w-3 text-indigo-400 shrink-0" />
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-semibold text-white truncate">#{order.id} — {order.customer_name || "Anonyme"}</p>
            <p className="text-[8px] text-indigo-300/80">🕐 {order.scheduled_time}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold border ${STATUS_COLORS[order.status] || "bg-white/10"}`}>
            {formatStatus(order.status)}
          </span>
          <span className="text-[9px] font-bold text-white/60">{order.total.toFixed(2)}€</span>
          <span className="text-indigo-400 text-[9px]">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-3 pb-3">
          <div className="flex items-center gap-2 mb-2 text-[9px] text-white/50">
            <span className="font-semibold">{order.mode === "livraison" ? "🚚 Livraison" : "🥡 À emporter"}</span>
            {order.address && <span className="truncate">📍 {order.address}</span>}
          </div>
          <div className="space-y-1 mb-2">
            <p className="text-[8px] text-white/30 uppercase tracking-wider font-semibold">Composition</p>
            {order.order_items?.map((item, idx) => (
              <div key={idx} className="p-1.5 rounded bg-white/[0.02] border border-white/5">
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-white/80">{item.quantity}x {item.item_name}</span>
                  <span className="text-white/50">{item.subtotal.toFixed(2)}€</span>
                </div>
                {item.customization && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {item.customization.split("|").map((part, pi) => {
                      const clean = part.trim().replace(/^[^:]*:\s*/, "");
                      return clean ? (
                        <span key={pi} className="text-[8px] bg-indigo-500/10 text-indigo-300/80 px-1.5 py-0.5 rounded-full border border-indigo-500/10">{clean}</span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
