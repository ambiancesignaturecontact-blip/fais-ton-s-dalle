import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/connexion",
  title: "Connexion | FAIS TON S'DALLE",
  description:
    "Connectez-vous ou créez votre compte FAIS TON S'DALLE pour commander vos sandwichs halal et profiter de la fidélité.",
  index: false,
});

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
