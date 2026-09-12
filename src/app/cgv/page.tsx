import type { Metadata } from "next";
import Link from "next/link";
import { FromToText } from "@/components/hours/HoursText";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/cgv",
  title: "CGV | FAIS TON S'DALLE – Sandwich Halal 93320",
  description:
    "CGV de FAIS TON S'DALLE : commande en ligne, paiement sécurisé Stripe, livraison et retrait de sandwichs halal aux Pavillons-sous-Bois (93320).",
  keywords: ["CGV", "conditions générales de vente", "commande sandwich halal"],
});

export default function CGV() {
  return (
    <div className="min-h-screen bg-[#1a0a0a] text-white/80 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-8 inline-block">← Retour au menu</Link>
        <h1 className="font-heading text-2xl tracking-wider mb-6">Conditions Générales de Vente</h1>
        <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <p><strong className="text-white/80">FAIS TON S&apos;DALLE</strong> — 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois.</p>
          <p>Les prix sont indiqués en euros TTC. Le paiement s&apos;effectue par carte bancaire via Stripe. Le restaurant propose un service de livraison <FromToText /> et un service à emporter.</p>
          <p>Le client reconnaît avoir pris connaissance des présentes CGV avant de passer commande. Toute commande validée vaut acceptation des CGV.</p>
          <p>Conformément à la loi, le client dispose d&apos;un délai de rétractation de 14 jours, excepté pour les denrées périssables (articles L.221-28 du Code de la consommation).</p>
          <p>Pour toute réclamation, contacter le 06 72 04 48 75.</p>
        </div>
      </div>
    </div>
  );
}
