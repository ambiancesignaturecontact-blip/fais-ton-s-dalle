"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import type { CartItem as CartItemType } from "@/data/cart";

export function CartItemRow({ item, onUpdateQuantity, onRemove }: {
  item: CartItemType;
  onUpdateQuantity: (id: string, delta: number, customization?: string) => void;
  onRemove: (id: string, customization?: string) => void;
}) {
  return (
    <motion.div layout
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0, padding: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/10">
        <Image src={item.image} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
          <button onClick={() => onRemove(item.id, item.customization)} className="p-1 hover:text-red-400 shrink-0">
            <X className="h-3.5 w-3.5 text-white/30" />
          </button>
        </div>
        {item.customization && (
          <p className="text-[11px] text-white/40 truncate leading-tight mt-0.5">{item.customization}</p>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button onClick={() => onUpdateQuantity(item.id, -1, item.customization)} disabled={item.quantity <= 1}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-white/70">
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(item.id, 1, item.customization)} disabled={item.quantity >= 99}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-white/70">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="text-sm font-bold text-brand-red">
            {(item.price * item.quantity).toFixed(2).replace(".", ",")}€
          </span>
        </div>
      </div>
    </motion.div>
  );
}
