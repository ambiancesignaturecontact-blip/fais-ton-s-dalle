// ─── Campagnes e-mail — un outil à part ───────────────────────
//
// Demandé le 02/10/2026 : « notif push ET mail séparés ».
//
//  · notification → application, écran Push, uniquement ceux qui
//    ont accepté. Aucun e-mail n'en part ;
//  · campagne e-mail → espace restaurateur du site, modèles prêts
//    à l'emploi et modifiables, tout le fichier client.

import fs from "fs";
import path from "path";
import { MODELES, modeleParId, rendreEmail } from "@/lib/modeles-email";
import { lienDesabonnement, verifierDesabonnement, corpsEmail } from "@/lib/campagne-email";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

const SITE = "https://www.faistonsdalle.com";

describe("Les deux canaux restent séparés", () => {
  test("la route push n'envoie AUCUN e-mail", () => {
    const push = lire("app/api/push/expo/route.ts");
    expect(push).not.toContain("envoyerCampagneEmail");
    expect(push).not.toContain("campagne-email");
  });

  test("le compteur push ne compte que des appareils", () => {
    expect(lire("app/api/push/expo/route.ts")).toContain("clientsOffres: joignablesPush");
  });

  test("la campagne e-mail a sa propre route, protégée", () => {
    const c = lire("app/api/campagne/route.ts");
    expect(c).toContain("estAdmin(");
    expect(c).toContain('action === "apercu"');
    expect(c).toContain('action === "essai"');
    expect(c).toContain('action === "envoyer"');
  });

  test("et son propre écran dans l'admin du site", () => {
    expect(lire("app/admin/page.tsx")).toContain("CampagneEmailPanel");
    expect(lire("app/admin/page.tsx")).toContain('id: "emails"');
  });
});

describe("Modèles", () => {
  test("cinq modèles prêts à l'emploi", () => {
    expect(MODELES).toHaveLength(5);
    for (const m of MODELES) {
      expect(m.titre.length).toBeGreaterThan(5);
      expect(m.message.length).toBeGreaterThan(30);
      expect(m.cta.length).toBeGreaterThan(2);
      expect(m.couleur).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  test("tous vouvoient", () => {
    for (const m of MODELES) {
      const t = `${m.titre} ${m.message} ${m.cta}`
        .replace(/[A-Za-zÀ-ÿ]+/g, (w) => (/[À-ÿ]/.test(w) ? "MOT" : w));
      expect(t).not.toMatch(/\b(tu|ton|ta|tes|toi)\b/i);
    }
  });

  test("on retrouve un modèle par son identifiant", () => {
    expect(modeleParId("weekend")?.nom).toBe("Offre du week-end");
    expect(modeleParId("inconnu")).toBeNull();
  });
});

describe("Rendu de l'e-mail", () => {
  const html = rendreEmail(
    { surtitre: "NOUVEAU", titre: "Titre", message: "Para 1\n\nPara 2", cta: "Commander", nom: "Sophie" },
    SITE
  );

  test("le logo est une image absolue, en PNG (Outlook ignore le webp)", () => {
    expect(html).toContain(`${SITE}/images/logo-512.png`);
  });

  test("mise en page en tableaux et styles en ligne", () => {
    expect(html).toContain('role="presentation"');
    expect(html).not.toContain("<style>");
    expect(html).not.toContain("class=");
  });

  test("personnalisé et vouvoyé", () => {
    expect(html).toContain("Bonjour Sophie,");
    expect(html).toContain("Vous recevez ce message");
  });

  test("une ligne vide crée un vrai paragraphe", () => {
    expect((html.match(/<p style="margin:0 0 16px;color:#3a3a3a/g) || []).length).toBe(2);
  });

  test("adresse, horaires, téléphone, allergènes", () => {
    for (const bout of ["Colonel Fabien", "11h30", "06 72 04 48 75", "/allergenes"]) {
      expect(html).toContain(bout);
    }
  });

  test("le HTML injecté est neutralisé", () => {
    expect(rendreEmail({ titre: "<script>x</script>", message: "ok" }, SITE))
      .not.toContain("<script>x");
  });
});

describe("Désabonnement", () => {
  test("présent dans un vrai envoi", () => {
    const html = corpsEmail({ titre: "T", message: "M" }, "a@b.fr", "Eren");
    expect(html).toContain("/desabonnement?e=");
    expect(html).toContain("Ne plus recevoir nos offres");
  });

  test("en-têtes « un clic » pour Gmail et Apple Mail", () => {
    const s = lire("lib/campagne-email.ts");
    expect(s).toContain("List-Unsubscribe");
    expect(s).toContain("List-Unsubscribe-Post");
  });

  test("le lien est signé", () => {
    const sig = new URL(lienDesabonnement("a@b.fr")).searchParams.get("s") ?? "";
    expect(verifierDesabonnement("a@b.fr", sig)).toBe(true);
    expect(verifierDesabonnement("voisin@b.fr", sig)).toBe(false);
  });

  test("les désabonnés sont exclus, et jamais de doublon", () => {
    const s = lire("lib/campagne-email.ts");
    expect(s).toContain("is_active=eq.false");
    expect(s).toContain("stop.has(e)");
    expect(s).toContain("vus.has(e)");
  });
});
