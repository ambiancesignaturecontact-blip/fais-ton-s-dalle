import type { Metadata } from "next";
import { pageMeta, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";
import { getGoogleRating } from "@/lib/server-settings";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = pageMeta({
  path: "/avis",
  title: "Avis Clients – Sandwich Halal 93320 | FAIS TON S'DALLE",
  description:
    "Les avis Google de nos clients sur nos sandwichs halal sur mesure aux Pavillons-sous-Bois (93320), livrés le soir et la nuit. Consultez-les et commandez.",
  ogTitle: "Avis clients – FAIS TON S'DALLE, sandwich halal 93320",
  ogDescription:
    "Ce que nos clients disent de nos sandwichs sur mesure halal aux Pavillons-sous-Bois.",
  image: "/images/photo-equipe-groupe.webp",
  imageAlt: "L'équipe de FAIS TON S'DALLE, restaurant de sandwichs halal aux Pavillons-sous-Bois",
  keywords: [
    "avis sandwich halal 93320",
    "avis faistonsdalle",
    "meilleur sandwich halal pavillons sous bois",
    "avis fast food halal 93",
    "témoignages sandwich halal",
  ],
});

export default async function AvisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note et avis réels Google (rien n'est inventé)
  const google = await getGoogleRating();

  const restaurant: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE_URL}/#restaurant`,
    name: "FAIS TON S'DALLE",
    url: SITE_URL,
  };
  if (google) {
    restaurant.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: google.rating,
      reviewCount: google.total,
      bestRating: 5,
    };
    if (google.reviews.length > 0) {
      restaurant.review = google.reviews.map((r) => ({
        "@type": "Review",
        datePublished: r.publish_time ?? undefined,
        reviewBody: r.text,
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
        },
        author: { "@type": "Person", name: r.author_name },
      }));
    }
  }

  return (
    <>
      <JsonLd
        items={[
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Avis", path: "/avis" },
          ]),
          restaurant,
        ]}
      />
      {children}
    </>
  );
}
