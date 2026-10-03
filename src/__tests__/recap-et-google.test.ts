// ─── Récapitulatif de fin de service & avis Google ─────────────

import fs from "fs";
import path from "path";
import { heureParis, texteRecap, debutDuService, Recap } from "@/lib/recap";
import { lienAvisGoogle } from "@/lib/avis-google";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

const vide: Recap = {
  periode: "", commandes: 0, ca: 0, panierMoyen: 0, pourboires: 0,
  livraisons: 0, emportees: 0, annulees: 0, remboursements: 0,
  ruptures: [], topProduits: [],
};

describe("Heure de Paris", () => {
  // Piège réel : en français, formater une heure seule rend
  // « 16 h », et Number("16 h") vaut NaN — le test de minuit
  // n'aurait jamais été vrai et le récap jamais envoyé.
  test("ne renvoie jamais NaN", () => {
    expect(Number.isFinite(heureParis())).toBe(true);
  });

  test("heure d'été : le cron de 22 h 05 UTC tombe à minuit", () => {
    expect(heureParis(new Date("2026-07-15T22:05:00Z"))).toBe(0);
  });

  test("heure d'hiver : c'est celui de 23 h 05 UTC", () => {
    expect(heureParis(new Date("2026-01-15T23:05:00Z"))).toBe(0);
    expect(heureParis(new Date("2026-01-15T22:05:00Z"))).toBe(23);
  });
});

describe("Coupure du service", () => {
  // 2026-07-16T22:30Z = 00 h 30 à Paris, déjà le 17 juillet.
  // Le service qui vient de finir est celui du 16 : la coupure doit
  // tomber le 16, surtout pas le 15 (sinon on compte deux services).
  test("à 00 h 30, la coupure est bien celle du service qui finit", () => {
    const d = debutDuService(new Date("2026-07-16T22:30:00Z"));
    expect(d.toISOString()).toBe("2026-07-16T01:00:00.000Z");
  });

  test("à 23 h, le service du jour même", () => {
    const d = debutDuService(new Date("2026-07-16T21:00:00Z")); // 23 h à Paris
    expect(d.toISOString()).toBe("2026-07-16T01:00:00.000Z");
  });

  test("en hiver aussi (UTC+1)", () => {
    const d = debutDuService(new Date("2026-01-15T23:30:00Z")); // 00 h 30 le 16
    expect(d.toISOString()).toBe("2026-01-15T01:00:00.000Z");
  });

  test("à 20 h, c'est le service du jour même", () => {
    const d = debutDuService(new Date("2026-07-16T18:00:00Z")); // 20 h à Paris
    expect(d.toISOString().slice(0, 10)).toBe("2026-07-16");
  });
});

describe("Texte de la notification", () => {
  test("service vide : on le dit, sans chiffres inutiles", () => {
    const t = texteRecap(vide);
    expect(t.title).toContain("aucune commande");
    expect(t.body).toContain("tout est en stock");
  });

  test("les ruptures sont nommées — c'est la liste de courses", () => {
    const t = texteRecap({ ...vide, ruptures: ["Pastrami", "Milka"] });
    expect(t.body).toContain("Pastrami");
    expect(t.body).toContain("Milka");
  });

  test("chiffres clés présents et au format français", () => {
    const t = texteRecap({
      ...vide, commandes: 2, ca: 40, panierMoyen: 20, pourboires: 2,
    });
    expect(t.title).toContain("40,00 €");
    expect(t.body).toContain("2 commandes");
    expect(t.body).toContain("panier moyen 20,00 €");
    expect(t.body).toContain("2,00 € de pourboires");
  });

  test("les pourboires n'apparaissent pas s'il n'y en a pas", () => {
    const t = texteRecap({ ...vide, commandes: 1, ca: 10, panierMoyen: 10 });
    expect(t.body).not.toContain("pourboire");
  });
});

describe("Route /api/recap", () => {
  const src = lire("app/api/recap/route.ts");

  test("protégée : admin ou cron, jamais ouverte", () => {
    expect(src).toContain("X-Admin-Auth");
    expect(src).toContain("x-vercel-cron");
    expect(src).toContain("status: 401");
  });

  test("n'envoie la notification qu'à minuit à Paris", () => {
    expect(src).toContain("if (h !== 0)");
  });

  test("la consultation manuelle ne réveille personne", () => {
    expect(src).toContain("if (admin && !cron)");
  });

  test("deux crons sont déclarés (heure d'été et d'hiver)", () => {
    const vercel = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8")
    );
    const heures = vercel.crons.map((c: { schedule: string }) => c.schedule);
    expect(heures).toContain("5 22 * * *");
    expect(heures).toContain("5 23 * * *");
  });
});

describe("Avis Google", () => {
  test("le lien n'est jamais vide, même sans Place ID", () => {
    const url = lienAvisGoogle();
    expect(url).toMatch(/^https:\/\//);
    expect(url).not.toMatch(/placeid=$/);
  });

  test("la notification de livraison emmène sur Google", () => {
    const src = lire("lib/notifier-client.ts");
    expect(src).toContain("lienAvisGoogle()");
    expect(src).toContain('statut === "delivered"');
    expect(src).toContain("avis Google");
  });

  test("le reçu par e-mail contient le bouton Google", () => {
    const src = lire("lib/envoyer-recu.ts");
    expect(src).toContain("lienAvisGoogle()");
    expect(src).toContain("Google");
  });

  test("la page de suivi propose Google une fois livré", () => {
    const src = lire("app/suivi/page.tsx");
    expect(src).toContain("lienAvisGoogle()");
    expect(src).toContain('status === "delivered"');
  });
});
