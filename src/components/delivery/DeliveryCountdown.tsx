"use client";

// ─── Petit panneau fixe en bas à gauche du site ────────────────
//
// Affiche l'état de la livraison (ouvert / dernière ligne droite /
// fermé) d'après les HORAIRES DYNAMIQUES de /api/settings.
//
// Ces horaires sont les mêmes que ceux de l'application mobile :
// quand un horaire est modifié depuis l'app (ou l'admin du site),
// ce panneau se met à jour automatiquement, sans déploiement.
//
// Avant, les heures (11h, 23h, 3h, réouverture 11h30) étaient écrites
// en dur ici et ne bougeaient jamais.

import { useEffect, useState } from "react";
import { Clock, Truck, Timer } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import { describeSettings, type LiveStatus } from "@/lib/hours";

export function DeliveryCountdown() {
  const settings = useSettings();
  const [view, setView] = useState<LiveStatus | null>(null);

  // Recalcule l'affichage chaque 30 s ; les réglages, eux, sont
  // synchronisés une seule fois par SettingsProvider, comme ailleurs.
  useEffect(() => {
    const tick = () => setView(describeSettings(settings, new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [settings]);

  if (!view) return null;

  const Icon =
    view.tone === "urgent" ? Timer : view.tone === "open" ? Truck : Clock;

  const toneClass =
    view.tone === "urgent"
      ? "bg-gradient-to-r from-red-600 to-orange-600 text-white border-red-400/30 animate-pulse"
      : view.tone === "open"
      ? "bg-[#0d1a0d] text-[#a7f3d0] border-green-500/20"
      : "bg-[#1a1535] text-[#c7d2fe] border-indigo-500/20";

  return (
    <div
      className={`fixed bottom-24 left-2 md:left-3 z-40 rounded-xl px-3 py-2.5 shadow-lg border text-[11px] md:text-xs font-bold transition-all duration-300 max-w-[200px] md:max-w-none ${toneClass}`}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 shrink-0" />
          <span>{view.line1}</span>
        </div>
        {view.line2 && (
          <div className="flex items-center gap-1 mt-0.5 text-[9px] md:text-[10px] opacity-80">
            <Clock className="h-2.5 w-2.5 shrink-0" />
            <span>{view.line2}</span>
          </div>
        )}
      </div>
    </div>
  );
}
