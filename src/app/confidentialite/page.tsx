import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/confidentialite",
  title: "Politique de Confidentialité (RGPD) | FAIS TON S'DALLE",
  description:
    "Comment FAIS TON S'DALLE protège vos données personnelles (RGPD) : compte client, commandes, livraison, cookies et droits des personnes.",
  keywords: ["confidentialité", "RGPD", "données personnelles", "cookies"],
});

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#1a0a0a] text-white/80 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-8 inline-block">← Retour au menu</Link>
        <h1 className="font-heading text-2xl tracking-wider mb-6">Politique de confidentialité</h1>
        <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <p><strong className="text-white/80">Dernière mise à jour :</strong> Juillet 2026</p>
          
          <h2 className="text-white font-heading text-lg tracking-wider mt-6">1. Collecte des données</h2>
          <p>Nous collectons les données suivantes lors de votre commande : nom, adresse email, numéro de téléphone, adresse de livraison et le contenu de votre commande. Ces données sont strictement nécessaires au traitement de votre commande.</p>
          
          <h2 className="text-white font-heading text-lg tracking-wider mt-6">2. Utilisation des données</h2>
          <p>Vos données sont utilisées uniquement pour :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Traiter et livrer votre commande</li>
            <li>Vous envoyer la confirmation par email</li>
            <li>Vous informer des promotions (uniquement si vous êtes inscrit à la newsletter)</li>
            <li>Améliorer nos services</li>
          </ul>

          <h2 className="text-white font-heading text-lg tracking-wider mt-6">3. Partage des données</h2>
          <p>Nous ne vendons aucune de vos données personnelles. Elles sont traitées via des prestataires sécurisés : Stripe (paiement), Supabase (base de données), Resend (emails).</p>

          <h2 className="text-white font-heading text-lg tracking-wider mt-6">4. Durée de conservation</h2>
          <p>Vos données sont conservées pendant 3 ans après votre dernière commande, conformément aux obligations légales fiscales.</p>

          <h2 className="text-white font-heading text-lg tracking-wider mt-6">5. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour les exercer, contactez-nous à <a href="mailto:contact@faistonsdalle.com" className="text-brand-red">contact@faistonsdalle.com</a> ou au 06 72 04 48 75.</p>

          <h2 className="text-white font-heading text-lg tracking-wider mt-6">6. Cookies</h2>
          <p>Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement du panier et du paiement. Aucun cookie publicitaire ou de traçage n&apos;est utilisé.</p>

          <h2 className="text-white font-heading text-lg tracking-wider mt-6">7. Sécurité</h2>
          <p>Les paiements sont traités via Stripe, plateforme certifiée PCI DSS niveau 1. Vos informations bancaires ne transitent jamais sur nos serveurs.</p>
        </div>
      </div>
    </div>
  );
}
