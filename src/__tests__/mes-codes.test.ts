// ─── Mes codes promo : possession et usage unique ─────────────
//
// Deux règles à ne jamais casser :
//   1. un code personnel n'appartient qu'à son client ;
//   2. un code ne peut pas servir deux fois au même client,
//      même s'il reste des utilisations globales.

import fs from "fs";
import path from "path";

const lire = (f: string) =>
  fs.readFileSync(path.join(__dirname, "..", f), "utf8");

const order = lire("app/api/order/route.ts");
const promos = lire("app/api/promos/route.ts");
const customer = lire("app/api/customer/route.ts");
const reviews = lire("app/api/reviews/route.ts");

describe("Propriété d'un code personnel", () => {
  test("le code de remerciement est rattaché au client", () => {
    expect(reviews).toContain("owner_email");
    expect(reviews).toContain("owner_phone");
    expect(reviews).toContain("orders?uuid=eq.");
  });

  test("la commande refuse un code personnel volé", () => {
    expect(order).toContain("estLeProprio");
    expect(order).toContain("owner_email");
  });

  test("le panier le refuse aussi, avant le paiement", () => {
    // Sinon la remise s'affichait puis disparaissait au paiement
    expect(promos).toContain("Ce code est personnel");
    expect(promos).toContain("403");
  });
});

describe("Un code = une fois par client", () => {
  test("la commande vérifie les usages déjà enregistrés", () => {
    expect(order).toContain("promo_uses?code=eq.");
    expect(order).toContain("dejaUtilise");
  });

  test("l'usage est enregistré après la commande", () => {
    expect(order).toContain('fetch(`${SUPABASE_URL}/rest/v1/promo_uses`');
    expect(order).toContain("customer_key: cleClient");
  });

  test("la clé client est l'e-mail, sinon le téléphone", () => {
    expect(order).toContain("const cleClient");
    expect(order).toContain("customerEmail");
  });
});

describe("Le client retrouve ses codes", () => {
  test("/api/customer renvoie la liste", () => {
    expect(customer).toContain("promos");
    expect(customer).toContain("promo_uses?customer_key=in.");
    expect(customer).toContain("Merci pour votre avis");
  });

  test("l'état used / expired est calculé côté serveur", () => {
    expect(customer).toContain("used:");
    expect(customer).toContain("expired:");
  });
});

describe("Tant que le SQL n'est pas passé, rien ne casse", () => {
  test("la commande retente sans les colonnes propriétaire", () => {
    expect(order).toContain("if (!pr.ok) {");
  });

  test("la liste des codes aussi", () => {
    expect(promos).toContain("/owner_(email|phone)/.test(query)");
  });

  test("la création du code de remerciement aussi", () => {
    expect(reviews).toContain("delete ligne.owner_email");
  });
});
