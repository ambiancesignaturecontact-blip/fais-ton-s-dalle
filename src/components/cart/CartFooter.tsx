"use client";

import { motion } from "framer-motion";
import { Truck, CreditCard, MessageCircle, Sparkles, Package, MapPin, Gift, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { RangeText } from "@/components/hours/HoursText";

export function CartFooter({
  subtotal, deliveryFee, minOrder, mode, isPaying, isWASending,
  fidelityDiscount, parrainDiscount, promoDiscount, finalTotal,
  currentZone, onPay, onWhatsApp
}: {
  subtotal: number; deliveryFee: number; minOrder: number;
  mode: string; isPaying: boolean; isWASending: boolean;
  fidelityDiscount: { saved: number; finalPrice: number } | null;
  parrainDiscount: { saved: number; label: string } | null;
  promoDiscount: { saved: number; percent: number; label: string } | null;
  finalTotal: number;
  currentZone: { emoji: string; label: string; minOrder: number } | null;
  onPay: () => void; onWhatsApp: () => void;
}) {
  const { t } = useI18n();
  const hasDiscounts = fidelityDiscount || parrainDiscount || promoDiscount;

  return (
    <div className="bg-[#120a0a] border-t border-white/5 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-white/50">{t("cart.subtotal")}</span>
          <span className="font-semibold text-white">{subtotal.toFixed(2).replace(".", ",")}€</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-white/50 flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{t("cart.delivery")}</span>
            <span className="font-semibold text-white">{deliveryFee.toFixed(2).replace(".", ",")}€</span>
          </div>
        )}
        {fidelityDiscount && (
          <div className="flex justify-between text-sm">
            <span className="text-amber-400 flex items-center gap-1"><Gift className="h-3.5 w-3.5" /> Fidélité -10%</span>
            <span className="font-semibold text-amber-400">-{fidelityDiscount.saved.toFixed(2).replace(".", ",")}€</span>
          </div>
        )}
        {parrainDiscount && (
          <div className="flex justify-between text-sm">
            <span className="text-green-400 flex items-center gap-1"><Gift className="h-3.5 w-3.5" />{t("cart.parrain")}</span>
            <span className="font-semibold text-green-400">-{parrainDiscount.saved.toFixed(2).replace(".", ",")}€</span>
          </div>
        )}
        {promoDiscount && promoDiscount.saved > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-purple-400 flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Promo {promoDiscount.label}</span>
            <span className="font-semibold text-purple-400">-{promoDiscount.saved.toFixed(2).replace(".", ",")}€</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
          <span className="text-white">{t("cart.total")}</span>
          <motion.span key={finalTotal} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className={hasDiscounts ? "text-green-400" : "text-brand-red"}>
            {finalTotal.toFixed(2).replace(".", ",")}€
          </motion.span>
        </div>
      </div>

      <button onClick={onPay} disabled={isPaying || (mode === "livraison" && subtotal < minOrder)}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-base shadow-xl shadow-red-800/30 hover:shadow-red-800/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed border-2 border-red-400/30 flex items-center justify-center gap-2 mb-2">
        {isPaying ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
        ) : (<CreditCard className="h-5 w-5" />)}
        {t("cart.pay")} {finalTotal.toFixed(2).replace(".", ",")}€
      </button>

      <button onClick={onWhatsApp} disabled={isWASending}
        className="w-full py-3 rounded-2xl border-2 border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]">
        {isWASending ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full" />
        ) : (<MessageCircle className="h-5 w-5" />)}
        {t("cart.whatsapp")}
      </button>

      <div className="flex items-center justify-center gap-4 text-[10px] text-white/30 pt-2 pb-safe flex-wrap">
        <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" />{t("checkout.secure")}</span>
        <span className="flex items-center gap-1"><Package className="h-3 w-3" /> <RangeText /></span>
        {currentZone ? (
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-indigo-400" /> {currentZone.emoji} {currentZone.label} · min {currentZone.minOrder}€</span>
        ) : (
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-indigo-400" /> 93</span>
        )}
      </div>
    </div>
  );
}
