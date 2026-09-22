"use client";

// ─── Onglet « Horaires » de l'admin du site ────────────────────
//
// Même source de vérité que l'application : /api/settings.
// Ce que tu changes ici est visible immédiatement dans l'app, et
// inversement — il n'y a plus d'horaires écrits en dur nulle part.
//
// À brancher comme le panneau Stock :
//   <HoursPanel adminPassword={password} />

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type DayHours = { open: string; close: string } | null;
type WeekHours = Record<string, DayHours>;

const DAYS: { n: number; label: string }[] = [
  { n: 1, label: "Lundi" },
  { n: 2, label: "Mardi" },
  { n: 3, label: "Mercredi" },
  { n: 4, label: "Jeudi" },
  { n: 5, label: "Vendredi" },
  { n: 6, label: "Samedi" },
  { n: 0, label: "Dimanche" },
];

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function HoursPanel({ adminPassword }: { adminPassword: string }) {
  const [hours, setHours] = useState<WeekHours | null>(null);
  const [prep, setPrep] = useState("20");
  const [initial, setInitial] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
      const j = await r.json();
      const h: WeekHours = j.hours ?? {};
      setHours(h);
      setPrep(String(j.prep_minutes ?? 20));
      setInitial(JSON.stringify({ h, p: j.prep_minutes ?? 20 }));
      setError(null);
    } catch {
      setError("Chargement impossible");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setDay = (n: number, patch: Partial<{ open: string; close: string }>) => {
    setHours((prev) => {
      if (!prev) return prev;
      const cur = prev[String(n)] ?? { open: "11:30", close: "03:00" };
      return { ...prev, [String(n)]: { ...cur, ...patch } };
    });
    setError(null);
  };

  const toggleClosed = (n: number) => {
    setHours((prev) => {
      if (!prev) return prev;
      const cur = prev[String(n)];
      return {
        ...prev,
        [String(n)]: cur === null ? { open: "11:30", close: "03:00" } : null,
      };
    });
    setError(null);
  };

  const applyToAll = () => {
    if (!hours) return;
    const model = hours["1"];
    const next: WeekHours = {};
    for (const d of DAYS) next[String(d.n)] = model ? { ...model } : null;
    setHours(next);
  };

  const dirty = hours !== null &&
    JSON.stringify({ h: hours, p: Number(prep) }) !== initial;

  const onSave = async () => {
    if (!hours) return;
    if (!adminPassword) {
      setError("Session admin expirée — reconnectez-vous");
      return;
    }

    // Validation locale : une heure mal saisie afficherait « Fermé »
    // aux clients toute la journée.
    for (const d of DAYS) {
      const slot = hours[String(d.n)];
      if (slot === null) continue;
      if (!slot || !HHMM.test(slot.open) || !HHMM.test(slot.close)) {
        setError(`${d.label} : heure invalide (format 11:30)`);
        return;
      }
      if (slot.open === slot.close) {
        setError(`${d.label} : ouverture et fermeture identiques`);
        return;
      }
    }
    const p = Number(prep);
    if (!Number.isInteger(p) || p < 5 || p > 120) {
      setError("Temps de préparation : entre 5 et 120 minutes");
      return;
    }
    if (DAYS.every((d) => hours[String(d.n)] === null)) {
      setError("Tous les jours sont fermés — au moins un jour doit être ouvert");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Auth": adminPassword },
        body: JSON.stringify({ hours, prepMinutes: p }),
      });
      if (!r.ok) {
        const msg =
          r.status === 401
            ? "Mot de passe admin refusé — reconnectez-vous"
            : ((await r.json().catch(() => null))?.error ?? `Erreur ${r.status}`);
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Horaires mis à jour — actifs sur le site et l'app");
      await load();
    } catch {
      setError("Réseau indisponible");
      toast.error("Réseau indisponible");
    } finally {
      setBusy(false);
    }
  };

  if (!hours) {
    return (
      <div className="py-8 text-center text-sm opacity-60">
        {error ?? "Chargement…"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {DAYS.map((d) => {
        const slot = hours[String(d.n)];
        const closed = slot === null;
        return (
          <div
            key={d.n}
            className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
          >
            <span className="w-24 text-sm font-bold">{d.label}</span>

            {closed ? (
              <span className="flex-1 text-sm font-bold text-red-400">Fermé</span>
            ) : (
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={slot?.open ?? ""}
                  onChange={(e) => setDay(d.n, { open: e.target.value })}
                  placeholder="11:30"
                  aria-label={`Heure d'ouverture ${d.label}`}
                  className="w-20 rounded-md bg-black/40 px-2 py-2 text-center text-sm font-bold"
                />
                <span className="opacity-50">→</span>
                <input
                  value={slot?.close ?? ""}
                  onChange={(e) => setDay(d.n, { close: e.target.value })}
                  placeholder="03:00"
                  aria-label={`Heure de fermeture ${d.label}`}
                  className="w-20 rounded-md bg-black/40 px-2 py-2 text-center text-sm font-bold"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => toggleClosed(d.n)}
              aria-pressed={closed}
              className={`min-h-[40px] rounded-md px-3 text-xs font-bold ${
                closed ? "bg-red-500 text-white" : "bg-white/10"
              }`}
            >
              {closed ? "Rouvrir" : "Fermer"}
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={applyToAll}
        className="min-h-[44px] w-full rounded-lg bg-white/5 text-sm font-bold"
      >
        Appliquer lundi à toute la semaine
      </button>

      <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
        <span className="flex-1 text-sm font-bold">Temps de préparation</span>
        <input
          value={prep}
          onChange={(e) => setPrep(e.target.value.replace(/\D/g, "").slice(0, 3))}
          aria-label="Temps de préparation en minutes"
          className="w-16 rounded-md bg-black/40 px-2 py-2 text-center text-sm font-bold"
        />
        <span className="text-xs opacity-60">min</span>
      </div>

      <p className="text-xs opacity-60">
        Une fermeture après minuit est normale : 11:30 → 03:00 signifie que
        vous fermez à 3 h du matin le lendemain. Le changement s&apos;applique
        aussitôt au site et à l&apos;application.
      </p>

      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || busy}
        className="min-h-[48px] w-full rounded-xl bg-emerald-600 font-bold disabled:opacity-40"
      >
        {busy ? "Enregistrement…" : dirty ? "Enregistrer les horaires" : "À jour"}
      </button>
    </div>
  );
}
