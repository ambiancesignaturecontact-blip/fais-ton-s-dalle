"use client";

// ─── Modifier les ingrédients d'une commande en cours ──────────
//
// Demandé le 02/10/2026 : « enlever ou rajouter un ingrédient
// d'une commande côté admin ».
//
// Le cas réel : le client rappelle deux minutes après avoir
// commandé — « sans oignons », « rajoutez du cheddar ». Jusqu'ici
// il fallait annuler la commande et tout ressaisir : nouveau
// numéro, livreur perdu, compta comptée deux fois.
//
// Le prix suit la composition : retirer un supplément fait baisser
// l'addition, en ajouter la fait monter. Et c'est le SERVEUR qui
// recalcule — jamais ce fichier.

import { useMemo, useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { VIANDES, CRUDITES, SAUCES, SUPPLEMENTS } from "@/data/menu";
import {
  lireComposition, ecrireComposition, quotasPour, comptePayants,
  type Composition, type Famille,
} from "@/lib/composition";

const CHOIX: Record<Famille, readonly string[]> = {
  viande: VIANDES,
  crudites: CRUDITES,
  sauces: SAUCES,
  supplements: SUPPLEMENTS,
};

const TITRES: Record<Famille, string> = {
  viande: "Viandes",
  crudites: "Crudités",
  sauces: "Sauces",
  supplements: "Suppléments",
};

export function EditeurComposition({
  nomArticle, composition, onValider, onAnnuler, occupe,
}: {
  nomArticle: string;
  composition: string | null;
  onValider: (nouvelle: string) => void;
  onAnnuler: () => void;
  occupe?: boolean;
}) {
  const [c, setC] = useState<Composition>(() => lireComposition(composition));

  const quotas = quotasPour(nomArticle);
  const payants = comptePayants(nomArticle, c);
  const depart = useMemo(
    () => comptePayants(nomArticle, lireComposition(composition)),
    [nomArticle, composition]
  );
  const ecart = payants - depart;

  function basculer(famille: Famille, valeur: string) {
    setC((avant) => {
      const liste = avant[famille] ?? [];
      return {
        ...avant,
        [famille]: liste.includes(valeur)
          ? liste.filter((v) => v !== valeur)
          : [...liste, valeur],
      };
    });
  }

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-3">
      {(Object.keys(CHOIX) as Famille[]).map((famille) => {
        const choisis = c[famille] ?? [];
        const inclus = quotas[famille];
        return (
          <div key={famille} className="mb-2.5 last:mb-0">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-white/40">
              {TITRES[famille]}
              <span className="ml-1 font-normal normal-case text-white/25">
                {inclus} inclus{famille === "supplements" ? "" : "es"} · +1,00 € au-delà
              </span>
            </p>
            <div className="flex flex-wrap gap-1">
              {CHOIX[famille].map((valeur) => {
                const actif = choisis.includes(valeur);
                const rang = choisis.indexOf(valeur);
                const payant = actif && rang >= inclus;
                return (
                  <button
                    key={valeur}
                    type="button"
                    disabled={occupe}
                    onClick={() => basculer(famille, valeur)}
                    className={
                      "rounded-md px-2 py-0.5 text-[10px] font-semibold transition " +
                      (actif
                        ? payant
                          ? "bg-amber-500/25 text-amber-200 ring-1 ring-amber-400/40"
                          : "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
                        : "bg-white/5 text-white/40 hover:bg-white/10")
                    }
                    title={payant ? "Supplément facturé 1,00 €" : undefined}
                  >
                    {actif ? <Check className="mr-0.5 inline h-2.5 w-2.5" /> : <Plus className="mr-0.5 inline h-2.5 w-2.5" />}
                    {valeur}
                    {payant ? " +1€" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <p className="text-[10px] text-white/50">
          {ecart === 0
            ? "Prix inchangé"
            : ecart > 0
            ? `+ ${(ecart * 1).toFixed(2).replace(".", ",")} € de suppléments`
            : `− ${(-ecart * 1).toFixed(2).replace(".", ",")} € en moins`}
          <span className="ml-1 text-white/25">(recalculé par le serveur)</span>
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onAnnuler}
            disabled={occupe}
            className="rounded-md bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60 hover:bg-white/10"
          >
            <X className="mr-0.5 inline h-2.5 w-2.5" />Annuler
          </button>
          <button
            type="button"
            onClick={() => onValider(ecrireComposition(c))}
            disabled={occupe}
            className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold
                       text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40"
          >
            <Check className="mr-0.5 inline h-2.5 w-2.5" />Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
