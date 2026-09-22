// ─── Journée de service ────────────────────────────────────────
//
// Le restaurant ouvre à 11h30 et ferme à 3h du matin. « Aujourd'hui »
// pour un livreur, ce n'est donc PAS le jour calendaire : une course
// livrée à 1h15 appartient au service de la veille, celui qu'il est
// en train de terminer.
//
// Deux bugs réels que ce fichier corrige :
//
//  1. Le serveur Vercel tourne en UTC. `new Date(); d.setHours(0,0,0,0)`
//     y produit minuit UTC = 2h du matin à Paris (heure d'été).
//     Résultat mesuré : à 2h30 du matin, un livreur voyait « 0 course
//     aujourd'hui » alors qu'il venait d'en faire cinq. Ses gains du
//     jour repassaient à zéro en pleine tournée.
//
//  2. Même corrigé en heure de Paris, un minuit calendaire coupe le
//     service en deux : les courses de 23h30 et de 0h30 tombent dans
//     deux « journées » différentes alors que c'est le même shift.
//
// La bascule est donc fixée à 5h du matin, heure de Paris : après la
// fermeture (3h) et avant l'ouverture (11h30). Aucune course ne peut
// exister à cette heure-là, la coupure ne sépare jamais un service.

export const TZ = "Europe/Paris";

/** Heure de bascule d'une journée de service à la suivante (heure de Paris) */
export const HEURE_BASCULE = 5;

/**
 * Décalage de Paris par rapport à UTC, en minutes, à un instant donné.
 * Passe par Intl : gère l'heure d'été sans table de dates.
 */
export function decalageParis(at: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const p: Record<string, string> = {};
  for (const { type, value } of fmt.formatToParts(at)) p[type] = value;
  // `hour` peut valoir "24" à minuit selon l'implémentation
  const h = p.hour === "24" ? "00" : p.hour;
  const commeUtc = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(h), Number(p.minute), Number(p.second)
  );
  return Math.round((commeUtc - at.getTime()) / 60000);
}

/** Composantes de la date à Paris (année, mois, jour, heure) */
function composantesParis(at: Date) {
  const dec = decalageParis(at);
  const d = new Date(at.getTime() + dec * 60000);
  return {
    y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(),
    h: d.getUTCHours(), dec,
  };
}

/**
 * Instant de début de la journée de service en cours.
 *
 * @param at instant de référence (par défaut : maintenant)
 * @param joursEnArriere 0 = service en cours, 1 = la veille…
 */
export function debutJourneeService(at: Date = new Date(), joursEnArriere = 0): Date {
  const c = composantesParis(at);
  // Avant 5h du matin, on est encore sur le service de la veille
  const jour = c.h < HEURE_BASCULE ? c.d - 1 : c.d;
  // On construit 5h00 heure de Paris, puis on repasse en UTC
  const brut = Date.UTC(c.y, c.m, jour - joursEnArriere, HEURE_BASCULE, 0, 0);
  const approx = new Date(brut - c.dec * 60000);
  // Le décalage peut changer entre les deux dates (nuit de changement
  // d'heure) : une seconde passe suffit à se recaler exactement.
  const dec2 = decalageParis(approx);
  return dec2 === c.dec ? approx : new Date(brut - dec2 * 60000);
}

/** Début du service d'il y a N jours (7 = la semaine glissante) */
export function debutIlYAJours(n: number, at: Date = new Date()): Date {
  return debutJourneeService(at, n);
}

/** Étiquette lisible d'une journée de service : « lundi 20 août » */
export function libelleJournee(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long",
  }).format(d);
}

// ─── Distance estimée ──────────────────────────────────────────
//
// La table `orders` ne stocke NI latitude NI longitude (vérifié en
// production : `column orders.lat does not exist`). Impossible donc
// de calculer une vraie distance sans géocoder après coup.
//
// L'ancien code faisait `nombre de courses × 2,4 km` — un chiffre
// inventé, identique pour une livraison à Bondy (2 km) et une à
// Montreuil (9 km). Affiché au livreur, il servait de base à sa paie :
// c'était donc un chiffre faux sur un sujet d'argent.
//
// À défaut de coordonnées, on utilise la donnée réelle dont on
// dispose — la ville dans l'adresse — et on annonce clairement que
// c'est une estimation.

/** Distance aller estimée depuis le restaurant, par zone (km) */
const KM_ZONE: Record<number, number> = { 1: 2.2, 2: 4.5, 3: 8.0 };

const VILLES_ZONE: Array<{ zone: number; motifs: string[] }> = [
  { zone: 1, motifs: ["pavillons-sous-bois", "93320", "bondy", "93110", "villemomble", "93250"] },
  { zone: 2, motifs: [
    "bobigny", "93000", "drancy", "93700", "aulnay-sous-bois", "93600",
    "blanc-mesnil", "93150", "livry-gargan", "93190", "rosny-sous-bois",
    "noisy-le-sec", "93130", "gagny", "93220", "raincy", "93340",
  ] },
  { zone: 3, motifs: [
    "saint-denis", "93200", "aubervilliers", "93300", "pantin", "93500",
    "montreuil", "93100", "bagnolet", "93170", "lilas", "93260",
    "romainville", "93230", "noisy-le-grand", "93160", "clichy-sous-bois", "93390",
    "montfermeil", "93370", "sevran", "93270", "villepinte", "93420",
    "tremblay-en-france", "93290", "neuilly-plaisance", "93360",
    "neuilly-sur-marne", "93330", "gournay-sur-marne", "93460",
    "chelles", "77500", "coubron", "93470", "pre-saint-gervais", "93310",
  ] },
];

/** Zone de livraison déduite de l'adresse (1 proche → 3 lointain) */
export function zoneDeAdresse(adresse: string | null | undefined): number {
  if (!adresse) return 1;
  const l = adresse.toLowerCase();
  for (const { zone, motifs } of VILLES_ZONE) {
    for (const m of motifs) if (l.includes(m)) return zone;
  }
  return 2; // inconnu : on prend la valeur médiane, jamais la plus flatteuse
}

/**
 * Kilomètres estimés pour une course : aller + retour au restaurant,
 * majorés de 25 % pour approcher le trajet routier réel (les rues ne
 * sont pas des lignes droites).
 */
export function kmEstimes(adresse: string | null | undefined): number {
  const base = KM_ZONE[zoneDeAdresse(adresse)] ?? 4.5;
  return Math.round(base * 2 * 1.25 * 10) / 10;
}
