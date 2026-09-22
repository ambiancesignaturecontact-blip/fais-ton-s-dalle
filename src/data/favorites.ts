// ─── Compositions favorites ─────────────────────────────────
// Stocké dans localStorage sous "ftsd_favorites"

export interface FavoriteComposition {
  id: string;
  name: string;
  itemId: string;
  itemName: string;
  selections: Record<string, string[]>;
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

const STORAGE_KEY = "ftsd_favorites";

export function getFavorites(): FavoriteComposition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveFavorites(favorites: FavoriteComposition[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); } catch {}
}

export function saveFavorite(name: string, itemId: string, itemName: string, selections: Record<string, string[]>): FavoriteComposition {
  const favorites = getFavorites();
  const newFav: FavoriteComposition = {
    id: "fav_" + Date.now(),
    name,
    itemId,
    itemName,
    selections: JSON.parse(JSON.stringify(selections)),
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    useCount: 1,
  };
  // Limite à 10 favoris
  favorites.unshift(newFav);
  saveFavorites(favorites.slice(0, 10));
  return newFav;
}

export function deleteFavorite(id: string) {
  const favorites = getFavorites().filter(f => f.id !== id);
  saveFavorites(favorites);
}

export function useFavorite(id: string) {
  const favorites = getFavorites();
  const fav = favorites.find(f => f.id === id);
  if (fav) {
    fav.lastUsed = new Date().toISOString();
    fav.useCount += 1;
    saveFavorites(favorites);
  }
}
