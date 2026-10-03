import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/success",
  title: "Commande Confirmée | FAIS TON S'DALLE",
  description:
    "Votre commande de sandwichs halal est confirmée. Suivez sa préparation et sa livraison en temps réel.",
  index: false,
});

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
