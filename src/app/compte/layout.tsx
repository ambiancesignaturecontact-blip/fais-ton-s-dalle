import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/compte",
  title: "Mon Compte | FAIS TON S'DALLE",
  description:
    "Accédez à votre compte FAIS TON S'DALLE : fidélité, parrainage et historique de vos commandes de sandwichs halal.",
  index: false,
});

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
