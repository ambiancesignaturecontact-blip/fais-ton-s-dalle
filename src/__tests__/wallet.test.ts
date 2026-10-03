// ─── Carte Apple Wallet : les deux pannes de production ────────
//
// 1. « Cannot import model: directory ./public/wallet/fidelite.pass
//    not found » — le dossier public/ n'existe pas forcément dans
//    la fonction serverless Vercel.
// 2. « Invalid PEM formatted message » — on passait un .p12 binaire
//    là où passkit-generator attend du PEM.

import fs from "fs";
import path from "path";
import { MODELE_WALLET, tamponsModele } from "@/lib/wallet-modele";
import { certificatSeul, ouvrirP12 } from "@/lib/wallet-certs";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

describe("Modèle embarqué", () => {
  test("les 6 fichiers du modèle sont dans le code", () => {
    for (const f of [
      "pass.json", "icon.png", "icon@2x.png", "icon@3x.png",
      "logo.png", "logo@2x.png",
    ]) {
      expect(Object.keys(MODELE_WALLET)).toContain(f);
    }
  });

  test("les PNG sont de vrais PNG (entête vérifiée)", () => {
    const b = tamponsModele();
    for (const f of Object.keys(b)) {
      if (!f.endsWith(".png")) continue;
      expect(b[f].subarray(1, 4).toString("ascii")).toBe("PNG");
    }
  });

  test("pass.json est lisible et de type storeCard", () => {
    const j = JSON.parse(tamponsModele()["pass.json"].toString("utf8"));
    expect(j.storeCard).toBeDefined();
    expect(j.passTypeIdentifier).toBe("pass.com.faistonsdalle.fidelite");
    expect(j.teamIdentifier).toBe("NK7HG53G64");
  });

  test("le modèle reste identique aux fichiers sources", () => {
    const dossier = path.join(process.cwd(), "public/wallet/fidelite.pass");
    for (const f of fs.readdirSync(dossier)) {
      const disque = fs.readFileSync(path.join(dossier, f));
      expect(tamponsModele()[f].equals(disque)).toBe(true);
    }
  });

  test("la route ne lit plus le disque", () => {
    const src = lire("app/api/wallet/route.ts");
    // (la chaîne apparaît encore dans un commentaire d'explication :
    //  on vérifie donc une vraie ligne de code, pas le mot)
    expect(src).not.toMatch(/^\s*model: "\.\/public/m);
    expect(src).toContain("tamponsModele()");
  });
});

describe("Certificats", () => {
  test("un .cer en DER est converti en PEM", () => {
    const der = Buffer.from([0x30, 0x82, 0x01, 0x02, 0x03]);
    const pem = certificatSeul(der.toString("base64"));
    expect(pem).toContain("-----BEGIN CERTIFICATE-----");
    expect(pem).toContain("-----END CERTIFICATE-----");
  });

  test("du PEM déjà encodé en base64 est rendu tel quel", () => {
    const pem = "-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----\n";
    expect(certificatSeul(Buffer.from(pem).toString("base64"))).toContain("BEGIN CERTIFICATE");
  });

  test("un mauvais mot de passe donne un message compréhensible", () => {
    // Un .p12 invalide suffit : on vérifie qu'on ne laisse jamais
    // remonter une erreur cryptique de node-forge.
    expect(() => ouvrirP12(Buffer.from("pas un p12").toString("base64"), "x"))
      .toThrow();
  });

  test("la route convertit avant de signer", () => {
    const src = lire("app/api/wallet/route.ts");
    expect(src).toContain("certificatsWallet()");
    expect(src).not.toContain('signerCert: Buffer.from(CERT_P12!, "base64")');
  });
});
