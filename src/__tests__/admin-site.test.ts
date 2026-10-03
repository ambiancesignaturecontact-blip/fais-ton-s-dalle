// ─── L'admin du site doit offrir la même chose que l'app ─────
//
// Les panneaux Compta et Établissements existaient dans le dossier
// components… mais n'étaient branchés nulle part. Le site n'avait
// donc ni comptabilité, ni gestion des locaux, ni campagne, alors
// que l'application les avait.

import fs from "fs";
import path from "path";

const page = fs.readFileSync(path.join(__dirname, "../app/admin/page.tsx"), "utf8");
const lire = (f: string) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");

describe("Onglets de l'admin du site", () => {
  test.each([
    ["Commandes", "orders"],
    ["Historique", "history"],
    ["Analytics", "analytics"],
    ["Stock", "stock"],
    ["Horaires", "hours"],
    ["Compta", "compta"],
    ["Locaux", "locaux"],
    ["Campagne", "campagne"],
    ["Outils", "tools"],
  ])("l'onglet %s existe", (label, id) => {
    expect(page).toContain(`label: "${label}"`);
    expect(page).toContain(`activeTab === "${id}"`);
  });

  test("les panneaux sont réellement rendus", () => {
    expect(page).toContain("<ComptaPanel adminPassword={password} />");
    expect(page).toContain("<FranchisePanel adminPassword={password} />");
    expect(page).toContain("<CampagnePanel adminPassword={password} />");
  });

  test("ils sont importés", () => {
    for (const c of ["ComptaPanel", "FranchisePanel", "CampagnePanel"]) {
      expect(page).toContain(`import ${c} from "@/components/${c}"`);
    }
  });
});

describe("Éditeur de campagne du site", () => {
  const panel = lire("components/CampagnePanel.tsx");

  test("personnalisation visuelle : palettes et pipette", () => {
    expect(panel).toContain("PALETTES");
    expect(panel).toContain('type="color"');
    expect(panel).toContain("Rouge maison");
  });

  test("choix d'emoji en un clic", () => {
    expect(panel).toContain("const EMOJIS");
  });

  test("aperçu en direct des DEUX tailles", () => {
    expect(panel).toContain("Aperçu client");
    expect(panel).toContain("Version discrète");
  });

  test("les trois modes d'affichage sont proposés", () => {
    expect(panel).toContain("Automatique");
    expect(panel).toContain("Toujours grande");
    expect(panel).toContain("Toujours discrète");
  });

  test("relit le serveur après enregistrement", () => {
    // Afficher ce qu'on croit avoir envoyé donnerait l'illusion
    // d'un enregistrement réussi.
    expect(panel).toContain("await charger();");
  });
});

describe("Bannière du site : discrète par défaut", () => {
  const banner = lire("components/campaign/CampaignBanner.tsx");

  test("version compacte pour les habitués", () => {
    expect(banner).toContain("dejaClient()");
    expect(banner).toContain("if (compact)");
  });

  test("le gérant peut forcer grande ou discrète", () => {
    expect(banner).toContain('campagne.affichage === "vedette"');
    expect(banner).toContain('campagne.affichage === "discret"');
  });

  test("le visiteur peut la ranger pour 7 jours", () => {
    expect(banner).toContain("7 * 86400000");
    expect(banner).toContain("Masquer cette annonce");
  });
});
