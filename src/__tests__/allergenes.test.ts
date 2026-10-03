// ─── Allergènes côté site — même source que l'app ─────────────
import fs from "fs";
import path from "path";
import {
  ALLERGENES_OFFICIELS, ALLERGENES_INGREDIENT, allergenesDe,
  allergenesComposes, MENTION_TRACES, MENTION_LEGALE,
} from "../data/allergenes";

describe("Données", () => {
  test("les 14 allergènes réglementaires", () => {
    expect(ALLERGENES_OFFICIELS).toHaveLength(14);
  });

  test("le thon déclare bien le poisson", () => {
    expect(allergenesDe("Thon")).toContain("Poissons");
  });

  test("un sandwich se calcule sur les choix réels", () => {
    const r = allergenesComposes(["Émincé poulet", "Ketchup"], true);
    expect(r).toContain("Gluten");
    expect(r).not.toContain("Moutarde");
  });

  test("identique à l'application (même fichier)", () => {
    const site = fs.readFileSync(path.join(__dirname, "../data/allergenes.ts"), "utf8");
    const app = fs.readFileSync(
      path.join(__dirname, "../../../ftsd-ios/src/data/allergenes.ts"),
      "utf8"
    );
    // Une divergence entre le site et l'app serait une information
    // contradictoire sur un sujet de santé.
    expect(site).toBe(app);
  });
});

describe("Page /allergenes", () => {
  const page = fs.readFileSync(
    path.join(__dirname, "../app/allergenes/page.tsx"),
    "utf8"
  );

  test("affiche la mention de traces et la base légale", () => {
    expect(page).toContain("MENTION_TRACES");
    expect(page).toContain("MENTION_LEGALE");
    expect(MENTION_LEGALE).toContain("1169/2011");
    expect(MENTION_TRACES).toMatch(/traces/i);
  });

  test("liste toutes les familles d'ingrédients", () => {
    for (const f of ["Pain", "Viandes", "Crudités", "Sauces", "Suppléments", "Desserts", "Milkshakes"]) {
      expect(page).toContain(`titre: "${f}"`);
    }
  });

  test("est indexable et dans le sitemap", () => {
    const sitemap = fs.readFileSync(path.join(__dirname, "../app/sitemap.ts"), "utf8");
    expect(sitemap).toContain("/allergenes");
  });

  test("est accessible depuis le pied de page", () => {
    const footer = fs.readFileSync(
      path.join(__dirname, "../components/layout/Footer.tsx"),
      "utf8"
    );
    expect(footer).toContain('href="/allergenes"');
  });

  test("référence tous les ingrédients connus", () => {
    const manquants = Object.keys(ALLERGENES_INGREDIENT).filter(
      (i) => !page.includes(`"${i}"`)
    );
    // Les boissons sont sur la carte, pas dans ce tableau
    const boissons = ["Coca-Cola", "Coca Zero", "Coca-Cola Cherry",
      "Oasis Tropical", "Ice Tea", "Orangina", "Cristaline", "San Pellegrino"];
    expect(manquants.filter((m) => !boissons.includes(m))).toEqual([]);
  });
});

describe("Allergènes pendant la composition (site)", () => {
  const modal = fs.readFileSync(
    path.join(__dirname, "../components/menu/CustomizationModal.tsx"),
    "utf8"
  );

  test("la liste suit les ingrédients choisis", () => {
    expect(modal).toContain("allergenesComposes(");
    expect(modal).toContain("Object.values(sel).flat()");
  });

  test("le pain n'est compté que pour un sandwich", () => {
    expect(modal).toContain('item?.category === "menus"');
  });

  test("la mention de traces et le lien complet sont affichés", () => {
    expect(modal).toContain("MENTION_TRACES");
    expect(modal).toContain("/allergenes");
  });
});
