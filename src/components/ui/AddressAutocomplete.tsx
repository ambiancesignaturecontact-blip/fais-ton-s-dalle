"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search } from "lucide-react";

const RUE_93 = [
  "134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois",
  "Avenue Jean Jaurès, 93320 Les Pavillons-sous-Bois",
  "Rue de la République, 93320 Les Pavillons-sous-Bois",
  "Rue Aristide Briand, 93320 Les Pavillons-sous-Bois",
  "Rue du Général Leclerc, 93320 Les Pavillons-sous-Bois",
  "Rue des Écoles, 93320 Les Pavillons-sous-Bois",
  "Rue de Paris, 93320 Les Pavillons-sous-Bois",
  "Avenue de la Libération, 93320 Les Pavillons-sous-Bois",
  "Rue Carnot, 93320 Les Pavillons-sous-Bois",
  "Rue Pasteur, 93320 Les Pavillons-sous-Bois",
  "Avenue du 8 Mai 1945, 93320 Les Pavillons-sous-Bois",
  "Rue des Lilas, 93320 Les Pavillons-sous-Bois",
  "Rue Victor Hugo, 93320 Les Pavillons-sous-Bois",
  "Rue Voltaire, 93320 Les Pavillons-sous-Bois",
  "Rue de la Gare, 93320 Les Pavillons-sous-Bois",
  "Avenue Henri Barbusse, 93320 Les Pavillons-sous-Bois",
  "Rue Marceau, 93320 Les Pavillons-sous-Bois",
  "Rue Gambetta, 93320 Les Pavillons-sous-Bois",
  "Place de la République, 93320 Les Pavillons-sous-Bois",
  "Rue Jules Ferry, 93320 Les Pavillons-sous-Bois",
  "Rue de l'Église, 93320 Les Pavillons-sous-Bois",
  "Rue Jean Moulin, 93320 Les Pavillons-sous-Bois",
  "Avenue Paul Vaillant-Couturier, 93320 Les Pavillons-sous-Bois",
  "Rue des Fauvettes, 93320 Les Pavillons-sous-Bois",
  "Rue des Merisiers, 93320 Les Pavillons-sous-Bois",
  "Rue du Moulin, 93320 Les Pavillons-sous-Bois",
  "Rue de la Fontaine, 93320 Les Pavillons-sous-Bois",
  "Rue du Château, 93320 Les Pavillons-sous-Bois",
  "Avenue du Maréchal Foch, 93320 Les Pavillons-sous-Bois",
  "Rue des Peupliers, 93320 Les Pavillons-sous-Bois",
  "Rue des Rosiers, 93320 Les Pavillons-sous-Bois",
  "Rue du Bois, 93320 Les Pavillons-sous-Bois",
  "Chemin de la Croix, 93320 Les Pavillons-sous-Bois",
  "Rue des Vergers, 93320 Les Pavillons-sous-Bois",
  "Rue de la Paix, 93320 Les Pavillons-sous-Bois",
  "Avenue Charles de Gaulle, 93320 Les Pavillons-sous-Bois",
  "Rue de la Liberté, 93320 Les Pavillons-sous-Bois",
  "Boulevard de la Solidarité, 93320 Les Pavillons-sous-Bois",
];

const VILLES_93 = [
  "Les Pavillons-sous-Bois", "Bondy", "Bobigny", "Drancy", "Aulnay-sous-Bois",
  "Le Blanc-Mesnil", "La Courneuve", "Saint-Denis", "Aubervilliers",
  "Pantin", "Romainville", "Noisy-le-Sec", "Montreuil", "Bagnolet",
  "Les Lilas", "Le Pré-Saint-Gervais", "Sevran", "Tremblay-en-France",
  "Villepinte", "Vaujours", "Livry-Gargan", "Clichy-sous-Bois",
  "Montfermeil", "Coubron", "Neuilly-Plaisance", "Neuilly-sur-Marne",
  "Rosny-sous-Bois", "Villemomble", "Gagny", "Le Raincy",
  "Noisy-le-Grand", "Gournay-sur-Marne", "Chelles"
];

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

function getSuggestions(val: string): string[] {
  if (val.length < 2) return [];
  const lower = val.toLowerCase();
  const results: string[] = [];
  for (const rue of RUE_93) {
    if (rue.toLowerCase().includes(lower)) {
      results.push(rue);
      if (results.length >= 6) break;
    }
  }
  if (results.length < 3) {
    for (const ville of VILLES_93) {
      if (ville.toLowerCase().includes(lower)) {
        const suffix = 93200 + Math.floor(Math.random() * 200);
        const suggestion = `134 Allée du Colonel Fabien, ${ville} ${String(suffix).slice(0, 5)}`;
        if (!results.includes(suggestion)) {
          results.push(suggestion);
          if (results.length >= 6) break;
        }
      }
    }
  }
  if (results.length < 3 && /^\d+/.test(val.trim())) {
    const num = val.trim().split(" ")[0];
    results.push(`${num} Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois`);
    results.push(`${num} Avenue Jean Jaurès, 93320 Les Pavillons-sous-Bois`);
  }
  return results;
}

export function AddressAutocomplete({ value, onChange }: AddressAutocompleteProps) {
  const [show, setShow] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => getSuggestions(value), [value]);
  const showSuggestions = show && suggestions.length > 0 && value.length >= 2;

  const selectAddress = (addr: string) => {
    onChange(addr);
    setShow(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      selectAddress(suggestions[selectedIdx]);
    } else if (e.key === "Escape") {
      setShow(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Ex: 134 Allée du Colonel Fabien, 93320"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShow(true); }}
          onBlur={() => setTimeout(() => setShow(false), 200)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all"
          autoComplete="off"
        />
        {suggestions.length > 0 && value.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Search className="h-3.5 w-3.5 text-brand-red" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#120a0a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="py-1 max-h-52 overflow-y-auto">
              {suggestions.map((addr, i) => (
                <button
                  key={i}
                  onMouseDown={() => selectAddress(addr)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs transition-colors ${
                    i === selectedIdx
                      ? "bg-brand-red/20 text-white"
                      : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  <MapPin className="h-3 w-3 shrink-0 text-brand-red" />
                  <span className="truncate">{addr}</span>
                </button>
              ))}
            </div>
            <div className="px-3.5 py-1.5 border-t border-white/5 text-[9px] text-white/30 text-center">
              ↑↓ pour naviguer · Entrée pour choisir · Échap pour fermer
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
