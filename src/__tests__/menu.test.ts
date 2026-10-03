import { getItem, MENU_ITEMS, VIANDES, CRUDITES, SAUCES, SUPPLEMENTS } from "../data/menu";

describe("Menu data", () => {
  test("18 produits", () => expect(MENU_ITEMS.length).toBe(18));
  test("getItem Menu Gourmand", () => {
    const i = getItem("g");
    expect(i?.name).toBe("Menu Gourmand");
    expect(i?.price).toBe(9.9);
  });
  test("getItem inconnu", () => expect(getItem("zzz")).toBeUndefined());
  test("7 viandes", () => expect(VIANDES.length).toBe(7));
  test("6 crudités", () => expect(CRUDITES.length).toBe(6));
  test("9 sauces", () => expect(SAUCES.length).toBe(9));
  test("3 suppléments", () => expect(SUPPLEMENTS.length).toBe(3));
  test("prix tous positifs", () => MENU_ITEMS.forEach(i => expect(i.price).toBeGreaterThan(0)));
});
