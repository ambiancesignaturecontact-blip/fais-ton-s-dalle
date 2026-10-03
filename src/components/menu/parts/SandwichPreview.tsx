"use client";

import { motion } from "framer-motion";
import { Wine, Cookie } from "lucide-react";
import { MenuItem } from "@/data/menu";

const COLORS: Record<string, string> = {
  Salade: "#4ade80", Tomate: "#ef4444",
  Oignons: "#d1d5db", Mais: "#fcd34d",
  "Carottes râpées": "#fb923c", Avocat: "#86efac",
};

// ─── Couche d'ingrédient animée ──────────────────────────────────
function Layer({ color, h, delay, label }: { color: string; h: number; delay: number; label?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ delay, type: "spring", damping: 12, stiffness: 180 }}
      className="w-full rounded-full shadow-sm"
      style={{
        height: h,
        background: `linear-gradient(to bottom, ${color}, ${color}dd)`,
        transformOrigin: "center",
        maxWidth: h > 3 ? "85%" : "70%",
      }}
    >
      {label && (
        <span className="block text-center text-[7px] leading-none pt-0.5 text-white/80 font-bold truncate px-1">
          {label}
        </span>
      )}
    </motion.div>
  );
}

// ─── Grain de sésame ─────────────────────────────────────────────
function Sesame({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay, type: "spring", damping: 8 }}
      className="absolute w-1.5 h-1 rounded-full bg-amber-200/70 dark:bg-amber-300/50"
    />
  );
}

// ─── Pain (haut) ─────────────────────────────────────────────────
function TopBun() {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0, rotateX: -15 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 200 }}
      className="relative w-full max-w-[90px] h-6 rounded-t-full bg-gradient-to-b from-amber-400 via-amber-300 to-amber-200 dark:from-amber-600 dark:via-amber-700 dark:to-amber-800 shadow-md"
      style={{ transformStyle: "preserve-3d", perspective: "200px" }}
    >
      <Sesame delay={0.3} />
      <div className="absolute top-1 left-3"><Sesame delay={0.35} /></div>
      <div className="absolute top-0.5 right-4"><Sesame delay={0.4} /></div>
      <div className="absolute top-1.5 left-6"><Sesame delay={0.45} /></div>
      <div className="absolute top-0.5 right-2"><Sesame delay={0.5} /></div>
    </motion.div>
  );
}

// ─── Pain (bas) ──────────────────────────────────────────────────
function BottomBun({ isBowl }: { isBowl?: boolean }) {
  if (isBowl) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 150, delay: 0.6 }}
        className="w-full max-w-[90px] h-14 rounded-b-2xl bg-gradient-to-b from-green-100/80 to-green-200/60 dark:from-green-800/40 dark:to-green-900/30 border-2 border-green-300/40 dark:border-green-700/30 shadow-inner flex items-center justify-center"
      >
        <span className="text-2xl opacity-30">🥣</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ y: 15, opacity: 0, rotateX: 15 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.5 }}
      className="w-full max-w-[90px] h-4 rounded-b-full bg-gradient-to-b from-amber-300 to-amber-200 dark:from-amber-700 dark:to-amber-800 shadow-sm"
    />
  );
}

// ─── Sandwich Principal ──────────────────────────────────────────
function LiveSandwich({
  viandes, crudites, sauces, supplements, boisson, dessert, isBowl
}: {
  viandes: string[]; crudites: string[]; sauces?: string; supplements: string[];
  boisson?: string; dessert?: string; isBowl: boolean;
}) {
  const items: { color: string; h: number; delay: number; label?: string }[] = [];

  // Suppléments (fromage)
  supplements.forEach((_, i) => {
    items.push({ color: "#facc15", h: 3, delay: 0.1 + i * 0.05 });
  });

  // Viandes
  viandes.forEach((_, i) => {
    items.push({ color: "#b91c1c", h: 4, delay: 0.2 + i * 0.08, label: "🥩" });
  });

  // Crudités (une couche colorée par type)
  const uniqueCrudites = [...new Set(crudites)];
  uniqueCrudites.forEach((c, i) => {
    items.push({ color: COLORS[c] || "#d4d4d4", h: 2.5, delay: 0.35 + i * 0.04 });
  });

  // Sauce
  if (sauces) {
    items.push({ color: "#e8a84a", h: 2, delay: 0.5 });
  }

  return (
    <div className="flex flex-col items-center gap-0.5 py-1" style={{ perspective: "300px" }}>
      {/* Boisson + Dessert badges au-dessus */}
      {(boisson || dessert) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-1.5 mb-1"
        >
          {boisson && (
            <span className="flex items-center gap-0.5 text-[7px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-full border border-blue-200/50">
              <Wine className="h-2 w-2" /> {boisson.length > 8 ? boisson.slice(0, 6) + "…" : boisson}
            </span>
          )}
          {dessert && (
            <span className="flex items-center gap-0.5 text-[7px] font-bold text-pink-600 dark:text-pink-400 bg-pink-100/80 dark:bg-pink-900/40 px-1.5 py-0.5 rounded-full border border-pink-200/50">
              <Cookie className="h-2 w-2" /> {dessert.length > 8 ? dessert.slice(0, 6) + "…" : dessert}
            </span>
          )}
        </motion.div>
      )}

      <TopBun />
      {!isBowl && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.05, type: "spring", damping: 12 }}
          className="w-full max-w-[90px] flex flex-col items-center gap-0.5"
        >
          {items.map((it, i) => (
            <Layer key={i} {...it} />
          ))}
        </motion.div>
      )}
      {isBowl && (
        <div className="w-full max-w-[90px] flex flex-col items-center gap-0.5">
          {items.map((it, i) => (
            <Layer key={i} {...it} />
          ))}
        </div>
      )}
      <BottomBun isBowl={isBowl} />
    </div>
  );
}

// ─── Milkshake Live ──────────────────────────────────────────────
function LiveMilkshake({ choice, coulis }: { choice: string; coulis: string[] }) {
  return (
    <div className="flex flex-col items-center" style={{ perspective: "300px" }}>
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ type: "spring", damping: 12 }}
        className="relative w-[70px] h-[85px]"
        style={{ transformOrigin: "bottom" }}
      >
        {/* Verre */}
        <motion.div
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-0 bottom-0 h-[75px] rounded-b-2xl bg-gradient-to-b from-pink-200/50 to-pink-100/30 dark:from-pink-800/30 dark:to-pink-900/20 border-2 border-pink-300/40 dark:border-pink-700/30 shadow-md"
        />
        {/* Liquide */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "65%" }}
          transition={{ delay: 0.2, type: "spring", damping: 12 }}
          className="absolute bottom-[2px] left-[3px] right-[3px] rounded-b-xl bg-gradient-to-b from-pink-300/60 to-pink-400/40 dark:from-pink-600/40 dark:to-pink-700/30"
        />
        {/* Mousse */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 10 }}
          className="absolute top-[10px] left-[5px] right-[5px] h-[10px] rounded-full bg-gradient-to-b from-white/80 to-pink-100/40 dark:from-white/20 dark:to-pink-800/20"
        />
        {/* Paille */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.4, type: "spring", damping: 12 }}
          className="absolute -top-1 right-1 w-[5px] h-[40px] bg-gradient-to-b from-red-400 to-red-300 dark:from-red-500 dark:to-red-600 rounded-full rotate-12 origin-bottom shadow-sm"
          style={{ transformOrigin: "bottom" }}
        />
        {/* Coulis */}
        {coulis.map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 0.7 }}
            transition={{ delay: 0.5 + i * 0.15, type: "spring", damping: 8 }}
            className="absolute w-[6px] h-[6px] rounded-full bg-gradient-to-br from-brand-red to-brand-orange"
            style={{ top: 15 + i * 10, left: 10 + i * 12 }}
          />
        ))}
      </motion.div>
      {choice && <p className="text-[8px] font-bold text-muted-foreground mt-0.5 truncate max-w-[70px]">{choice}</p>}
    </div>
  );
}

// ─── Tiramisu Live ───────────────────────────────────────────────
function LiveTiramisu({ parfum }: { parfum: string }) {
  return (
    <div className="flex flex-col items-center" style={{ perspective: "300px" }}>
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ type: "spring", damping: 12 }}
        className="relative w-[75px] h-[60px]"
        style={{ transformOrigin: "bottom" }}
      >
        {/* Base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[45px] rounded-lg bg-gradient-to-b from-amber-200 to-amber-100 dark:from-amber-700/40 dark:to-amber-800/30 border border-amber-300/50 dark:border-amber-600/30 shadow-md" />
        {/* Couche crème */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.15, type: "spring", damping: 10 }}
          className="absolute bottom-[30px] left-1/2 -translate-x-1/2 w-[85%] h-[8px] rounded-full bg-gradient-to-r from-amber-300 to-amber-200 dark:from-amber-600/50 dark:to-amber-500/30 shadow-sm"
        />
        {/* Cacao */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-[18px] left-1/2 -translate-x-1/2 flex gap-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="w-[4px] h-[4px] rounded-full bg-amber-700/40 dark:bg-amber-300/40"
            />
          ))}
        </motion.div>
        <Cookie className="absolute bottom-[12px] left-1/2 -translate-x-1/2 h-[14px] w-[14px] text-amber-500/50 dark:text-amber-400/40" />
      </motion.div>
      {parfum && <p className="text-[8px] font-bold text-muted-foreground mt-0.5">{parfum}</p>}
    </div>
  );
}

// ─── Export Principal (choisit la scène) ─────────────────────────
export function SandwichPreview({ selections, item }: { selections: Record<string, string[]>; item: MenuItem }) {
  const isMilkshake = item.customSteps === 3;
  const isTiramisu = item.customSteps === 2;
  const isBowl = item.category === "bowls";

  if (isMilkshake) return <LiveMilkshake choice={selections["milkshake"]?.[0] || ""} coulis={selections["milkshake-coulis"] || []} />;
  if (isTiramisu) return <LiveTiramisu parfum={selections["parfum"]?.[0] || ""} />;

  return (
    <LiveSandwich
      viandes={selections["viande"] || []}
      crudites={selections["crudites"] || []}
      sauces={selections["sauces"]?.[0]}
      supplements={selections["supplements"] || []}
      boisson={selections["boisson"]?.[0]}
      dessert={selections["dessert"]?.[0]}
      isBowl={isBowl}
    />
  );
}
