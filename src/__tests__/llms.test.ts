import { buildLlmsFullTxt, buildLlmsTxt, BUSINESS } from "../lib/llms-docs";
import { menuJsonLd } from "../lib/menu-jsonld";
import { DEFAULT_SETTINGS, sameDayHoursFixture } from "./fixtures";
import { MENU_ITEMS } from "../data/menu";
import { DELIVERY_CITY_NAMES } from "../data/delivery";

describe("llms.txt (fiche courte IA)", () => {
  const txt = buildLlmsTxt(DEFAULT_SETTINGS);

  test("contient les coordonnées essentielles", () => {
    expect(txt).toContain(BUSINESS.name);
    expect(txt).toContain("134 Allée du Colonel Fabien");
    expect(txt).toContain(BUSINESS.phone);
    expect(txt).toContain("halal");
  });

  test("contient les horaires dynamiques", () => {
    expect(txt).toContain("11h30-3h");
    expect(txt).toContain("7j/7");
  });

  test("pointe vers la fiche complète et les pages clés", () => {
    expect(txt).toContain("https://faistonsdalle.com/llms-full.txt");
    expect(txt).toContain("https://faistonsdalle.com/contact");
    expect(txt).toContain("https://faistonsdalle.com/hors-zone");
    expect(txt).toContain("https://faistonsdalle.com/avis");
  });

  test("suit un changement d'horaires (réglage app)", () => {
    const custom = buildLlmsTxt({
      ...DEFAULT_SETTINGS,
      hours: sameDayHoursFixture,
    });
    expect(custom).toContain("18h-23h");
  });
});

describe("llms-full.txt (fiche complète IA)", () => {
  const txt = buildLlmsFullTxt(DEFAULT_SETTINGS);

  test.each(MENU_ITEMS.map((i) => [i.name, i.price]))(
    "carte : %s à %s €",
    (name, price) => {
      expect(txt).toContain(`**${name}**`);
      expect(txt).toContain(price.toFixed(2).replace(".", ","));
    }
  );

  test("liste les ingrédients de composition", () => {
    expect(txt).toContain("Tenders");
    expect(txt).toContain("Samouraï");
    expect(txt).toContain("Avocat");
    expect(txt).toContain("Mozzarella");
  });

  test("liste toutes les zones de livraison", () => {
    for (const city of DELIVERY_CITY_NAMES) {
      expect(txt).toContain(city.replace(" (77)", ""));
    }
  });

  test("contient la FAQ avec les 7 questions", () => {
    expect(txt).toContain("## Questions fréquentes");
    expect(txt).toContain("Quels sont les horaires");
    expect(txt).toContain("La viande est-elle halal");
    expect(txt).toContain("montant minimum");
  });

  test("horaires jour par jour présents", () => {
    expect(txt).toContain("Lundi au dimanche");
  });
});

describe("menuJsonLd", () => {
  const menu = menuJsonLd("https://faistonsdalle.com");

  test("4 sections avec tous les produits", () => {
    expect(menu["@type"]).toBe("Menu");
    const sections = menu.hasMenuSection;
    expect(sections).toHaveLength(4);
    const totalItems = sections.reduce(
      (n, sec) => n + sec.hasMenuItem.length,
      0
    );
    expect(totalItems).toBe(MENU_ITEMS.length);
  });

  test("prix en euros et images absolues", () => {
    const first = menu.hasMenuSection[0].hasMenuItem[0];
    expect(first.offers.priceCurrency).toBe("EUR");
    expect(Number(first.offers.price)).toBeGreaterThan(0);
    expect(first.image).toMatch(/^https:\/\/faistonsdalle\.com\/images\//);
  });
});
