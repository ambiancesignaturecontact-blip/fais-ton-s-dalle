import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/suivi",
  title: "Suivi de Commande | FAIS TON S'DALLE",
  description:
    "Suivez votre commande FAIS TON S'DALLE en temps réel : reçue, en préparation, en livraison ou livrée dans le 93.",
  // Page personnelle (identifiant de commande) : pas d'indexation
  index: false,
});

export default function SuiviLayout({ children }: { children: React.ReactNode }) {
  return children;
}
