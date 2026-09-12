import Link from "next/link";
import { XCircle, MessageCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/echec",
  title: "Paiement Échoué | FAIS TON S'DALLE",
  description:
    "Le paiement n'a pas abouti. Réessayez ou commandez directement par WhatsApp au 06 72 04 48 75 — livraison de sandwichs halal dans le 93.",
  index: false,
});

export default function EchecPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] p-4">
      <div className="text-center max-w-md w-full">
        {/* Icone */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-6 mx-auto">
          <XCircle className="h-12 w-12 text-red-400" />
        </div>

        <h1 className="font-heading text-3xl tracking-wider text-white mb-3">
          Paiement <span className="text-brand-red">échoué</span>
        </h1>
        <p className="text-white/70 text-sm mb-2">
          Oups ! La transaction n&apos;a pas pu aboutir.
        </p>
        <p className="text-white/50 text-xs mb-8 max-w-sm mx-auto">
          Pas d&apos;inquiétude — votre panier est toujours là. Vous pouvez réessayer ou
          nous contacter directement sur WhatsApp pour passer commande.
        </p>

        {/* Boutons */}
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/#menu"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold text-sm shadow-lg shadow-brand-red/20 hover:scale-105 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Link>

          <a
            href="https://wa.me/33672044875"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:scale-105 transition-all duration-200"
          >
            <MessageCircle className="h-4 w-4" />
            Commander sur WhatsApp
          </a>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-white/50 hover:text-white/80 text-xs transition-colors mt-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à l&apos;accueil
          </Link>
        </div>

        {/* Contact info */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-white/40 text-[10px]">
            Un probleme ? Appelle ou ecris au{" "}
            <a
              href="tel:+33672044875"
              className="text-brand-red font-bold hover:underline"
            >
              06 72 04 48 75
            </a>
          </p>
          <p className="text-white/30 text-[9px] mt-1">
            FAIS TON S&apos;DALLE — 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois
          </p>
        </div>
      </div>
    </div>
  );
}
