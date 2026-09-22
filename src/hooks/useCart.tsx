"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { CartItem, CartState, getSubtotal, getTotal } from "@/data/cart";
import { playAddToCartSound, playRemoveSound } from "@/lib/sounds";

const STORAGE_KEY = "ftsd_cart";

interface CartContextType extends CartState {
  addItem: (item: CartItem) => void;
  removeItem: (id: string, customization?: string) => void;
  updateQuantity: (id: string, delta: number, customization?: string) => void;
  clearCart: () => void;
  setMode: (mode: "livraison" | "emporter") => void;
  setAddress: (addr: string) => void;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  subtotal: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): { items: CartItem[]; mode: "livraison" | "emporter"; address: string; name: string; phone: string } {
  if (typeof window === "undefined") return { items: [], mode: "livraison", address: "", name: "", phone: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { items: [], mode: "livraison", address: "", name: "", phone: "" };
}

function saveCart(items: CartItem[], mode: string, address: string, name: string, phone: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, mode, address, name, phone }));
  } catch { /* ignore */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadCart);
  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [mode, setModeState] = useState<"livraison" | "emporter">(initial.mode);
  const [address, setAddressState] = useState(initial.address);
  const [name, setNameState] = useState(initial.name);
  const [phone, setPhoneState] = useState(initial.phone);

  // Persist to localStorage on every change
  useEffect(() => {
    saveCart(items, mode, address, name, phone);
  }, [items, mode, address, name, phone]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.customization === item.customization
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.customization === item.customization
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    try { playAddToCartSound(); } catch {}
  }, []);

  const removeItem = useCallback((id: string, customization?: string) => {
    setItems((prev) =>
      customization
        ? prev.filter((i) => !(i.id === id && i.customization === customization))
        : prev.filter((i) => i.id !== id)
    );
    try { playRemoveSound(); } catch {}
  }, []);

  const updateQuantity = useCallback((id: string, delta: number, customization?: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id && (!customization || i.customization === customization) ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const setMode = useCallback((m: "livraison" | "emporter") => {
    setModeState(m);
  }, []);

  const setAddress = useCallback((addr: string) => {
    setAddressState(addr);
  }, []);

  const setName = useCallback((n: string) => {
    setNameState(n);
  }, []);

  const setPhone = useCallback((p: string) => {
    setPhoneState(p);
  }, []);

  const subtotal = getSubtotal(items);
  const total = getTotal(items, mode);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, mode, address, name, phone, addItem, removeItem, updateQuantity, clearCart, setMode, setAddress, setName, setPhone, subtotal, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
