"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "ftsd_recent_orders";
const MAX_ORDERS = 5;

export interface RecentOrder {
  id: string;
  items: { id: string; name: string; price: number; customization?: string; image: string }[];
  total: number;
  date: string;
  mode: "livraison" | "emporter";
}

export function useRecentOrders() {
  const [orders, setOrders] = useState<RecentOrder[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveOrder = useCallback((order: RecentOrder) => {
    setOrders((prev) => {
      const updated = [order, ...prev].slice(0, MAX_ORDERS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const reorder = useCallback(
    (order: RecentOrder, addItem: (item: { id: string; name: string; price: number; quantity: number; image: string; customization?: string }) => void) => {
      order.items.forEach((item) => {
        addItem({ ...item, quantity: 1 });
      });
    },
    []
  );

  return { orders, saveOrder, reorder };
}
