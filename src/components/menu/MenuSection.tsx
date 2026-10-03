"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Filter, ChefHat, Utensils, Coffee, CakeSlice } from "lucide-react";
import { getItemsByCategory } from "@/data/menu";
import { MenuCard } from "./MenuCard";
import { CustomizationModal } from "./CustomizationModal";
import { MenuCardSkeleton } from "@/components/ui/Skeleton";
import { useI18n } from "@/lib/i18n";

const MENU_COUNT = 8; // 4 menus + 4 bowls (Léger, Classique, Gourmand, Royal)

export function MenuSection() {
  const { t } = useI18n();
  const CATEGORIES = [
  { id: "all", label: t("menu.cat.all"), icon: Filter },
  { id: "menus", label: t("menu.cat.sandwichs"), icon: ChefHat },
  { id: "bowls", label: t("menu.cat.bowls"), icon: Utensils },
  { id: "desserts", label: t("menu.cat.desserts"), icon: CakeSlice },
  { id: "boissons", label: t("menu.cat.boissons"), icon: Coffee },
  ];
  const [activeCategory, setActiveCategory] = useState("all");
  const [customizingId, setCustomizingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const items = getItemsByCategory(activeCategory);

  // Skeleton loading lors du changement de catégorie
  const [mountKey, setMountKey] = useState(0);
  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setLoading(true);
    setMountKey((k) => k + 1);
  };
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [mountKey]);

  return (
    <section id="menu" className="relative py-16 md:py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-brand-red/3 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-brand-orange/3 rounded-full blur-[60px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-6 md:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold mb-4">
            <ChefHat className="h-3.5 w-3.5" />
            {activeCategory === "menus" || activeCategory === "all"
              ? `${MENU_COUNT} ${t('menu.formules')}`
              : `${items.length} ${t("menu.produits")}`}
          </div>
          <h2 className="font-heading text-3xl md:text-5xl tracking-wider mb-3">
            {t("menu.title")}
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            {t("menu.subtitle")}
          </p>
        </div>

        {/* Filtres plus visibles sur mobile */}
        <div className="flex items-center gap-2 mb-6 md:mb-8 overflow-x-auto pb-3 scrollbar-none justify-start md:justify-center -mx-4 px-4 md:mx-0 md:px-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button key={cat.id} whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 md:px-6 md:py-3 rounded-full text-sm md:text-base font-bold whitespace-nowrap shrink-0 transition-all duration-300 touch-target min-w-[80px] justify-center ${
                  isActive
                    ? "bg-gradient-to-r from-brand-red to-red-700 text-white shadow-lg shadow-red-800/40 scale-105"
                    : "bg-brand-red/15 hover:bg-brand-red/25 text-brand-red border-2 border-brand-red/25 hover:border-brand-red/40 shadow-md"
                }`}>
                <Icon className="h-5 w-5 md:h-4 md:w-4" /> {cat.label}
              </motion.button>
            );
          })}
        </div>

        {loading ? (
          /* Skeleton loading */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <MenuCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <motion.p key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground mb-4 text-center">
              {items.length} {t("menu.results")}{items.length > 1 ? "s" : ""}
            </motion.p>

            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <MenuCard key={item.id} item={item} index={index} onCustomize={() => setCustomizingId(item.id)} />
                ))}
              </AnimatePresence>
            </motion.div>

            {items.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
                <p className="text-sm">{t("menu.noresults")}</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Photo bannière entre Menu et About */}
      <div className="relative h-40 md:h-72 -mx-4 mt-12 md:mt-16 overflow-hidden">
        <Image src="/images/photo-sandwich-1.webp" alt="Sandwich FAIS TON S'DALLE - Prêt à déguster" fill className="object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-base md:text-2xl font-heading tracking-wider text-center px-4">
            Vous voulez le vôtre ? <span className="text-brand-red">Commandez maintenant</span>
          </p>
        </div>
      </div>

      <AnimatePresence>
        {customizingId && <CustomizationModal itemId={customizingId} onClose={() => setCustomizingId(null)} />}
      </AnimatePresence>
    </section>
  );
}
