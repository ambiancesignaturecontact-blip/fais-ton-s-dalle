import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { pageMeta } from "@/lib/seo";

// Version courte de l'article complet publié sur /blog : on y pointe
// le canonical pour éviter tout contenu dupliqué.
export const metadata: Metadata = pageMeta({
  path: "/guides/composer",
  canonicalPath: "/blog",
  title: "Comment Composer son Sandwich ? | FAIS TON S'DALLE",
  description:
    "Guide complet pour composer votre sandwich halal parfait : choix de la formule, 7 viandes, 6 crudités, 9 sauces et suppléments. Toutes nos astuces.",
  ogTitle: "Comment composer son sandwich sur mesure ?",
  ogDescription: "Formule, viandes, crudités, sauces : le guide complet pour un sandwich parfait.",
  image: "/images/menu-gourmand.webp",
  keywords: [
    "composer son sandwich",
    "sandwich sur mesure",
    "guide sandwich halal",
    "viandes sauces crudités sandwich",
  ],
});

export default function GuideComposer() {
  return (
    <div className="min-h-screen bg-[#0d0808] text-white/80 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">← Accueil</Link>
        <h1 className="font-heading text-3xl md:text-5xl tracking-wider text-white mb-4">Comment composer <span className="text-brand-red">votre sandwich</span> sur mesure</h1>
        <section className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="font-heading text-xl text-white mb-3"> Choisissez votre ou vos viandes</h2>
          <p className="text-sm leading-relaxed">7 viandes disponibles : Tenders, Émincé poulet, Blanc dinde, Jambon dinde, Pastrami, Rosette, Thon. Jusqu&apos;à 2 viandes dans les formules Classique et Gourmand.</p>
        </section>
        <section className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="font-heading text-xl text-white mb-3"> Ajoutez vos crudités</h2>
          <p className="text-sm leading-relaxed">6 crudités : Salade, Tomate, Oignons, Maïs, Carottes râpées, Avocat.</p>
        </section>
        <section className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="font-heading text-xl text-white mb-3"> Votre sauce signature</h2>
          <p className="text-sm leading-relaxed">9 sauces : Mayo, Ketchup, Algérienne, Samouraï, Blanche, Moutarde, Brésil, Chili, Thai.</p>
        </section>
        
        {/* Photo milkshake */}
        <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden mb-8 border border-white/10">
          <Image src="/images/photo-milkshake-1.webp" alt="Milkshake personnalisable FAIS TON S'DALLE" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <section className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-brand-red/10 to-brand-orange/10 border border-brand-red/20">
          <h2 className="font-heading text-xl text-white mb-3"> Envie d&apos;un dessert ?</h2>
          <p className="text-sm leading-relaxed">Tiramisu maison 3,00 ou Milkshake 5,00. Ajoutables dans le menu Gourmand.</p>
        </section>
        <div className="text-center mt-10">
          <Link href="/#menu" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold shadow-lg hover:scale-105 transition-all">Composer mon sandwich →</Link>
        </div>
      </div>
    </div>
  );
}