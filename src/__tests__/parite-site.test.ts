// ─── Parité site ↔ application ───────────────────────────────

import fs from "fs";
import path from "path";
import { distanceKm, etaMinutes } from "../components/delivery/SuiviCarte";

const lire = (f: string) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");

describe("Suivi du livreur sur carte", () => {
  test("distance à vol d'oiseau correcte", () => {
    // Restaurant → 2 km environ vers Bondy
    const km = distanceKm(48.9047, 2.5045, 48.9047, 2.5318);
    expect(km).toBeGreaterThan(1.9);
    expect(km).toBeLessThan(2.1);
    expect(distanceKm(48.9047, 2.5045, 48.9047, 2.5045)).toBe(0);
  });

  test("estimation d'arrivée en scooter", () => {
    expect(etaMinutes(0)).toBe(2);
    expect(etaMinutes(3)).toBe(12);
    expect(etaMinutes(6)).toBe(22);
  });

  test("la carte ne s'affiche que pendant la course", () => {
    const src = lire("components/delivery/SuiviCarte.tsx");
    expect(src).toContain('["ready", "en-route", "arrived"].includes(statut)');
  });

  test("elle se rafraîchit toute seule", () => {
    const src = lire("components/delivery/SuiviCarte.tsx");
    expect(src).toContain("setInterval(relire, 15000)");
  });

  test("position périmée signalée au client", () => {
    const src = lire("components/delivery/SuiviCarte.tsx");
    expect(src).toContain("Dernière position il y a");
  });

  test("elle est branchée sur la page de suivi", () => {
    expect(lire("app/suivi/page.tsx")).toContain("<SuiviCarte");
  });

  test("aucune clé d'API ni bibliothèque de carte ajoutée", () => {
    const pkg = JSON.parse(lire("../package.json"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const lourd of ["leaflet", "mapbox-gl", "react-map-gl", "google-maps"]) {
      expect(deps).not.toContain(lourd);
    }
  });
});

describe("Reçu PDF depuis le site", () => {
  test("le bouton existe sur la page de suivi", () => {
    const src = lire("app/suivi/page.tsx");
    expect(src).toContain("/api/recu?uuid=");
    expect(src).toContain("Télécharger le reçu (PDF)");
  });

  test("le téléphone sert de preuve", () => {
    expect(lire("app/suivi/page.tsx")).toContain("&tel=${encodeURIComponent(tel.trim())}");
  });
});

describe("Carte de fidélité", () => {
  const page = lire("app/carte-fidelite/page.tsx");

  test("affiche tampons, récompense et QR code", () => {
    expect(page).toContain("urlQr");
    expect(page).toContain("Montrez ce code au comptoir");
    expect(page).toContain("PALIER = 10");
  });

  test("le bouton Wallet n'apparaît que s'il fonctionne", () => {
    expect(page).toContain('method: "HEAD"');
    expect(page).toContain("setWalletPret(r.status === 200)");
  });

  test("elle est accessible depuis le compte", () => {
    expect(lire("app/compte/page.tsx")).toContain('href="/carte-fidelite"');
  });
});

describe("Boutons Menu et Commander enfin visibles", () => {
  const header = lire("components/layout/Header.tsx");

  test("un bouton « Commander » permanent dans l'en-tête", () => {
    // Il n'y en avait aucun : le client devait deviner qu'il fallait
    // faire défiler jusqu'à la carte.
    expect(header).toContain("Commander");
    expect(header).toContain("from-brand-red to-brand-red-light");
  });

  test("le compteur du panier est visible dessus", () => {
    expect(header).toContain("itemCount > 0");
  });

  test("la navigation n'est plus en gris sur gris", () => {
    expect(header).toContain("text-white/80 hover:text-white");
    expect(header).not.toContain("text-muted-foreground hover:text-foreground");
  });
});

describe("Bannière du jeu : bien placée", () => {
  test("elle passe après la carte, pas avant", () => {
    const page = lire("app/page.tsx");
    const iMenu = page.indexOf("<MenuSection />");
    const iPromo = page.indexOf("<CampaignBanner />");
    expect(iMenu).toBeGreaterThan(0);
    expect(iPromo).toBeGreaterThan(iMenu);
  });
});
