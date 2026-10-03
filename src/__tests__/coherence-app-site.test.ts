// ─── Le site et l'app doivent dire EXACTEMENT la même chose ───
//
// Bugs réels trouvés en comparant les deux :
//   · la sauce « Thaï » s'appelait « Thai » sur le site → une
//     rupture de stock déclarée dans l'admin n'était pas appliquée
//     au site, le client pouvait commander une sauce épuisée ;
//   · « Caramel spéculoos » s'appelait « Caramel speculos » → même
//     problème, et deux orthographes sur les tickets de cuisine ;
//   · les coulis portaient le prix DANS leur nom
//     (« Coulis chocolat (+1,00 €) ») : ça partait tel quel en
//     cuisine et ne correspondait à aucune ligne de stock.

import fs from "fs";
import path from "path";

const APP = path.join(__dirname, "../../../ftsd-ios/src/data/menu.ts");
const SITE = path.join(__dirname, "../data/menu.ts");

function listeDe(fichier: string, nom: string): string[] {
  const src = fs.readFileSync(fichier, "utf8");
  const m = new RegExp(`export const ${nom} = \\[(.*?)\\] as const;`, "s").exec(src);
  if (!m) throw new Error(`${nom} introuvable dans ${fichier}`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

const LISTES = [
  "VIANDES", "CRUDITES", "SAUCES", "SUPPLEMENTS",
  "TIRAMISU_PARFUMS", "MILKSHAKE_CHOIX", "MILKSHAKE_COULIS", "CUISSON",
];

describe("Ingrédients : app et site, mot pour mot", () => {
  test.each(LISTES)("%s est identique des deux côtés", (nom) => {
    expect(listeDe(SITE, nom)).toEqual(listeDe(APP, nom));
  });

  test("aucun prix caché dans un nom d'ingrédient", () => {
    for (const nom of LISTES) {
      for (const item of listeDe(SITE, nom)) {
        expect(item).not.toMatch(/[€]|\+\d/);
      }
    }
  });

  test("les accents des noms sensibles sont respectés", () => {
    const sauces = listeDe(SITE, "SAUCES");
    expect(sauces).toContain("Thaï");
    expect(sauces).not.toContain("Thai");
    expect(listeDe(SITE, "TIRAMISU_PARFUMS")).toContain("Caramel spéculoos");
  });

  test("le stock du site vise les mêmes noms", () => {
    const stock = fs.readFileSync(path.join(__dirname, "../data/stock.ts"), "utf8");
    const libStock = fs.readFileSync(path.join(__dirname, "../lib/stock.ts"), "utf8");
    for (const src of [stock, libStock]) {
      expect(src).toContain("Thaï");
      expect(src).toContain("Caramel spéculoos");
      expect(src).not.toMatch(/"Thai"/);
      expect(src).not.toMatch(/speculos"/);
    }
  });
});

describe("Orthographe des textes clients", () => {
  const FAUTES: [RegExp, string][] = [
    // « remiseFidelite » est un nom de fonction, pas un texte client :
    // on ne cherche la faute que dans les chaînes affichées.
    [/["'`][^"'`\n]*\bFidelite\b/, "Fidélité"],
    [/\bSecurite\b/, "Sécurité"],
    [/\bCreations\b/, "Créations"],
    [/"Prenom"/, "Prénom"],
    [/"Telephone"/, "Téléphone"],
    [/\bmises a jour\b/, "mises à jour"],
    [/\bspeculos\b/, "spéculoos"],
    [/\bacceuil\b/, "accueil"],
    [/\baddresse\b/, "adresse"],
    [/\bparcontre\b/, "par contre"],
    [/\bmalgres\b/, "malgré"],
    [/\bpaiment\b/, "paiement"],
    [/\bcomande\b/, "commande"],
    [/\bpersonalis/, "personnalis…"],
    [/\bprofessionel/, "professionnel…"],
    [/\bPAYEE\b/, "PAYÉE"],
  ];

  function fichiers(): string[] {
    const out: string[] = [];
    const parcourir = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== "__tests__") parcourir(p); }
        else if (/\.tsx?$/.test(e.name)) out.push(p);
      }
    };
    parcourir(path.join(__dirname, ".."));
    return out;
  }

  test.each(FAUTES)("%s n'apparaît nulle part", (motif, correction) => {
    const trouves: string[] = [];
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8");
      // on ignore les chemins d'images et les URL
      const propre = src
        .replace(/["'`][^"'`\n]*\.(webp|png|jpg|svg)["'`]/g, "")
        .replace(/https?:\/\/\S+/g, "");
      if (motif.test(propre)) {
        trouves.push(`${path.relative(path.join(__dirname, ".."), f)} (attendu : ${correction})`);
      }
    }
    expect(trouves).toEqual([]);
  });
});
