// ─── Carte de fidélité Apple Wallet, version « pro » ───────────
//
// Trois reproches du gérant, le 02/10/2026 :
//  1. la carte faisait pauvre ;
//  2. le QR n'affichait qu'un numéro de téléphone ;
//  3. l'ajout passe par Safari.
//
// (1) et (2) sont traités ici. (3) demande un module natif, donc un
// nouveau build : documenté dans AUDIT-BUGS.md.

import fs from "fs";
import path from "path";
import { codeCarte, lienCarte, lireCodeCarte } from "@/lib/carte-fidelite";
import { bandeFidelite, bandesFidelite } from "@/lib/wallet-bandes";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");
const wallet = lire("app/api/wallet/route.ts");

describe("Code de la carte", () => {
  test("le lien ne contient plus le téléphone", () => {
    expect(lienCarte(36)).toMatch(/\/carte\/36-[0-9a-f]{16}$/);
    expect(wallet).not.toContain("message: String(client.phone ?? tel)");
  });

  test("un code valide se relit", () => {
    expect(lireCodeCarte(codeCarte(36))).toBe(36);
  });

  test("un code falsifié est rejeté", () => {
    expect(lireCodeCarte("36-0000000000000000")).toBeNull();
    expect(lireCodeCarte("36")).toBeNull();
    expect(lireCodeCarte("")).toBeNull();
  });

  test("on ne peut pas se faire passer pour un autre client", () => {
    const vole = codeCarte(36).replace(/^36/, "37");
    expect(lireCodeCarte(vole)).toBeNull();
  });
});

describe("Bandes visuelles", () => {
  test("une image par état, 0 à 10", () => {
    for (let n = 0; n <= 10; n++) {
      const b = bandeFidelite(n);
      expect(b.length).toBeGreaterThan(500);
      expect(b.subarray(1, 4).toString("ascii")).toBe("PNG");
    }
  });

  test("les états extrêmes ne plantent pas", () => {
    expect(bandeFidelite(-3).equals(bandeFidelite(0))).toBe(true);
    expect(bandeFidelite(99).equals(bandeFidelite(10))).toBe(true);
  });

  test("la progression change bien l'image", () => {
    expect(bandeFidelite(0).equals(bandeFidelite(7))).toBe(false);
  });

  test("les trois tailles exigées par Apple sont présentes", () => {
    const jeu = bandesFidelite(3);
    expect(Object.keys(jeu).sort()).toEqual(
      ["strip.png", "strip@2x.png", "strip@3x.png"]
    );
    // @1x deux fois plus petit que @2x : c'est ce qui manquait
    expect(jeu["strip.png"].length).toBeLessThan(jeu["strip@2x.png"].length);
  });
});

describe("Contenu de la carte", () => {
  test("les TROIS résolutions de la bande sont ajoutées", () => {
    // `strip.png` est la version @1x (375×144). On y avait mis
    // l'image 750×246 : iOS la rognait — « c'est coupé ».
    expect(wallet).toContain("bandesFidelite(tampons)");
    expect(wallet).toContain("pass.addBuffer(nom, image)");
  });

  test("elle sort sur l'écran verrouillé près du restaurant", () => {
    expect(wallet).toContain("pass.setLocations(");
    expect(wallet).toContain("maxDistance: 150");
  });

  test("elle peut ouvrir l'application", () => {
    expect(wallet).toContain("associatedStoreIdentifiers: [6811130537]");
    expect(wallet).toContain("appLaunchURL");
  });

  test("elle ne se partage pas (sinon les tampons circulent)", () => {
    expect(wallet).toContain("sharingProhibited: true");
  });

  test("le verso est complet et cliquable", () => {
    for (const bout of ["Comment ça marche", "tel:+33672044875", "/allergenes"]) {
      expect(wallet).toContain(bout);
    }
  });
});

describe("Validation d'un passage", () => {
  const api = lire("app/api/fidelite/route.ts");

  test("ajouter un tampon exige le mot de passe restaurateur", () => {
    expect(api).toContain('await estAdmin(request.headers.get("X-Admin-Auth"))');
  });

  test("au 10ᵉ menu, la remise s'active et le compteur repart", () => {
    expect(api).toContain("tampons = 0;");
    expect(api).toContain("actif = true;");
  });

  test("la lecture n'expose ni téléphone ni e-mail", () => {
    const f = api.slice(api.indexOf("function publique"), api.indexOf("async function charger"));
    expect(f).not.toContain("phone");
    expect(f).not.toContain("email");
  });
});

describe("Annonces : tous les appareils", () => {
  const push = lire("app/api/push/expo/route.ts");

  test("une annonce ne se limite plus à l'audience « customer »", () => {
    expect(push).toContain("? `marketing_optin=not.is.false`");
  });

  test("le compteur annonce le même nombre que l'envoi", () => {
    expect(push).toContain("rows.filter((r) => r.marketing_optin !== false).length");
  });
});
