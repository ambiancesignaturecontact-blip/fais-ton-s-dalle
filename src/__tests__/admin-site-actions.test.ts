// ─── L'espace restaurateur du SITE était incomplet ─────────────
//
// Signalé le 02/10/2026 : « la modification de commande et le
// remboursement, je vois rien ».
//
// Vérification : les deux existaient dans l'APPLICATION et les
// routes serveur étaient là (`PUT /api/admin/orders`,
// `POST /api/admin/refund`)… mais **aucun bouton** ne les appelait
// sur le site. La fonctionnalité était invisible pour qui gère
// depuis un ordinateur.
//
// Troisième bug trouvé en testant : `order_items.subtotal` n'était
// jamais rempli à la création → chaque ligne s'affichait « 0,00 € »
// dans l'admin du site, alors que le total était juste.

import fs from "fs";
import path from "path";

const lire = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

const tab = lire("components/admin/tabs/OrdersTab.tsx");
const page = lire("app/admin/page.tsx");
const commande = lire("app/api/order/route.ts");
const adminOrders = lire("app/api/admin/orders/route.ts");

describe("Modifier une commande depuis le site", () => {
  test("des boutons − et + appellent la route PUT", () => {
    expect(tab).toContain("changerQuantite");
    expect(tab).toContain('method: "PUT"');
    expect(tab).toContain('"/api/admin/orders"');
  });

  test("seulement tant que la commande n'est pas partie", () => {
    expect(tab).toContain(
      '["pending", "confirmed", "preparing", "ready"].includes(s)'
    );
  });

  test("le mot de passe admin est transmis", () => {
    expect(tab).toContain('"X-Admin-Auth": adminPassword');
    expect(page).toContain("adminPassword={password}");
  });

  test("la liste est rechargée après coup", () => {
    expect(tab).toContain("onRefresh?.()");
    expect(page).toContain("onRefresh={fetchOrders}");
  });
});

describe("Rembourser depuis le site", () => {
  test("moitié et totalité, avec confirmation", () => {
    expect(tab).toContain("rembourser(order, true)");
    expect(tab).toContain("rembourser(order, false)");
    expect(tab).toContain("window.confirm");
  });

  test("le bouton n'apparaît que pour une commande encaissée", () => {
    expect(tab).toContain('order.is_paid && order.status !== "cancelled"');
  });

  test("le cas « espèces » est expliqué au lieu d'un faux succès", () => {
    expect(tab).toContain("main à la main");
  });
});

describe("Sous-totaux des lignes", () => {
  test("remplis à la création de la commande", () => {
    expect(commande).toContain("subtotal: Math.round(prix * qte * 100) / 100");
  });

  test("recalculés quand on change la quantité OU la composition", () => {
    expect(adminOrders).toContain("subtotal: Math.round(prixUnitaire * d.q * 100) / 100");
    expect(adminOrders).toContain("prixLigne(ligne.item_name, compositionFinale)");
  });

  test("repli à l'affichage pour les anciennes commandes à 0", () => {
    expect(tab).toContain("item.subtotal || item.item_price * item.quantity");
  });
});
