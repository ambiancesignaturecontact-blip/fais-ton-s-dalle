"use client";

// ─── Code de remise, côté site web ─────────────────────────────
//
// Ce bloc n'existait que dans l'application mobile. Résultat concret :
// un client qui commandait depuis le site n'avait AUCUN code à donner
// au livreur. À la porte, le livreur ne pouvait pas valider sa course
// et devait appeler le restaurant — pour chaque commande web.
//
// Le code vient du serveur (`delivery_code` dans /api/order/[uuid]).
// On ne le recalcule pas ici : le navigateur n'a pas à connaître la
// règle de dérivation, et cela garantit qu'app, site et livreur
// affichent toujours la même valeur.

import { useEffect, useState } from "react";
import { Copy, Check, ShieldCheck, Bike } from "lucide-react";

interface Props {
  /** Code à 6 chiffres renvoyé par l'API ; null tant qu'il n'est pas émis */
  code: string | null | undefined;
  /** Statut de la commande, pour adapter le message */
  status?: string;
  /** Mode : le code n'a de sens qu'en livraison */
  mode?: string;
}

function estValide(code: string | null | undefined): code is string {
  return !!code && /^\d{6}$/.test(code);
}

export default function DeliveryCodeCard({ code, status, mode }: Props) {
  const [copie, setCopie] = useState(false);

  // Remet le bouton à l'état neutre : sans ça, « Copié ✓ » restait
  // affiché indéfiniment et le client ne savait plus s'il venait de
  // copier ou si c'était un reste de tout à l'heure.
  useEffect(() => {
    if (!copie) return;
    const t = setTimeout(() => setCopie(false), 2000);
    return () => clearTimeout(t);
  }, [copie]);

  // Le retrait sur place ne passe pas par un livreur.
  if (mode && mode !== "livraison") return null;

  // Avant que la commande soit prête, aucun code n'est émis : on
  // explique pourquoi plutôt que de laisser un trou dans la page.
  if (!estValide(code)) {
    const enCours = status === "pending" || status === "preparing" || status === "confirmed";
    if (!enCours) return null;
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-3">
          <Bike className="h-5 w-5 shrink-0 text-white/40" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-white/80">
              Votre code de remise
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/45">
              Il apparaîtra ici dès que votre commande partira en livraison.
              Gardez cette page ouverte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const groupe = `${code.slice(0, 3)} ${code.slice(3)}`;

  async function copier() {
    try {
      await navigator.clipboard.writeText(code as string);
      setCopie(true);
    } catch {
      // Safari en http, ou permission refusée : le code reste lisible
      // à l'écran, la copie n'est qu'un confort.
      setCopie(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-brand-red/40 bg-gradient-to-br from-brand-red/15 to-brand-red/5 p-5 sm:p-6"
      aria-labelledby="titre-code-remise"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="titre-code-remise" className="text-sm font-black uppercase tracking-wide text-white">
            Code de remise
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            Communiquez ces 6 chiffres au livreur à son arrivée. Ils
            confirment que la commande vous a bien été remise.
          </p>
        </div>
      </div>

      {/* Chaque chiffre dans sa case : lisible d'un coup d'œil, y
          compris à bout de bras sur un palier mal éclairé. */}
      <div
        className="mt-5 flex justify-center gap-2 sm:gap-2.5"
        role="img"
        aria-label={`Votre code de remise : ${code.split("").join(" ")}`}
      >
        {code.split("").map((chiffre, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={
              "flex h-14 w-10 items-center justify-center rounded-xl border-2 " +
              "border-brand-red/50 bg-black/40 text-2xl font-black tabular-nums " +
              "text-white sm:h-16 sm:w-12 sm:text-3xl " +
              (i === 2 ? "mr-2 sm:mr-3" : "")
            }
          >
            {chiffre}
          </span>
        ))}
      </div>

      <p className="mt-3 text-center text-xs font-semibold tabular-nums text-white/45">
        {groupe}
      </p>

      <button
        type="button"
        onClick={copier}
        aria-label="Copier le code de remise"
        className={
          "mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 " +
          "text-sm font-bold transition-colors " +
          (copie
            ? "bg-green-500/20 text-green-300"
            : "bg-white/10 text-white hover:bg-white/15")
        }
      >
        {copie ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Code copié
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copier le code
          </>
        )}
      </button>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
        Ne communiquez ce code qu'au livreur, une fois votre commande
        en main. Aucun employé ne vous le demandera par téléphone.
      </p>
    </section>
  );
}
