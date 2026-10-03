// ─── 🔴 Les suppléments étaient offerts ────────────────────────
//
// Trouvé le 02/10/2026. `/api/order` comptait les suppléments avec
//     (custom.match(/Crudité/gi) || []).length
// soit le nombre d'ÉTIQUETTES, pas d'ingrédients. « Crudites:
// Salade, Tomate, Oignons, Avocat, Mais » comptait pour 1.
//
// Mesuré avant correction, sur un Menu Classique à 7,90 € avec
// 2 viandes, 5 crudités, 3 sauces et 2 suppléments :
//   facturé 7,90 € au lieu de 12,90 €  →  5,00 € perdus.

import {
  lireComposition, ecrireComposition, prixLigne, comptePayants, quotasPour,
} from "@/lib/composition";

const CHARGE =
  "Viande: Tenders, Pastrami | Crudites: Salade, Tomate, Oignons, Avocat, Mais" +
  " | Sauce: Algérienne, Blanche, Samouraï | Suppléments: Cheddar, Feta";

describe("Lecture de la composition", () => {
  test("chaque famille est séparée en ingrédients", () => {
    const c = lireComposition(CHARGE);
    expect(c.viande).toEqual(["Tenders", "Pastrami"]);
    expect(c.crudites).toHaveLength(5);
    expect(c.sauces).toEqual(["Algérienne", "Blanche", "Samouraï"]);
    expect(c.supplements).toEqual(["Cheddar", "Feta"]);
  });

  test("les étiquettes au singulier, pluriel ou sans accent sont reconnues", () => {
    const c = lireComposition("Crudité: Salade | Crudites: Tomate | Sauces: Mayo");
    expect(c.crudites).toEqual(["Salade", "Tomate"]);
    expect(c.sauces).toEqual(["Mayo"]);
  });

  test("les mentions de prix ne sont jamais relues", () => {
    const c = lireComposition("Viande: Tenders | crudités sup +2,00€");
    expect(c.autres ?? []).toHaveLength(0);
  });

  test("ce qu'on lit, on sait le réécrire", () => {
    expect(ecrireComposition(lireComposition(CHARGE))).toBe(CHARGE);
  });

  test("une composition vide ne casse rien", () => {
    expect(lireComposition(null)).toEqual({});
    expect(prixLigne("Menu Classique", null)).toBe(7.9);
  });
});

describe("Facturation des suppléments", () => {
  test("le Menu Classique inclut 3 crudités, le Léger 2", () => {
    expect(quotasPour("Menu Classique").crudites).toBe(3);
    expect(quotasPour("Menu Léger").crudites).toBe(2);
  });

  test("5 suppléments comptés (c'était 0 avant)", () => {
    expect(comptePayants("Menu Classique", lireComposition(CHARGE))).toBe(5);
  });

  test("le cas réel : 7,90 € → 12,90 €", () => {
    expect(prixLigne("Menu Classique", CHARGE)).toBe(12.9);
  });

  test("retirer des ingrédients fait baisser le prix", () => {
    expect(
      prixLigne("Menu Classique", "Viande: Tenders | Crudites: Salade, Tomate | Sauce: Algérienne")
    ).toBe(7.9);
  });

  test("ce qui est inclus reste gratuit", () => {
    expect(
      prixLigne("Menu Classique",
        "Viande: Tenders | Crudites: Salade, Tomate, Oignons | Sauce: Mayo, Ketchup | Suppléments: Cheddar")
    ).toBe(7.9);
  });

  test("un ingrédient vendu seul reste à 1,00 €", () => {
    expect(prixLigne("Supplément cheddar", null, 1.0)).toBe(1);
  });

  test("une boisson n'a pas de suppléments", () => {
    expect(prixLigne("Coca-Cola", null)).toBe(1.5);
  });
});

describe("Un seul calcul de prix dans tout le site", () => {
  const fs = jest.requireActual("fs") as typeof import("fs");
  const path = jest.requireActual("path") as typeof import("path");
  const lire = (p: string) =>
    fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

  test("la création de commande utilise le module", () => {
    expect(lire("app/api/order/route.ts")).toContain("prixLigne(");
  });

  test("la modification admin aussi", () => {
    expect(lire("app/api/admin/orders/route.ts")).toContain("prixLigne(");
  });

  test("plus personne ne compte les étiquettes", () => {
    for (const f of ["app/api/order/route.ts", "app/api/admin/orders/route.ts"]) {
      expect(lire(f)).not.toContain("match(/Crudité/gi)");
    }
  });
});
