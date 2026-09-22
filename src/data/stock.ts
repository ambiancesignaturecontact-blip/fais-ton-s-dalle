// ─── Gestion des stocks ───────────────────────────────────────────
// Stocké dans Supabase (API) + localStorage en fallback

export interface StockItem {
  quantity: number;
  unlimited: boolean;
}

export type StockMap = Record<string, StockItem>;

export const STOCK_CATEGORIES = [
  {
    key: "viandes",
    label: "Viandes",
    items: ["Tenders","Émincé poulet","Blanc dinde","Jambon dinde","Pastrami","Rosette","Thon"],
  },
  {
    key: "crudites",
    label: "Crudités",
    items: ["Salade","Tomate","Oignons","Mais","Carottes râpées","Avocat"],
  },
  {
    key: "sauces",
    label: "Sauces",
    items: ["Mayo","Ketchup","Algérienne","Samouraï","Blanche","Moutarde","Brésil","Chili","Thai"],
  },
  {
    key: "supplements",
    label: "Suppléments",
    items: ["Cheddar","Mozzarella","Feta"],
  },
  {
    key: "tiramisu",
    label: "Tiramisu (parfums)",
    items: ["Caramel speculos","Chocolat","Oreo"],
  },
  {
    key: "milkshakes",
    label: "Milkshakes",
    items: ["Kinder Bueno","Kinder Bueno White","Snickers","Oreo","KitKat","KitKat White","Milka"],
  },
  {
    key: "coulis",
    label: "Suppléments milkshake",
    items: ["Coulis chocolat (+1,00 €)","Coulis caramel (+1,00 €)","Chantilly (+1,00 €)"],
  },
  {
    key: "boissons",
    label: "Boissons",
    items: ["Coca-Cola","Coca Zero","Oasis Tropical","Ice Tea","Orangina","Cristaline","San Pellegrino","Coca-Cola Cherry"],
  },
  {
    key: "produits",
    label: "Menus & produits",
    items: ["Menu Léger","Menu Classique","Menu Gourmand","Menu Royal","Bowl","Bowl + Boisson","Tiramisu","Milkshake"],
  },
];

/** Cache pour éviter les appels API répétés */
let cachedStock: StockMap | null = null;

export function getDefaultStock(): StockMap {
  const stock: StockMap = {};
  for (const cat of STOCK_CATEGORIES) {
    for (const item of cat.items) {
      stock[item] = { quantity: 999, unlimited: true };
    }
  }
  return stock;
}

function getLocalStock(): StockMap {
  if (typeof window === "undefined") return getDefaultStock();
  try {
    const raw = localStorage.getItem("ftsd_stock");
    if (raw) return JSON.parse(raw);
  } catch {}
  const def = getDefaultStock();
  localStorage.setItem("ftsd_stock", JSON.stringify(def));
  return def;
}

/**
 * Récupère le stock depuis l'API Supabase (ou localStorage en fallback)
 */
export async function getStock(): Promise<StockMap> {
  if (cachedStock) return cachedStock;
  try {
    const res = await fetch("/api/stock");
    const data = await res.json();
    if (data.stock && Object.keys(data.stock).length > 0) {
      cachedStock = data.stock;
      // Sync dans localStorage pour le fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("ftsd_stock", JSON.stringify(data.stock));
      }
      return data.stock;
    }
  } catch {}
  // Fallback localStorage
  const local = getLocalStock();
  cachedStock = local;
  return local;
}

/**
 * Sauvegarde le stock dans Supabase + localStorage
 */
export async function saveStock(stock: StockMap) {
  cachedStock = stock;
  if (typeof window !== "undefined") {
    localStorage.setItem("ftsd_stock", JSON.stringify(stock));
  }
  // Sauvegarde chaque item dans Supabase
  for (const [itemName, item] of Object.entries(stock)) {
    try {
      await fetch("/api/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_name: itemName, quantity: item.quantity, unlimited: item.unlimited }),
      });
    } catch {}
  }
}

/**
 * Vérifie si un item est disponible (synchrone, utilise le cache)
 */
export function isItemAvailable(itemName: string): boolean {
  try {
    const stock = cachedStock || getLocalStock();
    const s = stock[itemName];
    if (!s) return true;
    if (s.unlimited) return true;
    return s.quantity > 0;
  } catch { return true; }
}

/**
 * Décrémente le stock d'un item (après commande)
 */
export function consumeStock(itemName: string, qty = 1) {
  const stock = cachedStock || getLocalStock();
  const s = stock[itemName];
  if (!s || s.unlimited) return;
  s.quantity = Math.max(0, s.quantity - qty);
  if (typeof window !== "undefined") {
    localStorage.setItem("ftsd_stock", JSON.stringify(cachedStock || stock));
  }
}
