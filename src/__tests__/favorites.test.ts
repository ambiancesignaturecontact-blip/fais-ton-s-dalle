/**
 * Test pour les compositions favorites
 */
import { saveFavorite, getFavorites, deleteFavorite } from "@/data/favorites";

describe("Favorites", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("devrait sauvegarder et recuperer un favori", () => {
    const fav = saveFavorite("Mon sandwich", "g", "Menu Gourmand", { viande: ["Tenders"], sauces: ["Algerienne"] });
    expect(fav.name).toBe("Mon sandwich");
    expect(fav.itemId).toBe("g");
    
    const all = getFavorites();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe("Mon sandwich");
  });

  it("devrait supprimer un favori", () => {
    const fav = saveFavorite("Test", "l", "Menu Leger", {});
    expect(getFavorites().length).toBe(1);
    
    deleteFavorite(fav.id);
    expect(getFavorites().length).toBe(0);
  });

  it("devrait limiter a 10 favoris", () => {
    for (let i = 0; i < 15; i++) {
      saveFavorite(`Fav ${i}`, "l", "Menu Leger", {});
    }
    expect(getFavorites().length).toBe(10);
  });
});
