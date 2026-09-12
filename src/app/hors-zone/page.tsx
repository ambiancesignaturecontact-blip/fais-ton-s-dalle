import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, MessageCircle, ArrowLeft } from "lucide-react";
import { pageMeta, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { DELIVERY_CITY_NAMES } from "@/data/delivery";

export const metadata: Metadata = pageMeta({
  path: "/hors-zone",
  title: "Zone de Livraison 93 | FAIS TON S'DALLE – Sandwich Halal",
  description:
    "Livraison de sandwichs halal dans le 93 : Pavillons-sous-Bois, Bondy, Bobigny, Aulnay, Le Blanc-Mesnil, Sevran, Tremblay, Villepinte et 25 autres villes.",
  ogTitle: "Villes livrées dans le 93 – FAIS TON S'DALLE",
  ogDescription:
    "Pavillons-sous-Bois, Bondy, Bobigny, Aulnay, Sevran, Tremblay, Villepinte… vérifiez votre zone de livraison.",
  image: "/images/photo-concept.webp",
  imageAlt: "Concept FAIS TON S'DALLE : sandwichs halal livrés dans tout le 93",
  keywords: [
    "livraison sandwich halal 93",
    "zone de livraison pavillons sous bois",
    "livraison Bondy",
    "livraison Aulnay",
    "fast food halal livraison nuit 93",
  ],
});

const ZONES_93 = DELIVERY_CITY_NAMES;

export default function HorsZonePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] flex items-center justify-center p-4">
      <div className="text-center max-w-lg w-full">
        <JsonLd data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Zone de livraison", path: "/hors-zone" },
        ])} />
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/20 mb-6 mx-auto">
          <MapPin className="h-12 w-12 text-amber-400" />
        </div>

        <h1 className="font-heading text-3xl tracking-wider text-white mb-3">
          Pas encore dans <span className="text-brand-red">ta ville</span>
        </h1>
        <p className="text-white/70 text-sm mb-2">
          On livre uniquement dans le <strong className="text-white">93</strong> pour le moment.
        </p>
        <p className="text-white/50 text-xs mb-6">
          On arrive bientôt dans les autres départements ! En attendant, tu peux passer commande et venir retirer sur place.
        </p>

        {/* Villes livrées */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">🚚 Villes livrées dans le 93</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {ZONES_93.map((ville) => (
              <span key={ville} className="px-2 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-[10px] font-medium">
                {ville}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <Link href="/#menu"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold text-sm shadow-lg shadow-brand-red/20 hover:scale-105 transition-all duration-200"
          >
            Commander à emporter →
          </Link>
          <a href="https://wa.me/33672044875" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:scale-105 transition-all duration-200"
          >
            <MessageCircle className="h-4 w-4" /> Commander sur WhatsApp
          </a>
          <Link href="/"
            className="inline-flex items-center justify-center gap-1.5 text-white/50 hover:text-white/80 text-xs transition-colors mt-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
