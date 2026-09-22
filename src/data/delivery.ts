// ─── Zones de livraison intelligentes ─────────────────────────
// Restaurant : 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois
// Plus c'est loin, plus le minimum de commande et les frais augmentent

export interface DeliveryZone {
  id: number;
  label: string;
  minOrder: number;
  fee: number;
  cities: string[];
  emoji: string;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 1,
    label: "Proche",
    minOrder: 15,
    fee: 2.9,
    emoji: "🟢",
    cities: [
      "pavillons-sous-bois", "93320", "bondy", "93110",
      "villemomble", "93250",
    ],
  },
  {
    id: 2,
    label: "Moyen",
    minOrder: 18,
    fee: 2.9,
    emoji: "🟡",
    cities: [
      "bobigny", "93000", "drancy", "93700", "aulnay-sous-bois", "93600",
      "blanc-mesnil", "93150", "livry-gargan", "93190",
      "rosny-sous-bois", "93110", "noisy-le-sec", "93130",
      "gagny", "93220", "raincy", "93340",
    ],
  },
  {
    id: 3,
    label: "Lointain",
    minOrder: 22,
    fee: 2.9,
    emoji: "🟠",
    cities: [
      "saint-denis", "93200", "aubervilliers", "93300",
      "pantin", "93500", "montreuil", "93100",
      "bagnolet", "93170", "lilas", "93260",
      "romainville", "93230", "noisy-le-grand", "93160",
      "clichy-sous-bois", "93390", "montfermeil", "93370",
      "sevran", "93270", "villepinte", "93420",
      "tremblay-en-france", "93290", "neuilly-plaisance", "93360",
      "neuilly-sur-marne", "93330", "gournay-sur-marne", "93460",
      "chelles", "77500", "vaudours", "93410",
      "coubron", "93470", "pre-saint-gervais", "93310",
    ],
  },
];

/**
 * Trouve la zone de livraison à partir d'une adresse
 */
export function findZone(address: string): DeliveryZone {
  if (!address) return DELIVERY_ZONES[0];
  const lower = address.toLowerCase();

  for (const zone of DELIVERY_ZONES) {
    for (const city of zone.cities) {
      if (lower.includes(city)) return zone;
    }
  }

  // Par défaut : zone 1 (proche)
  return DELIVERY_ZONES[0];
}

/**
 * Retourne le minimum de commande pour une adresse
 */
export function getMinOrder(address: string): number {
  return findZone(address).minOrder;
}

/**
 * Retourne les frais de livraison pour une adresse
 */
export function getDeliveryFee(address: string): number {
  return findZone(address).fee;
}

/**
 * Vérifie si la zone est couverte (toujours vrai dans le 93)
 */
export function isInZone(address: string): boolean {
  if (!address) return false;
  const lower = address.toLowerCase();
  for (const zone of DELIVERY_ZONES) {
    for (const city of zone.cities) {
      if (lower.includes(city)) return true;
    }
  }
  // Vérifier les codes 93
  return /93\d{3}/.test(address);
}

/** Noms affichables des villes livrées (page zone, llms.txt, docs IA) */
export const DELIVERY_CITY_NAMES: string[] = [
  "Les Pavillons-sous-Bois", "Bondy", "Bobigny", "Drancy", "Aulnay-sous-Bois",
  "Le Blanc-Mesnil", "La Courneuve", "Saint-Denis", "Aubervilliers",
  "Pantin", "Romainville", "Noisy-le-Sec", "Montreuil", "Bagnolet",
  "Les Lilas", "Le Pré-Saint-Gervais", "Sevran", "Tremblay-en-France",
  "Villepinte", "Vaujours", "Livry-Gargan", "Clichy-sous-Bois",
  "Montfermeil", "Coubron", "Neuilly-Plaisance", "Neuilly-sur-Marne",
  "Rosny-sous-Bois", "Villemomble", "Gagny", "Le Raincy",
  "Noisy-le-Grand", "Gournay-sur-Marne", "Chelles (77)",
].sort((a, b) => a.localeCompare(b, "fr"));
