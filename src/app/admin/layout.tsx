import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/admin",
  title: "Administration | FAIS TON S'DALLE",
  description:
    "Espace d'administration interne de FAIS TON S'DALLE : commandes, stocks, promos et statistiques.",
  index: false,
  nofollow: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
