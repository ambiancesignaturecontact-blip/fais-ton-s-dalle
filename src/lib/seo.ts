// ─── Fabrique de métadonnées SEO commune à toutes les pages ─────
//
// Pourquoi ce helper :
//  1. `title.absolute` → le titre n'est plus re-suffixé par le
//     template du layout racine (qui doublonnait « … | FTSD | FTSD »).
//  2. chaque page fournit sa PROPRE URL canonique — avant, toutes
//     héritaient du canonical « / » de l'accueil.
//  3. Open Graph + Twitter Card complets partout (les guides
//     n'exportaient que og:title et og:description, sans image).
//
// Bonnes pratiques appliquées : titre ≤ ~60 caractères, description
// unique de 120–160 caractères, pages privées en noindex.

import type { Metadata } from "next";

export const SITE_NAME = "FAIS TON S'DALLE";
export const SITE_URL = "https://faistonsdalle.com";
export const DEFAULT_OG_IMAGE = "/images/logo.jpg";
export const DEFAULT_OG_IMAGE_ALT =
  "FAIS TON S'DALLE — sandwichs sur mesure halal aux Pavillons-sous-Bois (93320)";

const BASE_KEYWORDS = [
  "sandwich halal",
  "FAIS TON S'DALLE",
  "pavillons-sous-bois",
  "93320",
];

export type PageSeoOptions = {
  /** Chemin de la page, ex. "/contact" (servi au canonique et à og:url) */
  path: string;
  /** Titre complet et définitif, ≤ ~60 caractères */
  title: string;
  /** Description unique, idéalement 140–160 caractères */
  description: string;
  /** Titre Open Graph spécifique (sinon titre de la page) */
  ogTitle?: string;
  /** Description Open Graph spécifique (sinon description) */
  ogDescription?: string;
  /** Image OG/Twitter (chemin absoluit depuis /public) */
  image?: string;
  /** Description alternative de l'image OG */
  imageAlt?: string;
  /** URL canonique si elle diffère de `path` (ex. doublon d'article) */
  canonicalPath?: string;
  /** true = page indexée (défaut), false = noindex,follow */
  index?: boolean;
  /** noindex ET nofollow (admin…) */
  nofollow?: boolean;
  keywords?: string[];
  type?: "website" | "article";
  /** Pour les articles : date de publication */
  publishedTime?: string;
};

export function pageMeta(o: PageSeoOptions): Metadata {
  const index = o.index ?? true;
  const url = `${SITE_URL}${(o.canonicalPath ?? o.path) === "/" ? "" : (o.canonicalPath ?? o.path)}`;
  const image = o.image ?? DEFAULT_OG_IMAGE;

  return {
    title: { absolute: o.title },
    description: o.description,
    alternates: { canonical: url },
    keywords: [...new Set([...(o.keywords ?? []), ...BASE_KEYWORDS])],
    robots: {
      index,
      follow: !o.nofollow,
      googleBot: {
        index,
        follow: !o.nofollow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: o.type ?? "website",
      url,
      siteName: SITE_NAME,
      locale: "fr_FR",
      title: o.ogTitle ?? o.title,
      description: o.ogDescription ?? o.description,
      // Pas de dimensions déclarées : les images de pages n'ont pas
      // toutes le même ratio que le logo (dimensions non obligatoires).
      images: [{ url: image, alt: o.imageAlt ?? DEFAULT_OG_IMAGE_ALT }],
      ...(o.publishedTime ? { publishedTime: o.publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: o.ogTitle ?? o.title,
      description: o.ogDescription ?? o.description,
      images: [image],
    },
  };
}

// ─── JSON-LD ────────────────────────────────────────────────────

type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path === "/" ? "" : c.path}`,
    })),
  };
}

export function articleJsonLd(o: {
  headline: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: o.headline,
    description: o.description,
    inLanguage: "fr-FR",
    url: `${SITE_URL}${o.path}`,
    image: `${SITE_URL}${o.image ?? DEFAULT_OG_IMAGE}`,
    datePublished: o.datePublished ?? "2026-01-01T00:00:00+01:00",
    dateModified: o.dateModified ?? new Date().toISOString(),
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${o.path}`,
    },
  };
}
