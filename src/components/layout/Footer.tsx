import Link from "next/link";
import { HoursSummary } from "@/components/hours/HoursText";

export function Footer() {
  return (
    <footer className="bg-[#0d0808] text-white/80 border-t-2 border-brand-red/20" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-heading text-sm tracking-wider text-white mb-4">FAIS TON S&apos;DALLE</h4>
            <p className="text-xs text-white/60 font-medium">Sandwichs Halal · <HoursSummary /></p>
          </div>
          <div>
            <h4 className="font-heading text-sm tracking-wider text-white mb-4">Contact</h4>
            <address className="not-italic text-xs text-white/70 space-y-1 font-medium">
              <a href="tel:+33672044875" className="block hover:text-brand-red transition-colors" aria-label="Appeler le 06 72 04 48 75">
                📞 06 72 04 48 75
              </a>
              <p>134 Allée du Colonel Fabien</p>
              <p>93320 Les Pavillons-sous-Bois</p>
            </address>
          </div>
          <div>
            <h4 className="font-heading text-sm tracking-wider text-white mb-4">Liens</h4>
            <nav aria-label="Liens du pied de page" className="text-xs text-white/70 space-y-1 font-medium">
              <Link href="/" className="block hover:text-brand-red transition-colors">Accueil</Link>
              <Link href="/#menu" className="block hover:text-brand-red transition-colors">Menu</Link>
              <Link href="/#ap" className="block hover:text-brand-red transition-colors">Infos</Link>
              <Link href="/contact" className="block hover:text-brand-red transition-colors">Contact</Link>
              <Link href="/avis" className="block hover:text-brand-red transition-colors">Avis clients</Link>
              <Link href="/blog" className="block hover:text-brand-red transition-colors">Blog</Link>
              <Link href="/histoire" className="block hover:text-brand-red transition-colors">Notre Histoire</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-heading text-sm tracking-wider text-white mb-4">Infos</h4>
            <nav aria-label="Informations légales" className="text-xs text-white/70 space-y-1 font-medium">
              <Link href="/mentions-legales" className="block hover:text-brand-red transition-colors">Mentions légales</Link>
              <Link href="/cgv" className="block hover:text-brand-red transition-colors">CGV</Link>
              <Link href="/confidentialite" className="block hover:text-brand-red transition-colors">Confidentialité</Link>
              <Link href="/engagement" className="block hover:text-brand-red transition-colors">Engagement qualité</Link>
            </nav>
          </div>
        </div>
        <div className="text-center text-xs text-white/50 mt-10 pt-6 border-t border-brand-red/10 font-medium">
          <p>&copy; {new Date().getFullYear()} FAIS TON S&apos;DALLE — Sandwichs sur mesure Halal | Les Pavillons-sous-Bois 93320</p>
        </div>
      </div>
    </footer>
  );
}
