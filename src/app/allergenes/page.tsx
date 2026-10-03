import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Phone, AlertTriangle } from "lucide-react";
import { pageMeta, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  ALLERGENES_OFFICIELS, EMOJI_ALLERGENE, ALLERGENES_INGREDIENT,
  allergenesDe, MENTION_TRACES, MENTION_LEGALE,
} from "@/data/allergenes";

export const metadata: Metadata = pageMeta({
  path: "/allergenes",
  title: "Allergènes | FAIS TON S'DALLE — Sandwichs halal 93",
  description:
    "Liste des allergènes ingrédient par ingrédient : pain, viandes, crudités, sauces, suppléments, desserts. Information obligatoire (règlement UE 1169/2011).",
  ogTitle: "Allergènes — FAIS TON S'DALLE",
  ogDescription:
    "Gluten, œufs, lait, poissons, fruits à coque… le détail de chaque ingrédient avant de composer votre sandwich.",
  keywords: [
    "allergènes sandwich halal",
    "sans gluten pavillons sous bois",
    "information allergènes fast food 93",
  ],
});

const FAMILLES: { titre: string; items: string[] }[] = [
  { titre: "Pain", items: ["Pain"] },
  { titre: "Viandes", items: ["Tenders", "Émincé poulet", "Blanc dinde", "Jambon dinde", "Pastrami", "Rosette", "Thon"] },
  { titre: "Crudités", items: ["Salade", "Tomate", "Oignons", "Mais", "Carottes râpées", "Avocat"] },
  { titre: "Sauces", items: ["Mayo", "Ketchup", "Algérienne", "Samouraï", "Blanche", "Moutarde", "Brésil", "Chili", "Thaï"] },
  { titre: "Suppléments", items: ["Cheddar", "Mozzarella", "Feta"] },
  { titre: "Desserts", items: ["Tiramisu", "Caramel spéculoos", "Chocolat", "Oreo"] },
  { titre: "Milkshakes", items: ["Milkshake", "Kinder Bueno", "Kinder Bueno White", "Snickers", "KitKat", "KitKat White", "Milka", "Coulis chocolat", "Coulis caramel", "Chantilly"] },
];

export default function AllergenesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <JsonLd data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Allergènes", path: "/allergenes" },
        ])} />

        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/80">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à l&apos;accueil
        </Link>

        <h1 className="font-heading text-3xl tracking-wider text-white">Allergènes</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Vous composez vous-même votre sandwich : les allergènes dépendent
          donc de vos choix. Voici le détail, ingrédient par ingrédient.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {ALLERGENES_OFFICIELS.map((a) => (
            <span key={a}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
              {EMOJI_ALLERGENE[a]} {a}
            </span>
          ))}
        </div>

        {FAMILLES.map((f) => (
          <section key={f.titre} className="mt-8">
            <h2 className="mb-3 font-heading text-lg tracking-wider text-white">{f.titre}</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {f.items.map((ing, i) => {
                const liste = allergenesDe(ing);
                return (
                  <div key={ing}
                    className={`flex items-center justify-between gap-4 px-4 py-3 ${i > 0 ? "border-t border-white/5" : ""} ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                    <span className="text-sm font-semibold text-white">{ing}</span>
                    <span className={`text-right text-[12px] ${liste.length ? "text-white/60" : "text-emerald-400"}`}>
                      {liste.length
                        ? liste.map((a) => `${EMOJI_ALLERGENE[a]} ${a}`).join(" · ")
                        : "Aucun"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="mt-10 space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-amber-200/90">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {MENTION_TRACES}
          </p>
          <p className="text-[12px] leading-relaxed text-white/50">{MENTION_LEGALE}</p>
          <p className="text-[11px] text-white/40">
            {Object.keys(ALLERGENES_INGREDIENT).length} ingrédients référencés.
          </p>
        </div>

        <a href="tel:+33672044875"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-red to-red-700 px-6 py-3.5 text-sm font-bold text-white sm:w-auto">
          <Phone className="h-4 w-4" /> Appeler avant de commander
        </a>
      </div>
    </div>
  );
}
