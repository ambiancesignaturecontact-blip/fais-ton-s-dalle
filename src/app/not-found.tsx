import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable (404) | FAIS TON S'DALLE",
  description: "La page que vous cherchez n'existe pas. Retournez à l'accueil pour commander vos sandwichs halal sur mesure aux Pavillons-sous-Bois 93320.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0808] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-heading text-brand-red mb-4 drop-shadow-[0_0_30px_rgba(212,61,43,0.3)]">404</div>
        <h1 className="font-heading text-2xl tracking-wider text-white mb-2">Page introuvable</h1>
        <p className="text-white/50 text-sm mb-8 max-w-sm">
          On a cherché partout dans la cuisine, mais on n&apos;a pas trouvé cette page.
        </p>
        <Link href="/"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
