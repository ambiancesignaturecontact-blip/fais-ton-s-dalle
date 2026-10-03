// ─── Composition d'un article : lecture, écriture, tarif ───────
//
// 🔴 Bug d'argent trouvé le 02/10/2026 en préparant la modification
// des ingrédients depuis l'espace restaurateur.
//
// `/api/order` comptait les suppléments comme ceci :
//
//     const cruditeCount = (item.custom.match(/Crudité/gi) || []).length;
//
// Or la composition s'écrit :
//
//     « Viande: Tenders | Crudites: Salade, Tomate, Oignons, Avocat |
//       Sauce: Algérienne, Blanche | Suppléments: Cheddar, Feta »
//
// La recherche compte donc les **étiquettes**, pas les ingrédients :
// quatre crudités comptaient pour UN. Résultat : les suppléments
// n'étaient jamais facturés côté serveur. Le client voyait bien
// « +2,00 € » dans l'application, mais le serveur recalculait le
// total à partir de ses propres prix… sans les extras.
//
// Autrement dit : **tous les suppléments étaient offerts**.
//
// Ce module devient la seule source de vérité : il lit la
// composition, la réécrit, et calcule le prix d'une ligne. Il sert
// à la création de commande ET à la modification depuis l'admin.

/** Prix forfaitaires serveur (jamais le prix envoyé par le client). */
export const PRIX_ARTICLES: Record<string, number> = {
  "Menu Léger": 6.9, "Menu Classique": 7.9, "Menu Gourmand": 9.9, "Menu Royal": 15.9,
  "Bowl Léger": 10.9, "Bowl Classique": 11.9, "Bowl Gourmand": 13.9, "Bowl Royal": 18.9,
  Tiramisu: 3.0, Milkshake: 5.0,
  "Coca-Cola": 1.5, "Coca Zero": 1.5, "Coca-Cola Cherry": 1.5,
  "Oasis Tropical": 1.5, "Ice Tea": 1.5, Orangina: 1.5,
  Cristaline: 1.5, "San Pellegrino": 1.5,
};

export const PRIX_SUPPLEMENT = 1.0;

/** Ce qui est compris dans le prix, par article. */
export interface Quotas {
  viande: number;
  crudites: number;
  sauces: number;
  supplements: number;
}

const QUOTA_DEFAUT: Quotas = { viande: 1, crudites: 2, sauces: 2, supplements: 1 };

/** Les menus et bowls « Classique » et au-dessus ont 3 crudités. */
export function quotasPour(nomArticle: string): Quotas {
  const n = (nomArticle || "").toLowerCase();
  if (/(classique|gourmand|royal)/.test(n)) {
    return { viande: 1, crudites: 3, sauces: 2, supplements: 1 };
  }
  return QUOTA_DEFAUT;
}

/** Les quatre familles modifiables, et leur étiquette affichée. */
export const FAMILLES = [
  { cle: "viande", etiquette: "Viande" },
  { cle: "crudites", etiquette: "Crudites" },
  { cle: "sauces", etiquette: "Sauce" },
  { cle: "supplements", etiquette: "Suppléments" },
] as const;

export type Famille = (typeof FAMILLES)[number]["cle"];
export type Composition = Partial<Record<Famille, string[]>> & {
  /** Tout ce qui n'entre dans aucune famille (cuisson, parfums…) */
  autres?: string[];
};

/** Reconnaît l'étiquette d'un groupe, accents et pluriels compris. */
function familleDe(etiquette: string): Famille | null {
  const e = etiquette
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (e.startsWith("viande")) return "viande";
  if (e.startsWith("crudit")) return "crudites";
  if (e.startsWith("sauce")) return "sauces";
  if (e.startsWith("supplement") || e.startsWith("supp")) return "supplements";
  return null;
}

/**
 * « Viande: Tenders | Crudites: Salade, Tomate » → objet.
 *
 * Les mentions de prix ajoutées à la fin (« crudités sup +2,00€ »)
 * sont ignorées : elles sont recalculées, jamais relues.
 */
export function lireComposition(texte: string | null | undefined): Composition {
  const out: Composition = {};
  if (!texte) return out;

  for (const bloc of String(texte).split("|")) {
    const morceau = bloc.trim();
    if (!morceau) continue;

    const sep = morceau.indexOf(":");
    if (sep === -1) {
      // Mention de prix recalculée automatiquement : on l'oublie.
      if (/\+\s*\d/.test(morceau)) continue;
      (out.autres ??= []).push(morceau);
      continue;
    }

    const etiquette = morceau.slice(0, sep);
    const valeurs = morceau
      .slice(sep + 1)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const famille = familleDe(etiquette);
    if (famille) {
      out[famille] = [...(out[famille] ?? []), ...valeurs];
    } else {
      (out.autres ??= []).push(morceau);
    }
  }
  return out;
}

/** L'inverse : objet → texte, dans l'ordre d'affichage habituel. */
export function ecrireComposition(c: Composition): string {
  const blocs: string[] = [];
  for (const { cle, etiquette } of FAMILLES) {
    const valeurs = c[cle];
    if (valeurs && valeurs.length) blocs.push(`${etiquette}: ${valeurs.join(", ")}`);
  }
  for (const autre of c.autres ?? []) blocs.push(autre);
  return blocs.join(" | ");
}

/** Nombre de suppléments payants, famille par famille. */
export function comptePayants(nomArticle: string, c: Composition): number {
  const q = quotasPour(nomArticle);
  return (
    Math.max(0, (c.viande?.length ?? 0) - q.viande) +
    Math.max(0, (c.crudites?.length ?? 0) - q.crudites) +
    Math.max(0, (c.sauces?.length ?? 0) - q.sauces) +
    Math.max(0, (c.supplements?.length ?? 0) - q.supplements)
  );
}

/**
 * Prix unitaire d'une ligne : prix de l'article + suppléments.
 *
 * `prixClient` sert uniquement au cas « ingrédient vendu seul »
 * (articles hors catalogue facturés 1,00 €).
 */
export function prixLigne(
  nomArticle: string,
  composition: string | Composition | null | undefined,
  prixClient?: number
): number {
  const base = PRIX_ARTICLES[nomArticle] ?? 0;
  if (base === 0 && prixClient === PRIX_SUPPLEMENT) return PRIX_SUPPLEMENT;

  const c =
    typeof composition === "string" || composition == null
      ? lireComposition(composition)
      : composition;

  const total = base + comptePayants(nomArticle, c) * PRIX_SUPPLEMENT;
  return Math.round(total * 100) / 100;
}
