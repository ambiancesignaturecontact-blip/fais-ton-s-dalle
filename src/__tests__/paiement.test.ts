/**
 * Parcours de paiement
 *
 * Deux bugs bloquaient TOUS les paiements par carte en production.
 * Ces tests empêchent leur retour.
 */

import * as fs from "fs";
import * as path from "path";

const RACINE = path.join(__dirname, "..");
const lire = (rel: string) => fs.readFileSync(path.join(RACINE, rel), "utf8");

describe("le panier appelle une route qui existe", () => {
  const panier = lire("components/cart/CartSheet.tsx");

  it("n'appelle pas /api/create-checkout", () => {
    // Bug constaté en production : le bouton « Payer » appelait
    // /api/create-checkout, or la route s'appelle /api/checkout.
    // Résultat : 404 sur CHAQUE paiement par carte. Le client voyait
    // « Erreur réseau » et aucune commande ne pouvait aboutir.
    expect(panier).not.toMatch(/["']\/api\/create-checkout["']/);
  });

  it("appelle bien /api/checkout", () => {
    expect(panier).toMatch(/fetch\(\s*["']\/api\/checkout["']/);
  });

  it("chaque route appelée par le panier existe sur le disque", () => {
    // Garde-fou général : toute route citée dans le panier doit
    // correspondre à un fichier. Une faute de frappe se voit ici,
    // pas en production.
    const appels = [...panier.matchAll(/fetch\(\s*["'](\/api\/[^"'`]+)["']/g)];
    expect(appels.length).toBeGreaterThan(0);

    for (const [, route] of appels) {
      const dossier = route.replace(/^\//, "").split("?")[0];
      const fichier = path.join(RACINE, "app", dossier, "route.ts");
      expect(fs.existsSync(fichier)).toBe(true);
    }
  });

  it("affiche le motif d'un échec au lieu d'un message vague", () => {
    // Avant : un 404 faisait échouer res.json(), l'exception tombait
    // dans le catch et affichait « Erreur réseau ». Le client ne
    // pouvait rien comprendre, et le gérant non plus.
    expect(panier).toMatch(/res\.json\(\)\.catch/);
    expect(panier).toMatch(/!res\.ok/);
  });
});

describe("les suppléments sont facturables", () => {
  const route = lire("app/api/checkout/route.ts");

  it("tient compte du prix envoyé par le panier", () => {
    // Bug constaté : la route ne connaissait que le prix de base du
    // menu. Chaque supplément coûtant 1,00 €, l'écart dépassait la
    // tolérance de 0,50 € dès le premier ajout, et le paiement était
    // refusé avec « Erreur de calcul du total ».
    //
    // Concrètement : un Menu Classique avec du cheddar était
    // IMPAYABLE sur le site.
    expect(route).toMatch(/prixAnnonce/);
    expect(route).toMatch(/MAX_SUPPLEMENTS_CENTIMES/);
  });

  it("refuse un prix inférieur au prix de base", () => {
    // Accepter le prix du client sans contrôle permettrait de payer
    // 1 € un menu à 9,90 €. La borne basse est le prix du catalogue.
    expect(route).toMatch(/prixAnnonce\s*>=\s*basePrice/);
  });

  it("plafonne le supplément acceptable", () => {
    // Borne haute : au plus 10 suppléments, soit 10,00 €. Évite
    // qu'un panier corrompu génère une session à 4 000 €.
    expect(route).toMatch(/10\s*\*\s*100/);
  });

  it("indique les montants en cas d'écart", () => {
    // « Erreur de calcul du total » ne disait ni l'attendu ni le
    // reçu : impossible à diagnostiquer sans relire le code.
    expect(route).toMatch(/attendu/);
    expect(route).toMatch(/recu/);
  });
});

describe("les prix restent calculés côté serveur", () => {
  const route = lire("app/api/checkout/route.ts");

  it("reconstruit le total à partir du catalogue", () => {
    // Le prix de base vient TOUJOURS de MENU_ITEMS, jamais du
    // navigateur. Seul l'écart lié aux suppléments est toléré.
    expect(route).toMatch(/getServerPrice\(name\)/);
    expect(route).toMatch(/import .*MENU_ITEMS.*from "@\/data\/menu"/);
  });

  it("rejette un produit absent du catalogue", () => {
    expect(route).toMatch(/Produit inconnu/);
  });

  it("borne les quantités", () => {
    expect(route).toMatch(/qty > 99/);
  });
});

describe("inscription par e-mail", () => {
  const route = lire("app/api/auth/register/route.ts");
  const authApp = fs.existsSync(path.join(RACINE, "..", "..", "ftsd-ios", "src", "lib", "auth.ts"));

  it("la route register existe", () => {
    // L'app appelait /api/auth/send-confirmation, qui n'inscrit
    // personne : elle envoie un e-mail et exige un `token` que
    // l'app n'a pas. Elle répondait 400 « Paramètres manquants »
    // à CHAQUE création de compte.
    expect(route.length).toBeGreaterThan(0);
  });

  it("crée l'utilisateur dans Supabase Auth", () => {
    // C'est ce compte que /api/auth/login vérifie. Sans lui, la
    // connexion échouerait juste après l'inscription.
    expect(route).toMatch(/auth\/v1\/admin\/users/);
    expect(route).toMatch(/email_confirm:\s*true/);
  });

  it("crée aussi la fiche client", () => {
    expect(route).toMatch(/sb\("customers"/);
    expect(route).toMatch(/password_hash/);
  });

  it("annule le compte Auth si la fiche échoue", () => {
    // Sinon l'adresse resterait « déjà prise » sans compte
    // utilisable : le client ne pourrait plus jamais s'inscrire.
    expect(route).toMatch(/method:\s*"DELETE"/);
  });

  it("refuse un doublon avec un code 409", () => {
    expect(route).toMatch(/409/);
    expect(route).toMatch(/existe déjà/);
  });

  it("dit précisément ce qui manque", () => {
    // « Paramètres manquants » ne permettait à personne de
    // comprendre ce qui bloquait.
    expect(route).toMatch(/E-mail requis/);
    expect(route).toMatch(/Nom requis/);
    expect(route).toMatch(/au moins 8 caractères/);
    // Le message générique ne doit plus être RENVOYÉ au client
    // (il reste cité dans les commentaires qui expliquent le bug).
    expect(route).not.toMatch(/error:\s*"Paramètres manquants"/);
  });

  it("l'application pointe vers la bonne route", () => {
    if (!authApp) return;
    const src = fs.readFileSync(
      path.join(RACINE, "..", "..", "ftsd-ios", "src", "lib", "auth.ts"),
      "utf8"
    );
    expect(src).toMatch(/\/api\/auth\/register/);
    expect(src).not.toMatch(/post\("\/api\/auth\/send-confirmation"/);
  });
});

describe("suppression de compte — sécurité", () => {
  const route = lire("app/api/auth/delete/route.ts");
  const customer = lire("app/api/customer/route.ts");

  it("vérifie TOUJOURS le mot de passe", () => {
    // Faille découverte pendant les tests : la vérification était
    // conditionnée à la présence de SUPABASE_ANON. Sans cette clé,
    // un mot de passe erroné supprimait quand même le compte.
    // N'importe qui connaissant une adresse aurait pu détruire le
    // compte correspondant.
    expect(route).toMatch(/const cleAuth = SUPABASE_ANON \|\| SUPABASE_SERVICE/);
    expect(route).not.toMatch(/if \(SUPABASE_ANON\) \{/);
  });

  it("refuse si aucune clé n'est disponible", () => {
    expect(route).toMatch(/if \(!cleAuth\)/);
  });

  it("supprime l'utilisateur Supabase Auth", () => {
    // Sans cela, l'identifiant et le mot de passe restent valides :
    // le compte n'est pas réellement supprimé (guideline 5.1.1(v)),
    // et l'adresse devient inutilisable pour une nouvelle
    // inscription. Trois comptes orphelins existaient en base.
    expect(route).toMatch(/auth\/v1\/admin\/users\/\$\{u\.id\}/);
    expect(route).toMatch(/method: "DELETE"/);
  });

  it("compare les adresses strictement", () => {
    // La recherche par e-mail de Supabase renvoie des
    // correspondances partielles : sans égalité stricte, on risque
    // de supprimer le compte d'un autre client.
    expect(route).toMatch(/u\.email\?\.toLowerCase\(\) !== email/);
  });

  it("la route SMS supprime aussi le compte Auth", () => {
    expect(customer).toMatch(/auth\/v1\/admin\/users/);
    expect(customer).toMatch(/emailCompte/);
  });

  it("conserve les commandes de façon anonyme", () => {
    // Article L123-22 du Code de commerce : dix ans d'archives.
    // On dissocie au lieu d'effacer.
    expect(route).toMatch(/Compte supprimé/);
    expect(route).toMatch(/customer_id: null/);
  });
});

describe("on ne peut plus commander sans payer", () => {
  const order = lire("app/api/order/route.ts");
  const admin = lire("app/api/admin/orders/route.ts");
  const webhook = lire("app/api/stripe/webhook/route.ts");

  it("une commande par carte entre en attente de paiement", () => {
    // Bug constaté en production : la commande était créée avec le
    // statut « pending » AVANT le paiement. Il suffisait d'atteindre
    // l'écran de règlement et de fermer l'application pour qu'elle
    // parte en préparation sans qu'un centime soit encaissé.
    expect(order).toMatch(/enLigne \? "awaiting_payment" : "pending"/);
    expect(order).toMatch(/payMethod === "card" \|\| payMethod === "applepay"/);
  });

  it("la cuisine ne voit pas les commandes impayées", () => {
    expect(admin).toMatch(/status=neq\.awaiting_payment/);
  });

  it("le webhook Stripe confirme la commande", () => {
    // Sans ce passage en « pending », une commande payée resterait
    // invisible : le client aurait payé pour rien.
    expect(webhook).toMatch(/status: "pending"/);
    expect(webhook).toMatch(/is_paid: true/);
  });

  it("les espèces ne sont pas bloquées", () => {
    // Une commande à emporter réglée sur place doit partir en
    // préparation immédiatement.
    expect(order).toMatch(/: "pending"/);
  });
});

describe("routes admin manquantes", () => {
  it("la route des établissements existe", () => {
    // L'onglet « Locaux » affichait « Route franchises non déployée ».
    expect(lire("app/api/franchises/route.ts")).toMatch(/export async function GET/);
  });

  it("la route de comptabilité existe", () => {
    // L'onglet « Compta » affichait « Route compta non déployée ».
    expect(lire("app/api/compta/route.ts")).toMatch(/export async function GET/);
  });

  it("un gérant ne voit que son établissement", () => {
    // Sans ce cloisonnement, le gérant d'un local verrait le chiffre
    // d'affaires de tous les autres.
    const f = lire("app/api/franchises/route.ts");
    expect(f).toMatch(/auth\.siege \? "" : `&id=eq\.\$\{auth\.franchiseId\}`/);
    const c = lire("app/api/compta/route.ts");
    expect(c).toMatch(/auth\.siege[\s\S]{0,120}auth\.franchiseId/);
  });

  it("la compta ne compte que les commandes livrées", () => {
    // Une commande annulée ou en attente ne doit jamais entrer dans
    // le chiffre d'affaires déclaré.
    expect(lire("app/api/compta/route.ts")).toMatch(/status=eq\.delivered/);
  });

  it("le pourboire est exclu de la TVA", () => {
    // Il est reversé au livreur : ce n'est pas du chiffre d'affaires.
    expect(lire("app/api/compta/route.ts")).toMatch(/const baseTva = caTtc - pourboires/);
  });
});

describe("codes promo — validés côté serveur", () => {
  const order = lire("app/api/order/route.ts");

  it("utilise la bonne table", () => {
    // La table s'appelle `promo_codes`. Viser `promos` faisait
    // échouer la requête en silence : aucune remise n'était jamais
    // appliquée, et aucune erreur n'apparaissait.
    expect(order).toMatch(/rest\/v1\/promo_codes\?code=eq\./);
    expect(order).not.toMatch(/rest\/v1\/promos\?code=eq\./);
  });

  it("recalcule la remise depuis la base", () => {
    // Le montant annoncé par l'application n'est jamais repris tel
    // quel : seul le CODE circule.
    expect(order).toMatch(/const codePromo = String\(body\?\.promoCode/);
    expect(order).toMatch(/promo\.type === "percent"/);
  });

  it("enregistre le total remisé, pas le prix catalogue", () => {
    // Avant : le client voyait 14,31 €, Stripe encaissait 14,31 €,
    // mais la base enregistrait 15,90 €. La comptabilité était
    // fausse à chaque promotion.
    expect(order).toMatch(/const calculatedTotal = arrondi\(totalCatalogue - remisesTotales \+ pourboire\)/);
  });

  it("incrémente le compteur d'utilisations", () => {
    // Sans cela, `max_uses` n'avait aucun effet : un code limité à
    // dix utilisations restait valable indéfiniment.
    expect(order).toMatch(/uses: promoAppliquee\.uses \+ 1/);
  });

  it("refuse un code épuisé ou expiré", () => {
    expect(order).toMatch(/const epuise =/);
    expect(order).toMatch(/const expire =/);
  });

  it("une remise ne rend jamais la commande gratuite", () => {
    expect(order).toMatch(/remise = Math\.min\(remise, articlesSeuls\)/);
  });

  it("trace la remise accordée", () => {
    expect(order).toMatch(/discount_applied: remisesTotales > 0 \? remisesTotales : null/);
  });
});
