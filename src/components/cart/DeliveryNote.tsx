"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

export function DeliveryNote({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/50 hover:text-white/70">
        <span className="flex items-center gap-1.5 font-medium">
          <MessageSquare className="h-3 w-3" /> Note pour le livreur
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-3 pb-2">
          <input type="text" placeholder="Ex: Sonner à l'interphone, code 1234B" value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
        </motion.div>
      )}
    </div>
  );
}
