import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

// ─── Page d'assistance ─────────────────────────────────────────
//
// L'« URL d'assistance » est un champ OBLIGATOIRE d'App Store Connect :
// sans elle, le formulaire de soumission ne peut pas être validé.
//
// On aurait pu y mettre /contact, mais Apple attend une page qui
// répond aux questions courantes, pas seulement un formulaire. Une
// page d'assistance vide ou purement décorative peut valoir un rejet
// en guideline 1.5 (informations de contact insuffisantes).

export const metadata: Metadata = pageMeta({
  path: "/support",
  title: "Aide et assistance | FAIS TON S'DALLE",
  description:
    "Besoin d'aide avec l'application ou votre commande FAIS TON S'DALLE ? Réponses aux questions fréquentes et contact direct.",
  keywords: ["aide", "assistance", "support", "FAQ", "problème commande"],
});

const QUESTIONS: { q: string; r: React.ReactNode }[] = [
  {
    q: "Où en est ma commande ?",
    r: (
      <>
        Suivez-la en direct sur la page{" "}
        <Link href="/suivi" className="text-brand-red underline hover:text-red-400">
          Suivi de commande
        </Link>{" "}
        avec le numéro figurant sur votre confirmation, ou depuis
        l&apos;onglet <strong className="text-white/80">Commandes</strong> de
        l&apos;application.
      </>
    ),
  },
  {
    q: "Livrez-vous chez moi ?",
    r: (
      <>
        Nous livrons Les Pavillons-sous-Bois et les communes limitrophes
        (Bondy, Livry-Gargan, Le Raincy, Villemomble, Aulnay-sous-Bois).
        L&apos;application vérifie automatiquement votre adresse au moment
        de la commande et vous prévient si vous êtes hors zone.
      </>
    ),
  },
  {
    q: "Qu'est-ce que le code de remise à 6 chiffres ?",
    r: (
      <>
        Il garantit que votre commande n&apos;est remise qu&apos;à vous. Le
        livreur vous le demande à l&apos;arrivée : communiquez-le
        uniquement une fois votre commande en main. Il change à chaque
        commande et cesse d&apos;être valable après la livraison.
      </>
    ),
  },
  {
    q: "Vos produits sont-ils halal ?",
    r: (
      <>
        Oui. Toutes nos viandes sont certifiées halal. Nos fournisseurs sont
        indiqués en boutique et communiqués sur simple demande.
      </>
    ),
  },
  {
    q: "Comment fonctionne la fidélité ?",
    r: (
      <>
        Un menu acheté = un point. Au bout de{" "}
        <strong className="text-white/80">10 menus</strong>, une réduction
        est automatiquement appliquée à votre commande suivante. Le compteur
        est visible dans l&apos;onglet Fidélité de l&apos;application.
      </>
    ),
  },
  {
    q: "L'aperçu 3D ne s'affiche pas",
    r: (
      <>
        L&apos;aperçu 3D nécessite un appareil récent et une accélération
        graphique disponible. S&apos;il reste indisponible, la commande
        fonctionne normalement sans lui : il s&apos;agit d&apos;un confort
        visuel, pas d&apos;une étape obligatoire.
      </>
    ),
  },
  {
    q: "Je veux supprimer mon compte",
    r: (
      <>
        Rendez-vous sur{" "}
        <Link
          href="/suppression-compte"
          className="text-brand-red underline hover:text-red-400"
        >
          Supprimer mon compte
        </Link>
        . La procédure est décrite pas à pas et prend moins d&apos;une minute
        depuis l&apos;application.
      </>
    ),
  },
  {
    q: "Un problème avec un paiement",
    r: (
      <>
        Nos paiements sont traités par Stripe : nous n&apos;avons jamais accès
        à votre numéro de carte. En cas de débit sans commande confirmée,
        appelez-nous au 06 72 04 48 75 avec la date et le montant : le
        remboursement est immédiat.
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#1a0a0a] text-white/80 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-brand-red font-bold text-sm hover:underline mb-8 inline-block"
        >
          ← Retour au menu
        </Link>

        <h1 className="font-heading text-2xl tracking-wider mb-2">
          Aide et assistance
        </h1>
        <p className="text-sm text-white/40 mb-8">
          Une question sur l&apos;application ou votre commande ? La réponse
          est probablement ci-dessous.
        </p>

        {/* ─── Contact direct, en haut : c'est ce qu'on cherche ─── */}
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          <a
            href="tel:+33672044875"
            className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/20 hover:bg-brand-red/20 transition-colors"
          >
            <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
              Par téléphone
            </p>
            <p className="text-white font-bold">06 72 04 48 75</p>
            <p className="text-xs text-white/40 mt-1">
              Tous les jours, 11h30 – 23h00
            </p>
          </a>
          <a
            href="mailto:contact@faistonsdalle.com"
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
              Par e-mail
            </p>
            <p className="text-white font-bold text-sm break-all">
              contact@faistonsdalle.com
            </p>
            <p className="text-xs text-white/40 mt-1">Réponse sous 24 h</p>
          </a>
        </div>

        {/* ─── Questions fréquentes ─── */}
        <h2 className="font-heading text-lg tracking-wider text-white mb-4">
          Questions fréquentes
        </h2>
        <div className="space-y-3 mb-10">
          {QUESTIONS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-white flex items-center justify-between gap-3">
                {item.q}
                <span className="text-brand-red shrink-0 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-4 text-sm text-white/60 leading-relaxed">
                {item.r}
              </div>
            </details>
          ))}
        </div>

        {/* ─── Coordonnées complètes ─── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-white/60">
          <h2 className="font-heading text-base tracking-wider text-white mb-3">
            Nous trouver
          </h2>
          <p>
            FAIS TON S&apos;DALLE
            <br />
            134 Allée du Colonel Fabien
            <br />
            93320 Les Pavillons-sous-Bois
          </p>
          <p className="mt-3 text-xs text-white/40">
            Voir aussi nos{" "}
            <Link href="/cgv" className="underline hover:text-white/70">
              conditions générales
            </Link>
            , nos{" "}
            <Link href="/mentions-legales" className="underline hover:text-white/70">
              mentions légales
            </Link>{" "}
            et notre{" "}
            <Link href="/confidentialite" className="underline hover:text-white/70">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
