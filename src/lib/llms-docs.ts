// ─── Documents llms.txt et llms-full.txt ────────────────────────
//
// Standard proposé sur https://llmstxt.org : un fichier Markdown à la
// racine du site qui donne aux assistants IA (ChatGPT, Claude, Gemini,
// Perplexity…) un contexte fiable et structuré sur l'établissement.
//
// Le contenu est généré à la volée (routes /llms.txt et /llms-full.txt)
// pour rester synchronisé avec les horaires pilotés depuis l'app et
// avec les prix réels de la carte (src/data/menu.ts).

import {
  CRUDITES,
  DESSERT_OPTIONS,
  DRINK_OPTIONS,
  MENU_ITEMS,
  MILKSHAKE_CHOIX,
  SAUCES,
  SUPPLEMENTS,
  TIRAMISU_PARFUMS,
  VIANDES,
} from "@/data/menu";
import { DELIVERY_CITY_NAMES } from "@/data/delivery";
import { FAQ_ENTRIES, HOURS_QUESTION } from "@/data/faq";
import {
  daysOpenText,
  formatRange,
  fromToSentence,
  groupHours,
  longDaysLabel,
  mainSlot,
  summarizeHours,
  type RestaurantSettings,
} from "@/lib/hours";

export const BUSINESS = {
  name: "FAIS TON S'DALLE",
  tagline:
    "Sandwichs et bowls halal sur mesure aux Pavillons-sous-Bois (93320), livrés le soir et la nuit en Seine-Saint-Denis.",
  url: "https://faistonsdalle.com",
  phone: "06 72 04 48 75",
  phoneHref: "+33672044875",
  whatsapp: "https://wa.me/33672044875",
  email: "contact@faistonsdalle.com",
  street: "134 Allée du Colonel Fabien",
  city: "93320 Les Pavillons-sous-Bois",
  country: "France",
  deliveryFee: "2,90 €",
  prepMinutes: "20 à 30 minutes en moyenne",
};

function euros(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

function weeklyHoursBlock(s: RestaurantSettings): string {
  return groupHours(s.hours)
    .map((g) => {
      const label = longDaysLabel(g.days);
      return `- **${label}** : ${g.slot ? `${g.slot.open.replace(":", "h")}–${g.slot.close.replace(":", "h")}` : "fermé"}`;
    })
    .join("\n");
}

function menuBlock(): string {
  const lines: string[] = [];
  const sections: { title: string; cats: string[] }[] = [
    { title: "Menus sandwichs", cats: ["menus"] },
    { title: "Bowls", cats: ["bowls"] },
    { title: "Desserts", cats: ["desserts"] },
    { title: "Boissons", cats: ["boissons"] },
  ];
  for (const section of sections) {
    lines.push(`### ${section.title}`);
    for (const item of MENU_ITEMS.filter((i) =>
      section.cats.includes(i.category)
    )) {
      lines.push(
        `- **${item.name}** — ${euros(item.price)}${
          item.description ? ` : ${item.description}` : ""
        }`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

/** Fichier court : présentation + liens essentiels (spécification llms.txt) */
export function buildLlmsTxt(s: RestaurantSettings): string {
  const b = BUSINESS;
  return `# ${b.name}

> ${b.tagline} Horaires de livraison : ${summarizeHours(s.hours)}. Commande en ligne, WhatsApp et retrait sur place.

## Fiche établissement

- **Nom** : ${b.name}
- **Adresse** : ${b.street}, ${b.city}, ${b.country}
- **Téléphone / WhatsApp** : ${b.phone} (${b.whatsapp})
- **Email** : ${b.email}
- **Horaires** : ${summarizeHours(s.hours)} — livraison ${fromToSentence(
    mainSlot(s.hours)
  )}, ${daysOpenText(s.hours, true)}
- **Frais de livraison** : ${b.deliveryFee} (minimum 15 € / 18 € / 22 € selon la zone)
- **Délai moyen** : ${b.prepMinutes}
- **Paiements** : carte bancaire en ligne (Stripe), paiement à la livraison, espèces ; viande 100 % halal certifiée
- **Délai de préparation** : ${s.prep_minutes} minutes

## Liens

- [Accueil et commande en ligne](${b.url}/) : menu complet, panier et paiement
- [Contact et horaires détaillés](${b.url}/contact) : adresse, téléphone, horaires jour par jour
- [Avis clients Google](${b.url}/avis) : notes et avis vérifiés
- [Zone de livraison](${b.url}/hors-zone) : villes livrées dans le 93
- [Blog : comment composer son sandwich](${b.url}/blog)
- [Guide des sauces](${b.url}/guides/sauces)
- [Notre histoire](${b.url}/histoire)
- [Engagement qualité](${b.url}/engagement)
- [CGV](${b.url}/cgv), [Mentions légales](${b.url}/mentions-legales), [Confidentialité](${b.url}/confidentialite)

## Documentation complète

- [Fiche complète pour les assistants IA](${b.url}/llms-full.txt) : carte détaillée, composition des sandwichs, zones de livraison, questions fréquentes
`;
}

/** Fichier long : toutes les informations factuelles, en texte clair */
export function buildLlmsFullTxt(s: RestaurantSettings): string {
  const b = BUSINESS;
  const faq = [
    {
      q: HOURS_QUESTION,
      a: `Nous livrons ${fromToSentence(
        mainSlot(s.hours)
      )}, ${daysOpenText(s.hours, true)}, dans tout le 93. Horaires à jour sur ${b.url}/contact.`,
    },
    ...FAQ_ENTRIES,
  ]
    .map((e) => `### ${e.q}\n\n${e.a}`)
    .join("\n\n");

  return `# ${b.name} — fiche complète

${b.tagline}

Dernière synchronisation des horaires : ${new Date().toISOString()}.

## Coordonnées

- **Adresse** : ${b.street}, ${b.city}, ${b.country}
- **Téléphone** : ${b.phone}
- **WhatsApp** : ${b.whatsapp}
- **Email** : ${b.email}
- **Site / commande** : ${b.url}
- **Itinéraire Google Maps** : https://www.google.com/maps/dir/?api=1&destination=134+Allee+du+Colonel+Fabien,+93320+Les+Pavillons-sous-Bois

## Horaires d'ouverture et de livraison

Résumé : **${summarizeHours(s.hours)}**. Une fermeture exceptionnelle s'affiche en temps réel sur le site et l'application.

${weeklyHoursBlock(s)}

Plage principale : **${formatRange(mainSlot(s.hours))}**.

## Commande et livraison

- Commande sur le site ou l'application, paiement sécurisé par carte via Stripe, ou par WhatsApp.
- Retrait sur place possible.
- Frais de livraison fixes : **${b.deliveryFee}**.
- Minimum de commande : **15 €** zone proche (Les Pavillons-sous-Bois, Bondy, Villemomble), **18 €** zone moyenne (Bobigny, Drancy, Aulnay-sous-Bois, Le Blanc-Mesnil, Livry-Gargan, Rosny-sous-Bois, Noisy-le-Sec, Gagny, Le Raincy), **22 €** zone éloignée.
- Délai moyen de livraison : ${b.prepMinutes}.
- Villes livrées (${DELIVERY_CITY_NAMES.length}) : ${DELIVERY_CITY_NAMES.join(", ")}.

## Carte et prix

${menuBlock()}
## Composition des sandwichs et bowls sur mesure

- **Viandes (7)** : ${VIANDES.join(", ")}.
- **Crudités (6)** : ${CRUDITES.join(", ")}.
- **Sauces (9)** : ${SAUCES.join(", ")}.
- **Suppléments (+1 €)** : ${SUPPLEMENTS.join(", ")}.
- **Cuisson** : froid ou chaud.
- **Tiramisu** parfums : ${TIRAMISU_PARFUMS.join(", ")}.
- **Milkshakes** parfums : ${MILKSHAKE_CHOIX.join(", ")} ; coulis chocolat, coulis caramel ou chantilly (+1 €).
- **Boissons (1,50 €)** : ${DRINK_OPTIONS.map((d) => d.name).join(", ")}.
- **Desserts** : ${DESSERT_OPTIONS.map((d) => `${d.name} ${euros(d.price)}`).join(", ")}.

## Concept

Chaque sandwich ou bowl est composé à la commande devant le client, avec viande, crudités et sauces au choix. Toutes les viandes sont halal certifiées. L'établissement est spécialisé dans la livraison nocturne en Seine-Saint-Denis.

## Questions fréquentes

${faq}
`;
}
