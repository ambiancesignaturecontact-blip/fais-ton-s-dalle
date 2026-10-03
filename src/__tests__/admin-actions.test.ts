// ─── Remboursement, modification de commande, preuve de dépôt ─

import fs from "fs";
import path from "path";

const lire = (f: string) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const refund = lire("app/api/admin/refund/route.ts");
const orders = lire("app/api/admin/orders/route.ts");
const driver = lire("app/api/driver/route.ts");

describe("Remboursement Stripe", () => {
  test("réservé à l'admin", () => {
    expect(refund).toContain('request.headers.get("X-Admin-Auth")');
    expect(refund).toContain("Non autorisé");
  });

  test("jamais plus que ce qui a été encaissé", () => {
    expect(refund).toContain("const restant = Math.max(0, Math.round((total - dejaRembourse)");
    expect(refund).toContain("Math.min(Math.round(demande * 100) / 100, restant)");
  });

  test("un remboursement déjà complet est refusé", () => {
    expect(refund).toContain("déjà intégralement remboursée");
  });

  test("la commande n'est PAS touchée si Stripe refuse", () => {
    // Sinon on annulerait une commande dont l'argent n'est jamais
    // reparti : le pire des deux mondes.
    expect(refund).toContain("Remboursement refusé");
    const iCatch = refund.indexOf("Remboursement refusé");
    const iPatch = refund.indexOf("refunded_amount: totalRembourse");
    expect(iCatch).toBeLessThan(iPatch);
  });

  test("les espèces sont traitées à part", () => {
    expect(refund).toContain("à rembourser de la main à la main");
  });

  test("un remboursement complet annule la commande", () => {
    expect(refund).toContain('status: "cancelled"');
  });
});

describe("Modification d'une commande en cours", () => {
  test("route PUT protégée", () => {
    expect(orders).toContain("export async function PUT");
    // Depuis le 02/10, le contrôle passe par estAdmin() : mot de
    // passe général OU accès personnel de l'équipe.
    expect(orders).toContain('await estAdmin(who)');
  });

  test("le total est recalculé côté serveur", () => {
    expect(orders).toContain("const articles = restantes.reduce(");
    expect(orders).toContain("Number(o.delivery_fee ?? 0)");
  });

  test("une commande livrée ou annulée est verrouillée", () => {
    expect(orders).toContain('["delivered", "cancelled"].includes(String(o.status))');
  });

  test("on ne peut pas vider une commande", () => {
    expect(orders).toContain("ne peut pas être vidée");
  });

  test("le client est prévenu du changement", () => {
    expect(orders).toContain('notifierClient(uuid, "modifiee")');
    expect(lire("lib/notifier-client.ts")).toContain("Commande modifiée");
  });
});

describe("Photo de dépôt", () => {
  test("la commande doit appartenir au livreur", () => {
    expect(driver).toContain("driver_id=eq.${driver.id}&select=id&limit=1");
  });

  test("stockage privé, taille plafonnée", () => {
    expect(driver).toContain("preuves-livraison");
    expect(driver).toContain("Photo trop lourde");
  });

  test("le chemin est enregistré sur la commande", () => {
    expect(driver).toContain("proof_url: chemin");
  });
});
