// ─── Allergènes — obligation légale (règlement INCO 1169/2011) ─
//
// En vente à distance, l'information sur les 14 allergènes doit être
// disponible AVANT l'achat, sans frais supplémentaire, et de nouveau
// à la livraison. Un contrôle DGCCRF sanctionne son absence.
//
// Ce qui n'allait pas : la liste était écrite produit par produit
// (« Menu Léger → Gluten, Moutarde ») alors que le client COMPOSE son
// sandwich. Un client qui prenait du thon ne voyait pas « poisson »,
// et celui qui évitait la moutarde la voyait annoncée sans en avoir
// mis. Une information fausse est pire que pas d'information.
//
// Ici, chaque ingrédient porte ses allergènes et la liste est
// recalculée à partir des choix réels.

/** Les 14 allergènes à déclaration obligatoire, orthographe officielle */
export const ALLERGENES_OFFICIELS = [
  "Gluten",
  "Crustacés",
  "Œufs",
  "Poissons",
  "Arachides",
  "Soja",
  "Lait",
  "Fruits à coque",
  "Céleri",
  "Moutarde",
  "Sésame",
  "Sulfites",
  "Lupin",
  "Mollusques",
] as const;

export type Allergene = (typeof ALLERGENES_OFFICIELS)[number];

/** Pictogramme par allergène — aide à repérer d'un coup d'œil */
export const EMOJI_ALLERGENE: Record<Allergene, string> = {
  "Gluten": "🌾",
  "Crustacés": "🦐",
  "Œufs": "🥚",
  "Poissons": "🐟",
  "Arachides": "🥜",
  "Soja": "🌱",
  "Lait": "🥛",
  "Fruits à coque": "🌰",
  "Céleri": "🥬",
  "Moutarde": "🌭",
  "Sésame": "🫘",
  "Sulfites": "🍷",
  "Lupin": "🌼",
  "Mollusques": "🦪",
};

/**
 * Allergènes par ingrédient.
 *
 * Les clés reprennent EXACTEMENT les libellés de menu.ts : un test
 * vérifie qu'aucun ingrédient n'est oublié, sinon un nouvel
 * ingrédient arriverait sans allergène déclaré.
 */
export const ALLERGENES_INGREDIENT: Record<string, Allergene[]> = {
  // ─── Pain (toujours présent dans un sandwich) ───────────────
  "Pain": ["Gluten", "Sésame"],

  // ─── Viandes ────────────────────────────────────────────────
  "Tenders": ["Gluten", "Œufs", "Lait"],   // panure
  "Émincé poulet": [],
  "Blanc dinde": [],
  "Jambon dinde": [],
  "Pastrami": [],
  "Rosette": [],
  "Thon": ["Poissons", "Œufs"],            // thon mayonnaise

  // ─── Crudités ───────────────────────────────────────────────
  "Salade": [],
  "Tomate": [],
  "Oignons": [],
  "Mais": [],
  "Carottes râpées": [],
  "Avocat": [],

  // ─── Sauces ─────────────────────────────────────────────────
  "Mayo": ["Œufs", "Moutarde"],
  "Ketchup": [],
  "Algérienne": ["Œufs", "Moutarde"],
  "Samouraï": ["Œufs", "Moutarde"],
  "Blanche": ["Œufs", "Lait", "Moutarde"],
  "Moutarde": ["Moutarde", "Sulfites"],
  "Brésil": ["Œufs", "Moutarde"],
  "Chili": [],
  "Thaï": ["Poissons", "Soja", "Sésame"],  // nuoc-mâm + soja

  // ─── Suppléments ────────────────────────────────────────────
  "Cheddar": ["Lait"],
  "Mozzarella": ["Lait"],
  "Feta": ["Lait"],

  // ─── Desserts ───────────────────────────────────────────────
  "Tiramisu": ["Lait", "Œufs", "Gluten"],
  "Caramel spéculoos": ["Lait", "Œufs", "Gluten", "Soja"],
  "Chocolat": ["Lait", "Œufs", "Gluten", "Soja"],
  "Oreo": ["Lait", "Œufs", "Gluten", "Soja"],

  // ─── Milkshakes ─────────────────────────────────────────────
  "Milkshake": ["Lait"],
  "Kinder Bueno": ["Lait", "Fruits à coque", "Soja", "Gluten"],
  "Kinder Bueno White": ["Lait", "Fruits à coque", "Soja", "Gluten"],
  "Snickers": ["Lait", "Arachides", "Fruits à coque", "Soja"],
  "KitKat": ["Lait", "Gluten", "Soja"],
  "KitKat White": ["Lait", "Gluten", "Soja"],
  "Milka": ["Lait", "Fruits à coque", "Soja"],
  "Coulis chocolat": ["Lait", "Soja"],
  "Coulis caramel": ["Lait"],
  "Chantilly": ["Lait"],

  // ─── Boissons ───────────────────────────────────────────────
  "Coca-Cola": [], "Coca Zero": [], "Coca-Cola Cherry": [],
  "Oasis Tropical": [], "Ice Tea": [], "Orangina": [],
  "Cristaline": [], "San Pellegrino": [],
};

/** Allergènes d'un ingrédient (liste vide si inconnu) */
export function allergenesDe(ingredient: string): Allergene[] {
  return ALLERGENES_INGREDIENT[ingredient.trim()] ?? [];
}

/**
 * Allergènes réels d'un produit composé.
 *
 * @param choix  tous les ingrédients choisis par le client
 * @param avecPain true pour un sandwich (le pain est toujours servi)
 */
export function allergenesComposes(
  choix: string[],
  avecPain = false
): Allergene[] {
  const set = new Set<Allergene>();
  if (avecPain) for (const a of allergenesDe("Pain")) set.add(a);
  for (const c of choix) for (const a of allergenesDe(c)) set.add(a);
  // Ordre officiel, pas l'ordre des clics : plus lisible et stable
  return ALLERGENES_OFFICIELS.filter((a) => set.has(a));
}

/** « 🌾 Gluten · 🥚 Œufs » */
export function formatAllergenes(liste: Allergene[]): string {
  if (!liste.length) return "Aucun des 14 allergènes à déclaration obligatoire";
  return liste.map((a) => `${EMOJI_ALLERGENE[a]} ${a}`).join(" · ");
}

/**
 * Mention obligatoire de contamination croisée.
 * La cuisine est unique : on ne peut pas garantir l'absence de traces.
 */
export const MENTION_TRACES =
  "Préparé dans une cuisine qui manipule gluten, lait, œufs, poissons, " +
  "fruits à coque, arachides, soja, sésame et moutarde : la présence de " +
  "traces ne peut pas être exclue.";

export const MENTION_LEGALE =
  "Information fournie au titre du règlement (UE) n° 1169/2011. " +
  "En cas d'allergie sévère, appelez-nous avant de commander : " +
  "nous vérifions l'étiquette du lot servi ce jour-là.";

/** Un ingrédient est-il compatible avec les allergènes évités ? */
export function ingredientCompatible(
  ingredient: string,
  aEviter: Allergene[]
): boolean {
  if (!aEviter.length) return true;
  const a = allergenesDe(ingredient);
  return !a.some((x) => aEviter.includes(x));
}
