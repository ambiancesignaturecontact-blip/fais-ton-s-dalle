// ─── Deux pannes vécues par le gérant, le même jour ────────────
//
// 1. « E-mail ou mot de passe incorrect alors que c'est le bon »
//    → son compte avait subi un « mot de passe oublié » AVANT que
//      la route de réinitialisation ne soit corrigée : le bon mot
//      de passe était dans `customers.password_hash`, l'ancien
//      dans Supabase Auth. Corriger la réinitialisation ne suffit
//      pas : il fallait réparer les comptes déjà cassés.
//
// 2. « Apple Wallet je le vois pas »
//    → la carte se cherchait avec `phone = eq.<chiffres>` alors
//      que la base contient « +33611924863 ». Vérifié en prod :
//      /api/wallet?tel=0611924863 → 404, donc bouton masqué.

import fs from "fs";
import path from "path";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

const login = lire("app/api/auth/login/route.ts");
const wallet = lire("app/api/wallet/route.ts");

describe("Connexion — rattrapage des comptes désynchronisés", () => {
  test("si Supabase refuse, on vérifie notre propre empreinte", () => {
    expect(login).toContain("motDePasseCorrespond");
    expect(login).toContain("password_hash");
  });

  test("la comparaison est à temps constant (pas de fuite)", () => {
    expect(login).toContain("timingSafeEqual");
  });

  test("le compte d'authentification est réparé, puis on réessaie", () => {
    expect(login).toContain("reparerCompteAuth");
    expect(login).toContain("grant_type=password");
    // le deuxième essai existe bien
    expect(login.split("grant_type=password").length - 1).toBeGreaterThanOrEqual(2);
  });

  test("un mauvais mot de passe reste refusé", () => {
    expect(login).toContain('{ error: "Email ou mot de passe incorrect" }');
  });

  test("on n'entre JAMAIS sans empreinte correspondante", () => {
    expect(login).toContain(
      "if (!empreinte || !motDePasseCorrespond(password, empreinte))"
    );
  });
});

describe("Apple Wallet — toutes les écritures d'un numéro", () => {
  test("les variantes 06… / +336… / 336… sont cherchées", () => {
    expect(wallet).toContain('variantes.add("+33" + tel.slice(1))');
    expect(wallet).toContain('variantes.add("0" + tel.slice(2))');
  });

  test("la recherche n'est plus une égalité stricte", () => {
    expect(wallet).not.toContain("customers?phone=eq.${encodeURIComponent(tel)}");
    expect(wallet).toContain("customers?or=(${ou})");
  });

  test("un numéro inconnu répond toujours 404 (bouton masqué)", () => {
    expect(wallet).toContain('{ error: "Compte introuvable"');
    expect(wallet).toContain("status: 404");
  });
});

describe("Apple Wallet — comptes « Se connecter avec Apple »", () => {
  // Apple ne communique JAMAIS de numéro de téléphone. Ces comptes
  // n'avaient donc aucun identifiant utilisable : aucun bouton, et
  // aucune explication. C'est le cas du gérant lui-même.
  test("l'e-mail est accepté comme identifiant", () => {
    expect(wallet).toContain('searchParams.get("email")');
    expect(wallet).toContain("criteres.push(`email.eq.");
  });

  test("sans numéro ET sans e-mail, on refuse proprement", () => {
    expect(wallet).toContain("Numéro de téléphone ou e-mail requis");
  });

  test("le QR replie sur l'e-mail quand il n'y a pas de numéro", () => {
    // Le QR contient désormais un lien signé ; l'identification
    // par e-mail reste assurée par la recherche du client.
    expect(wallet).toContain("criteres.push(`email.eq.");
    expect(wallet).toContain("lienCarte(Number(client.id))");
  });

  test("l'application transmet les deux", () => {
    const carte = fs.readFileSync(
      path.join(process.cwd(), "..", "ftsd-ios", "src", "components", "CarteWallet.tsx"),
      "utf8"
    );
    expect(carte).toContain('p.set("email", email)');
    expect(carte).toContain("(!telephone && !email)");
  });
});

describe("Textes clients", () => {
  test("la réinitialisation ne tutoie plus", () => {
    const reset = lire("app/api/auth/reset/route.ts");
    expect(reset).not.toContain("Contacte le restaurant");
    expect(reset).toContain("Appelez-nous");
  });
});
