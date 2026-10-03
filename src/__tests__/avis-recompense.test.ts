// ─── Récompense d'avis, côté serveur ──────────────────────────
//
// L'app promettait « -10 % avec MERCI10 » alors que la table
// promo_codes était vide : le client payait plein tarif. Le serveur
// crée désormais un vrai code, personnel et à usage unique.

import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(__dirname, "../app/api/reviews/route.ts"),
  "utf8"
);

describe("Création du code de remerciement", () => {
  test("le code est créé en base, pas inventé côté client", () => {
    expect(src).toContain("recompenserAvis");
    expect(src).toContain('sb("promo_codes"');
  });

  test("usage unique et durée limitée", () => {
    expect(src).toContain("max_uses: 1");
    expect(src).toContain("RECOMPENSE_JOURS");
    expect(src).toContain("expires_at");
  });

  test("remise de 10 %", () => {
    expect(src).toContain("RECOMPENSE_POURCENT = 10");
    expect(src).toContain('type: "percent"');
  });

  test("un seul code par commande, même en cas de double envoi", () => {
    // L'étiquette « avis:<uuid> » sert de garde-fou : on relit avant
    // de créer, donc deux avis sur la même commande = un seul code.
    expect(src).toContain("`avis:${orderUuid}`");
    expect(src).toContain("promo_codes?label=eq.");
  });

  test("aucune récompense pour un avis sans commande", () => {
    expect(src).toContain("uuidValide ? await recompenserAvis(uuidValide) : null");
  });

  test("un identifiant de commande bidon ne fait pas perdre l'avis", () => {
    // Trouvé en test réel : la colonne order_uuid est de type uuid.
    // Une valeur mal formée faisait échouer TOUTE l'insertion.
    expect(src).toContain("UUID_RE");
    expect(src).toContain("order_uuid: uuidValide");
  });

  test("code lisible : pas de 0/O ni de 1/I", () => {
    const alphabet = /const ALPHABET = "([^"]+)"/.exec(src)?.[1] ?? "";
    expect(alphabet.length).toBeGreaterThan(20);
    for (const c of ["0", "O", "1", "I", "8", "B"]) {
      expect(alphabet).not.toContain(c);
    }
  });

  test("un échec de création ne promet rien", () => {
    // Mieux vaut pas de cadeau qu'un cadeau qui ne marche pas.
    expect(src).toContain("return null;");
    expect(src).toContain("reward");
  });
});

describe("Messages", () => {
  test("le client est vouvoyé", () => {
    expect(src).not.toContain("Tu as déjà laissé");
    expect(src).toContain("Vous avez déjà laissé");
    expect(src).toContain("Votre avis sera publié");
  });
});

// ─── Le code personnel ne doit pas fuiter ─────────────────────
//
// Faille évitée de justesse : /api/promos renvoyait TOUS les codes
// actifs. Les codes de remerciement, personnels et à usage unique,
// s'y seraient retrouvés — n'importe qui aurait pu lire la liste et
// consommer le cadeau d'un autre client avant lui.

const promos = fs.readFileSync(
  path.join(__dirname, "../app/api/promos/route.ts"),
  "utf8"
);

describe("Liste publique des codes", () => {
  test("les codes personnels sont exclus de la liste", () => {
    expect(promos).toContain("estPersonnel");
    expect(promos).toContain('label.startsWith("avis:")');
    expect(promos).toContain("!estPersonnel(r.label) && !r.owner_email && !r.owner_phone");
  });

  test("l'étiquette interne n'est jamais renvoyée telle quelle", () => {
    // « avis:<uuid de commande> » révélerait un identifiant de commande
    expect(promos).toContain("etiquettePublique");
    expect(promos).toContain("Merci pour votre avis");
  });

  test("un code précis peut être vérifié à la demande", () => {
    expect(promos).toContain('searchParams.get("code")');
    expect(promos).toContain("code=eq.");
  });

  test("un code épuisé est refusé", () => {
    expect(promos).toContain("Code déjà utilisé");
    expect(promos).toContain("max_uses === null || r.uses < r.max_uses");
  });

  test("le paramètre code est filtré avant la requête", () => {
    // Pas d'injection dans l'URL PostgREST
    expect(promos).toContain("/^[A-Z0-9-]{3,32}$/");
  });
});
