import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/mentions-legales",
  title: "Mentions Légales | FAIS TON S'DALLE",
  description:
    "Mentions légales et éditeur du site FAIS TON S'DALLE, restaurant de sandwichs halal au 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois.",
  keywords: ["mentions légales", "éditeur", "FAIS TON S'DALLE"],
});

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-[#1a0a0a] text-white/80 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-8 inline-block">← Retour au menu</Link>
        <h1 className="font-heading text-2xl tracking-wider mb-6">Mentions Légales</h1>
        <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <p><strong className="text-white/80">Raison sociale :</strong> FAIS TON S&apos;DALLE</p>
          <p><strong className="text-white/80">Adresse :</strong> 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois</p>
          <p><strong className="text-white/80">Téléphone :</strong> 06 72 04 48 75</p>
          <p><strong className="text-white/80">Email :</strong> contact@faistonsdalle.com</p>
          <p><strong className="text-white/80">Directeur de publication :</strong> L&apos;exploitant</p>
          <p><strong className="text-white/80">Hébergeur :</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
          <p>Le site est accessible 7j/7, sauf maintenance. Les informations fournies sont données à titre indicatif. Le restaurant ne saurait être tenu responsable des erreurs ou omissions.</p>
          <p>Conformément au RGPD, les données personnelles collectées (nom, email, adresse) sont utilisées uniquement pour le traitement des commandes et ne sont pas revendues.</p>
        </div>
      </div>
    </div>
  );
}
