// ─── Questions fréquentes — source unique ──────────────────────
//
// Utilisées à la fois par la section FAQ visible du site (HTML
// explorable par les assistants IA) et par le JSON-LD FAQPage
// (résultats enrichis Google et réponses des moteurs IA).
//
// Les horaires sont volontairement exclus de cette liste statique :
// ils sont dynamiques (réglages partagés avec l'app) et injectés en
// tête de la FAQ côté composant et côté JSON-LD.

export const HOURS_QUESTION = "Quels sont les horaires de livraison ?";

export const HOURS_ANSWER_TEMPLATE =
  (range: string, days: string) =>
    `Nous livrons ${range}, ${days}, dans tout le 93 (Seine-Saint-Denis). Les horaires à jour sont affichés sur le site et dans l'application.`;

export type FaqEntry = { q: string; a: string };

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    q: "Où se trouve FAIS TON S'DALLE ?",
    a: "134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois. Nous livrons dans tout le département 93 (Seine-Saint-Denis) et le retrait sur place est possible.",
  },
  {
    q: "Quels sont les menus et les prix ?",
    a: "Menu Léger 6,90 € (sandwich), Menu Classique 7,90 € (sandwich + boisson), Menu Gourmand 9,90 € (sandwich + boisson + tiramisu), Menu Royal 15,90 € (sandwich + boisson + tiramisu + milkshake). Bowls de 10,90 € à 18,90 €, tiramisu 3 €, milkshake 5 €, boissons 1,50 €.",
  },
  {
    q: "La viande est-elle halal ?",
    a: "Oui, 100 % de nos viandes sont halal certifiées : tenders, émincé de poulet, blanc de dinde, jambon de dinde, pastrami, rosette, thon.",
  },
  {
    q: "Quel est le montant minimum de livraison ?",
    a: "Le minimum de commande est de 15 € pour les zones proches (Les Pavillons-sous-Bois, Bondy, Villemomble), 18 € pour les zones moyennes (Bobigny, Drancy, Aulnay, Le Blanc-Mesnil, Livry-Gargan, Rosny, Gagny, Le Raincy) et 22 € pour les zones plus éloignées du 93. Les frais de livraison sont fixes : 2,90 €.",
  },
  {
    q: "Peut-on personnaliser son sandwich ?",
    a: "Oui, chaque sandwich est préparé à la commande. Choisissez la cuisson (froid ou chaud), jusqu'à 3 viandes, jusqu'à 6 crudités (salade, tomate, oignons, maïs, carottes râpées, avocat), jusqu'à 4 sauces (mayo, ketchup, algérienne, samouraï, blanche, moutarde, brésil, chili, thaï) et des suppléments (cheddar, mozzarella, feta).",
  },
  {
    q: "Comment commander et comment payer ?",
    a: "Commandez en ligne sur le site ou l'application, paiement sécurisé par carte bancaire via Stripe, ou par WhatsApp au 06 72 04 48 75. Le retrait sur place est également possible. La livraison prend en moyenne 30 minutes.",
  },
];
