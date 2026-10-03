// ─── Campagne marketing (opération commerciale du moment) ──────
//
// Une seule source de vérité, partagée par le site et l'application :
// la colonne `campaign` (jsonb) de la table `settings`, servie par
// /api/settings.
//
// Lancer, modifier ou arrêter une opération ne demande donc AUCUNE
// republication : ni Vercel, ni App Store.
//
// Si la colonne n'existe pas encore en base, tout continue de
// fonctionner avec les valeurs par défaut ci-dessous.

/** "auto" | "vedette" | "discret" — voir l'app pour le détail */
export type AffichageCampagne = "auto" | "vedette" | "discret";

export type Campaign = {
  active: boolean;
  affichage: AffichageCampagne;
  badge: string;
  emoji: string;
  titre: string;
  accroche: string;
  detail: string;
  lieu: string;
  adresse: string;
  ville: string;
  sousTitre: string;
  signature: string;
  cta: string;
  couleurs: [string, string];
  debut: string | null;
  fin: string | null;
};

export const DEFAULT_CAMPAIGN: Campaign = {
  active: true,
  affichage: "auto",
  badge: "JEU SUR PLACE 🔔",
  emoji: "🎁",
  titre: "VOTRE 1ʳᵉ COMMANDE EST OFFERTE !",
  accroche: "Pour participer, passez directement au fast-food !",
  detail:
    "Appuyez sur le buzzer 🔔 posé sur le comptoir : à chaque partie, un produit à gagner. 🍔🥤",
  lieu: "FAIS TON S'DALLE",
  adresse: "134 Allée du Colonel Fabien",
  ville: "93320 Les Pavillons-sous-Bois",
  sousTitre: "Sur place, aux Pavillons-sous-Bois",
  signature: "ON VOUS ATTEND CHEZ FAIS TON S'DALLE ! 🔥",
  cta: "M'y emmener 📍",
  couleurs: ["#E85D4A", "#A82D1E"],
  debut: null,
  fin: null,
};

const MAX: Record<string, number> = {
  badge: 28, emoji: 8, titre: 70, accroche: 110, detail: 180,
  lieu: 40, adresse: 60, ville: 60, sousTitre: 60, signature: 80, cta: 30,
};

function str(v: unknown, key: string, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const clean = v.replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, MAX[key] ?? 80) : fallback;
}

function color(v: unknown, fallback: string): string {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
}

function isoOrNull(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/**
 * Valide une campagne reçue de l'admin ou lue en base.
 * Renvoie null si l'objet n'est pas exploitable : on préfère garder
 * l'ancienne campagne plutôt qu'afficher une bannière vide.
 */
export function parseCampaign(input: unknown): Campaign | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const r = input as Record<string, unknown>;
  const d = DEFAULT_CAMPAIGN;
  const couleurs = Array.isArray(r.couleurs) ? r.couleurs : [];

  const modes: AffichageCampagne[] = ["auto", "vedette", "discret"];

  const c: Campaign = {
    active: r.active !== false,
    affichage: modes.includes(r.affichage as AffichageCampagne)
      ? (r.affichage as AffichageCampagne)
      : "auto",
    badge: str(r.badge, "badge", d.badge),
    emoji: str(r.emoji, "emoji", d.emoji),
    titre: str(r.titre, "titre", d.titre),
    accroche: str(r.accroche, "accroche", d.accroche),
    detail: str(r.detail, "detail", d.detail),
    lieu: str(r.lieu, "lieu", d.lieu),
    adresse: str(r.adresse, "adresse", d.adresse),
    ville: str(r.ville, "ville", d.ville),
    sousTitre: str(r.sousTitre, "sousTitre", d.sousTitre),
    signature: str(r.signature, "signature", d.signature),
    cta: str(r.cta, "cta", d.cta),
    couleurs: [color(couleurs[0], d.couleurs[0]), color(couleurs[1], d.couleurs[1])],
    debut: isoOrNull(r.debut),
    fin: isoOrNull(r.fin),
  };

  if (!c.titre) return null;
  // Une fenêtre à l'envers (fin avant début) n'afficherait jamais rien
  if (c.debut && c.fin && Date.parse(c.fin) <= Date.parse(c.debut)) return null;
  return c;
}

/** La campagne est-elle visible à cet instant ? */
export function campaignVisible(c: Campaign | null, at: Date = new Date()): Campaign | null {
  if (!c || !c.active) return null;
  const t = at.getTime();
  if (c.debut && t < Date.parse(c.debut)) return null;
  if (c.fin && t > Date.parse(c.fin)) return null;
  return c;
}

/** Adresse sur une ligne, pour l'itinéraire */
export function campaignAddress(c: Campaign): string {
  return `${c.lieu}, ${c.adresse}, ${c.ville}`;
}
