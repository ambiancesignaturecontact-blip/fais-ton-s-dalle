"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

/**
 * Upsell intelligent — propose de passer au menu supérieur
 * Quand un client ajoute un Menu Classique, on propose le Gourmand pour +2€
 * Quand un client ajoute un Menu Léger, on propose le Classique pour +1€
 * Quand un client ajoute un Milkshake, on propose un Tiramisu pour 3€
 */
export function UpsellToast() {
  const { items, addItem } = useCart();

  useEffect(() => {
    const lastItem = items[items.length - 1];
    if (!lastItem) return;

    if (lastItem.id === "c") {
      // Menu Classique → Gourmand (+2€)
      const timer = setTimeout(() => {
        toast(
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍰</span>
            <div className="flex-1">
              <p className="font-bold text-sm">Passe au Menu Gourmand</p>
              <p className="text-xs text-muted-foreground">Boisson + dessert inclus pour seulement +2€</p>
            </div>
            <button
              onClick={() => {
                addItem({ id: "g", name: "Menu Gourmand", price: 9.9, quantity: 1, image: "/images/menu-gourmand.webp" });
                toast.success("🎉 Menu Gourmand ajouté !");
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-red to-brand-red-light text-white text-xs font-bold"
            >
              +2€ seulement
            </button>
          </div>,
          { duration: 6000, position: "top-center" }
        );
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (lastItem.id === "l") {
      // Menu Léger → Classique (+1€)
      const timer = setTimeout(() => {
        toast(
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥤</span>
            <div className="flex-1">
              <p className="font-bold text-sm">Passe au Menu Classique</p>
              <p className="text-xs text-muted-foreground">Ajoute une boisson pour seulement +1€</p>
            </div>
            <button
              onClick={() => {
                addItem({ id: "c", name: "Menu Classique", price: 7.9, quantity: 1, image: "/images/menu-classique.webp" });
                toast.success("🎉 Menu Classique ajouté !");
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-red to-brand-red-light text-white text-xs font-bold"
            >
              +1€ seulement
            </button>
          </div>,
          { duration: 6000, position: "top-center" }
        );
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (lastItem.id === "m") {
      // Milkshake → propose Tiramisu
      const timer = setTimeout(() => {
        toast(
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍫</span>
            <div className="flex-1">
              <p className="font-bold text-sm">Ajoute un Tiramisu maison ?</p>
              <p className="text-xs text-muted-foreground">Caramel spéculoos, Chocolat ou Oreo — 3€</p>
            </div>
            <button
              onClick={() => {
                addItem({ id: "t", name: "Tiramisu", price: 3.0, quantity: 1, image: "/images/tiramisu.webp" });
                toast.success("🍪 Tiramisu ajouté !");
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-red to-brand-red-light text-white text-xs font-bold"
            >
              3€
            </button>
          </div>,
          { duration: 6000, position: "top-center" }
        );
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [items, addItem]);

  return null;
}
