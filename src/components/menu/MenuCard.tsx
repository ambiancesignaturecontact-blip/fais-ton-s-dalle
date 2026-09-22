"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Plus, Check, ChefHat, Sparkles, MessageCircle, AlertTriangle } from "lucide-react";
import { MenuItem } from "@/data/menu";
import { isItemAvailable } from "@/data/stock";
import { useCart } from "@/hooks/useCart";
import { trackProductClick } from "@/lib/analytics";

interface MenuCardProps {
  item: MenuItem;
  index: number;
  onCustomize: () => void;
}

function shareWhatsApp(name: string, price: number) {
  const msg = "Salut ! Découvre " + name + " chez FAIS TON S'DALLE - " + price.toFixed(2).replace(".", ",") + "€ !";
  window.open("https://wa.me/33672044875?text=" + encodeURIComponent(msg), "_blank");
}

export function MenuCard({ item, index, onCustomize }: MenuCardProps) {
  const { addItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const isAvailable = isItemAvailable(item.name);

  const handleClick = () => {
    if (!isAvailable) return;
    trackProductClick(item.name);
    if (item.customSteps) onCustomize();
    else {
      addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image });
      triggerAdded();
    }
  };

  const triggerAdded = () => { setAdded(true); setTimeout(() => setAdded(false), 600); };

  const btnClass = added
    ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
    : "bg-gradient-to-r from-brand-red to-brand-red-light text-white shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/40";

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30, scale: 0.92 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={isAvailable ? { y: -6, transition: { duration: 0.25 } } : {}}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`group relative bg-card rounded-2xl border border-border/40 overflow-hidden transition-all duration-500 ${
        isAvailable
          ? "cursor-pointer hover:shadow-2xl hover:border-brand-red/20 hover:shadow-brand-red/5"
          : "cursor-not-allowed opacity-70"
      }`}
    >
      <div className="relative h-48 md:h-52 overflow-hidden">
        <Image src={item.image} alt={item.name} fill className="object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <motion.div className="absolute inset-0 bg-gradient-to-br from-brand-red/10 to-transparent"
          initial={{ opacity: 0 }} animate={{ opacity: isHovered ? 1 : 0 }} transition={{ duration: 0.3 }} />
        {item.popular && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="absolute top-3 left-3 flex items-center gap-1.5 bg-gradient-to-r from-brand-red to-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-800/50 border border-red-400/20">
            <Sparkles className="h-3.5 w-3.5" /> Populaire
          </motion.div>
        )}
        {!isAvailable && (
          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-1 bg-red-600/90 px-4 py-2 rounded-xl border border-red-400/50 shadow-xl">
              <AlertTriangle className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-xs">Rupture</span>
            </div>
          </motion.div>
        )}
        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-sm font-bold px-3 py-1 rounded-full border border-white/20">
          {item.price.toFixed(2).replace(".", ",") + "€"}
        </div>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
          {item.category === "menus" ? "Menu" : item.category === "bowls" ? "Bowl" : item.category === "desserts" ? "Dessert" : "Boisson"}
        </div>
        <motion.div className="absolute bottom-3 right-3"
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.5 }} transition={{ duration: 0.2 }}>
          <span className="text-[10px] text-white bg-black/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full font-semibold">
            {item.customSteps ? "Personnaliser →" : "Ajouter +"}
          </span>
        </motion.div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg tracking-wide text-foreground truncate">{item.name}</h3>
            {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {item.customSteps && (
            <span className="inline-flex items-center gap-1 text-[10px] text-brand-red font-bold bg-brand-red/15 px-2.5 py-1 rounded-full border border-brand-red/30">
              <ChefHat className="h-3 w-3" /> Personnalisable
            </span>
          )}
          {item.category === "menus" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-brand-orange font-bold bg-brand-orange/15 px-2.5 py-1 rounded-full border border-brand-orange/30">
              Sandwich sur mesure
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div>
            <span className="text-[10px] text-muted-foreground font-medium">A partir de</span>
            <div className="text-lg font-bold text-brand-red">{item.price.toFixed(2).replace(".", ",") + "€"}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); shareWhatsApp(item.name, item.price); }}
              className="text-[#25D366] hover:text-[#1da851] transition-colors p-1" title="Partager sur WhatsApp">
              <MessageCircle className="h-4 w-4" />
            </button>
            <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
              className={"relative w-11 h-11 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 " + btnClass}>
              <motion.div animate={added ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.3 }}>
                {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}