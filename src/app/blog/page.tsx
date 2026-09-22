import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { RangeText, FromToText, DaysOpenText } from "@/components/hours/HoursText";
import { pageMeta, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const BLOG_DATE = "2026-07-21T00:00:00+02:00";

export const metadata: Metadata = pageMeta({
  path: "/blog",
  title: "Composer son Sandwich Halal : Guide | FAIS TON S'DALLE",
  description:
    "Guide complet pour composer votre sandwich halal : formules, 7 viandes, 6 crudités, 9 sauces. Les conseils de FAIS TON S'DALLE, Pavillons-sous-Bois (93320).",
  ogTitle: "Blog – Comment composer son sandwich sur mesure ?",
  ogDescription:
    "Formules, viandes, crudités, sauces : tout pour créer le sandwich halal parfait.",
  image: "/images/menu-gourmand.webp",
  imageAlt: "Menu Gourmand : sandwich sur mesure halal, boisson et tiramisu maison",
  type: "article",
  publishedTime: BLOG_DATE,
  keywords: [
    "sandwich halal 93320", "sandwich sur mesure", "composer son sandwich",
    "livraison sandwich nuit", "fast food halal pavillons sous bois",
    "tenders halal", "menu pas cher seine saint denis",
    "sandwich personnalisable", "bowl halal", "snacking nocturne",
  ],
});

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0d0808]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm h-14 md:h-16 flex items-center px-4">
        <Link href="/" className="font-heading text-sm md:text-lg tracking-wider text-white/90">
          ← FAIS TON S&apos;DALLE
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-4 pt-24 pb-16 text-white/80">
        <JsonLd items={[
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: "Comment composer votre sandwich sur mesure",
            description:
              "Formules, viandes, crudités, sauces : le guide complet pour composer votre sandwich halal sur mesure.",
            inLanguage: "fr-FR",
            datePublished: BLOG_DATE,
            dateModified: BLOG_DATE,
            image: `${SITE_URL}/images/menu-gourmand.webp`,
            author: { "@type": "Organization", name: "FAIS TON S'DALLE", url: SITE_URL },
            publisher: {
              "@type": "Organization",
              name: "FAIS TON S'DALLE",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logo.jpg` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog` },
          },
        ]} />
        <h1 className="font-heading text-3xl md:text-5xl tracking-wider text-white mb-4">
          Comment composer <span className="text-brand-red">votre sandwich</span> sur mesure
        </h1>
        <p className="text-sm text-white/50 mb-8">Publié le 21 juillet 2026</p>

        <section className="mb-10">
          <p className="text-sm md:text-base leading-relaxed mb-4">
            Vous avez faim ? Vous voulez un <strong className="text-white">sandwich halal, frais, généreux</strong>{" "}
            et surtout <strong className="text-white">préparé selon vos envies</strong> ?
            Bienvenue chez <strong className="text-white">FAIS TON S&apos;DALLE</strong>, le concept de
            sandwich sur mesure incontournable aux Pavillons-sous-Bois.
          </p>
          <p className="text-sm md:text-base leading-relaxed">
            Ici, pas de menu imposé. Vous choisissez VOTRE formule, VOS viandes, VOS crudités, VOS sauces.
            Et nous préparons devant vous. Simple, frais, généreux.
          </p>
        </section>

        <section className="mb-10 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="font-heading text-xl md:text-2xl tracking-wider text-white mb-3">1. Choisissez votre formule</h2>
          <p className="text-sm leading-relaxed mb-3">Trois formules pour toutes les faims :</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><span className="text-brand-red font-bold shrink-0">🍞</span><div><strong className="text-white">Menu Léger — 6,90€</strong> — Sandwich (viande + crudités + sauce).</div></li>
            <li className="flex items-start gap-2"><span className="text-brand-red font-bold shrink-0">🥤</span><div><strong className="text-white">Menu Classique — 7,90€</strong> — Sandwich + boisson.</div></li>
            <li className="flex items-start gap-2"><span className="text-brand-red font-bold shrink-0">🍰</span><div><strong className="text-white">Menu Gourmand — 9,90€</strong> — Sandwich + boisson + dessert.</div></li>
          </ul>
        </section>

        {/* Photo sandwich */}
        <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-10 border border-white/10">
          <Image src="/images/photo-sandwich-2.webp" alt="Sandwich sur mesure FAIS TON S'DALLE" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <section className="mb-10 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="font-heading text-xl md:text-2xl tracking-wider text-white mb-3">2. Personnalisez votre sandwich</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><span className="text-brand-red font-bold shrink-0">🔥</span> <strong className="text-white">Cuisson :</strong> Froid ou chaud ? Au choix.</li>
            <li className="flex gap-2"><span className="text-brand-red font-bold shrink-0">🥩</span> <strong className="text-white">7 viandes :</strong> Tenders, émincé poulet, blanc dinde, jambon dinde, pastrami, rosette, thon. Jusqu&apos;à 2 viandes (Classique/Gourmand).</li>
            <li className="flex gap-2"><span className="text-brand-red font-bold shrink-0">🥗</span> <strong className="text-white">6 crudités :</strong> Salade, tomate, oignons, maïs, carottes râpées, avocat.</li>
            <li className="flex gap-2"><span className="text-brand-red font-bold shrink-0">🧂</span> <div><strong className="text-white">9 sauces :</strong> Mayo, Ketchup, Algérienne, Samouraï, Blanche, Moutarde, Brésil, Chili, Thai.{' '}
              <Link href="/guides/sauces" className="text-brand-red underline">Quelle sauce choisir pour ton sandwich ? →</Link>
            </div></li>
            <li className="flex gap-2"><span className="text-brand-red font-bold shrink-0">🧀</span> <strong className="text-white">Suppléments :</strong> Cheddar, Mozzarella, Feta — dès 1€.</li>
          </ul>
        </section>

        <section className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-brand-red/10 to-brand-orange/10 border border-brand-red/20">
          <h2 className="font-heading text-xl md:text-2xl tracking-wider text-white mb-3">🌙 Livraison <RangeText /></h2>
          <p className="text-sm leading-relaxed">Service <FromToText />, <DaysOpenText />. Paiement Stripe sécurisé.</p>
        </section>

        <section className="mb-10 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="font-heading text-xl md:text-2xl tracking-wider text-white mb-3">🥗 Les Bowls</h2>
          <p className="text-sm leading-relaxed">Mêmes ingrédients que le sandwich, dans un bol. Bowl 10,90€, Bowl + boisson 11,90€.</p>
        </section>

        <section className="mb-10 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <h2 className="font-heading text-xl md:text-2xl tracking-wider text-white mb-3">⭐ Avis clients</h2>
          <p className="text-sm text-white/70 mb-5">
            Découvrez les avis vérifiés de nos clients sur notre fiche Google :
            sandwichs généreux, tenders croustillants et milkshakes maison.
          </p>
          <Link href="/avis" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold text-sm hover:scale-105 transition-transform">
            Voir tous les avis →
          </Link>
        </section>

        <div className="text-center mt-12">
          <Link href="/#menu" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold text-sm shadow-lg shadow-brand-red/20 hover:scale-105 transition-all duration-200">
            Commander maintenant →
          </Link>
          <p className="text-xs text-white/40 mt-4">
            FAIS TON S&apos;DALLE — 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois<br />
            Livraison <RangeText /> · <DaysOpenText /> · 06 72 04 48 75
          </p>
        </div>
      </article>
    </div>
  );
}
