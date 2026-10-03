"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package, Search, AlertTriangle, CheckCircle, RotateCcw,
  ChevronDown, ChevronUp, Save, Bell,
} from "lucide-react";
import { toast } from "sonner";
import {
  STOCK_CATEGORIES, getStock, saveStock, getDefaultStock,
  type StockMap, type StockItem,
} from "@/data/stock";

export function StockManagement() {
  const [stock, setStock] = useState<StockMap>(getDefaultStock());
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getStock().then(s => { setStock(s); });
  }, []);

  const updateItem = (name: string, updates: Partial<StockItem>) => {
    setStock(prev => ({
      ...prev,
      [name]: { ...prev[name], ...updates },
    }));
    setDirty(true);
  };

  const save = async () => {
    await saveStock(stock);
    setDirty(false);
    toast.success("Stock mis à jour ✅", { duration: 2000 });
  };

  const resetAll = async () => {
    if (!confirm("Réinitialiser tout le stock à illimité ?")) return;
    const fresh = Object.fromEntries(
      Object.keys(stock).map((k) => [k, { quantity: 999, unlimited: true }])
    );
    setStock(fresh);
    await saveStock(fresh);
    setDirty(false);
    toast.success("Stock réinitialisé");
  };

  const toggleCat = (key: string) => {
    setExpandedCats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = STOCK_CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(i => {
      if (!search) return true;
      const q = search.toLowerCase();
      return i.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q);
    }),
  })).filter(cat => cat.items.length > 0);

  const getCatStatus = (cat: typeof STOCK_CATEGORIES[0]) => {
    const outOfStock = cat.items.filter(i => {
      const s = stock[i];
      return s && !s.unlimited && s.quantity <= 0;
    }).length;
    if (outOfStock === 0) return "ok";
    if (outOfStock === cat.items.length) return "empty";
    return "partial";
  };

  const totalOutOfStock = Object.entries(stock).filter(
    ([, v]) => !v.unlimited && v.quantity <= 0
  ).length;
  const lowStockItems = Object.entries(stock).filter(
    ([, v]) => !v.unlimited && v.quantity > 0 && v.quantity < 5
  );

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Gestion des stocks
            {totalOutOfStock > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[9px]">
                {totalOutOfStock} rupture{totalOutOfStock > 1 ? "s" : ""}
              </span>
            )}
          </h3>
        </div>
        <div className="flex gap-1">
          <button onClick={resetAll}
            className="px-2 py-1 rounded-lg bg-white/5 text-white/50 text-[9px] font-bold hover:bg-white/10 hover:text-white/70 transition-colors flex items-center gap-1">
            <RotateCcw className="h-2.5 w-2.5" /> Reset
          </button>
          <button onClick={save} disabled={!dirty}
            className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 ${
              dirty
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/25"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}>
            <Save className="h-2.5 w-2.5" /> {dirty ? "Sauvegarder" : "Sauvegardé"}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-white/40 mb-3">
        Mets à 0 un ingrédient pour le marquer en <strong className="text-red-400">rupture</strong> sur le site. 
        Les clients ne pourront pas le sélectionner.
        {!dirty && <span className="text-emerald-400/60 ml-1">✓ Aucune modif en attente</span>}
      </p>

      {/* Alertes stock faible */}
      {lowStockItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Stock faible</span>
            <span className="text-[9px] text-amber-400/60 ml-auto">{lowStockItems.length} alerte{lowStockItems.length > 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {lowStockItems.map(([name, s]) => (
              <span key={name} className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                {name} : {s.quantity} restant{s.quantity > 1 ? "s" : ""}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recherche */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30" />
        <input type="text" placeholder="Rechercher un ingrédient..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
      </div>

      {/* Catégories */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filteredCategories.map((cat) => {
          const status = getCatStatus(cat);
          const expanded = expandedCats[cat.key] !== false; // open by default
          return (
            <div key={cat.key} className="rounded-lg border border-white/5 overflow-hidden">
              <button onClick={() => toggleCat(cat.key)}
                className="w-full flex items-center justify-between p-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    status === "ok" ? "bg-emerald-500" :
                    status === "empty" ? "bg-red-500" :
                    "bg-amber-500"
                  }`} />
                  <span className="text-[11px] font-bold text-white/80">{cat.label}</span>
                  <span className="text-[9px] text-white/30">{cat.items.length}</span>
                </div>
                {expanded ? <ChevronUp className="h-3 w-3 text-white/30" /> : <ChevronDown className="h-3 w-3 text-white/30" />}
              </button>
              
              {expanded && (
                <div className="divide-y divide-white/5">
                  {cat.items.map((itemName) => {
                    const s = stock[itemName];
                    if (!s) return null;
                    const isOut = !s.unlimited && s.quantity <= 0;
                    return (
                      <div key={itemName} className={`flex items-center justify-between p-2 pl-4 ${
                        isOut ? "bg-red-500/5" : ""
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {isOut ? (
                            <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle className="h-3 w-3 text-emerald-500/50 shrink-0" />
                          )}
                          <span className={`text-[10px] truncate ${
                            isOut ? "text-red-400 font-semibold" : "text-white/70"
                          }`}>
                            {itemName}
                            {isOut && <span className="ml-1.5 text-[8px] bg-red-500/20 px-1 rounded-full">Rupture</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={!s.unlimited}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Passer en mode quantité limitée
                                  updateItem(itemName, { unlimited: false, quantity: 10 });
                                } else {
                                  updateItem(itemName, { unlimited: true, quantity: 999 });
                                }
                              }}
                              className="w-3 h-3 accent-brand-red" />
                            <span className="text-[7px] text-white/30">Limité</span>
                          </label>
                          {!s.unlimited ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateItem(itemName, { quantity: Math.max(0, s.quantity - 1) })}
                                className="w-5 h-5 rounded bg-white/10 text-white/60 text-[10px] flex items-center justify-center hover:bg-white/20">−</button>
                              <input type="number" min={0} max={999} value={s.quantity}
                                onChange={(e) => updateItem(itemName, { quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                                className={`w-10 text-center bg-white/5 border rounded text-[10px] font-bold py-0.5 focus:outline-none ${
                                  isOut ? "border-red-500/30 text-red-400" : "border-white/10 text-white"
                                }`} />
                              <button onClick={() => updateItem(itemName, { quantity: Math.min(999, s.quantity + 1) })}
                                className="w-5 h-5 rounded bg-white/10 text-white/60 text-[10px] flex items-center justify-center hover:bg-white/20">+</button>
                            </div>
                          ) : (
                            <span className="text-[8px] text-white/30 italic">Illimité</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-3 text-[8px] text-white/30">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Disponible</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Partiel</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Rupture</span>
      </div>
    </div>
  );
}
