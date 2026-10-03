"use client";

// ─── Onglet « Campagne » de l'admin du site ───────────────────
//
// Même contenu que dans l'application (clé `campaign` de
// /api/settings) : une modification ici change l'app ET le site.
//
// Ce que le site apporte en plus : la personnalisation VISUELLE.
// Sur un grand écran, on peut choisir les couleurs à la pipette,
// piocher un emoji et voir le rendu en direct — grande version et
// version discrète côte à côte.
//
// À brancher :  <CampagnePanel adminPassword={password} />

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, ChevronRight, X, Eye, Palette } from "lucide-react";
import {
  DEFAULT_CAMPAIGN, parseCampaign, type Campaign, type AffichageCampagne,
} from "@/lib/campaign";

/** Couleurs prêtes à l'emploi, cohérentes avec l'enseigne */
const PALETTES: { nom: string; couleurs: [string, string] }[] = [
  { nom: "Rouge maison", couleurs: ["#E85D4A", "#A82D1E"] },
  { nom: "Braise", couleurs: ["#F5B84E", "#D43D2B"] },
  { nom: "Nuit", couleurs: ["#3B3B5C", "#16161F"] },
  { nom: "Menthe", couleurs: ["#2FBF71", "#146B43"] },
  { nom: "Océan", couleurs: ["#4A90E2", "#1B3F79"] },
  { nom: "Violet", couleurs: ["#9B5DE5", "#4A2073"] },
];

const EMOJIS = ["🎁", "🔔", "🥖", "🔥", "🌙", "⭐", "🎉", "🍔", "🥤", "💥", "🏆", "❤️"];

type Champ = { cle: keyof Campaign; label: string; aide: string; long?: boolean };

const CHAMPS: Champ[] = [
  { cle: "badge", label: "Pastille", aide: "Le petit rectangle en haut" },
  { cle: "titre", label: "Titre", aide: "La phrase en gros" },
  { cle: "accroche", label: "Accroche", aide: "Comment participer", long: true },
  { cle: "detail", label: "Détail", aide: "Le buzzer, le lot à gagner…", long: true },
  { cle: "lieu", label: "Nom affiché", aide: "FAIS TON S'DALLE" },
  { cle: "adresse", label: "Adresse", aide: "134 Allée du Colonel Fabien" },
  { cle: "ville", label: "Code postal et ville", aide: "93320 Les Pavillons-sous-Bois" },
  { cle: "sousTitre", label: "Ligne de la version discrète", aide: "Sous le titre, quand la bannière est en petit" },
  { cle: "cta", label: "Bouton", aide: "Ouvre l'itinéraire" },
  { cle: "signature", label: "Signature", aide: "La phrase de fin" },
];

function versInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default function CampagnePanel({ adminPassword }: { adminPassword: string }) {
  const [c, setC] = useState<Campaign>({ ...DEFAULT_CAMPAIGN });
  const [initial, setInitial] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  // `premier` : au montage, l'état « chargement » est déjà vrai.
  // Le remettre à vrai de façon synchrone dans l'effet déclenche un
  // rendu en cascade (et un avertissement React).
  const charger = useCallback(async (premier = false) => {
    if (!premier) setChargement(true);
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = res.ok ? await res.json() : null;
      const recue = parseCampaign(data?.campaign) ?? { ...DEFAULT_CAMPAIGN };
      setC(recue);
      setInitial(JSON.stringify(recue));
    } catch {
      toast.error("Chargement impossible");
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { charger(true); }, 0);
    return () => clearTimeout(t);
  }, [charger]);

  const modifie = JSON.stringify(c) !== initial;

  async function enregistrer() {
    if (!c.titre.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    setEnvoi(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Auth": adminPassword },
        body: JSON.stringify({ campaign: c }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Enregistrement impossible");
        setEnvoi(false);
        return;
      }
      // On relit le serveur : afficher ce qu'on croit avoir envoyé
      // donnerait l'illusion d'un enregistrement réussi.
      await charger();
      toast.success("Campagne enregistrée — app et site à jour");
    } catch {
      toast.error("Réseau indisponible");
    }
    setEnvoi(false);
  }

  if (chargement) {
    return <p className="px-4 py-6 text-sm text-white/50">Chargement…</p>;
  }

  const maj = (patch: Partial<Campaign>) => setC({ ...c, ...patch });

  return (
    <div className="mx-auto max-w-7xl px-4 py-3 pb-12">
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(300px,380px)]">
        {/* ─── Formulaire ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Interrupteur + mode */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Campagne affichée</p>
                <p className="text-[11px] text-white/50">
                  Coupez l&apos;interrupteur et la bannière disparaît partout,
                  sans rien effacer.
                </p>
              </div>
              <button
                onClick={() => maj({ active: !c.active })}
                aria-pressed={c.active}
                className={`h-7 w-12 shrink-0 rounded-full transition-colors ${c.active ? "bg-brand-red" : "bg-white/15"}`}>
                <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${c.active ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-white/40">
              Taille sur l&apos;accueil
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                { k: "auto", label: "Automatique" },
                { k: "vedette", label: "Toujours grande" },
                { k: "discret", label: "Toujours discrète" },
              ] as { k: AffichageCampagne; label: string }[]).map((m) => (
                <button key={m.k} onClick={() => maj({ affichage: m.k })}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    c.affichage === m.k
                      ? "bg-brand-red text-white"
                      : "border border-white/15 text-white/70 hover:bg-white/10"
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-white/40">
              « Automatique » : grande pour un nouveau client, rappel d&apos;une
              ligne pour les habitués — ils ne sont pas concernés par une
              première commande offerte.
            </p>
          </div>

          {/* Visuel */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <Palette className="h-4 w-4 text-brand-red" /> Visuel
            </p>

            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/40">
              Palettes
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PALETTES.map((p) => {
                const on = c.couleurs[0] === p.couleurs[0] && c.couleurs[1] === p.couleurs[1];
                return (
                  <button key={p.nom} onClick={() => maj({ couleurs: p.couleurs })}
                    title={p.nom} aria-label={`Palette ${p.nom}`}
                    className={`h-9 w-14 rounded-lg border-2 transition-transform hover:scale-105 ${on ? "border-white" : "border-white/15"}`}
                    style={{ backgroundImage: `linear-gradient(135deg, ${p.couleurs[0]}, ${p.couleurs[1]})` }} />
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-[12px] text-white/70">
                Début du dégradé
                <input type="color" value={c.couleurs[0]}
                  onChange={(e) => maj({ couleurs: [e.target.value, c.couleurs[1]] })}
                  className="h-8 w-12 cursor-pointer rounded border border-white/15 bg-transparent" />
              </label>
              <label className="flex items-center gap-2 text-[12px] text-white/70">
                Fin du dégradé
                <input type="color" value={c.couleurs[1]}
                  onChange={(e) => maj({ couleurs: [c.couleurs[0], e.target.value] })}
                  className="h-8 w-12 cursor-pointer rounded border border-white/15 bg-transparent" />
              </label>
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-white/40">
              Emoji animé
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => maj({ emoji: e })}
                  aria-label={`Choisir l'emoji ${e}`}
                  className={`h-9 w-9 rounded-lg text-lg transition-colors ${
                    c.emoji === e ? "bg-brand-red" : "bg-white/5 hover:bg-white/10"
                  }`}>
                  {e}
                </button>
              ))}
              <input value={c.emoji} onChange={(e) => maj({ emoji: e.target.value.slice(0, 8) })}
                aria-label="Autre emoji"
                className="h-9 w-16 rounded-lg border border-white/15 bg-white/5 px-2 text-center text-sm text-white" />
            </div>
          </div>

          {/* Textes */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            {CHAMPS.map((ch) => (
              <div key={String(ch.cle)}>
                <label className="text-[11px] font-bold text-white/60">{ch.label}</label>
                {ch.long ? (
                  <textarea
                    value={String(c[ch.cle] ?? "")}
                    onChange={(e) => maj({ [ch.cle]: e.target.value } as Partial<Campaign>)}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-red/50 focus:outline-none"
                  />
                ) : (
                  <input
                    value={String(c[ch.cle] ?? "")}
                    onChange={(e) => maj({ [ch.cle]: e.target.value } as Partial<Campaign>)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-red/50 focus:outline-none"
                  />
                )}
                <p className="mt-0.5 text-[10px] text-white/35">{ch.aide}</p>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-white/60">Début (facultatif)</label>
                <input type="date" value={versInput(c.debut)}
                  onChange={(e) => maj({ debut: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-white/60">Fin (facultatif)</label>
                <input type="date" value={versInput(c.fin)}
                  onChange={(e) => maj({ fin: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <p className="text-[11px] text-white/40">
              Dates vides = opération sans fin. Sinon la bannière apparaît et
              disparaît toute seule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={enregistrer} disabled={envoi || !modifie}
              className="rounded-xl bg-gradient-to-r from-brand-red to-red-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-40">
              {envoi ? "Enregistrement…" : modifie ? "Enregistrer" : "Aucun changement"}
            </button>
            {modifie && (
              <button onClick={() => charger()}
                className="text-[12px] font-semibold text-white/50 hover:text-white/80">
                Annuler mes modifications
              </button>
            )}
          </div>
        </div>

        {/* ─── Aperçu en direct ───────────────────────────── */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
            <Eye className="h-3.5 w-3.5" /> Aperçu client
          </p>

          {/* Grande version */}
          <div className="overflow-hidden rounded-2xl shadow-2xl"
            style={{ backgroundImage: `linear-gradient(135deg, ${c.couleurs[0]}, ${c.couleurs[1]})` }}>
            <div className="flex flex-col gap-2.5 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  {c.badge}
                </span>
                <span className="animate-pulse text-2xl">{c.emoji}</span>
              </div>
              <h3 className="text-lg font-black leading-tight text-white">{c.titre}</h3>
              <p className="text-[13px] font-bold text-white/95">{c.accroche}</p>
              {!!c.detail && <p className="text-[12.5px] text-white/90">{c.detail}</p>}
              <div className="mt-1 flex items-center gap-2 rounded-xl bg-black/20 p-3">
                <MapPin className="h-4 w-4 shrink-0 text-white" />
                <div className="min-w-0">
                  <p className="text-[12px] font-black tracking-wide text-white">{c.lieu}</p>
                  <p className="text-[11.5px] leading-4 text-white/90">{c.adresse}<br />{c.ville}</p>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 rounded-full border border-white/35 bg-white/20 py-2.5 text-[13px] font-extrabold text-white">
                {c.cta} <ChevronRight className="h-3.5 w-3.5" />
              </div>
              {!!c.signature && (
                <p className="text-center text-[12px] font-extrabold text-white">{c.signature}</p>
              )}
            </div>
          </div>

          {/* Version discrète */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
              Version discrète (habitués)
            </p>
            <div className="relative">
              <div className="flex items-center gap-3 rounded-2xl border-2 bg-[#141414] py-2.5 pl-3 pr-8"
                style={{ borderColor: `${c.couleurs[0]}66` }}>
                <span className="text-lg">{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-extrabold text-white">
                    {c.titre.replace(/\s*!+\s*$/, "")}
                  </p>
                  <p className="truncate text-[11px] text-white/50">{c.sousTitre}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
              </div>
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-[#1A1A1A]">
                <X className="h-2.5 w-2.5 text-white/40" />
              </span>
            </div>
          </div>

          {!c.active && (
            <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-[11.5px] text-amber-200/90">
              La campagne est coupée : rien ne s&apos;affiche côté client.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
