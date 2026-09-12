// ─── Stock du site web — version synchronisée ──────────────────
//
// Remplace l'ancien module. Trois défauts corrigés, tous constatés
// en production le 15/08/2026 :
//
// 1. `saveStock()` envoyait ses PATCH SANS l'en-tête X-Admin-Auth.
//    Le serveur répondait 401 sur chacun, l'erreur était avalée par
//    un `catch {}` vide et l'interface affichait quand même
//    « Stock mis à jour ✅ ». Le patron croyait avoir signalé une
//    rupture ; rien n'était enregistré, et l'application n'en voyait
//    évidemment rien. C'était LE bug de désynchronisation.
//
// 2. `isItemAvailable()` comparait des libellés accentués
//    (« Samouraï », « Menu Léger », « Carottes râpées ») à des clés
//    de base sans accents (« Samourai »…), plus des libellés
//    contenant le prix (« Coulis chocolat (+1,00 €) »). 11 articles
//    sur 53 ne pouvaient donc jamais passer en rupture côté site.
//
// 3. Le module lisait `localStorage` en priorité : un navigateur
//    ayant vu le stock une fois gardait sa copie pour toujours.
//    localStorage n'est plus qu'un filet de sécurité hors ligne.
//
// 4. 53 requêtes PATCH en série à chaque enregistrement → remplacé
//    par un seul appel groupé.

import { stockKey } from "./stock-key";

export interface StockCell {
  quantity: number;
  unlimited: boolean;
}
export type Stock = Record<string, StockCell>;

/** Catégories affichées dans l'admin du site. */
export const STOCK_CATEGORIES: { key: string; label: string; items: string[] }[] = [
  { key: "viandes", label: "Viandes", items: [
    "Tenders", "Émincé poulet", "Blanc dinde", "Jambon dinde", "Pastrami", "Rosette", "Thon",
  ]},
  { key: "crudites", label: "Crudités", items: [
    "Salade", "Tomate", "Oignons", "Mais", "Carottes râpées", "Avocat",
  ]},
  { key: "sauces", label: "Sauces", items: [
    "Mayo", "Ketchup", "Algérienne", "Samouraï", "Blanche", "Moutarde", "Brésil", "Chili", "Thai",
  ]},
  { key: "supplements", label: "Suppléments", items: ["Cheddar", "Mozzarella", "Feta"] },
  { key: "tiramisu", label: "Parfums tiramisu", items: ["Caramel speculos", "Chocolat", "Oreo"] },
  { key: "milkshakes", label: "Parfums milkshake", items: [
    "Kinder Bueno", "Kinder Bueno White", "Snickers", "Oreo", "KitKat", "KitKat White", "Milka",
  ]},
  { key: "boissons", label: "Boissons", items: [
    "Coca-Cola", "Coca Zero", "Oasis Tropical", "Ice Tea", "Orangina",
    "Cristaline", "San Pellegrino", "Coca-Cola Cherry",
  ]},
  { key: "menus", label: "Menus & bowls", items: [
    "Menu Leger", "Menu Classique", "Menu Gourmand", "Menu Royal",
    "Bowl Leger", "Bowl Classique", "Bowl Gourmand", "Bowl Royal",
  ]},
  { key: "desserts", label: "Desserts", items: ["Tiramisu", "Milkshake"] },
];

const LS_KEY = "ftsd_stock";

let cache: Stock | null = null;
let keyed: Record<string, StockCell> = {};
let fetchedAt = 0;
const TTL = 15_000;

export function getDefaultStock(): Stock {
  const s: Stock = {};
  for (const cat of STOCK_CATEGORIES) {
    for (const item of cat.items) s[item] = { quantity: 999, unlimited: true };
  }
  return s;
}

function reindex(s: Stock) {
  const out: Record<string, StockCell> = {};
  for (const [name, cell] of Object.entries(s)) {
    const k = stockKey(name);
    const prev = out[k];
    // Doublon (« Oreo » = dessert + milkshake) : le plus restrictif gagne
    if (!prev || (prev.unlimited && !cell.unlimited) ||
        (!prev.unlimited && !cell.unlimited && cell.quantity < prev.quantity)) {
      out[k] = cell;
    }
  }
  keyed = out;
}

function readLocal(): Stock | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Stock) : null;
  } catch { return null; }
}

/**
 * Lit le stock. Le serveur fait toujours autorité ; localStorage ne
 * sert qu'en cas de coupure réseau.
 */
export async function getStock(force = false): Promise<Stock> {
  const now = Date.now();
  if (!force && cache && now - fetchedAt < TTL) return cache;
  try {
    const res = await fetch(`/api/stock?t=${now}`, { cache: "no-store" });
    const json = await res.json();
    if (json?.stock && Object.keys(json.stock).length > 0) {
      cache = json.stock as Stock;
      // Le serveur fournit déjà l'index normalisé depuis la mise à jour
      keyed = (json.keyed as Record<string, StockCell>) ?? {};
      if (!Object.keys(keyed).length) reindex(cache);
      fetchedAt = now;
      try { localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch {}
      return cache;
    }
  } catch { /* hors ligne : on retombe sur la copie locale */ }

  const local = readLocal() ?? getDefaultStock();
  cache = local;
  reindex(local);
  fetchedAt = now;
  return local;
}

/**
 * Un article est-il commandable ? Insensible aux accents et au
 * suffixe de prix. Renvoie true par défaut : une panne de réseau ne
 * doit jamais empêcher une commande.
 */
export function isItemAvailable(name: string): boolean {
  const cell = keyed[stockKey(name)];
  if (!cell) return true;
  if (cell.unlimited) return true;
  return cell.quantity > 0;
}

/** Liste des articles épuisés, pour le bandeau d'information. */
export function outOfStockNames(): string[] {
  if (!cache) return [];
  return Object.entries(cache)
    .filter(([, c]) => !c.unlimited && c.quantity <= 0)
    .map(([n]) => n);
}

/**
 * Enregistre les modifications (admin uniquement).
 *
 * @param next     état complet souhaité
 * @param password mot de passe admin — OBLIGATOIRE, c'est son absence
 *                 qui rendait l'ancienne version totalement inopérante
 * @param previous état précédent, pour n'envoyer que les différences
 */
export async function saveStock(
  next: Stock,
  password: string,
  previous?: Stock | null
): Promise<{ ok: boolean; error?: string; changed: number }> {
  if (!password) {
    return { ok: false, error: "Mot de passe admin manquant", changed: 0 };
  }

  const before = previous ?? cache ?? {};
  const soldOut: string[] = [];
  const back: string[] = [];
  const exact: { itemName: string; quantity: number }[] = [];

  for (const [name, cell] of Object.entries(next)) {
    const old = before[name];
    if (old && old.quantity === cell.quantity && old.unlimited === cell.unlimited) continue;
    if (!cell.unlimited && cell.quantity <= 0) soldOut.push(name);
    else if (cell.unlimited) back.push(name);
    else exact.push({ itemName: name, quantity: cell.quantity });
  }

  const changed = soldOut.length + back.length + exact.length;
  if (!changed) return { ok: true, changed: 0 };

  const headers = { "Content-Type": "application/json", "X-Admin-Auth": password };

  try {
    // Deux appels groupés au lieu de 53 requêtes en série
    if (soldOut.length) {
      const r = await fetch("/api/stock", {
        method: "POST", headers,
        body: JSON.stringify({ action: "bulk", names: soldOut, soldOut: true }),
      });
      if (!r.ok) return { ok: false, error: await errText(r), changed: 0 };
    }
    if (back.length) {
      const r = await fetch("/api/stock", {
        method: "POST", headers,
        body: JSON.stringify({ action: "bulk", names: back, soldOut: false }),
      });
      if (!r.ok) return { ok: false, error: await errText(r), changed: 0 };
    }
    for (const e of exact) {
      const r = await fetch("/api/stock", {
        method: "PATCH", headers, body: JSON.stringify(e),
      });
      if (!r.ok) return { ok: false, error: await errText(r), changed: 0 };
    }
  } catch {
    return { ok: false, error: "Réseau indisponible", changed: 0 };
  }

  // On relit le serveur : l'affichage montre ce qui est réellement
  // enregistré, jamais ce qu'on espérait enregistrer.
  cache = null;
  await getStock(true);
  return { ok: true, changed };
}

async function errText(r: Response): Promise<string> {
  if (r.status === 401) return "Mot de passe admin refusé — reconnectez-vous";
  try {
    const j = await r.json();
    return j?.error ?? `Erreur ${r.status}`;
  } catch { return `Erreur ${r.status}`; }
}

/** Remet tout en illimité (début de service). */
export async function resetStock(password: string): Promise<{ ok: boolean; error?: string }> {
  if (!password) return { ok: false, error: "Mot de passe admin manquant" };
  try {
    const r = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Auth": password },
      body: JSON.stringify({ action: "reset_all" }),
    });
    if (!r.ok) return { ok: false, error: await errText(r) };
  } catch { return { ok: false, error: "Réseau indisponible" }; }
  cache = null;
  await getStock(true);
  return { ok: true };
}
