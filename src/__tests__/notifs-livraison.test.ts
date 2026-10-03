// ─── Le patron doit suivre ses livraisons ─────────────────────
//
// Demandé le 01/10/2026 : « moi recevoir notif commande quand ya
// livraison ». Avant, l'admin n'était prévenu QUE de l'arrivée
// d'une nouvelle commande : une fois le livreur parti, plus aucune
// information sans rouvrir l'écran d'administration.

import fs from "fs";
import path from "path";
import { resumeCommande } from "@/lib/notifier-client";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

const driver = lire("app/api/driver/route.ts");
const notifier = lire("lib/notifier-client.ts");

describe("Étapes qui préviennent le restaurant", () => {
  test("course prise, arrivée, livraison", () => {
    expect(driver).toContain('notifierAdmins(\n        "prise"');
    expect(driver).toContain('"arrive"');
    expect(driver).toContain('notifierAdmins("livree"');
  });

  test("un incident réveille même en mode Concentration", () => {
    expect(notifier).toContain('etape === "incident"');
    expect(notifier).toContain("time-sensitive");
  });

  test("« en route » ne notifie PAS l'admin (doublon avec « prise »)", () => {
    const bloc = driver.slice(
      driver.indexOf('if (action === "start")'),
      driver.indexOf('if (action === "position")')
    );
    expect(bloc).not.toContain("notifierAdmins");
  });

  test("une notification ratée ne bloque jamais le livreur", () => {
    // tous les appels sont détachés avec .catch()
    const appels = driver.match(/notifierAdmins\([\s\S]{0,220}?\)\s*\.?\s*\n?\s*\.catch/g) ?? [];
    expect(appels.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Texte du récapitulatif de course", () => {
  test("montant et pourboire en français", () => {
    expect(resumeCommande({ id: 42, total: 18.9, tip: 2 }))
      .toBe("#42 · 18,90 € · 2,00 € de pourboire 🎉");
  });

  test("sans pourboire, on n'écrit pas « 0,00 € de pourboire »", () => {
    expect(resumeCommande({ id: 7, total: 15.9, tip: 0 })).toBe("#7 · 15,90 €");
  });

  test("le nom du client est ajouté s'il existe", () => {
    expect(resumeCommande({ id: 7, total: 10, customer_name: "Sophie" }))
      .toContain("Sophie");
  });
});

describe("Annonce marketing", () => {
  const push = lire("app/api/push/expo/route.ts");

  test("vise tous les clients joignables, pas seulement ceux qui ont commandé", () => {
    // Depuis le 02/10, une annonce vise TOUS les appareils qui
    // n'ont pas refusé — y compris les téléphones du restaurant.
    expect(push).toContain("? `marketing_optin=not.is.false`");
    expect(push).not.toContain("order_uuid=not.is.null");
  });

  test("part sur le canal « promos », distinct du suivi de commande", () => {
    expect(push).toContain('audience === "customer" ? "promos" : "commandes"');
  });
});
