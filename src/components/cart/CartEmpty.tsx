"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export function CartEmpty({ onClose, recentOrders, addItem, reorder, setIsOpen }: {
  onClose: () => void;
  recentOrders: any[];
  addItem: (item: any) => void;
  reorder: (order: any, addItem: any) => void;
  setIsOpen: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30">
      <ShoppingBag className="h-16 w-16 mb-4 text-white/10" />
      <p className="text-lg font-bold text-white/60 mb-1">Ton panier est vide</p>
      <p className="text-sm text-white/30 mb-6">Ajoute des articles depuis le menu</p>
      <button onClick={onClose} className="text-sm text-brand-red font-bold hover:underline bg-brand-red/10 px-6 py-2.5 rounded-full border border-brand-red/20">
        Voir le menu →
      </button>
      {recentOrders.length > 0 && (
        <div className="w-full max-w-xs mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2 text-center">Re-commande rapide</p>
          {recentOrders.slice(0, 3).map((order: any) => (
            <button key={order.id} onClick={() => { reorder(order, addItem); setIsOpen(false); toast.success("Commande reprise !"); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-brand-red/30 hover:bg-white/[0.07] mb-2 text-left transition-all">
              <span className="text-lg">⏪</span>
              <div>
                <p className="text-sm font-bold text-white/80">{order.items.map((i: any) => i.name).join(", ")}</p>
                <p className="text-xs text-white/40">{order.total.toFixed(2).replace(".", ",")}€ · {new Date(order.date).toLocaleDateString("fr-FR")}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
