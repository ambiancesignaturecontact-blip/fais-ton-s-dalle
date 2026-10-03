import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/email-confirme",
  title: "Confirmation d'Email | FAIS TON S'DALLE",
  description:
    "Confirmez votre adresse email pour activer votre compte FAIS TON S'DALLE et commander en ligne.",
  index: false,
  nofollow: true,
});

export default function EmailConfirmeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
