import { getSubtotal, getDelivery, getTotal, DELIVERY_FEE, MIN_DELIVERY_ORDER } from "../data/cart";

describe("Cart calculations", () => {
  const items = [
    { id: "l", name: "Menu Léger", price: 6.9, quantity: 1, image: "/images/menu-leger.webp" },
    { id: "co", name: "Coca-Cola", price: 1.5, quantity: 2, image: "/images/coca.webp" },
  ];

  test("getSubtotal", () => expect(getSubtotal(items)).toBeCloseTo(9.9, 2));
  test("getSubtotal empty", () => expect(getSubtotal([])).toBe(0));
  test("getDelivery livraison", () => expect(getDelivery("livraison")).toBe(DELIVERY_FEE));
  test("getDelivery emporter", () => expect(getDelivery("emporter")).toBe(0));
  test("getTotal livraison", () => expect(getTotal(items, "livraison")).toBeCloseTo(12.8, 2));
  test("getTotal emporter", () => expect(getTotal(items, "emporter")).toBeCloseTo(9.9, 2));
  test("MIN_DELIVERY_ORDER", () => expect(MIN_DELIVERY_ORDER).toBe(15));
});
