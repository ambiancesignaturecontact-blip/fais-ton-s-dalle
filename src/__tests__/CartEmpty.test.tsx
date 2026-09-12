/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
/**
 * Test pour le composant CartEmpty
 */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => React.createElement("div", props, children), button: ({ children, ...props }: any) => React.createElement("button", props, children), span: ({ children, ...props }: any) => React.createElement("span", props, children) },
}));

describe("CartEmpty", () => {
  it("devrait afficher le message panier vide", () => {
    const CartEmpty = require("@/components/cart/CartEmpty").CartEmpty;
    render(React.createElement(CartEmpty, { onClose: () => {}, recentOrders: [], addItem: () => {}, reorder: () => {}, setIsOpen: () => {} }));
    expect(screen.getByText("Ton panier est vide")).toBeTruthy();
  });

  it("devrait afficher les recentes commandes", () => {
    const CartEmpty = require("@/components/cart/CartEmpty").CartEmpty;
    const orders = [{ id: "1", items: [{ name: "Menu Gourmand" }], total: 9.9, date: new Date().toISOString(), mode: "livraison" }];
    render(React.createElement(CartEmpty, { onClose: () => {}, recentOrders: orders, addItem: () => {}, reorder: () => {}, setIsOpen: () => {} }));
    expect(screen.getByText("Re-commande rapide")).toBeTruthy();
    expect(screen.getByText("Menu Gourmand")).toBeTruthy();
  });
});
