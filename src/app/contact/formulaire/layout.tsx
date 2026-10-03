import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/contact/formulaire",
  title: "Formulaire de Contact | FAIS TON S'DALLE",
  description:
    "Formulaire de contact pour joindre l'équipe de FAIS TON S'DALLE, sandwichs halal sur mesure aux Pavillons-sous-Bois (93320).",
  index: false,
});

export default function FormulaireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
