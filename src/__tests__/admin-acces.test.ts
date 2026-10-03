// ─── Accès restaurateur personnels ────────────────────────────
//
// Demandé le 02/10/2026 : « mets-moi admin, eren93190@gmail.com ».
//
// Jusqu'ici un seul mot de passe pour toute l'équipe : quand
// quelqu'un part, il faut le changer et le redonner à tous. La
// table `admins` existait en base, vide et inutilisée.
//
// Chaque personne a maintenant son propre accès, révocable
// séparément. Le mot de passe général continue de fonctionner.

import fs from "fs";
import path from "path";
import { hacherMotDePasse } from "@/lib/admin-auth";

const racine = (p: string) => path.join(process.cwd(), "src", p);
const lire = (p: string) => fs.readFileSync(racine(p), "utf8");

describe("Empreintes", () => {
  test("deux empreintes du même mot de passe diffèrent (sel aléatoire)", () => {
    expect(hacherMotDePasse("abc")).not.toBe(hacherMotDePasse("abc"));
  });

  test("format « sel:scrypt », comme les comptes clients", () => {
    const [sel, h] = hacherMotDePasse("abc").split(":");
    expect(sel).toHaveLength(32);
    expect(h).toHaveLength(128);
  });
});

describe("Toutes les routes passent par le même contrôle", () => {
  const routes = fs
    .readdirSync(racine("app/api"), { recursive: true, encoding: "utf8" })
    .filter((f) => String(f).endsWith("route.ts"))
    .map((f) => `app/api/${f}`);

  test("aucune route ne compare encore le mot de passe en dur", () => {
    const fautives: string[] = [];
    for (const r of routes) {
      const s = lire(r);
      if (/(get\("X-Admin-Auth"\)|pw|who|admin|auth)\s*[!=]==\s*ADMIN_PASSWORD/.test(s)) {
        fautives.push(r);
      }
    }
    expect(fautives).toEqual([]);
  });

  test("les routes sensibles utilisent estAdmin()", () => {
    for (const r of [
      "app/api/push/expo/route.ts",
      "app/api/admin/orders/route.ts",
      "app/api/admin/refund/route.ts",
      "app/api/fidelite/route.ts",
      "app/api/recap/route.ts",
      "app/api/compta/route.ts",
    ]) {
      expect(lire(r)).toContain("estAdmin(");
    }
  });

  test("la connexion admin accepte les deux, et dit qui c'est", () => {
    const s = lire("app/api/admin/login/route.ts");
    expect(s).toContain("verifierAdmin(password)");
    expect(s).toContain("qui: identite.qui");
  });
});

describe("Sécurité", () => {
  const s = lire("lib/admin-auth.ts");

  test("comparaison à temps constant", () => {
    expect(s).toContain("timingSafeEqual");
  });

  test("un secret vide n'ouvre rien", () => {
    expect(s).toContain('if (!s) return { ok: false, qui: "" };');
  });

  test("les accès sont mis en cache, mais pas éternellement", () => {
    expect(s).toContain("60_000");
    expect(s).toContain("export function oublierComptes");
  });
});
