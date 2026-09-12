import type { Metadata } from "next";
import { pageMeta, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";
import { getServerSettings } from "@/lib/server-settings";
import { openingHoursSpecs } from "@/lib/hours";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = pageMeta({
  path: "/contact",
  title: "Contact & Horaires | FAIS TON S'DALLE (93320)",
  description:
    "Contactez FAIS TON S'DALLE : 06 72 04 48 75 ou WhatsApp, 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois. Horaires et commande en ligne.",
  ogTitle: "Contact – FAIS TON S'DALLE, Pavillons-sous-Bois 93320",
  ogDescription:
    "Téléphone, WhatsApp, adresse et horaires : contactez FAIS TON S'DALLE pour vos sandwichs halal sur mesure.",
  image: "/images/photo-terrasse.webp",
  imageAlt: "Devanture et terrasse de FAIS TON S'DALLE aux Pavillons-sous-Bois (93320)",
  keywords: [
    "contact faistonsdalle",
    "téléphone sandwich halal 93320",
    "adresse pavillons sous bois sandwich",
    "contacter fast food halal 93",
    "horaires sandwich halal pavillons sous bois",
  ],
});

export default async function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getServerSettings();

  // Fiche contact avec les horaires dynamiques (ceux pilotés depuis l'app)
  const restaurant = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE_URL}/#restaurant`,
    name: "FAIS TON S'DALLE",
    url: `${SITE_URL}/contact`,
    telephone: "+33672044875",
    email: "contact@faistonsdalle.com",
    image: `${SITE_URL}/images/photo-terrasse.webp`,
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
    openingHoursSpecification: openingHoursSpecs(settings.hours),
    sameAs: ["https://wa.me/33672044875"],
  };

  return (
    <>
      <JsonLd
        items={[
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          restaurant,
        ]}
      />
      {children}
    </>
  );
}
