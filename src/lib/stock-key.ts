// ─── Normalisation des noms d'articles de stock ────────────────
//
// Pourquoi ce fichier existe :
// la base contient « Algerienne », « Menu Leger », « Samourai »,
// « Carottes rapees » (sans accents, saisis à la création des lignes)
// alors que le site et l'application affichent « Algérienne »,
// « Menu Léger », « Samouraï », « Carottes râpées ».
// Résultat mesuré en production : marquer une sauce épuisée dans
// l'admin ne grisait rien du tout côté client, la comparaison
// `stock[name]` échouait sur l'accent.
//
// Le site ajoutait en plus le prix dans le libellé
// (« Coulis chocolat (+1,00 €) »), ce qui ne correspondait à
// aucune ligne en base.
//
// Ce module est la SEULE source de vérité de la comparaison.
// Il est dupliqué à l'identique dans l'application mobile
// (ftsd-go / ftsd-ios : src/data/stock-key.ts) : garder les deux
// copies synchronisées lors d'une modification.

/**
 * Réduit un libellé à une clé comparable :
 *  - suppression des accents (é → e, ï → i, â → a…)
 *  - suppression du suffixe de prix « (+1,00 €) »
 *  - minuscules, espaces multiples réduits, ponctuation ignorée
 *
 *   stockKey("Coulis chocolat (+1,00 €)") === stockKey("coulis  chocolat")
 *   stockKey("Samouraï")                  === stockKey("Samourai")
 */
export function stockKey(name: string): string {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/\(.*?\)/g, "") // « (+1,00 €) », « (x2) »…
    .replace(/[^a-zA-Z0-9]+/g, " ") // ponctuation, €, apostrophes
    .trim()
    .toLowerCase();
}

/** Construit un index clé normalisée → valeur, à partir d'un objet brut. */
export function indexByKey<T>(src: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [name, value] of Object.entries(src ?? {})) {
    out[stockKey(name)] = value;
  }
  return out;
}
