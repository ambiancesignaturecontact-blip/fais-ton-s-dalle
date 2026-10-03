// ─── Non-régression : inscription Apple + notifications à tous ──
//
// Deux pannes constatées en production le 01/10/2026 :
//
// 1. « Création impossible » dès qu'on s'inscrivait avec Apple.
//    `customers.phone` a pour défaut la chaîne vide ET un index
//    UNIQUE : le 2ᵉ compte sans numéro heurtait la contrainte 23505.
//
// 2. « 0 client notifié ». Le jeton n'était enregistré qu'au
//    paiement, et le réenregistrement écrasait `order_uuid` avec
//    null, coupant le suivi de la commande en cours.

import fs from "fs";
import path from "path";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

describe("Connexion Apple — création de compte", () => {
  const src = lire("app/api/auth/apple/route.ts");

  test("le téléphone est explicitement NULL à la création", () => {
    expect(src).toMatch(/phone:\s*null/);
  });

  test("jamais de chaîne vide pour le téléphone", () => {
    expect(src).not.toMatch(/phone:\s*""/);
  });

  test("un doublon renvoie un message compréhensible, pas un 502 muet", () => {
    expect(src).toContain("23505");
    expect(src).toContain("déjà utilisé");
  });
});

describe("Notifications — tout le monde est joignable", () => {
  const src = lire("app/api/push/expo/route.ts");

  test("order_uuid n'est écrit que s'il est fourni", () => {
    expect(src).toContain("if (body?.orderUuid) ligne.order_uuid");
    // L'ancienne écriture destructrice ne doit plus exister
    expect(src).not.toContain("order_uuid: body?.orderUuid ?? null");
  });

  test("le consentement aux annonces est enregistré", () => {
    expect(src).toContain("marketing_optin");
    expect(src).toContain("optin_at");
  });

  test("une annonce vise tous les clients qui n'ont pas refusé", () => {
    expect(src).toContain("? `marketing_optin=not.is.false`");
  });

  test("l'annonce part sur le canal « promos », pas « commandes »", () => {
    expect(src).toContain('"promos"');
  });

  test("zéro destinataire est signalé au lieu d'un faux succès", () => {
    expect(src).toContain("Aucun appareil joignable");
    expect(src).toContain("cibles");
  });

  test("un compteur d'appareils joignables est exposé à l'admin", () => {
    expect(src).toContain("export async function GET");
    expect(src).toContain("clientsOffres");
  });
});
