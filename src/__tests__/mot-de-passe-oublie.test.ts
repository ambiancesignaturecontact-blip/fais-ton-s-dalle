// ─── « E-mail ou mot de passe incorrect » après réinitialisation ─
//
// Panne signalée par le gérant le 01/10/2026 : impossible de se
// reconnecter alors que le mot de passe était le bon.
//
// Cause : /api/auth/reset n'écrivait QUE `customers.password_hash`,
// alors que /api/auth/login fait vérifier le mot de passe par
// Supabase Auth. Le nouveau mot de passe n'était donc enregistré
// nulle part d'utile : il était refusé pour toujours, et l'ancien
// continuait de fonctionner.

import fs from "fs";
import path from "path";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

const reset = lire("app/api/auth/reset/route.ts");
const login = lire("app/api/auth/login/route.ts");
const register = lire("app/api/auth/register/route.ts");

describe("Réinitialisation du mot de passe", () => {
  test("le mot de passe est changé dans Supabase Auth, pas seulement en base", () => {
    expect(reset).toContain("majMotDePasseAuth");
    expect(reset).toContain("/auth/v1/admin/users/");
    expect(reset).toContain('method: "PUT"');
  });

  test("un compte sans authentification est réparé, pas abandonné", () => {
    expect(reset).toContain('return creation.ok ? "cree" : "echec"');
    expect(reset).toContain("email_confirm: true");
  });

  test("si Auth refuse, on ne prétend pas que c'est fait", () => {
    expect(reset).toContain('if (etat === "echec")');
    expect(reset).toContain("status: 502");
  });

  test("Auth est mis à jour AVANT la table (sinon on ment au client)", () => {
    expect(reset.indexOf("majMotDePasseAuth(email, password)")).toBeLessThan(
      reset.indexOf("password_hash: hashPassword(password)")
    );
  });

  test("l'e-mail de code vouvoie", () => {
    const corps = reset.slice(reset.indexOf("async function sendEmail"));
    const html = corps.slice(0, corps.indexOf("return r.ok"));
    // Deux pièges connus, déjà documentés dans AUDIT-BUGS.md :
    //  · la marque elle-même contient « TON » (FAIS TON S'DALLE) ;
    //  · en JS, \b ignore les accents, donc « n'êtes » déclenche
    //    une fausse alerte sur « tes ».
    const propre = html
      .replace(/FAIS TON S'DALLE/g, "LA MAISON")
      .replace(/[A-Za-zÀ-ÿ]+/g, (mot) => (/[À-ÿ]/.test(mot) ? "MOT" : mot));
    expect(propre).not.toMatch(/\b(tu|ton|ta|tes|toi)\b/i);
    expect(html).toContain("Vous avez demandé");
  });
});

describe("Cohérence des trois routes", () => {
  test("login vérifie bien auprès de Supabase Auth", () => {
    expect(login).toContain("auth/v1/token?grant_type=password");
  });

  test("l'inscription crée aussi le compte d'authentification", () => {
    expect(register).toContain("/auth/v1/admin/users");
  });

  // Depuis le 02/10/2026, la connexion SAIT lire `password_hash` —
  // mais uniquement pour rattraper un compte désynchronisé, et
  // jamais pour ouvrir la session directement : le compte Supabase
  // Auth est réparé, puis la vérification est refaite par Supabase.
  test("password_hash ne sert qu'à réparer, jamais à ouvrir la session", () => {
    const i = login.indexOf("motDePasseCorrespond(password, empreinte)");
    const j = login.indexOf("reparerCompteAuth(email, password)");
    const k = login.lastIndexOf("grant_type=password");
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i); // on vérifie AVANT de réparer
    expect(k).toBeGreaterThan(j); // et on refait valider par Supabase
  });
});
