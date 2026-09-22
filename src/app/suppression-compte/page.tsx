import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

// ─── Page exigée par Apple ─────────────────────────────────────
//
// Guideline 5.1.1(v) : toute application permettant de CRÉER un
// compte doit offrir un moyen de le SUPPRIMER, et le lien vers les
// instructions doit être :
//
//   • public         — accessible sans être connecté
//   • direct         — pas caché derrière un formulaire de contact
//   • renseigné      — champ « URL de suppression de compte » de la
//                      fiche App Store Connect
//
// Sans cette page, l'URL demandée par le formulaire n'existe pas et
// la soumission est rejetée. C'est un motif de rejet fréquent et
// entièrement évitable.

export const metadata: Metadata = pageMeta({
  path: "/suppression-compte",
  title: "Supprimer mon compte | FAIS TON S'DALLE",
  description:
    "Comment supprimer définitivement votre compte FAIS TON S'DALLE et les données associées, depuis l'application ou par e-mail.",
  keywords: ["supprimer compte", "suppression données", "RGPD"],
});

export default function SuppressionComptePage() {
  return (
    <div className="min-h-screen bg-[#1a0a0a] text-white/80 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-brand-red font-bold text-sm hover:underline mb-8 inline-block"
        >
          ← Retour au menu
        </Link>

        <h1 className="font-heading text-2xl tracking-wider mb-6">
          Supprimer mon compte
        </h1>

        <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <p>
            Vous pouvez supprimer votre compte FAIS TON S&apos;DALLE à tout
            moment. La suppression est <strong className="text-white/80">
            définitive</strong> et ne demande aucune justification.
          </p>

          {/* ─── Méthode 1 : dans l'application ─── */}
          <h2 className="text-white font-heading text-lg tracking-wider mt-8">
            1. Depuis l&apos;application mobile
          </h2>
          <p>C&apos;est la méthode la plus rapide : l&apos;effacement est immédiat.</p>
          <ol className="list-decimal list-inside space-y-2 pl-1">
            <li>Ouvrez l&apos;application et connectez-vous</li>
            <li>
              Rendez-vous dans l&apos;onglet{" "}
              <strong className="text-white/80">Profil</strong>
            </li>
            <li>
              Touchez <strong className="text-white/80">Mon compte</strong>
            </li>
            <li>
              Touchez{" "}
              <strong className="text-white/80">Supprimer mon compte</strong>{" "}
              en bas de l&apos;écran
            </li>
            <li>Confirmez : le compte est effacé de nos serveurs</li>
          </ol>

          {/* ─── Méthode 2 : par e-mail ─── */}
          <h2 className="text-white font-heading text-lg tracking-wider mt-8">
            2. Par e-mail
          </h2>
          <p>
            Si vous n&apos;avez plus accès à l&apos;application, écrivez à{" "}
            <a
              href="mailto:contact@faistonsdalle.com?subject=Suppression%20de%20mon%20compte"
              className="text-brand-red underline hover:text-red-400"
            >
              contact@faistonsdalle.com
            </a>{" "}
            depuis l&apos;adresse associée à votre compte, avec pour objet
            « Suppression de mon compte ».
          </p>
          <p>
            Votre demande est traitée sous{" "}
            <strong className="text-white/80">30 jours maximum</strong>,
            conformément au RGPD. En pratique, comptez 72 heures.
          </p>

          {/* ─── Ce qui est réellement effacé ─── */}
          <h2 className="text-white font-heading text-lg tracking-wider mt-8">
            Ce qui est supprimé
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Votre nom, adresse e-mail et numéro de téléphone</li>
            <li>Vos adresses de livraison enregistrées</li>
            <li>Votre compteur et vos avantages de fidélité</li>
            <li>Vos identifiants de connexion</li>
            <li>Votre historique de commandes personnel</li>
          </ul>

          {/* ─── Honnêteté sur ce qui est conservé ─── */}
          <h2 className="text-white font-heading text-lg tracking-wider mt-8">
            Ce que nous devons conserver
          </h2>
          <p>
            Les <strong className="text-white/80">factures</strong> des
            commandes déjà payées sont conservées{" "}
            <strong className="text-white/80">10 ans</strong>. Il ne
            s&apos;agit pas d&apos;un choix commercial : l&apos;article L123-22
            du Code de commerce et l&apos;administration fiscale l&apos;imposent
            à tout restaurant.
          </p>
          <p>
            Ces factures sont{" "}
            <strong className="text-white/80">dissociées de votre
            compte</strong> : elles ne servent qu&apos;à la comptabilité, ne
            sont plus rattachées à un profil client et ne peuvent plus être
            utilisées pour vous contacter.
          </p>
          <p>
            Les données de paiement ne sont pas concernées :{" "}
            <strong className="text-white/80">nous ne les détenons
            pas</strong>. Elles sont traitées exclusivement par Stripe, notre
            prestataire certifié PCI-DSS.
          </p>

          {/* ─── Effet immédiat ─── */}
          <h2 className="text-white font-heading text-lg tracking-wider mt-8">
            Conséquences
          </h2>
          <p>
            La suppression est <strong className="text-white/80">
            irréversible</strong>. Vos points de fidélité sont perdus et ne
            peuvent pas être rétablis. Vous pourrez créer un nouveau compte
            plus tard, mais il repartira de zéro.
          </p>
          <p className="pt-4">
            Une question ?{" "}
            <Link
              href="/contact"
              className="text-brand-red underline hover:text-red-400"
            >
              Contactez-nous
            </Link>{" "}
            ou consultez notre{" "}
            <Link
              href="/confidentialite"
              className="text-brand-red underline hover:text-red-400"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
