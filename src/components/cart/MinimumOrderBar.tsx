"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, ShoppingBag, Sandwich, Beef, Carrot, Droplets, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { DRINK_OPTIONS, VIANDES, CRUDITES, SAUCES, SUPPLEMENTS, getItemsByCategory } from "@/data/menu";
import { useCart } from "@/hooks/useCart";
import { findZone } from "@/data/delivery";
import { useI18n } from "@/lib/i18n";

/**
 * Upsell intelligent — propose uniquement des suggestions cohérentes avec le panier
 * - Si le panier contient un menu/bowl : propose des ingrédients complémentaires
 * - Si le panier n'a QUE des boissons/desserts : propose des vrais repas
 */
export function MinimumOrderBar() {
  const { t } = useI18n();
  const { items, mode, address, subtotal, addItem } = useCart();
  const zone = mode === "livraison" && address ? findZone(address) : null;
  const minOrder = zone?.minOrder || 15;

  const missing = Math.max(0, minOrder - subtotal);
  const progress = Math.min(100, (subtotal / minOrder) * 100);
  const show = mode === "livraison" && items.length > 0 && subtotal < minOrder;

  // Catégoriser le panier
  const cartAnalysis = useMemo(() => {
    const cart = {
      hasMeal: false,      // menus, bowls
      hasDrink: false,
      hasDessert: false,
      hasIngredient: false, // viande/crudité/sauce/supplément seul
      mealIds: new Set<string>(),
      ingredientNames: new Set<string>(),
    };

    for (const item of items) {
      const id = item.id;
      // Items ajoutés via l'upsell (préfixés) sont des ingrédients
      if (id.startsWith("viande-") || id.startsWith("crudite-") || id.startsWith("sauce-") || id.startsWith("supp-")) {
        cart.hasIngredient = true;
        if (id.startsWith("viande-")) cart.ingredientNames.add(id.replace("viande-", ""));
        if (id.startsWith("crudite-")) cart.ingredientNames.add(id.replace("crudite-", ""));
        if (id.startsWith("sauce-")) cart.ingredientNames.add(id.replace("sauce-", ""));
        if (id.startsWith("supp-")) cart.ingredientNames.add(id.replace("supp-", ""));
        continue;
      }
      const isMeal = ["l", "c", "g", "r", "bl", "bc", "bg", "br"].includes(id);
      const isDrink = ["co", "cz", "ck", "oa", "li", "or", "cr", "sp"].includes(id);
      const isDessert = ["t", "m"].includes(id);

      if (isMeal) {
        cart.hasMeal = true;
        cart.mealIds.add(item.id);
      }
      if (isDrink) cart.hasDrink = true;
      if (isDessert) cart.hasDessert = true;

      // Extraire les noms d'ingrédients depuis la personnalisation
      if (item.customization) {
        cart.hasIngredient = true;
        const parts = item.customization.split("|");
        for (const part of parts) {
          const val = part.split(":").pop() || "";
          val.split(",").forEach(v => {
            const t = v.trim();
            if (t) cart.ingredientNames.add(t);
          });
        }
      }
      cart.ingredientNames.add(item.name);
    }
    return cart;
  }, [items]);

  const suggestions = useMemo(() => {
    const result: { id: string; name: string; price: number; image: string; label: string; icon: React.ReactNode }[] = [];
    const inCartIds = new Set(items.map(i => i.id));
    const { hasMeal, hasDrink, hasDessert, ingredientNames } = cartAnalysis;

    // ─── Si AUCUN repas dans le panier → proposer des menus/bowls en priorité ───
    if (!hasMeal) {
      const menus = getItemsByCategory("menus").filter(m => !inCartIds.has(m.id));
      const bowls = getItemsByCategory("bowls").filter(b => !inCartIds.has(b.id));
      const meals = [...menus, ...bowls].sort((a, b) => a.price - b.price);

      for (const meal of meals.slice(0, 3)) {
        result.push({
          id: meal.id,
          name: meal.name,
          price: meal.price,
          image: meal.image,
          label: meal.price.toFixed(2).replace(".", ",") + "€",
          icon: <Sandwich className="h-2.5 w-2.5" />,
        });
      }

      // Boisson manquante ?
      if (!hasDrink) {
        const drink = DRINK_OPTIONS.find(d => !inCartIds.has(d.id));
        if (drink) {
          result.push({
            id: drink.id,
            name: drink.name,
            price: drink.price,
            image: drink.image,
            label: drink.price.toFixed(2).replace(".", ",") + "€",
            icon: <Droplets className="h-2.5 w-2.5" />,
          });
        }
      }

      // Dessert manquant ?
      if (!hasDessert && !inCartIds.has("t")) {
        result.push({
          id: "t",
          name: "Tiramisu",
          price: 3.0,
          image: "/images/tiramisu.webp",
          label: "3,00€",
          icon: <ChefHat className="h-2.5 w-2.5" />,
        });
      }

      return result.sort((a, b) => a.price - b.price).slice(0, 6);
    }

    // ─── Si le panier contient DÉJÀ un repas → ingrédients complémentaires ───
    // Viandes pas encore choisies
    const viandeDispo = VIANDES.filter(v => !ingredientNames.has(v));
    for (const v of viandeDispo.slice(0, 1)) {
      result.push({ id: "viande-" + v, name: v + " (+1€)", price: 1.0, image: "", label: "1,00€", icon: <Beef className="h-2.5 w-2.5" /> });
    }

    // Crudités pas encore choisies
    const cruditeDispo = CRUDITES.filter(c => !ingredientNames.has(c));
    for (const c of cruditeDispo.slice(0, 2)) {
      result.push({ id: "crudite-" + c, name: c, price: 1.0, image: "", label: "1,00€", icon: <Carrot className="h-2.5 w-2.5" /> });
    }

    // Sauces pas encore choisies
    const sauceDispo = SAUCES.filter(s => !ingredientNames.has(s));
    for (const s of sauceDispo.slice(0, 1)) {
      result.push({ id: "sauce-" + s, name: s, price: 1.0, image: "", label: "1,00€", icon: <Droplets className="h-2.5 w-2.5" /> });
    }

    // Suppléments pas encore choisis
    const suppDispo = SUPPLEMENTS.filter(s => !ingredientNames.has(s));
    for (const s of suppDispo.slice(0, 1)) {
      result.push({ id: "supp-" + s, name: s + " (+1€)", price: 1.0, image: "", label: "1,00€", icon: <ChefHat className="h-2.5 w-2.5" /> });
    }

    // Boisson manquante ?
    if (!hasDrink) {
      for (const d of DRINK_OPTIONS) {
        if (!inCartIds.has(d.id)) {
          result.push({ id: d.id, name: d.name, price: d.price, image: d.image, label: d.price.toFixed(2).replace(".", ",") + "€", icon: <Droplets className="h-2.5 w-2.5" /> });
          break;
        }
      }
    }

    // Tiramisu manquant ?
    if (!hasDessert && !inCartIds.has("t")) {
      result.push({ id: "t", name: "Tiramisu", price: 3.0, image: "/images/tiramisu.webp", label: "3,00€", icon: <ChefHat className="h-2.5 w-2.5" /> });
    }

    return result.sort((a, b) => a.price - b.price).slice(0, 6);
  }, [items, cartAnalysis]);

  const quickAdd = (id: string, name: string, price: number, image: string) => {
    // Nettoyer le nom : enlever les "(+1€)" ou " (+1€)" en fin de chaîne
    const cleanName = name.replace(/\s*\(?\+1€\)?\s*$/, "").trim();
    addItem({
      id,
      name: cleanName,
      price,
      quantity: 1,
      image,
    });
    toast.success(cleanName + " ajouté au panier !");
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="border-t border-white/10 pt-3 pb-1 space-y-3"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {missing.toFixed(2).replace(".", ",")}€ {t("cart.missing")}
            </span>
            <span className="text-white/50">{t("cart.min")} {minOrder.toFixed(2).replace(".", ",")}€</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${progress > 75 ? "bg-gradient-to-r from-green-500 to-emerald-400" : progress > 40 ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-gradient-to-r from-brand-red to-amber-500"}`} />
          </div>
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="text-[10px] text-white/40 font-medium mb-1.5">
              {cartAnalysis.hasMeal ? t("cart.quickadd") : t("cart.quickadd")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => {
                const isIngredient = s.id.startsWith("viande-") || s.id.startsWith("crudite-") || s.id.startsWith("sauce-") || s.id.startsWith("supp-");
                const isMealSuggest = !cartAnalysis.hasMeal && !isIngredient && !["t"].includes(s.id) && !DRINK_OPTIONS.find(d => d.id === s.id);
                return (
                  <motion.button key={s.id} whileTap={{ scale: 0.95 }}
                    onClick={() => quickAdd(s.id, s.name, s.price, s.image)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                      isMealSuggest ? "bg-brand-red/15 text-brand-red border border-brand-red/25 hover:bg-brand-red/25" :
                      isIngredient ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20" :
                      s.price >= missing ? "bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25" :
                      "bg-brand-red/10 text-brand-red border border-brand-red/20 hover:bg-brand-red/20"
                    }`}>
                    {s.icon}
                    <Plus className="h-2.5 w-2.5" /> {s.name} <span className="opacity-70 ml-0.5">{s.label}</span>
                    {!isIngredient && s.price >= missing && <span className="ml-0.5">✅</span>}
                  </motion.button>
                );
              })}
              <button onClick={() => { document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); (document.querySelector("[data-cart-trigger]") as HTMLButtonElement)?.click(); }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-white/5 text-white/50 border border-white/10 hover:bg-white/10">
                <ShoppingBag className="h-2.5 w-2.5" /> Voir le menu
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
