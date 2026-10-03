"use client";

// ─── Code promo et parrainage dans le panier du site ──────────
//
// Le site n'avait AUCUN champ de code : une promotion annoncée dans
// l'app était inutilisable ici, et un filleul ne pouvait pas faire
// valoir son parrainage. Le site est maintenant au même niveau que
// l'application.
//
// Deux façons de faire, comme dans l'app :
//   · cliquer sur un de SES codes (plus besoin de recopier
//     « MERCI-9NU39C » depuis un e-mail) ;
//   · taper un code à la main — promo ou parrainage (ABC-DEFGH).

import { useCallback, useEffect, useState } from "react";
import { Ticket, Check, X } from "lucide-react";
import { toast } from "sonner";
import { getMesCodes, remiseTexte, type MonCode } from "@/data/mes-codes";
import { getCurrentAccount } from "@/lib/auth";

export type CodeApplique = {
  code: string;
  /** "promo" passe par les codes promo, "parrainage" par le filleul */
  genre: "promo" | "parrainage";
  discount: number;
  type: "percent" | "fixed";
  label: string;
};

/** Forme d'un code de parrainage : ABC-DEFGH */
const FORMAT_PARRAIN = /^[A-Z2-9]{3}-[A-Z2-9]{5}$/;

/** Identifiant d'appareil, partagé avec le reste du site */
function deviceId(): string {
  try {
    let id = localStorage.getItem("ftsd_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("ftsd_device_id", id);
    }
    return id;
  } catch {
    return "";
  }
}

export function CodePromo({
  applique,
  onChange,
}: {
  applique: CodeApplique | null;
  onChange: (c: CodeApplique | null) => void;
}) {
  const [saisie, setSaisie] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [mesCodes, setMesCodes] = useState<MonCode[]>([]);

  const charger = useCallback(async () => {
    try {
      const acc = await getCurrentAccount();
      const codes = await getMesCodes(acc?.email ?? null, acc?.phone ?? null);
      setMesCodes(codes.filter((c) => !c.used && !c.expired));
    } catch {
      setMesCodes([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { charger(); }, 0);
    return () => clearTimeout(t);
  }, [charger]);

  async function appliquer(brut?: string) {
    const code = (brut ?? saisie).trim().toUpperCase();
    if (!code) return;
    setOccupe(true);

    try {
      // ─── Parrainage ──────────────────────────────────────
      if (FORMAT_PARRAIN.test(code)) {
        const res = await fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "apply", device: deviceId(), code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error ?? "Code de parrainage refusé");
          return;
        }
        onChange({
          code, genre: "parrainage", discount: 15, type: "percent",
          label: "Parrainage",
        });
        setSaisie("");
        toast.success("Parrainage appliqué : -15 % sur cette commande");
        return;
      }

      // ─── Code promo ──────────────────────────────────────
      const acc = await getCurrentAccount().catch(() => null);
      const params = new URLSearchParams({ code });
      if (acc?.email) params.set("email", acc.email);
      if (acc?.phone) params.set("phone", acc.phone);

      const res = await fetch(`/api/promos?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.promo) {
        toast.error(data?.error ?? "Code invalide ou déjà utilisé");
        return;
      }
      onChange({
        code: data.promo.code,
        genre: "promo",
        discount: Number(data.promo.discount) || 0,
        type: data.promo.type === "fixed" ? "fixed" : "percent",
        label: data.promo.label || "Code promo",
      });
      setSaisie("");
      toast.success("Code appliqué");
    } catch {
      toast.error("Réseau indisponible");
    } finally {
      setOccupe(false);
    }
  }

  if (applique) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-white">
          {applique.code}
          <span className="ml-2 font-semibold text-emerald-300">
            {applique.type === "fixed"
              ? `-${applique.discount.toFixed(2).replace(".", ",")} €`
              : `-${applique.discount} %`}
          </span>
        </span>
        <button onClick={() => onChange(null)} aria-label="Retirer le code"
          className="shrink-0 text-[11px] font-bold text-white/50 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {mesCodes.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Vos codes disponibles
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mesCodes.map((c) => (
              <button key={c.code} onClick={() => appliquer(c.code)} disabled={occupe}
                className="rounded-lg border-2 border-brand-red/40 bg-white/5 px-2.5 py-1.5 text-left transition-colors hover:bg-white/10 disabled:opacity-50">
                <span className="block text-[11.5px] font-black tracking-wide text-white">
                  {c.code}
                </span>
                <span className="block text-[10px] font-bold text-emerald-400">
                  {remiseTexte(c)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
          <Ticket className="h-4 w-4 shrink-0 text-white/30" />
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") appliquer(); }}
            placeholder={mesCodes.length ? "Ou saisissez un code" : "Code promo ou parrainage"}
            aria-label="Code promo ou code de parrainage"
            className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>
        <button onClick={() => appliquer()} disabled={occupe || !saisie.trim()}
          className="shrink-0 rounded-xl border border-white/15 px-4 text-[12px] font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-40">
          {occupe ? "…" : "Appliquer"}
        </button>
      </div>

      <p className="text-[10.5px] leading-4 text-white/35">
        Un code de parrainage (ABC-DEFGH) donne -15 % sur votre première
        commande. Le montant exact est recalculé au paiement.
      </p>
    </div>
  );
}

export default CodePromo;
