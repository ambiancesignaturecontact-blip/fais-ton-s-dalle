"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const CRENEAUX = [
  "11h30 - 12h00",
  "12h00 - 12h30",
  "12h30 - 13h00",
  "13h00 - 13h30",
  "18h00 - 18h30",
  "18h30 - 19h00",
  "19h00 - 19h30",
  "19h30 - 20h00",
  "20h00 - 20h30",
  "20h30 - 21h00",
  "21h00 - 21h30",
  "21h30 - 22h00",
  "22h00 - 22h30",
  "22h30 - 23h00",
  "23h00 - 23h30",
  "23h30 - 00h00",
  "00h00 - 00h30",
  "00h30 - 01h00",
  "01h00 - 01h30",
  "01h30 - 02h00",
  "02h00 - 02h30",
  "02h30 - 03h00",
];

export function ScheduledDelivery() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("ftsd_scheduled_time") || "";
  });
  const [active, setActive] = useState(() => !!selected);

  const activate = () => {
    if (!selected) { toast.error("Choisis un créneau"); return; }
    setActive(true);
    localStorage.setItem("ftsd_scheduled_time", selected);
    toast.success(`Livraison programmée à ${selected}`);
  };

  const deactivate = () => {
    setActive(false);
    setSelected("");
    localStorage.removeItem("ftsd_scheduled_time");
    toast.success("Livraison immédiate réactivée");
  };

  return (
    <div className="bg-[#1a0e0e] border-2 border-indigo-500/30 rounded-xl p-4 shadow-lg shadow-indigo-900/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Programmer ma livraison</h3>
        </div>
        <button onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          {open ? <ChevronUp className="h-4 w-4 text-white" /> : <ChevronDown className="h-4 w-4 text-white" />}
        </button>
      </div>

      {active ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/20 border-2 border-indigo-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-white font-bold">Livré à <span className="text-indigo-300">{selected}</span></p>
              <p className="text-[10px] text-white/50">Programmé ✅</p>
            </div>
          </div>
          <button onClick={deactivate}
            className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold hover:bg-red-500/30 border border-red-500/30 transition-colors flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5" /> Annuler
          </button>
        </div>
      ) : (
        <div>
          <p className="text-xs text-white/60 mb-3">Choisis un créneau de livraison (facultatif) :</p>
          
          {open && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-2 gap-2 mb-3 max-h-56 overflow-y-auto pr-1">
              {CRENEAUX.map((c) => (
                <button key={c} onClick={() => setSelected(c)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 border ${
                    selected === c
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-[1.02]"
                      : "bg-[#120808] text-white/70 border-white/10 hover:bg-[#1f1010] hover:border-white/20 hover:text-white"
                  }`}>
                  {c}
                </button>
              ))}
            </motion.div>
          )}

          {selected && !open && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-400" />
              <p className="text-xs text-white">Créneau sélectionné : <strong className="text-indigo-300">{selected}</strong></p>
            </div>
          )}

          <button onClick={() => { if (!open) setOpen(true); else activate(); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-sm font-bold hover:from-indigo-500 hover:to-purple-600 transition-all shadow-lg shadow-indigo-800/30 border border-indigo-400/20">
            {open ? (selected ? "✅ Confirmer ce créneau" : "Choisis d'abord un créneau") : "📅 Choisir un créneau"}
          </button>
        </div>
      )}
    </div>
  );
}
