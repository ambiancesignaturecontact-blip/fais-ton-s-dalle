// ─── Trois demandes du 02/10/2026 ─────────────────────────────
//
// 1. voir le PIN d'un livreur sans devoir en générer un nouveau ;
// 2. la récompense « menu offert » se retire sur place ;
// 3. plus de palier fantôme (voir pricing.test.ts côté app).

import fs from "fs";
import path from "path";
import { chiffrerPin, dechiffrerPin, pinValide, pinAuHasard } from "@/lib/pin-livreur";
import { valeurMenuOffert } from "@/lib/remises";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");
const driver = lire("app/api/driver/route.ts");

describe("Code PIN consultable", () => {
  test("ce qui est chiffré se relit", () => {
    expect(dechiffrerPin(chiffrerPin("2026"))).toBe("2026");
  });

  test("deux chiffrements du même PIN diffèrent (vecteur aléatoire)", () => {
    expect(chiffrerPin("2026")).not.toBe(chiffrerPin("2026"));
  });

  test("illisible sans la bonne clé", () => {
    const avant = process.env.PIN_SECRET;
    process.env.PIN_SECRET = "cle-a";
    const chiffre = chiffrerPin("2026");
    process.env.PIN_SECRET = "cle-b";
    expect(dechiffrerPin(chiffre)).toBeNull();
    process.env.PIN_SECRET = avant;
  });

  test("une valeur abîmée ne fait pas planter", () => {
    expect(dechiffrerPin("n'importe quoi")).toBeNull();
    expect(dechiffrerPin(null)).toBeNull();
    expect(dechiffrerPin("")).toBeNull();
  });

  test("les codes trop évidents sont refusés", () => {
    for (const mauvais of ["0000", "1234", "1111", "123", "abcd", "12345"]) {
      expect(pinValide(mauvais)).toBe(false);
    }
    expect(pinValide("2026")).toBe(true);
  });

  test("le tirage au hasard respecte la règle", () => {
    for (let i = 0; i < 200; i++) expect(pinValide(pinAuHasard())).toBe(true);
  });

  test("le PIN n'est déchiffré que pour l'admin authentifié", () => {
    const bloc = driver.slice(driver.indexOf("if (admin)"), driver.indexOf("const token"));
    expect(bloc).toContain("estAdmin(admin)");
    expect(bloc).toContain("dechiffrerPin");
  });

  test("on peut CHOISIR le code, pas seulement le subir", () => {
    expect(driver).toContain("const choisi = String(body?.pin ?? \"\").trim()");
    expect(driver).toContain("pinValide(choisi)");
  });

  test("la liste survit si le bloc SQL 8 n'est pas passé", () => {
    // Sans ce repli, pousser le site avant d'exécuter le SQL
    // viderait entièrement la liste des livreurs.
    expect(driver).toContain("res = await sb(`drivers?select=${champs}&order=created_at.desc`)");
  });
});

describe("Le menu offert se retire sur place", () => {
  const remises = lire("lib/remises.ts");

  test("aucune remise en livraison", () => {
    expect(remises).toContain('if (mode === "livraison") return { remise: 0, clientId: null };');
  });

  test("et la récompense n'est pas consommée pour autant", () => {
    // clientId à null ⇒ `consommerFidelite` n'est jamais appelé
    const bloc = remises.slice(remises.indexOf('if (mode === "livraison")'));
    expect(bloc.slice(0, 80)).toContain("clientId: null");
  });

  test("le calcul du menu offert reste correct", () => {
    expect(valeurMenuOffert([{ name: "Menu Royal" }])).toBe(7.9);
    expect(valeurMenuOffert([{ name: "Menu Léger" }])).toBe(6.9);
    expect(valeurMenuOffert([{ name: "Coca-Cola" }])).toBe(0);
  });
});
