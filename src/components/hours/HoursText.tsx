"use client";

// ─── Horaires affichés dans le site : toujours depuis les réglages
//
// partagés avec l'app (useSettings → /api/settings). À utiliser dans
// les composants clients ET dans les composants/pages serveur : ce sont
// de petites îles clientes qui se mettent à jour seules.
//
//   <RangeText />          → "11h30-3h"
//   <FromToText />         → "de 11h30 à 3h du matin"
//   <DaysOpenText />       → "7j/7"
//   <HoursSummary />       → "11h30-3h · 7j/7" (ou groupes réels)
//   <WeeklyHours />        → tableau jour par jour + état en direct

import { useEffect, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import {
  daysOpenText,
  describeSettings,
  formatRange,
  fromToSentence,
  mainSlot,
  summarizeHours,
  weeklyRows,
  type LiveStatus,
  type WeekHours,
} from "@/lib/hours";

/** "11h30-3h" — plage principale (celle qui revient le plus dans la semaine) */
export function RangeText({ className }: { className?: string }) {
  const s = useSettings();
  return <span className={className}>{formatRange(mainSlot(s.hours))}</span>;
}

/** "de 11h30 à 3h du matin" — pour insérer dans une phrase */
export function FromToText({ className }: { className?: string }) {
  const s = useSettings();
  return <span className={className}>{fromToSentence(mainSlot(s.hours))}</span>;
}

/** "7j/7" (ou "6j/7 (fermé le mardi)") */
export function DaysOpenText({
  className,
  long = false,
}: {
  className?: string;
  long?: boolean;
}) {
  const s = useSettings();
  return <span className={className}>{daysOpenText(s.hours, long)}</span>;
}

/** Résumé complet sur une ligne : "11h30-3h · 7j/7" */
export function HoursSummary({ className }: { className?: string }) {
  const s = useSettings();
  return <span className={className}>{summarizeHours(s.hours)}</span>;
}

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Pastille « Ouvert / Fermé » calculée en direct des horaires */
export function OpenStatusPill() {
  const s = useSettings();
  const now = useNow();
  const view: LiveStatus = describeSettings(s, now ?? new Date());
  const open = view.tone !== "closed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        open
          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          : "bg-red-500/15 text-red-300 border border-red-500/30"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-red-400"}`}
      />
      {view.line1}
    </span>
  );
}

/**
 * Tableau complet des horires de la semaine (page contact), avec
 * mise en avant du jour du jour et état en direct.
 */
export function WeeklyHours({ className }: { className?: string }) {
  const s = useSettings();
  const now = useNow();
  const today = now?.getDay();
  const rows = weeklyRows(s.hours);

  return (
    <div className={className}>
      <div className="mb-3">
        <OpenStatusPill />
      </div>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li
            key={r.day}
            className={`flex items-center justify-between gap-3 rounded-md px-2 py-1 ${
              r.day === today ? "bg-brand-red/15 font-bold" : ""
            }`}
          >
            <span className={r.day === today ? "text-brand-red" : ""}>
              {r.label}
              {r.day === today ? " (aujourd'hui)" : ""}
            </span>
            <span className={r.slot ? "" : "text-red-400"}>{r.text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs opacity-60">
        Les horaires sont susceptibles d&apos;évoluer les jours fériés —
        l&apos;état affiché ci-dessus est mis à jour en temps réel.
      </p>
    </div>
  );
}

/**
 * Texte du pied des emails / tickets : "Livraison 11h30-3h · 7j/7".
 * Version chaîne (pas un composant) pour les templates HTML.
 */
export function hoursFooterLine(hours: WeekHours): string {
  return `Livraison ${summarizeHours(hours)}`;
}
