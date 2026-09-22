// ─── Données structurées du menu (schema.org Menu) ─────────────
//
// Construit à partir de la seule source de vérité (src/data/menu.ts)
// pour que les prix exposés aux moteurs de recherche et aux assistants
// IA (ChatGPT, Gemini, Perplexity…) soient exactement ceux du site.

import {
  CRUDITES,
  MENU_ITEMS,
  SAUCES,
  SUPPLEMENTS,
  VIANDES,
} from "@/data/menu";

const SECTIONS: { name: string; categories: string[] }[] = [
  { name: "Menus sandwichs", categories: ["menus"] },
  { name: "Bowls", categories: ["bowls"] },
  { name: "Desserts", categories: ["desserts"] },
  { name: "Boissons", categories: ["boissons"] },
];

export function menuJsonLd(siteUrl: string) {
  return {
    "@type": "Menu",
    name: "Carte FAIS TON S'DALLE",
    description:
      `Sandwichs et bowls halal sur mesure. Viandes : ${VIANDES.join(", ")}. ` +
      `Crudités : ${CRUDITES.join(", ")}. Sauces : ${SAUCES.join(", ")}. ` +
      `Suppléments : ${SUPPLEMENTS.join(", ")}.`,
    hasMenuSection: SECTIONS.map((section) => ({
      "@type": "MenuSection",
      name: section.name,
      hasMenuItem: MENU_ITEMS.filter((i) =>
        section.categories.includes(i.category)
      ).map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        image: `${siteUrl}${item.image}`,
        offers: {
          "@type": "Offer",
          price: item.price.toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/#menu`,
        },
      })),
    })),
  };
}
