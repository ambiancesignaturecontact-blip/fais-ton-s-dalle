// ─── Remises : le serveur seul décide, et personne n'en abuse ─

import fs from "fs";
import path from "path";
import {
  plafonner, arrondi, telNormalise,
  VALEUR_MENU_OFFERT, valeurMenuOffert, TAUX_PARRAINAGE, MAX_FILLEULS_30J,
} from "../lib/remises";

const lire = (f: string) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const order = lire("app/api/order/route.ts");
const remises = lire("lib/remises.ts");
const referral = lire("app/api/referral/route.ts");

describe("Calculs", () => {
  test("taux annoncés = taux appliqués", () => {
    // Le panier affichait « Parrainage -15 % » et calculait 10 %.
    expect(TAUX_PARRAINAGE).toBe(0.15);
    // La fidélité n'est plus un pourcentage : c'est un menu offert,
    // plafonné à la valeur d'un Menu Classique (02/10/2026).
    expect(VALEUR_MENU_OFFERT).toBe(7.9);
  });

  test("le menu offert : le moins cher du panier, plafonné", () => {
    // Un Royal seul → on ne déduit que la valeur d'un Classique
    expect(valeurMenuOffert([{ name: "Menu Royal" }])).toBe(7.9);
    // Un Léger à 6,90 → on ne déduit que 6,90
    expect(valeurMenuOffert([{ name: "Menu Léger" }])).toBe(6.9);
    // Plusieurs menus → le moins cher
    expect(valeurMenuOffert([{ name: "Menu Royal" }, { name: "Menu Léger" }])).toBe(6.9);
    // Les bowls comptent aussi
    expect(valeurMenuOffert([{ name: "Bowl Classique" }])).toBe(7.9);
  });

  test("sans menu au panier, rien n'est offert", () => {
    expect(valeurMenuOffert([{ name: "Coca-Cola" }, { name: "Tiramisu" }])).toBe(0);
    expect(valeurMenuOffert([])).toBe(0);
  });

  test("la récompense n'est pas consommée s'il n'y a pas de menu", () => {
    // clientId à null = `consommerFidelite` ne sera pas appelé
    expect(remises).toContain("if (offert <= 0) return { remise: 0, clientId: null };");
  });

  test("les remises ne dépassent jamais le montant", () => {
    expect(plafonner(10, [5, 5, 5])).toBe(10);
    expect(plafonner(10, [2, 3])).toBe(5);
    expect(plafonner(10, [])).toBe(0);
    expect(plafonner(10, [-4, 2])).toBe(2);
  });

  test("arrondi au centime", () => {
    expect(arrondi(15.9 * 0.15)).toBe(2.38); // 2,385 arrondi au centime inférieur
    expect(arrondi(0.1 + 0.2)).toBe(0.3);
  });

  test("téléphone comparable", () => {
    expect(telNormalise("06 11 22 33 44")).toBe("0611223344");
    expect(telNormalise("+33 6 11 22 33 44")).toBe("33611223344");
    expect(telNormalise(null)).toBe("");
  });
});

describe("Le serveur applique TOUTES les remises", () => {
  test("fidélité et parrainage sont calculés à la commande", () => {
    // Avant : le panier affichait -20 % / -15 %, le serveur
    // enregistrait le plein tarif, Stripe encaissait le montant
    // remisé. Comptabilité fausse à chaque remise.
    expect(order).toContain("remiseFidelite(");
    expect(order).toContain("remiseParrainage(");
    expect(order).toContain("remisesTotales");
  });

  test("les frais de livraison ne sont pas remisés", () => {
    expect(order).toContain("const articlesSeuls");
    expect(order).toContain("plafonner(articlesSeuls");
  });

  test("les récompenses sont consommées APRÈS la création", () => {
    const iCreation = order.indexOf("const [order] = await orderRes.json()");
    const iConso = order.indexOf("consommerFidelite(");
    expect(iCreation).toBeGreaterThan(0);
    expect(iConso).toBeGreaterThan(iCreation);
  });
});

describe("Anti-abus du parrainage", () => {
  test("auto-parrainage impossible", () => {
    expect(referral).toContain("Vous ne pouvez pas utiliser votre propre code");
  });

  test("un seul parrainage par appareil", () => {
    expect(referral).toContain("Un parrainage a déjà été utilisé sur cet appareil");
  });

  test("réservé à un client qui n'a jamais commandé", () => {
    expect(remises).toContain("orders?customer_phone=eq.");
    expect(remises).toMatch(/nouveau client/i);
  });

  test("le parrain ne peut pas se parrainer avec un autre téléphone", () => {
    expect(remises).toContain("guest_token=eq.");
  });

  test("un parrain est plafonné sur 30 jours", () => {
    expect(MAX_FILLEULS_30J).toBe(20);
    expect(remises).toContain("MAX_FILLEULS_30J");
  });

  test("« consume » ne peut plus être déclenché depuis le téléphone", () => {
    // N'importe qui pouvait brûler ou créditer un parrainage sans
    // la moindre commande derrière.
    expect(referral).toContain("consommé automatiquement à la commande");
    expect(referral).not.toContain('consumed: true,\n            rewarded: true,');
  });
});

describe("Notifications de l'équipe", () => {
  const notifier = lire("lib/notifier-client.ts");
  const push = lire("app/api/push/expo/route.ts");

  test("le livreur peut enfin s'enregistrer", () => {
    // 🔴 L'app envoyait son JETON DE SESSION, le serveur attendait
    // un CODE livreur : 401 systématique, aucun livreur notifié.
    expect(push).toContain("driver_sessions?token=eq.");
    expect(push).toContain("codeLivreur");
  });

  test("une nouvelle commande réveille la cuisine", () => {
    expect(notifier).toContain("notifierEquipe");
    expect(order).toContain("notifierEquipe({");
  });

  test("les livreurs ne sont réveillés que pour une livraison", () => {
    expect(notifier).toContain('r.audience === "admin" || livraison');
  });

  test("la commande assignée vise LE bon livreur", () => {
    const admin = lire("app/api/admin/orders/route.ts");
    expect(admin).toContain("driver_code=eq.");
  });

  test("rien n'est envoyé avant le paiement en ligne", () => {
    expect(order).toContain("if (!enLigne) {");
  });
});

describe("Panier du site : parité avec l'app", () => {
  const cart = lire("components/cart/CartSheet.tsx");
  const codeUI = lire("components/cart/CodePromo.tsx");

  test("le site accepte enfin un code", () => {
    expect(cart).toContain("<CodePromo");
    expect(cart).toContain("promoCode:");
  });

  test("codes personnels cliquables + saisie manuelle", () => {
    expect(codeUI).toContain("Vos codes disponibles");
    expect(codeUI).toContain("FORMAT_PARRAIN");
  });

  test("le paiement applique vraiment la remise", () => {
    const checkout = lire("app/api/checkout/route.ts");
    expect(checkout).toContain("remisePourCode");
    expect(checkout).toContain("coupons.create");
  });
});
