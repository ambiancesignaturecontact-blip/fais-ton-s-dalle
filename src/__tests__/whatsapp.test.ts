import { normalizeAccents, buildOrderMessage } from "../data/whatsapp";

describe("WhatsApp", () => {
  test("normalizeAccents enlève les accents", () => {
    expect(normalizeAccents("éèêë àâä ùûü ôö îï ç")).toBe("eeee aaa uuu oo ii c");
  });
  test("normalizeAccents préserve ASCII", () => {
    expect(normalizeAccents("Menu Gourmand")).toBe("Menu Gourmand");
  });
  test("buildOrderMessage construit un message valide", () => {
    const msg = buildOrderMessage({
      items: [{ name: "Menu Gourmand", price: 9.9, qty: 2, customization: "Chaud" }],
      total: 19.8, customerName: "Karim", mode: "livraison", address: "134 Allée", isPaid: true, deliveryFee: 2.9,
    });
    expect(msg).toContain("NOUVELLE COMMANDE PAYEE");
    expect(msg).toContain("LIVRAISON");
    expect(msg).toContain("2x Menu Gourmand");
    expect(msg).toContain("PAYE OK");
    expect(msg).not.toContain("�");
  });
  test("buildOrderMessage emporter", () => {
    const msg = buildOrderMessage({
      items: [{ name: "Menu Léger", price: 6.9, qty: 1 }],
      total: 6.9, customerName: "Sophie", mode: "emporter", isPaid: false, deliveryFee: 0,
    });
    expect(msg).toContain("A EMPORTER");
    expect(msg).not.toContain("PAYE OK");
  });
});
