"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  X, Check, ChevronRight, ShoppingCart, ChevronLeft, Eye,
  Utensils, Beef, Carrot, Droplets, ChefHat, Cookie, Coffee,
  Sparkles, Heart,
} from "lucide-react";
import {
  getItem, CUISSON, VIANDES, CRUDITES, SAUCES, SUPPLEMENTS,
  TIRAMISU_PARFUMS, MILKSHAKE_CHOIX, MILKSHAKE_COULIS,
  DRINK_OPTIONS, DESSERT_OPTIONS,
} from "@/data/menu";
import { isItemAvailable } from "@/data/stock";
import { useCart } from "@/hooks/useCart";
import { saveFavorite } from "@/data/favorites";
import { toast } from "sonner";
import { SandwichPreview } from "./parts/SandwichPreview";

interface Props { itemId: string; onClose: () => void; initialSelections?: Record<string, string[]>; }

const EXTRA_PRICE = 1.0;

// ─── Limites par formule ─────────────────────────────────────────
const LIMITS: Record<number, { viandeBase: number; viandeMax: number; cruditesBase: number; cruditesMax: number; saucesBase: number; saucesMax: number; suppsBase: number; suppsMax: number }> = {
  1: { viandeBase: 1, viandeMax: 3, cruditesBase: 2, cruditesMax: 5, saucesBase: 2, saucesMax: 4, suppsBase: 1, suppsMax: 4 },  // Leger
  4: { viandeBase: 1, viandeMax: 3, cruditesBase: 3, cruditesMax: 6, saucesBase: 2, saucesMax: 4, suppsBase: 1, suppsMax: 4 },  // Classique
  5: { viandeBase: 1, viandeMax: 3, cruditesBase: 3, cruditesMax: 6, saucesBase: 2, saucesMax: 4, suppsBase: 1, suppsMax: 4 },  // Gourmand
  7: { viandeBase: 1, viandeMax: 3, cruditesBase: 3, cruditesMax: 6, saucesBase: 2, saucesMax: 4, suppsBase: 1, suppsMax: 4 },  // Royal
};

export function CustomizationModal({ itemId, onClose, initialSelections }: Props) {
  const item = getItem(itemId);
  const { addItem } = useCart();
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<Record<string, string[]>>(initialSelections || {});
  const [qty, setQty] = useState(1);
  const [review, setReview] = useState(Object.keys(initialSelections || {}).length > 0);
  const [adding, setAdding] = useState(false);

  const cs = item?.customSteps || 0;
  const limits = LIMITS[cs] || { viandeBase: 1, viandeMax: 3, cruditesBase: 2, cruditesMax: 5, saucesBase: 2, saucesMax: 4, suppsBase: 1, suppsMax: 4 };
  const isBurger = cs === 1 || cs === 4 || cs === 5 || cs === 7 || item?.category === "bowls";
  const isBowl = item?.category === "bowls";

  const steps = useMemo(() => [
    // Étapes sandwich/bowl uniquement
    ...(isBurger ? [
      ...(!isBowl && (cs === 1 || cs === 4 || cs === 5) ? [{ key: "cuisson", label: "Cuisson", emoji: "🔥", icon: Utensils, items: CUISSON as readonly string[], multi: false as const }] : []),
      { key: "viande", label: "Viande", emoji: "🥩", icon: Beef, items: VIANDES as readonly string[], multi: true as const, sub: `${limits.viandeBase} incluse${limits.viandeBase > 1 ? "s" : ""}, +1,00€/sup` },
      { key: "crudites", label: "Crudites", emoji: "🥗", icon: Carrot, items: CRUDITES as readonly string[], multi: true as const, sub: `${limits.cruditesBase} incluses, +1,00€/sup` },
      { key: "sauces", label: "Sauce", emoji: "🧂", icon: Droplets, items: SAUCES as readonly string[], multi: true as const, sub: "2 incluses, +1,00€/sup" },
      { key: "supplements", label: "Suppléments", emoji: "🧀", icon: ChefHat, items: SUPPLEMENTS as readonly string[], multi: true as const, sub: "1 inclus, +1,00€/sup" },
      ...(cs === 4 || cs === 5 || cs === 7 ? [{ key: "boisson", label: "Boisson", emoji: "🥤", icon: Coffee, items: DRINK_OPTIONS.map(d => d.name) as readonly string[], multi: false as const }] : []),
      ...(cs === 5 ? [{ key: "dessert", label: "Dessert", emoji: "🍰", icon: Cookie, items: ["Tiramisu"] as readonly string[], multi: false as const }] : []),
      ...(cs === 5 ? [{ key: "parfum", label: "Parfum tiramisu", emoji: "🍫", icon: Cookie, items: TIRAMISU_PARFUMS as readonly string[], multi: false as const }] : []),
      // Royal : Tiramisu + Milkshake inclus
      ...(cs === 7 ? [{ key: "parfum", label: "Tiramisu", emoji: "🍫", icon: Cookie, items: TIRAMISU_PARFUMS as readonly string[], multi: false as const }] : []),
      ...(cs === 7 ? [
        { key: "milkshake", label: "Milkshake", emoji: "🥤", icon: Coffee, items: MILKSHAKE_CHOIX as readonly string[], multi: true as const },
        { key: "milkshake-coulis", label: "Suppléments milkshake", emoji: "🍯", icon: Droplets, items: MILKSHAKE_COULIS as readonly string[], multi: true as const, sub: "1,00€/pièce, max 3" },
      ] : []),
    ] : []),
    // Tiramisu
    ...(cs === 2 ? [{ key: "parfum", label: "Parfum", emoji: "🍫", icon: Cookie, items: TIRAMISU_PARFUMS as readonly string[], multi: false as const }] : []),
    // Milkshake
    ...(cs === 3 ? [
      { key: "milkshake", label: "Choix", emoji: "🥤", icon: Coffee, items: MILKSHAKE_CHOIX as readonly string[], multi: true as const },
      { key: "milkshake-coulis", label: "Suppléments", emoji: "🍯", icon: Droplets, items: MILKSHAKE_COULIS as readonly string[], multi: true as const, sub: "1,00€/pièce, max 3" },
    ] : []),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [cs, isBowl, isBurger]);

  const cur = steps[step];
  const last = step === steps.length - 1;
  const first = step === 0;

  // ─── Calcul des prix ───────────────────────────────────────────
  const viandeCount = (sel["viande"] || []).length;
  const cruditeCount = (sel["crudites"] || []).length;
  const extraViande = Math.max(0, viandeCount - limits.viandeBase) * EXTRA_PRICE;
  const extraCrudites = Math.max(0, cruditeCount - limits.cruditesBase) * EXTRA_PRICE;
  const extraSauces = Math.max(0, (sel["sauces"] || []).length - limits.saucesBase) * EXTRA_PRICE;
  const extraSupps = Math.max(0, (sel["supplements"] || []).length - limits.suppsBase) * EXTRA_PRICE;
  const extraCoulis = (sel["milkshake-coulis"] || []).length * EXTRA_PRICE;
  const extraMilkshake = Math.max(0, (sel["milkshake"] || []).length - 1) * EXTRA_PRICE;

  const boissonPrice = (() => {
    // Boisson incluse dans Classique (cs=4), Gourmand (cs=5) et Royal (cs=7)
    if (cs === 4 || cs === 5 || cs === 7) return 0;
    const b = sel["boisson"]?.[0];
    return b ? DRINK_OPTIONS.find(d => d.name === b)?.price || 0 : 0;
  })();
  const dessertPrice = (() => {
    // Dessert inclus dans Gourmand (cs=5) et Royal (cs=7)
    if (cs === 5 || cs === 7) return 0;
    const d = sel["dessert"]?.[0];
    return d ? DESSERT_OPTIONS.find(o => o.name === d)?.price || 0 : 0;
  })();

  const totalExtras = extraViande + extraCrudites + extraSauces + extraSupps + extraMilkshake + extraCoulis + boissonPrice + dessertPrice;
  const unitPrice = (item?.price || 0) + totalExtras;
  const totalPrice = unitPrice * qty;

  // ─── Toggle sélection ──────────────────────────────────────────
  const toggle = (key: string, value: string) => {
    const s = steps.find(x => x.key === key);
    const isMulti = s?.multi ?? false;
    const max = key === "viande" ? limits.viandeMax : key === "crudites" ? limits.cruditesMax : key === "sauces" ? limits.saucesMax : key === "supplements" ? limits.suppsMax : key === "milkshake-coulis" ? 3 : 99;

    setSel(prev => {
      const c = prev[key] || [];
      if (isMulti) {
        if (c.includes(value)) return { ...prev, [key]: c.filter(v => v !== value) };
        if (c.length >= max) return prev;
        return { ...prev, [key]: [...c, value] };
      }
      return { ...prev, [key]: [value] };
    });
    if (review) setReview(false);
  };

  // ─── Navigation ────────────────────────────────────────────────
  const next = () => {
    if (!cur) return;
    const s = sel[cur.key] || [];
    if (s.length === 0) {
      toast.error("Choisis au moins un élément", { position: "top-center", duration: 2000 });
      return;
    }
    if (last) setReview(true);
    else setStep(p => p + 1);
  };

  const prev = () => { if (step > 0) setStep(p => p - 1); };

  const addToCart = () => {
    if (!item) return;
    setAdding(true);
    const parts: string[] = [];
    Object.entries(sel).forEach(([key, values]) => {
      if (values.length > 0) {
        const s = steps.find(x => x.key === key);
        parts.push(`${s?.label || key}: ${values.join(", ")}`);
      }
    });
    const extras = [];
    if (extraViande > 0) extras.push(`viande sup +${extraViande.toFixed(2).replace(".", ",")}€`);
    if (extraCrudites > 0) extras.push(`crudités sup +${extraCrudites.toFixed(2).replace(".", ",")}€`);
    if (extraSauces > 0) extras.push(`sauces sup +${extraSauces.toFixed(2).replace(".", ",")}€`);
    if (extraSupps > 0) extras.push(`suppléments +${extraSupps.toFixed(2).replace(".", ",")}€`);
    if (extraMilkshake > 0) extras.push(`parfums milkshake sup +${extraMilkshake.toFixed(2).replace(".", ",")}€`);
    if (extras.length > 0) parts.push(extras.join(", "));

    addItem({
      id: item.id, name: item.name, price: unitPrice, quantity: 1,
      customization: parts.join(" | "), image: item.image,
    });
    toast.success(
      <div className="flex items-center gap-2">
        <span className="text-lg">🎉</span>
        <div>
          <p className="font-bold text-sm">{qty > 1 ? `${qty}x ` : ""}{item.name} ajouté !</p>
          <p className="text-[11px] text-green-200 mt-0.5">{totalPrice.toFixed(2).replace(".", ",")}€</p>
        </div>
      </div>, { duration: 3000 }
    );
    setTimeout(() => { setAdding(false); onClose(); }, 400);
  };

  // ─── Clavier (touche Enter) ────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (review) setReview(false); else onClose(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [review, onClose]);

  if (!item || !cur) return null;

  const curSel = sel[cur.key] || [];
  const hasSel = Object.values(sel).some(v => v.length > 0);

  // ─── Écran récapitulatif ───────────────────────────────────────
  if (review) {
    const selectedItems = Object.entries(sel).filter(([, v]) => v.length > 0);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/70 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-card rounded-2xl border border-border/40 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/30">
          <div className="sticky top-0 bg-card z-10 border-b border-border/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg"><Check className="h-5 w-5 text-white" /></div>
                <div><h2 className="font-heading text-lg tracking-wide text-foreground">Ta creation</h2><p className="text-[11px] text-muted-foreground">Vérifie et confirme</p></div>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-center"><SandwichPreview selections={sel} item={item} /></div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border/50">
              <Image src={item.image} alt={item.name} width={56} height={56} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <h3 className="font-heading text-base text-foreground">{item.name}</h3>
                <p className="text-[11px] text-muted-foreground">{unitPrice.toFixed(2).replace(".", ",")}€ piece</p>
              </div>
              <div className="text-right"><p className="font-bold text-lg text-foreground">{totalPrice.toFixed(2).replace(".", ",")}€</p></div>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Selection</h4>
              {selectedItems.map(([key, values]) => {
                const s = steps.find(x => x.key === key);
                return (
                  <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="text-base mt-0.5">{s?.emoji || "•"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{s?.label || key}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{values.join(", ")}</p>
                    </div>
                    <button onClick={() => { const idx = steps.findIndex(x => x.key === key); if (idx >= 0) { setStep(idx); setReview(false); } }}
                      className="text-[10px] text-brand-red font-semibold hover:underline shrink-0">Modifier</button>
                  </div>
                );
              })}
            </div>
            {extraViande > 0 && <PriceRow label="Viande(s) sup." price={extraViande} />}
            {extraCrudites > 0 && <PriceRow label="Crudite(s) sup." price={extraCrudites} />}
            {extraSauces > 0 && <PriceRow label="Sauce(s) sup." price={extraSauces} />}
            {extraSupps > 0 && <PriceRow label="Suppléments" price={extraSupps} />}
            {extraCoulis > 0 && <PriceRow label="Supplements milkshake" price={extraCoulis} />}
          </div>
            {extraMilkshake > 0 && <PriceRow label="Parfums milkshake sup." price={extraMilkshake} />}
          <div className="sticky bottom-0 bg-card border-t border-border/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <span className="w-6 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(20, q + 1))} disabled={qty >= 20}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const name = prompt("Nom de la composition :", item?.name + " personnalisé"); if (name && item) { saveFavorite(name, item.id, item.name, sel); toast.success("Composition enregistrée !"); } }}
                  className="px-3 py-2.5 rounded-xl text-sm font-bold bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 hover:text-white transition-colors flex items-center gap-1" title="Enregistrer">
                  <Heart className="h-4 w-4" />
                </button>
                <button onClick={() => setReview(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-red/8 text-brand-red font-bold border-2 border-brand-red/20 hover:bg-brand-red/15 hover:border-brand-red/40 transition-colors">Retour</button>
                <button onClick={addToCart} disabled={adding}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-green-500/20">
                  {adding ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (<><ShoppingCart className="h-4 w-4" /> Ajouter {totalPrice.toFixed(2).replace(".", ",")}€</>)}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Flow étapes ───────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-card rounded-2xl border border-border/40 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/30">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 border-b border-border/30">
          <div className="flex items-center justify-between p-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-brand-red-light/80 flex items-center justify-center shadow-lg shadow-brand-red/20 overflow-hidden">
                <Image src={item.image} alt={item.name} width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-heading text-base tracking-wide text-foreground">{item.name}</h2>
                <p className="text-[11px] text-muted-foreground">Base {item.price.toFixed(2).replace(".", ",")}€</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/50"><X className="h-4 w-4" /></button>
          </div>
          {/* Progress */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1 mb-2">
              {steps.map((s, i) => (
                <div key={s.key} className="flex-1 h-1 rounded-full transition-all duration-500"
                  style={{ background: i <= step ? "linear-gradient(to right, #d43d2b, #e85d4a)" : "hsl(var(--muted) / 0.3)" }} />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Étape {step + 1}/{steps.length}</span>
              <span className="text-[10px] font-bold text-brand-red">{cur.emoji} {cur.label}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-red/10 to-brand-orange/10 border border-brand-red/10 flex items-center justify-center">
              <cur.icon className="h-6 w-6 text-brand-red" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg tracking-wide text-foreground">{cur.label}</h3>
              <p className="text-xs text-muted-foreground">{(cur as { sub?: string }).sub || "Choisis"}</p>
            </div>
          </div>

          {/* Grille de choix */}
          <div className="flex flex-wrap gap-2 mb-3">
              {cur.items.map((opt: string | { name: string; price?: number }, idx) => {
                const label = typeof opt === "string" ? opt : opt.name;
                const price = typeof opt === "object" ? opt.price : undefined;
              const isSelected = curSel.includes(label);
              const atMax = cur.key === "viande" ? curSel.length >= limits.viandeMax :
                cur.key === "crudites" ? curSel.length >= limits.cruditesMax :
                cur.key === "sauces" ? curSel.length >= limits.saucesMax :
                cur.key === "supplements" ? curSel.length >= limits.suppsMax :
                cur.key === "milkshake-coulis" ? curSel.length >= 3 : false;

              return (
                <motion.button key={label} layout
                  whileHover={isSelected || (!atMax && isItemAvailable(label)) ? { scale: 1.03 } : {}} whileTap={isSelected || (!atMax && isItemAvailable(label)) ? { scale: 0.97 } : {}}
                  onClick={() => { if (isSelected || (!atMax && isItemAvailable(label))) toggle(cur.key, label); }}
                  className={`relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    !isItemAvailable(label) && !isSelected
                      ? "bg-red-900/20 text-red-400/60 border-2 border-red-900/30 cursor-not-allowed line-through"
                      : isSelected
                        ? "bg-gradient-to-r from-brand-red to-brand-red-light text-white shadow-lg shadow-brand-red/30 border-0"
                        : atMax
                          ? "bg-muted/50 text-muted-foreground/60 border-2 border-border/40 cursor-not-allowed"
                          : "bg-brand-red/8 text-brand-red font-bold border-2 border-brand-red/20 hover:bg-brand-red/15 hover:border-brand-red/40 shadow-sm"
                  }`}>
                  {cur.multi && (
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${isSelected ? "bg-brand-red/50 border-white/40" : "border-border"}`}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                  )}
                  {label}
                  {!isItemAvailable(label) && !isSelected && <span className="text-[9px] bg-red-500/30 text-red-300 px-1.5 rounded-full">Rupture</span>}
                  {price && price > 0 && <span className="text-[10px] opacity-70">({price.toFixed(2).replace(".", ",")}€)</span>}
                  {cur.key === "viande" && isSelected && curSel.indexOf(label) >= limits.viandeBase && <span className="text-[9px] bg-white/20 px-1 rounded-full">+1€</span>}
                  {cur.key === "crudites" && isSelected && curSel.indexOf(label) >= limits.cruditesBase && <span className="text-[9px] bg-white/20 px-1 rounded-full">+1€</span>}
                  {cur.key === "sauces" && isSelected && curSel.indexOf(label) >= limits.saucesBase && <span className="text-[9px] bg-white/20 px-1 rounded-full">+1€</span>}
                  {cur.key === "supplements" && isSelected && curSel.indexOf(label) >= limits.suppsBase && <span className="text-[9px] bg-white/20 px-1 rounded-full">+1€</span>}
                  {cur.key === "milkshake" && isSelected && curSel.indexOf(label) >= 1 && <span className="text-[9px] bg-white/20 px-1 rounded-full">+1€</span>}
                  <span className="text-[9px] opacity-30 ml-1">{idx + 1}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Résumé sélection */}
          {curSel.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/20">
              <div className="flex items-center gap-2 flex-wrap">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-xs font-bold text-brand-red">
                  {curSel.length} choisi{curSel.length > 1 ? "s" : ""}
                </span>
                {cur.key === "viande" && extraViande > 0 && (
                  <span className="text-[10px] text-amber-600 font-semibold bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    dont {extraViande.toFixed(2).replace(".", ",")}€ de viande(s) sup.
                  </span>
                )}
                {cur.key === "crudites" && extraCrudites > 0 && (
                  <span className="text-[10px] text-amber-600 font-semibold bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    dont {extraCrudites.toFixed(2).replace(".", ",")}€ de crudite(s) sup.
                  </span>
                )}
                {cur.key === "sauces" && extraSauces > 0 && (
                  <span className="text-[10px] text-amber-600 font-semibold bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    dont {extraSauces.toFixed(2).replace(".", ",")}€ de sauce(s) sup.
                  </span>
                )}
                {cur.key === "supplements" && extraSupps > 0 && (
                  <span className="text-[10px] text-amber-600 font-semibold bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    dont {extraSupps.toFixed(2).replace(".", ",")}€ de supplement(s) sup.
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Compteur max */}
          {(cur.key === "viande" || cur.key === "crudites" || cur.key === "sauces" || cur.key === "supplements") && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" />
              {cur.key === "viande"
                ? `${limits.viandeBase} incluse${limits.viandeBase > 1 ? "s" : ""} • max ${limits.viandeMax} • +1,00€/sup`
                : cur.key === "sauces"
                ? `${limits.saucesBase} incluses • max ${limits.saucesMax} • +1,00€/sup`
                : cur.key === "supplements"
                ? `${limits.suppsBase} inclus • max ${limits.suppsMax} • +1,00€/sup`
                : `${limits.cruditesBase} incluses • max ${limits.cruditesMax} • +1,00€/sup`}
            </div>
          )}
          </div>

          {/* Sidebar preview desktop */}
          <div className="hidden md:block w-40 shrink-0">
            <div className="sticky top-4 p-3 rounded-xl bg-muted/20 border border-border/30">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2 text-center font-semibold">Aperçu</p>
              <SandwichPreview selections={sel} item={item} />
              <div className="mt-3 pt-2 border-t border-border/20">
                <p className="text-[9px] text-muted-foreground font-medium">Prix</p>
                <p className="font-bold text-sm text-foreground">{unitPrice.toFixed(2).replace(".", ",")}€</p>
                {(extraViande+extraCrudites+extraSauces+extraSupps+extraMilkshake+extraCoulis) > 0 && <p className="text-[9px] text-muted-foreground">extras +{(extraViande+extraCrudites+extraSauces+extraSupps+extraMilkshake+extraCoulis).toFixed(2).replace(".", ",")}€</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile preview strip */}
        <div className="md:hidden px-4 pb-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/20">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <SandwichPreview selections={sel} item={item} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex flex-wrap gap-1">
                {steps.filter(s => (sel[s.key] || []).length > 0).map(s => (
                  <span key={s.key} className="text-[9px] bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                    {s.emoji} {(sel[s.key] || []).join(", ")}
                  </span>
                ))}
                {!hasSel && <span className="text-[10px] text-muted-foreground italic">Fais ton choix</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!first && (
                <button onClick={prev}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold bg-brand-red/8 text-brand-red font-bold border-2 border-brand-red/20 hover:bg-brand-red/15 hover:border-brand-red/40 transition-all touch-target min-w-[44px] justify-center">
                  <ChevronLeft className="h-4 w-4" /> Retour
                </button>
              )}
              <button onClick={next}
                className="flex items-center gap-1.5 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-red to-red-700 hover:shadow-xl hover:shadow-red-800/40 transition-all duration-200 shadow-lg shadow-red-800/30 border-2 border-red-400/30 active:scale-95 touch-target min-w-[120px] justify-center">
                {last ? "Voir recap" : "Suivant"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PriceRow({ label, price }: { label: string; price: number }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground p-2 rounded-lg bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/30 dark:border-amber-700/20">
      <span className="font-medium">{label}</span>
      <span className="font-semibold">+{price.toFixed(2).replace(".", ",")}€</span>
    </div>
  );
}
