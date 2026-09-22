import type { Metadata } from "next";
import Link from "next/link";
import { FromToText, DaysOpenText } from "@/components/hours/HoursText";
import { pageMeta, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = pageMeta({
  path: "/engagement",
  title: "Engagement Qualité & Viande Halal | FAIS TON S'DALLE",
  description:
    "Notre engagement : viandes 100% halal certifiées, produits frais, sandwichs préparés à la commande et livraison rapide dans le 93. Qualité garantie.",
  ogTitle: "Engagement qualité – FAIS TON S'DALLE, sandwich halal 93320",
  ogDescription:
    "100% halal certifié, viandes fraîches, préparation à la commande : découvrez nos engagements.",
  image: "/images/bowl-gourmand.webp",
  imageAlt: "Bowl gourmand halal aux ingrédients frais chez FAIS TON S'DALLE",
  keywords: [
    "viande halal certifiée",
    "sandwich halal qualité",
    "produits frais sandwich",
    "engagement halal 93",
  ],
});

export default function EngagementPage() {
  return (
    <div className="min-h-screen bg-[#0d0808] text-white/80 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">← Accueil</Link>
        <JsonLd data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Engagement qualité", path: "/engagement" },
        ])} />

        <h1 className="font-heading text-3xl md:text-5xl tracking-wider text-white mb-6">
          Notre <span className="text-brand-red">engagement</span>
        </h1>

        <div className="space-y-6 text-sm md:text-base leading-relaxed">
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🕌</span>
              <h2 className="font-heading text-xl text-white">100% Halal certifié</h2>
            </div>
            <p>Toutes nos viandes sont certifiées halal. Nous travaillons avec des fournisseurs sélectionnés pour leur traçabilité et leur respect des normes. Chaque pièce de viande est traçable de l&apos;abattoir jusqu&apos;à votre assiette.</p>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🥩</span>
              <h2 className="font-heading text-xl text-white">Viandes fraîches, jamais surgelées</h2>
            </div>
            <p>Nos tenders, émincés de poulet, pastrami et autres viandes sont livrés frais chaque matin. Rien n&apos;est congelé, rien n&apos;est réchauffé. Chaque sandwich est préparé au moment de la commande.</p>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🥗</span>
              <h2 className="font-heading text-xl text-white">Légumes frais du jour</h2>
            </div>
            <p>Salade croquante, tomates mûries à point, oignons frais, avocat crémeux — nos crudités sont préparées chaque matin. Pas de conservateurs, pas d&apos;additifs.</p>
          </section>

          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">👨‍🍳</span>
              <h2 className="font-heading text-xl text-white">Préparé à la commande</h2>
            </div>
            <p>Quand tu passes commande, on prépare. Pas d&apos;avance, pas de réchauffe. Ton sandwich est assemblé devant toi (ou en cuisine si livraison), avec les ingrédients que tu as choisis. Ça prend 5 min, et c&apos;est chaud.</p>
          </section>

          <section className="p-6 rounded-2xl bg-gradient-to-r from-brand-red/10 to-brand-orange/10 border border-brand-red/20">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🌙</span>
              <h2 className="font-heading text-xl text-white">Livraison nocturne premium</h2>
            </div>
            <p>On livre <FromToText />, <DaysOpenText />, dans tout le 93. Nos livreurs sont formés pour un service rapide et courtois. Ta commande est livrée en moyenne en 30 min.</p>
          </section>
        </div>

        <div className="text-center mt-10">
          <Link href="/#menu" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold shadow-lg hover:scale-105 transition-all">
            Commander maintenant →
          </Link>
        </div>
      </div>
    </div>
  );
}
