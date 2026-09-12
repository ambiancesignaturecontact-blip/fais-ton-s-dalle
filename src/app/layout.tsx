import type { Metadata, Viewport } from "next";
import { Inter, Anton, Bebas_Neue } from "next/font/google";
import { CartProvider } from "@/hooks/useCart";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/layout/Analytics";
import { DeliveryCountdown } from "@/components/delivery/DeliveryCountdown";
import { UpsellToast } from "@/components/upsell/UpsellToast";
import { StickyCart } from "@/components/cart/StickyCart";
import { Tracker } from "@/components/layout/Tracker";
import { SettingsProvider } from "@/components/SettingsProvider";
import { I18nProvider } from "@/lib/i18n";
import { getGoogleRating, getServerSettings } from "@/lib/server-settings";
import { menuJsonLd } from "@/lib/menu-jsonld";
import { FAQ_ENTRIES, HOURS_QUESTION } from "@/data/faq";
import {
  daysOpenText,
  formatRange,
  fromToSentence,
  mainSlot,
  openingHoursSpecs,
  type RestaurantSettings,
} from "@/lib/hours";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas", display: "swap" });

const siteName = "FAIS TON S'DALLE";
const siteUrl = "https://faistonsdalle.com";
// Description de base (hors horaires dynamiques) utilisée par le
// JSON-LD. Les titres/descriptions de pages passent par src/lib/seo.ts.
const baseDescription =
  "Sandwichs halal sur mesure aux Pavillons-sous-Bois (93320) : 7 viandes, 6 crudités, 9 sauces, préparés à la commande.";
const extendedKeywords = [
  "sandwich halal 93320", "sandwich halal pavillons sous bois", "fast food halal 93",
  "sandwich sur mesure halal", "livraison sandwich halal nuit", "tenders halal",
  "sandwich personnalisable", "sandwich halal livraison 3h", "bowl halal 93",
  "snacking halal seine saint denis", "street food halal 93320",
  "menu pas cher 93320", "sandwich pas cher pavillons sous bois",
  "émincé poulet halal", "sandwich tenders", "restaurant halal 93320",
  "livraison sandwich 23h", "fast food nocturne 93", "manger halal tard",
  "sandwich frais halal", "milkshake halal", "tiramisu maison",
  "sandwich rosette", "sandwich pastrami", "repas halal livraison",
  "meilleur sandwich 93", "sandwich algerienne samourai",
];

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0a0a" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerSettings();
  const range = formatRange(mainSlot(settings.hours));
  // Titre ≤ ~60 car. (les pages filles utilisent title.absolute via
  // pageMeta — pas de template pour ne jamais doubler la marque).
  const title = `${siteName} · Sandwich Halal, Livraison ${range}`;
  const description =
    `Sandwich halal sur mesure aux Pavillons-sous-Bois (93320) : 7 viandes, 6 crudités, 9 sauces. ` +
    `Livraison soir et nuit (${range}), paiement sécurisé.`;
  return {
    metadataBase: new URL(siteUrl),
    // Titre racine : les pages filles passent toutes par pageMeta() qui
    // utilise title.absolute — il n'y a donc pas de template (qui
    // doublonnait la marque).
    title,
    description,
    keywords: [
      ...extendedKeywords,
      "sandwich halal", "livraison sandwich 93320", "fast food halal",
      "sandwich sur mesure", "tenders", "pavillons-sous-bois",
      "livraison nuit", "street food", "snacking halal", "93",
      "livraison 23h", "sandwich nuit", "émincé poulet", "menu pas cher"
    ].filter((v, i, a) => a.indexOf(v) === i),
    authors: [{ name: siteName }], creator: siteName, publisher: siteName,
    formatDetection: { telephone: true },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website", locale: "fr_FR", siteName,
      title,
      description,
      url: siteUrl,
      images: [{ url: "/images/logo.jpg", width: 2048, height: 1365, alt: siteName }],
      countryName: "France",
      phoneNumbers: ["+33672044875"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/logo.jpg"],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.jpg", type: "image/jpeg", sizes: "32x32" }],
      apple: [{ url: "/apple-icon.jpg", sizes: "180x180" }, { url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    },
    manifest: "/manifest.json",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: siteName, startupImage: "/images/logo.jpg" },
    category: "food",
    classification: "Restaurant Halal",
    referrer: "strict-origin-when-cross-origin",
    other: {
      "geo.region": "FR-93",
      "geo.placename": "Les Pavillons-sous-Bois",
      "geo.position": "48.9046;2.5193",
      "ICBM": "48.9046, 2.5193",
    },
  };
}

const PRODUCTS = [
  { name: "Menu Léger — Sandwich sur mesure", description: "Sandwich personnalisable : 7 viandes, 6 crudités, 9 sauces. Préparé à la commande.", price: "6.90", image: "/images/menu-leger.webp" },
  { name: "Menu Classique — Sandwich + boisson", description: "Sandwich sur mesure avec boisson. 7 viandes, 6 crudités, 9 sauces.", price: "7.90", image: "/images/menu-classique.webp" },
  { name: "Menu Gourmand — Sandwich + boisson + dessert", description: "Sandwich sur mesure, boisson et tiramisu maison. 7 viandes, 6 crudités, 9 sauces.", price: "9.90", image: "/images/menu-gourmand.webp" },
  { name: "Menu Royal — Sandwich + boisson + Tiramisu + Milkshake", description: "Menu complet : sandwich sur mesure, boisson, tiramisu maison et milkshake personnalisable.", price: "15.90", image: "/images/menu-royal.webp" },
  { name: "Bowl Halal sur mesure", description: "Bowl composé avec viande, crudités et sauces au choix. Préparé à la commande.", price: "10.90", image: "/images/bowl-legume.webp" },
  { name: "Bowl Gourmand — Bowl + boisson + Tiramisu", description: "Bowl sur mesure avec boisson et tiramisu maison. 7 viandes, 6 crudités, 9 sauces.", price: "13.90", image: "/images/bowl-gourmand.webp" },
  { name: "Bowl Royal — Bowl + boisson + Tiramisu + Milkshake", description: "Bowl sur mesure, boisson, tiramisu maison et milkshake. 7 viandes, 6 crudités, 9 sauces.", price: "18.90", image: "/images/bowl-royal.webp" },
  { name: "Milkshake personnalisable halal", description: "Milkshake au choix : Kinder Bueno, Snickers, Oreo, KitKat, Milka. Préparé à la commande.", price: "5.00", image: "/images/milkshake.webp" },
];

function buildJsonLd(
  settings: RestaurantSettings,
  google: import("@/lib/server-settings").GoogleRating | null
) {
  const range = formatRange(mainSlot(settings.hours));
  const description = `${baseDescription} Livraison ${range}.`;
  const deliveryAnswer = `Nous livrons ${fromToSentence(
    mainSlot(settings.hours)
  )}, ${daysOpenText(settings.hours, true)}, dans tout le 93 (Seine-Saint-Denis).`;

  const restaurant: Record<string, unknown> = {
    "@type": "Restaurant",
    "@id": `${siteUrl}/#restaurant`,
    name: siteName,
    description,
    url: siteUrl,
    telephone: "+33672044875",
    servesCuisine: ["Halal", "Sandwich", "Street Food", "Fast Food", "French"],
    priceRange: "€",
    image: `${siteUrl}/images/logo.jpg`,
    logo: { "@type": "ImageObject", url: `${siteUrl}/images/logo.jpg` },
    currenciesAccepted: "EUR",
    paymentAccepted: "Carte bancaire, espèces",
    address: {
      "@type": "PostalAddress",
      streetAddress: "134 Allée du Colonel Fabien",
      addressLocality: "Les Pavillons-sous-Bois",
      postalCode: "93320",
      addressCountry: "FR",
    },
    geo: { "@type": "GeoCoordinates", latitude: 48.9046, longitude: 2.5193 },
    hasMap:
      "https://www.google.com/maps/dir/?api=1&destination=134+Allee+du+Colonel+Fabien,+93320+Les+Pavillons-sous-Bois",
    sameAs: [
      "https://wa.me/33672044875",
      // Fiche Google Maps (recherche géolocalisée stable)
      "https://www.google.com/maps/search/?api=1&query=FAIS%20TON%20S%27DALLE%20134%20All%C3%A9e%20du%20Colonel%20Fabien%2093320",
      ...(google?.mapsUrl ? [google.mapsUrl] : []),
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+33672044875",
      contactType: "customer service",
      availableLanguage: ["French"],
    },
    openingHoursSpecification: openingHoursSpecs(settings.hours),
    menu: `${siteUrl}/#menu`,
    hasMenu: menuJsonLd(siteUrl),
    acceptsReservations: false,
    // Commande en ligne (WhatsApp)
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://wa.me/33672044875?text=Bonjour%2C%20je%20souhaite%20passer%20commande",
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      priceSpecification: {
        "@type": "DeliveryChargeSpecification",
        appliesToDeliveryMethod:
          "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
        priceCurrency: "EUR",
        price: "2.90",
      },
    },
  };

  // Note et avis : uniquement les VRAIES données Google mises en cache
  // (aucune note inventée — interdit par les consignes de Google).
  if (google) {
    restaurant.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: google.rating,
      reviewCount: google.total,
      bestRating: 5,
      worstRating: 1,
    };
    if (google.reviews.length > 0) {
      restaurant.review = google.reviews.map((r) => ({
        "@type": "Review",
        datePublished: r.publish_time ?? undefined,
        reviewBody: r.text,
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        author: { "@type": "Person", name: r.author_name },
      }));
    }
  }

  const products = PRODUCTS.map((p) => ({
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: `${siteUrl}${p.image}`,
    brand: { "@type": "Brand", name: siteName },
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/#menu`,
      seller: { "@id": `${siteUrl}/#restaurant` },
    },
  }));

  const website = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    inLanguage: "fr-FR",
    publisher: { "@id": `${siteUrl}/#restaurant` },
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Menu", item: `${siteUrl}/#menu` },
      { "@type": "ListItem", position: 3, name: "Avis", item: `${siteUrl}/avis` },
      { "@type": "ListItem", position: 4, name: "Contact", item: `${siteUrl}/contact` },
    ],
  };

  const faq = {
    "@type": "FAQPage",
    name: `FAQ - ${siteName}`,
    description:
      "Questions fréquentes sur les sandwichs halal sur mesure aux Pavillons-sous-Bois",
    mainEntity: [
      {
        "@type": "Question",
        name: HOURS_QUESTION,
        acceptedAnswer: { "@type": "Answer", text: deliveryAnswer },
      },
      ...FAQ_ENTRIES.map((e) => ({
        "@type": "Question",
        name: e.q,
        acceptedAnswer: { "@type": "Answer", text: e.a },
      })),
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [restaurant, website, ...products, breadcrumb, faq],
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, googleRating] = await Promise.all([
    getServerSettings(),
    getGoogleRating(),
  ]);
  const jsonLd = buildJsonLd(settings, googleRating);
  return (
    <html lang="fr-FR" className={`${inter.variable} ${anton.variable} ${bebas.variable}`} suppressHydrationWarning>
      <head>
        {/* next/font/google gère le préchargement des polices automatiquement */}
        <link rel="preload" href="/images/photo-interieur-2.webp" as="image" />
        <link rel="preload" href="/images/logo.webp" as="image" />
        <link rel="preload" href="/images/photo-sandwich-1.webp" as="image" />
        <link rel="preload" href="/images/menu-gourmand.webp" as="image" />
        <meta name="google-site-verification" content="VOTRE_CODE_ICI" />
        <meta name="google" content="nositelinkssearchbox" />
        <meta name="rating" content="general" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Script id="sw-manager" strategy="afterInteractive">
          {`(function(){if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(reg){reg.unregister()});});navigator.serviceWorker.register('/sw.js').then(function(reg){if(reg.installing){reg.installing.addEventListener('statechange',function(){if(this.state==='installed'){window.location.reload()}})}reg.addEventListener('updatefound',function(){var n=reg.installing;n.addEventListener('statechange',function(){if(this.state==='installed'&&navigator.serviceWorker.controller){window.location.reload()}})})});var r;navigator.serviceWorker.addEventListener('controllerchange',function(){if(r)return;r=true;window.location.reload()})}})()`}
        </Script>
        <I18nProvider>
        <SettingsProvider>
        <CartProvider>
          <Tracker />
          {children}
          <Analytics />
          <DeliveryCountdown />
          <UpsellToast />
          <StickyCart />
          <Toaster position="top-center" richColors closeButton duration={3000} />
        </CartProvider>
        </SettingsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
