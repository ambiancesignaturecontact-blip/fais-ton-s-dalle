// ─── Campagne marketing : validation et fenêtre d'affichage ───
//
// Le contenu vient de la base : on vérifie qu'une saisie hasardeuse
// ne peut ni casser la page, ni afficher une bannière fantôme.

import {
  DEFAULT_CAMPAIGN, parseCampaign, campaignVisible, campaignAddress,
} from "../lib/campaign";

describe("Campagne par défaut", () => {
  test("annonce la première commande offerte, sur place", () => {
    expect(DEFAULT_CAMPAIGN.titre).toMatch(/OFFERTE/i);
    expect(DEFAULT_CAMPAIGN.accroche).toMatch(/fast-food/i);
    expect(DEFAULT_CAMPAIGN.detail).toMatch(/buzzer/i);
  });

  test("porte la vraie adresse", () => {
    expect(campaignAddress(DEFAULT_CAMPAIGN)).toContain("134 Allée du Colonel Fabien");
    expect(campaignAddress(DEFAULT_CAMPAIGN)).toContain("93320");
  });

  test("vouvoie le client", () => {
    const txt = `${DEFAULT_CAMPAIGN.titre} ${DEFAULT_CAMPAIGN.accroche} ${DEFAULT_CAMPAIGN.detail} ${DEFAULT_CAMPAIGN.signature}`
      .replace(/FAIS TON S'DALLE/gi, "");
    expect(/\b(tu|ton|ta|tes|toi)\b/i.test(txt)).toBe(false);
  });
});

describe("parseCampaign", () => {
  test("refuse ce qui n'est pas un objet", () => {
    expect(parseCampaign(null)).toBeNull();
    expect(parseCampaign("promo")).toBeNull();
    expect(parseCampaign([])).toBeNull();
  });

  test("complète les champs absents", () => {
    const c = parseCampaign({ titre: "MENU OFFERT CE SOIR" })!;
    expect(c.titre).toBe("MENU OFFERT CE SOIR");
    expect(c.ville).toBe(DEFAULT_CAMPAIGN.ville);
  });

  test("tronque les textes trop longs", () => {
    expect(parseCampaign({ titre: "X".repeat(400) })!.titre.length).toBeLessThanOrEqual(70);
  });

  test("ignore une couleur invalide", () => {
    const c = parseCampaign({ titre: "T", couleurs: ["bleu", "#123abc"] })!;
    expect(c.couleurs[0]).toBe(DEFAULT_CAMPAIGN.couleurs[0]);
    expect(c.couleurs[1]).toBe("#123abc");
  });

  test("refuse une fenêtre à l'envers", () => {
    expect(
      parseCampaign({ titre: "T", debut: "2026-12-10", fin: "2026-12-01" })
    ).toBeNull();
  });
});

describe("campaignVisible", () => {
  const base = parseCampaign({ titre: "T" })!;

  test("campagne coupée : rien", () => {
    expect(campaignVisible({ ...base, active: false })).toBeNull();
  });

  test("avant le début : rien", () => {
    const c = { ...base, debut: "2026-12-01T00:00:00.000Z" };
    expect(campaignVisible(c, new Date("2026-11-20T12:00:00Z"))).toBeNull();
    expect(campaignVisible(c, new Date("2026-12-05T12:00:00Z"))).not.toBeNull();
  });

  test("après la fin : elle s'éteint seule", () => {
    const c = { ...base, fin: "2026-10-31T23:59:00.000Z" };
    expect(campaignVisible(c, new Date("2026-10-15T12:00:00Z"))).not.toBeNull();
    expect(campaignVisible(c, new Date("2026-11-02T12:00:00Z"))).toBeNull();
  });

  test("null reste null", () => {
    expect(campaignVisible(null)).toBeNull();
  });
});
