// ─── Remises : le serveur décide, jamais le client ────────────
//
// Ce qui n'allait pas, et c'était grave :
//
//   · le panier affichait « Fidélité -20 % » et « Parrainage -15 % »,
//     mais le serveur ne connaissait QUE les codes promo. Il
//     enregistrait donc le prix plein tarif, alors que Stripe
//     encaissait le montant remisé annoncé par l'application.
//     Résultat : comptabilité fausse à chaque remise, et en espèces
//     le client se voyait réclamer plus que ce qu'il avait lu.
//
//   · le parrainage annonçait « -15 % » et calculait 10 %.
//
//   · le bonus filleul se « consommait » sur simple appel du
//     téléphone, sans la moindre commande derrière.
//
// Tout est recalculé ici, à partir de la base, au moment où la
// commande est créée.

import { PRIX_ARTICLES } from "./composition";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** -20 % à partir de 10 menus achetés */
// ─── La récompense de fidélité : un menu offert ───────────────
//
// Choix du 02/10/2026, en remplacement du « -20 % ».
//
//  · « le 10ᵉ menu offert » se retient et se raconte ; « -20 % sur
//    la prochaine commande », personne ne sait ce que ça vaut ;
//  · un menu à 7,90 € coûte bien moins en matières qu'une remise
//    de 20 % sur un panier de 25 € ;
//  · la récompense oblige à repasser commande — et on prend
//    rarement QUE le menu offert.
//
// Concrètement : on déduit le menu le moins cher du panier,
// plafonné à la valeur d'un Menu Classique. Un Royal ne donne pas
// 15,90 € de remise ; un Léger à 6,90 € n'en déduit que 6,90.
// Sans menu dans le panier, la récompense n'est PAS consommée :
// elle attend la prochaine commande.
export const MENU_OFFERT = "Menu Classique";
export const VALEUR_MENU_OFFERT = 7.9;
/** -15 % pour le filleul, sur sa première commande */
export const TAUX_PARRAINAGE = 0.15;
/** Au-delà, un « parrain » ressemble à une fraude organisée */
export const MAX_FILLEULS_30J = 20;

function sb(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Téléphone comparable : uniquement les chiffres */
export function telNormalise(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

/**
 * Plafonne l'ensemble des remises au montant de la commande.
 * Une commande ne devient jamais gratuite ni négative.
 */
export function plafonner(base: number, remises: number[]): number {
  const somme = remises.reduce((s, r) => s + Math.max(0, r), 0);
  return arrondi(Math.min(somme, base));
}

// ─── Fidélité ──────────────────────────────────────────────────

export type Fidelite = { remise: number; clientId: number | null };

/**
 * -20 % si le compte du client a la récompense active.
 * Le client est retrouvé par son téléphone : c'est la seule donnée
 * dont on est sûr à la commande (l'app ne demande pas l'e-mail).
 */
export async function remiseFidelite(
  telephone: string,
  base: number,
  /** Le panier, pour trouver le menu à offrir */
  articles: Array<{ name?: string; price?: number; qty?: number }> = [],
  /** « livraison » ou « emporter » */
  mode = "emporter"
): Promise<Fidelite> {
  // ─── Le menu offert se retire sur place ────────────────────
  //
  // Deux raisons :
  //  1. un client qui commande seulement un Menu Léger avec sa
  //     récompense tombe à 0,00 € — et Stripe refuse un paiement
  //     de zéro. En livraison, la commande serait bloquée ;
  //  2. le faire venir au comptoir, c'est le revoir, lui dire
  //     bonjour, et souvent lui vendre une boisson.
  //
  // La récompense n'est PAS consommée : elle reste acquise pour
  // sa prochaine commande à emporter.
  if (mode === "livraison") return { remise: 0, clientId: null };

  const tel = telNormalise(telephone);
  if (!SUPABASE_URL || !SUPABASE_KEY || tel.length < 9) {
    return { remise: 0, clientId: null };
  }
  try {
    const res = await sb(
      `customers?phone=eq.${encodeURIComponent(tel)}` +
        `&select=id,fidelity_discount_active&limit=1`
    );
    if (!res.ok) return { remise: 0, clientId: null };
    const [c] = await res.json();
    if (!c?.fidelity_discount_active) {
      return { remise: 0, clientId: c?.id ?? null };
    }
    const offert = valeurMenuOffert(articles);
    // Aucun menu dans le panier : on n'offre rien, et surtout on ne
    // consomme pas la récompense (clientId laissé à null).
    if (offert <= 0) return { remise: 0, clientId: null };

    return { remise: Math.min(offert, arrondi(base)), clientId: c.id };
  } catch {
    return { remise: 0, clientId: null };
  }
}

/**
 * Valeur du menu offert : le moins cher du panier, plafonné à la
 * valeur d'un Menu Classique. 0 s'il n'y a aucun menu.
 */
export function valeurMenuOffert(
  articles: Array<{ name?: string; price?: number; qty?: number }>
): number {
  const prix: number[] = [];
  for (const a of articles ?? []) {
    const nom = String(a?.name ?? "");
    if (!/^(menu|bowl)\s/i.test(nom)) continue;
    const p = PRIX_ARTICLES[nom];
    if (typeof p === "number" && p > 0) prix.push(p);
  }
  if (!prix.length) return 0;
  return arrondi(Math.min(Math.min(...prix), VALEUR_MENU_OFFERT));
}

/** La récompense est consommée : elle ne doit pas servir deux fois */
export async function consommerFidelite(clientId: number): Promise<void> {
  try {
    await sb(`customers?id=eq.${clientId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        fidelity_discount_active: false,
        fidelity_menu_count: 0,
      }),
    });
  } catch { /* la commande reste valable */ }
}

// ─── Parrainage ────────────────────────────────────────────────

export type Parrainage = { remise: number; ligneId: number | null; parrain: string | null };

/**
 * -15 % pour le filleul, UNE seule fois, et seulement s'il est
 * réellement nouveau.
 *
 * Garde-fous (chacun correspond à un abus possible) :
 *   1. il faut un parrainage enregistré et non consommé ;
 *   2. le téléphone ne doit avoir AUCUNE commande passée — sinon il
 *      suffisait de réinstaller l'app pour être « filleul » à vie ;
 *   3. le parrain ne peut pas être ce même téléphone ;
 *   4. un parrain est plafonné à 20 filleuls récompensés sur 30
 *      jours — au-delà, ce n'est plus du bouche-à-oreille.
 */
export async function remiseParrainage(
  deviceId: string,
  telephone: string,
  base: number
): Promise<Parrainage> {
  const device = String(deviceId ?? "").trim();
  const tel = telNormalise(telephone);
  const vide: Parrainage = { remise: 0, ligneId: null, parrain: null };
  if (!SUPABASE_URL || !SUPABASE_KEY || device.length < 8) return vide;

  try {
    // 1. Un parrainage en attente sur cet appareil ?
    const res = await sb(
      `referral_uses?device_id=eq.${encodeURIComponent(device)}` +
        `&consumed=eq.false&select=id,referrer_code&limit=1`
    );
    if (!res.ok) return vide;
    const [ligne] = await res.json();
    if (!ligne?.id) return vide;

    // 2. Le filleul doit être un nouveau client
    if (tel.length >= 9) {
      const dejaCommande = await sb(
        `orders?customer_phone=eq.${encodeURIComponent(tel)}&select=id&limit=1`
      );
      if (dejaCommande.ok) {
        const rows = await dejaCommande.json();
        if (Array.isArray(rows) && rows.length) return vide;
      }
    }

    // 3. Le parrain n'est pas le filleul (même téléphone)
    const parrainRes = await sb(
      `referrals?code=eq.${encodeURIComponent(String(ligne.referrer_code))}` +
        `&select=device_id&limit=1`
    );
    if (parrainRes.ok) {
      const [p] = await parrainRes.json();
      if (p?.device_id && String(p.device_id) === device) return vide;
      if (p?.device_id && tel.length >= 9) {
        const cmdParrain = await sb(
          `orders?guest_token=eq.${encodeURIComponent(String(p.device_id))}` +
            `&select=customer_phone&limit=5`
        );
        if (cmdParrain.ok) {
          const rows = (await cmdParrain.json()) as Array<{ customer_phone?: string }>;
          if (rows.some((o) => telNormalise(o.customer_phone) === tel)) return vide;
        }
      }
    }

    // 4. Plafond du parrain sur 30 jours
    const depuis = new Date(Date.now() - 30 * 86400000).toISOString();
    const comptes = await sb(
      `referral_uses?referrer_code=eq.${encodeURIComponent(String(ligne.referrer_code))}` +
        `&rewarded=eq.true&used_at=gte.${depuis}&select=id`
    );
    if (comptes.ok) {
      const rows = await comptes.json();
      if (Array.isArray(rows) && rows.length >= MAX_FILLEULS_30J) return vide;
    }

    return {
      remise: arrondi(base * TAUX_PARRAINAGE),
      ligneId: Number(ligne.id),
      parrain: String(ligne.referrer_code),
    };
  } catch {
    return vide;
  }
}

/** Le bonus filleul est consommé au moment de la commande, pas avant */
export async function consommerParrainage(ligneId: number): Promise<void> {
  // La table referral_uses n'a pas de colonne order_uuid : on se
  // contente de marquer la ligne consommée (vérifié sur la base).
  try {
    await sb(`referral_uses?id=eq.${ligneId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        consumed: true,
        rewarded: true,
        used_at: new Date().toISOString(),
      }),
    });
  } catch { /* la commande reste valable */ }
}
