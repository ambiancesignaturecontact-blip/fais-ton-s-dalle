"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, CreditCard } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { MIN_DELIVERY_ORDER } from "@/data/cart";

export function StickyCart() {
  const { items, subtotal, total, mode, itemCount } = useCart();

  if (items.length === 0) return null;

  const canOrder = mode !== "livraison" || subtotal >= MIN_DELIVERY_ORDER;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-2xl md:hidden"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-red" />
            <div>
              <p className="text-sm font-bold">{itemCount} article{itemCount > 1 ? "s" : ""}</p>
              <p className="text-[10px] text-muted-foreground">{total.toFixed(2).replace(".", ",")}€</p>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("ftsd:openCart"))}
            disabled={!canOrder}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              canOrder
                ? "bg-gradient-to-r from-brand-red to-brand-red-light text-white shadow-lg shadow-brand-red/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-1.5" />
            {canOrder ? `Payer ${total.toFixed(2).replace(".", ",")}€` : `Min. ${MIN_DELIVERY_ORDER}€`}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
