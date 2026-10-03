// ─── Reçu PDF + notifications étape par étape ─────────────────

import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { genererRecu, detailTva, ENTREPRISE, TAUX_TVA } from "../lib/recu-pdf";
import { ETAPES } from "../lib/notifier-client";

const lire = (f: string) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");

describe("Reçu PDF", () => {
  const commande = {
    reference: "#42",
    date: new Date("2026-09-30T20:15:00"),
    client: "Jean Dupont",
    telephone: "0612345678",
    mode: "livraison",
    adresse: "12 Avenue Aristide Briand, 93320 Les Pavillons-sous-Bois",
    lignes: [
      { nom: "Menu Royal", quantite: 1, prixUnitaire: 15.9, personnalisation: "Viande: Tenders | Sauce: Algérienne" },
      { nom: "Coca-Cola", quantite: 2, prixUnitaire: 1.5, personnalisation: null },
    ],
    fraisLivraison: 2.9,
    remise: 1.59,
    pourboire: 1.5,
    total: 20.71,
    moyenPaiement: "carte bancaire",
    codePromo: "MERCI-AB12CD",
  };

  test("produit un PDF valide d'une page", async () => {
    const octets = await genererRecu(commande);
    const relu = await PDFDocument.load(octets);
    expect(relu.getPageCount()).toBe(1);
    expect(relu.getTitle()).toContain("#42");
  });

  test("les emojis ne font pas échouer la génération", async () => {
    // Les polices PDF standard ne les connaissent pas : sans
    // nettoyage, la génération plantait et le client n'avait rien.
    const octets = await genererRecu({
      ...commande,
      lignes: [{ nom: "Tiramisu 🍰", quantite: 1, prixUnitaire: 3, personnalisation: "Parfum : Oreo — œuf 🥚" }],
    });
    expect(octets.length).toBeGreaterThan(1000);
  });

  test("TVA à 10 %, pourboire exclu de la base", () => {
    expect(TAUX_TVA).toBe(0.1);
    const d = detailTva(20.71, 1.5);
    expect(d.baseTtc).toBeCloseTo(19.21, 2);
    expect(d.ht).toBeCloseTo(17.46, 2);
    expect(d.tva).toBeCloseTo(1.75, 2);
  });

  test("sans pourboire, toute la somme est dans la base", () => {
    const d = detailTva(11, 0);
    expect(d.ht + d.tva).toBeCloseTo(11, 2);
  });

  test("mentions légales de l'entreprise", () => {
    expect(ENTREPRISE.siret).toBe("803 191 600 00037");
    const src = lire("lib/recu-pdf.ts");
    expect(src).toContain("ne constitue pas une facture");
    expect(src).toContain("allergenes");
  });
});

describe("Accès au reçu", () => {
  const route = lire("app/api/recu/route.ts");

  test("refuse un inconnu", () => {
    expect(route).toContain("Non autorisé");
    expect(route).toContain("guest_token");
  });

  test("accepte le jeton de l'appareil, le téléphone ou l'admin", () => {
    expect(route).toContain("token === String(o.guest_token");
    expect(route).toContain("await estAdmin(admin)");
  });

  test("renvoie bien un PDF", () => {
    expect(route).toContain('"Content-Type": "application/pdf"');
  });

  test("est envoyé par e-mail après paiement", () => {
    const webhook = lire("app/api/stripe/webhook/route.ts");
    expect(webhook).toContain("envoyerRecuParEmail");
  });
});

describe("Notifications étape par étape", () => {
  test("les six étapes du client existent", () => {
    for (const e of ["confirmed", "preparing", "ready", "en-route", "arrived", "delivered"]) {
      expect(ETAPES[e as keyof typeof ETAPES]).toBeTruthy();
    }
  });

  test("tous les textes vouvoient", () => {
    for (const e of Object.values(ETAPES)) {
      const txt = `${e.title} ${e.body}`.replace(/FAIS TON S'DALLE/gi, "");
      expect(/\b(tu|ton|ta|tes|toi)\b/i.test(txt)).toBe(false);
    }
  });

  test("les étapes urgentes percent le mode Concentration", () => {
    const src = lire("lib/notifier-client.ts");
    expect(src).toContain("time-sensitive");
    expect(src).toContain('URGENTES: StatutCommande[] = ["ready", "en-route", "arrived"]');
  });

  test("l'admin prévient le client à chaque changement", () => {
    const src = lire("app/api/admin/orders/route.ts");
    expect(src).toContain("notifierClient(uuid, status)");
  });

  test("le livreur déclenche « en route », « arrivé » et « livré »", () => {
    const src = lire("app/api/driver/route.ts");
    expect(src).toContain('notifierClient(o.uuid, "en-route")');
    expect(src).toContain('notifierClient(uuid, "arrived")');
    expect(src).toContain('notifierClient(uuid, "delivered")');
  });

  test("le paiement confirmé prévient aussi", () => {
    expect(lire("app/api/stripe/webhook/route.ts")).toContain('notifierClient(orderUuid, "confirmed")');
  });

  test("une notification qui échoue ne bloque jamais la commande", () => {
    const src = lire("lib/notifier-client.ts");
    expect(src).toContain("catch {");
    expect(src).toContain("return 0;");
  });
});

describe("Détails du reçu", () => {
  test("le moyen de paiement est en français", async () => {
    const { moyenPaiementFr } = await import("../lib/recu-pdf");
    expect(moyenPaiementFr("card")).toBe("carte bancaire");
    expect(moyenPaiementFr("stripe")).toBe("carte bancaire");
    expect(moyenPaiementFr("applepay")).toBe("Apple Pay");
    expect(moyenPaiementFr("cash")).toBe("espèces");
    expect(moyenPaiementFr(null)).toBe("");
  });
});

describe("Pourboire et jeton enfin enregistrés", () => {
  const order = lire("app/api/order/route.ts");

  test("le pourboire entre dans le total et dans la commande", () => {
    // Il était ignoré : le client payait son pourboire via Stripe,
    // la base enregistrait un total sans lui, et le livreur ne le
    // voyait jamais.
    expect(order).toContain("const pourboire = Math.max(0, Math.min(50, Number(body?.tip) || 0))");
    expect(order).toContain("totalCatalogue - remisesTotales + pourboire");
    expect(order).toContain("tip: pourboire");
  });

  test("le jeton invité est stocké : reçu et suivi sans compte", () => {
    expect(order).toContain("guest_token: String(body?.guestToken");
  });

  test("le refus « espèces en livraison » est expliqué", () => {
    expect(order).toContain("orders_especes_retrait");
    expect(order).toContain("retrait sur place");
  });
});
