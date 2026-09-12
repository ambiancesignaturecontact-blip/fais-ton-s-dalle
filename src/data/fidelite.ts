// ─── Système de fidélité ───────────────────────────────────────
// 6 menus achetés → 10% de réduction sur tout
// Sync Supabase + localStorage fallback

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export interface FidelityData {
  menuCount: number;
  discountActive: boolean;
  discountUsed: number;
  totalSavings: number;
  lastMenuDate: string | null;
}

const STORAGE_KEY = "ftsd_fidelity";
const MENUS_THRESHOLD = 6;
const DISCOUNT_RATE = 0.10;

function getDefaultFidelity(): FidelityData {
  return { menuCount: 0, discountActive: false, discountUsed: 0, totalSavings: 0, lastMenuDate: null };
}

function getLocalFidelity(): FidelityData {
  if (typeof window === "undefined") return getDefaultFidelity();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const def = getDefaultFidelity();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
  return def;
}

function saveLocalFidelity(data: FidelityData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

/**
 * Récupère la fidélité depuis Supabase (si connecté) ou localStorage
 */
export async function getFidelity(): Promise<FidelityData> {
  const session = getSession();

  if (isSupabaseConfigured() && session) {
    try {
      const { data, error } = await supabase!.from("customers").select(
        "fidelity_menu_count, fidelity_discount_active, fidelity_discount_used, fidelity_total_savings, fidelity_last_menu_date"
      ).eq("email", session.email).single();
      if (!error && data) {
        return {
          menuCount: data.fidelity_menu_count || 0,
          discountActive: data.fidelity_discount_active || false,
          discountUsed: data.fidelity_discount_used || 0,
          totalSavings: data.fidelity_total_savings || 0,
          lastMenuDate: data.fidelity_last_menu_date || null,
        };
      }
    } catch {}
  }

  return getLocalFidelity();
}

async function saveFidelitySupabase(data: FidelityData) {
  const session = getSession();
  if (isSupabaseConfigured() && session) {
    try {
      await supabase!.from("customers").update({
        fidelity_menu_count: data.menuCount,
        fidelity_discount_active: data.discountActive,
        fidelity_discount_used: data.discountUsed,
        fidelity_total_savings: data.totalSavings,
        fidelity_last_menu_date: data.lastMenuDate,
      }).eq("email", session.email);
    } catch {}
  }
  saveLocalFidelity(data);
}

export async function trackMenuPurchase(): Promise<FidelityData> {
  const data = await getFidelity();
  data.menuCount += 1;
  data.lastMenuDate = new Date().toISOString();

  if (data.menuCount >= MENUS_THRESHOLD && !data.discountActive) {
    data.discountActive = true;
    data.menuCount = 0;
  }

  await saveFidelitySupabase(data);
  return data;
}

export async function applyDiscount(price: number): Promise<{ finalPrice: number; saved: number; wasDiscounted: boolean }> {
  const data = await getFidelity();
  if (!data.discountActive) return { finalPrice: price, saved: 0, wasDiscounted: false };
  const saved = Math.round(price * DISCOUNT_RATE * 100) / 100;
  const finalPrice = Math.round((price - saved) * 100) / 100;
  return { finalPrice, saved, wasDiscounted: true };
}

export async function consumeDiscount(totalBeforeDiscount: number): Promise<void> {
  const data = await getFidelity();
  if (!data.discountActive) return;
  const saved = Math.round(totalBeforeDiscount * DISCOUNT_RATE * 100) / 100;
  data.discountUsed += 1;
  data.totalSavings += saved;
  data.discountActive = false;
  await saveFidelitySupabase(data);
}

export async function getMenusUntilDiscount(): Promise<number> {
  const data = await getFidelity();
  if (data.discountActive) return 0;
  return Math.max(0, MENUS_THRESHOLD - data.menuCount);
}

export async function resetFidelity(): Promise<FidelityData> {
  const def = getDefaultFidelity();
  await saveFidelitySupabase(def);
  return def;
}
