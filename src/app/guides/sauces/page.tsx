import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const GUIDE_DATE = "2026-07-21T00:00:00+02:00";

export const metadata: Metadata = pageMeta({
  path: "/guides/sauces",
  title: "Les 9 Sauces du Sandwich Parfait | FAIS TON S'DALLE",
  description:
    "Algérienne, samouraï, blanche, chili, thaï : découvrez nos 9 sauces et les meilleurs accords pour votre sandwich halal. FAIS TON S'DALLE (93320).",
  ogTitle: "Quelle sauce choisir pour son sandwich ?",
  ogDescription: "Top 9 sauces pour un sandwich halal parfait : goût, piquant, accords.",
  image: "/images/menu-classique.webp",
  imageAlt: "Menu Classique : sandwich halal sur mesure avec boisson chez FAIS TON S'DALLE",
  type: "article",
  publishedTime: GUIDE_DATE,
  keywords: [
    "sauces sandwich",
    "sauce algérienne",
    "sauce samouraï",
    "meilleure sauce sandwich halal",
  ],
});

export default function GuideSauces() {
  return (
    <div className="min-h-screen bg-[#0d0808] text-white/80 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">← Accueil</Link>
        <JsonLd items={[
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: "Choisir sa sauce", path: "/guides/sauces" },
          ]),
          articleJsonLd({
            headline: "Quelle sauce choisir pour son sandwich ?",
            description: "Les 9 sauces de FAIS TON S'DALLE et les meilleurs accords pour votre sandwich halal.",
            path: "/guides/sauces",
            image: "/images/menu-classique.webp",
            datePublished: GUIDE_DATE,
            dateModified: GUIDE_DATE,
          }),
        ]} />
        <h1 className="font-heading text-3xl md:text-5xl tracking-wider text-white mb-4">Quelle sauce choisir <span className="text-brand-red">pour ton sandwich</span> ?</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            { name: "Algérienne", desc: "La préférée de tous. Épicée mais pas trop, elle va avec tout.", note: "5/5" },
            { name: "Samouraï", desc: "Pour les amateurs de sensations fortes. Mayonnaise épicée.", note: "4.5/5" },
            { name: "Blanche", desc: "Douce et crémeuse. Parfaite avec le poulet.", note: "4/5" },
            { name: "Brésil", desc: "Sauce barbecue fumée. Un délice avec les tenders.", note: "4.5/5" },
            { name: "Mayo", desc: "La classique indémodable.", note: "3.5/5" },
            { name: "Ketchup", desc: "Incontournable pour les puristes.", note: "3/5" },
            { name: "Moutarde", desc: "Piquante et relevée, idéale avec le pastrami.", note: "3.5/5" },
            { name: "Chili", desc: "Fort et fruité. Pour les courageux.", note: "4/5" },
            { name: "Thai", desc: "Douce-amère, exotique et surprenante.", note: "4/5" },
          ].map((s) => (
            <div key={s.name} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">{s.name}</h3>
                <span className="text-yellow-400 text-sm">{s.note}</span>
              </div>
              <p className="text-sm text-white/60">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/60 mb-6">
          Envie de tout maîtriser ?{' '}
          <Link href="/blog" className="text-brand-red underline">
            Lire notre guide complet pour composer son sandwich →
          </Link>
        </p>
        <div className="text-center">
          <Link href="/#menu" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold shadow-lg hover:scale-105 transition-all">Je veux goûter →</Link>
        </div>
      </div>
    </div>
  );
}