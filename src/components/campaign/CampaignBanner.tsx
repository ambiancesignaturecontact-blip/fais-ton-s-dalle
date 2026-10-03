"use client";

// ─── Bannière de campagne marketing ───────────────────────────
//
// Même contenu que dans l'application : il vient de /api/settings,
// donc une seule modification depuis l'espace restaurateur met à
// jour le site ET l'app.
//
// Deux tailles, comme dans l'app :
//   · grande   → pour qui n'a jamais commandé ;
//   · discrète → une ligne, pour les habitués. Le jeu prenait la
//     moitié de la page d'accueil à quelqu'un qui vient simplement
//     recommander son sandwich.
//
// Le gérant peut forcer l'une ou l'autre depuis l'admin, et le
// visiteur peut la ranger pour 7 jours.

import { useEffect, useState } from "react";
import { MapPin, ChevronRight, X } from "lucide-react";
import {
  type Campaign, parseCampaign, campaignVisible, campaignAddress,
} from "@/lib/campaign";

const CLE_MASQUAGE = "ftsd_campagne_masquee_jusqua";
const CLE_HISTORIQUE = "ftsd_order_history";

/** A-t-il déjà commandé ? (historique local, comme le compte) */
function dejaClient(): boolean {
  try {
    const brut = localStorage.getItem(CLE_HISTORIQUE);
    if (!brut) return false;
    const liste = JSON.parse(brut);
    return Array.isArray(liste) && liste.length > 0;
  } catch {
    return false;
  }
}

function masqueeMaintenant(): boolean {
  try {
    const v = localStorage.getItem(CLE_MASQUAGE);
    return !!v && Number(v) > Date.now();
  } catch {
    return false;
  }
}

export function CampaignBanner() {
  const [c, setC] = useState<Campaign | null>(null);
  const [compact, setCompact] = useState(true);
  const [masquee, setMasquee] = useState(false);

  useEffect(() => {
    let vivant = true;

    fetch("/api/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!vivant) return;
        // Lu ici et pas dans le corps de l'effet : localStorage
        // n'existe pas au rendu serveur, et un setState synchrone
        // dans un effet provoque un rendu en cascade.
        setMasquee(masqueeMaintenant());
        if (!data) return;
        const campagne = campaignVisible(parseCampaign(data.campaign));
        setC(campagne);
        if (campagne) {
          setCompact(
            campagne.affichage === "vedette"
              ? false
              : campagne.affichage === "discret"
              ? true
              : dejaClient()
          );
        }
      })
      .catch(() => {});
    return () => { vivant = false; };
  }, []);

  if (!c || masquee) return null;

  const maps = `https://maps.google.com/?q=${encodeURIComponent(campaignAddress(c))}`;

  function ranger() {
    setMasquee(true);
    try {
      localStorage.setItem(CLE_MASQUAGE, String(Date.now() + 7 * 86400000));
    } catch { /* navigation privée : elle réapparaîtra, tant pis */ }
  }

  // ─── Version discrète : une ligne ────────────────────────
  if (compact) {
    return (
      <section className="px-4 py-3" aria-label="Opération en cours">
        <div className="relative mx-auto max-w-2xl">
          <a href={maps} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border-2 bg-[#141414] py-2.5 pl-3 pr-9 transition-colors hover:bg-[#1a1a1a]"
            style={{ borderColor: `${c.couleurs[0]}66` }}>
            <span className="text-lg" aria-hidden="true">{c.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-extrabold text-white">
                {c.titre.replace(/\s*!+\s*$/, "")}
              </span>
              <span className="block truncate text-[11px] text-white/50">
                {c.sousTitre}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
          </a>
          <button onClick={ranger} aria-label="Masquer cette annonce"
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-[#1A1A1A] text-white/40 transition-colors hover:text-white">
            <X className="h-3 w-3" />
          </button>
        </div>
      </section>
    );
  }

  // ─── Grande version ──────────────────────────────────────
  return (
    <section className="px-4 py-6 md:py-8" aria-label="Opération en cours">
      <div className="relative mx-auto max-w-4xl">
        <a
          href={maps}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-2xl shadow-2xl transition-transform duration-200 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-white/60"
          style={{
            backgroundImage: `linear-gradient(135deg, ${c.couleurs[0]}, ${c.couleurs[1]})`,
          }}
        >
          <div className="flex flex-col gap-3 p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-black/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                {c.badge}
              </span>
              <span className="animate-pulse text-2xl md:text-3xl" aria-hidden="true">
                {c.emoji}
              </span>
            </div>

            <h2 className="text-xl font-black leading-tight text-white md:text-3xl">
              {c.titre}
            </h2>

            <p className="text-sm font-bold text-white/95 md:text-base">{c.accroche}</p>
            {!!c.detail && (
              <p className="text-sm text-white/90 md:text-[15px]">{c.detail}</p>
            )}

            <div className="mt-1 flex items-center gap-3 rounded-xl bg-black/20 p-3">
              <MapPin className="h-4 w-4 shrink-0 text-white" />
              <div className="min-w-0">
                <p className="text-[13px] font-black tracking-wide text-white">{c.lieu}</p>
                <p className="text-[12.5px] leading-5 text-white/90">
                  {c.adresse}
                  <br />
                  {c.ville}
                </p>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-center gap-1.5 rounded-full border border-white/35 bg-white/20 py-3 text-sm font-extrabold text-white">
              {c.cta}
              <ChevronRight className="h-4 w-4" />
            </div>

            {!!c.signature && (
              <p className="text-center text-[13px] font-extrabold text-white md:text-sm">
                {c.signature}
              </p>
            )}
          </div>
        </a>

        <button onClick={ranger} aria-label="Masquer cette annonce"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white/80 transition-colors hover:bg-black/50 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

export default CampaignBanner;
