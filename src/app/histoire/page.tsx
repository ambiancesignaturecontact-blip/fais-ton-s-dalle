import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FromToText, DaysOpenText } from "@/components/hours/HoursText";
import { pageMeta, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = pageMeta({
  path: "/histoire",
  title: "Notre Histoire – Street Food Halal 93320 | FAIS TON S'DALLE",
  description:
    "L'histoire de FAIS TON S'DALLE, le rendez-vous des sandwichs halal sur mesure aux Pavillons-sous-Bois : concept, équipe et passion de la street food.",
  ogTitle: "Notre histoire – FAIS TON S'DALLE, street food halal 93320",
  ogDescription:
    "Comment FAIS TON S'DALLE est devenu le rendez-vous des sandwichs halal aux Pavillons-sous-Bois.",
  image: "/images/photo-equipe-groupe.webp",
  imageAlt: "L'équipe de FAIS TON S'DALLE réunie aux Pavillons-sous-Bois",
  type: "article",
  keywords: ["histoire", "concept", "street food halal", "équipe restaurant 93320"],
});

export default function HistoirePage() {
  return (
    <div className="min-h-screen bg-[#0d0808] text-white/80 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">← Accueil</Link>
        <JsonLd items={[
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Notre histoire", path: "/histoire" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            url: `${SITE_URL}/histoire`,
            name: "Notre histoire",
            isPartOf: { "@type": "WebSite", url: SITE_URL, name: "FAIS TON S'DALLE" },
            about: { "@id": `${SITE_URL}/#restaurant` },
          },
        ]} />

        <h1 className="font-heading text-3xl md:text-5xl tracking-wider text-white mb-6">
          Notre <span className="text-brand-red">Histoire</span>
        </h1>

        <div className="space-y-6 text-sm md:text-base leading-relaxed">
          {/* La naissance d'un concept */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="font-heading text-xl text-white mb-3">🍔 La naissance d&apos;un concept</h2>
            <p className="mb-3">
              En 2026, un constat s&apos;impose : aux Pavillons-sous-Bois, il est difficile de trouver de quoi se restaurer tard le soir. La plupart des fast-foods ferment leurs portes dès 22 h, laissant peu d&apos;options aux travailleurs de nuit, aux étudiants ou à toutes les personnes qui ont faim après minuit.
            </p>
            <p className="mb-3">
              C&apos;est de ce constat qu&apos;est né <strong className="text-white">FAIS TON S&apos;DALLE</strong>.
            </p>
            <p className="mb-3">
              Derrière ce projet se cache avant tout une aventure humaine. Un homme y a investi tout son cœur, son énergie et sa détermination pour donner vie à cette idée. À ses côtés, une femme l&apos;a accompagné avec passion, en apportant tout son savoir-faire à la création des recettes et à l&apos;organisation de la cuisine. Ensemble, ils ont bâti les fondations d&apos;un concept pensé pour satisfaire les gourmands à toute heure.
            </p>
            <p className="mb-3">
              Le projet a également pu voir le jour grâce au travail d&apos;une équipe investie, qui a imaginé et développé toute l&apos;identité de FAIS TON S&apos;DALLE : le marketing, la communication, l&apos;image de marque et la mise en valeur du concept.
            </p>
            <p>
              Notre mission est simple : vous proposer des sandwichs 100 % halal, préparés à la commande avec des ingrédients frais, soigneusement sélectionnés chaque matin. Des recettes généreuses, entièrement personnalisables selon vos envies, disponibles sur place, à emporter ou en livraison jusqu&apos;à 3 h du matin.
            </p>
            <p className="mt-3 text-white/90 font-semibold">
              Parce que la faim ne connaît pas d&apos;heure, FAIS TON S&apos;DALLE est là pour vous accueillir et vous régaler, même lorsque les autres ont déjà fermé leurs portes.
            </p>
          </section>

          {/* Photo équipe */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden border border-white/10">
              <Image src="/images/photo-equipe-1.webp" alt="L'équipe FAIS TON S'DALLE en cuisine" fill className="object-cover" />
            </div>
            <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden border border-white/10">
              <Image src="/images/photo-equipe-2.webp" alt="Les fondateurs de FAIS TON S'DALLE" fill className="object-cover" />
            </div>
          </div>

          {/* Section clé */}
          <section className="p-6 rounded-2xl bg-gradient-to-r from-brand-red/10 to-brand-orange/10 border border-brand-red/20">
            <h2 className="font-heading text-xl text-white mb-3">🌙 La night food, notre ADN</h2>
            <p>
              Nous sommes ouverts <DaysOpenText />, <FromToText />. Parce que la faim ne connaît pas d&apos;heure. Notre équipe est là pour vous servir, à toute heure.
            </p>
            <p className="mt-3"><strong className="text-white">134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois</strong></p>
            <p className="mt-2">Commandes en ligne, livraison ou à emporter.</p>
          </section>

          {/* Photo interieur large */}
          <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden border border-white/10">
            <Image src="/images/photo-interieur-1.webp" alt="Ambiance du restaurant FAIS TON S'DALLE" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Photo préparation */}
          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden border border-white/10">
            <Image src="/images/photo-preparation-1.webp" alt="Preparation d'un sandwich FAIS TON S'DALLE" fill className="object-cover" />
          </div>

          <div className="text-center mt-10">
            <Link href="/#menu" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold shadow-lg hover:scale-105 transition-all">
              Commander maintenant →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
