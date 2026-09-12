import type { MetadataRoute } from "next";

const baseUrl = "https://faistonsdalle.com";

// Images à indexer dans Google Images
const IMAGES = [
  { url: "/images/photo-devanture.webp", title: "Devanture FAIS TON S'DALLE" },
  { url: "/images/photo-interieur-1.webp", title: "Intérieur du restaurant FAIS TON S'DALLE" },
  { url: "/images/photo-cuisine-1.webp", title: "Cuisine FAIS TON S'DALLE" },
  { url: "/images/photo-sandwich-1.webp", title: "Sandwich sur mesure halal" },
  { url: "/images/photo-sandwich-2.webp", title: "Menu Gourmand FAIS TON S'DALLE" },
  { url: "/images/photo-preparation-1.webp", title: "Préparation sandwich halal" },
  { url: "/images/photo-equipe-1.webp", title: "Équipe FAIS TON S'DALLE" },
  { url: "/images/photo-equipe-groupe.webp", title: "L'équipe FAIS TON S'DALLE au complet" },
  { url: "/images/photo-terrasse.webp", title: "Terrasse FAIS TON S'DALLE" },
  { url: "/images/photo-sandwich-3.webp", title: "Sandwich signature FAIS TON S'DALLE" },
  { url: "/images/photo-milkshake-1.webp", title: "Milkshake personnalisable FAIS TON S'DALLE" },
  { url: "/images/logo.jpg", title: "Logo FAIS TON S'DALLE" },
  { url: "/images/menu-gourmand.webp", title: "Menu Gourmand sandwich halal" },
  { url: "/images/menu-classique.webp", title: "Menu Classique sandwich" },
  { url: "/images/menu-leger.webp", title: "Menu Léger sandwich" },
  { url: "/images/bowl-legume.webp", title: "Bowl Léger FAIS TON S'DALLE" },
  { url: "/images/bowl-poulet.webp", title: "Bowl Classique et Gourmand FAIS TON S'DALLE" },
  { url: "/images/tiramisu.webp", title: "Tiramisu maison halal" },
  { url: "/images/milkshake.webp", title: "Milkshake personnalisable" },
];

// Le sitemap ne liste QUE les pages indexables et canoniques.
// Les pages privées (/compte, /connexion, /success, /echec, /suivi,
// /email-confirme, /contact/formulaire) sont en noindex : on les exclut,
// et /admin + /api sont interdits dans robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      images: IMAGES.map((img) => `${baseUrl}${img.url}`),
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date("2026-07-21"),
      changeFrequency: "monthly",
      priority: 0.8,
      images: [`${baseUrl}/images/photo-sandwich-2.webp`],
    },
    {
      url: `${baseUrl}/guides/sauces`,
      lastModified: new Date("2026-07-21"),
      changeFrequency: "monthly",
      priority: 0.7,
      images: [`${baseUrl}/images/photo-sandwich-1.webp`],
    },
    {
      url: `${baseUrl}/histoire`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
      images: [
        `${baseUrl}/images/photo-equipe-1.webp`,
        `${baseUrl}/images/photo-equipe-2.webp`,
        `${baseUrl}/images/photo-interieur-1.webp`,
        `${baseUrl}/images/photo-preparation-1.webp`,
      ],
    },
    {
      url: `${baseUrl}/avis`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
      images: [
        `${baseUrl}/images/photo-equipe-groupe.webp`,
        `${baseUrl}/images/photo-sandwich-3.webp`,
      ],
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      images: [
        `${baseUrl}/images/photo-devanture.webp`,
        `${baseUrl}/images/photo-terrasse.webp`,
      ],
    },
    {
      url: `${baseUrl}/engagement`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      images: [`${baseUrl}/images/photo-cuisine-1.webp`],
    },
    {
      url: `${baseUrl}/hors-zone`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cgv`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/confidentialite`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
