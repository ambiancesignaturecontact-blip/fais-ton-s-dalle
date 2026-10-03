"use client";

/**
 * Codes promo — stockés dans localStorage
 * Format: { code: string, discount: number, type: "percent" | "fixed", uses: number, maxUses: number, active: boolean }
 */

const STORAGE_KEY = "ftsd_promo_codes";

export interface PromoCode {
  code: string;
  discount: number; // 10 = 10% ou 10% du prix
  type: "percent" | "fixed";
  uses: number;
  maxUses: number;
  active: boolean;
}

export function getPromoCodes(): PromoCode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Codes par défaut
  const defaults: PromoCode[] = [
    { code: "WELCOME20", discount: 20, type: "percent", uses: 0, maxUses: 100, active: true },
    { code: "FTSD10", discount: 10, type: "percent", uses: 0, maxUses: 50, active: true },
    { code: "BIENVENUE", discount: 3, type: "fixed", uses: 0, maxUses: 30, active: true },
  ];
  savePromoCodes(defaults);
  return defaults;
}

export function savePromoCodes(codes: PromoCode[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(codes)); } catch {}
}

export function validatePromoCode(input: string): { valid: boolean; code?: PromoCode; error?: string } {
  const code = input.trim().toUpperCase();
  if (!code) return { valid: false, error: "Entrez un code" };
  const codes = getPromoCodes();
  const found = codes.find(c => c.code === code);
  if (!found) return { valid: false, error: "Code invalide" };
  if (!found.active) return { valid: false, error: "Code expiré" };
  if (found.uses >= found.maxUses) return { valid: false, error: "Code épuisé" };
  return { valid: true, code: found };
}

export function usePromoCode(input: string): number {
  const code = input.trim().toUpperCase();
  const codes = getPromoCodes();
  const idx = codes.findIndex(c => c.code === code);
  if (idx === -1) return 0;
  codes[idx].uses += 1;
  savePromoCodes(codes);
  return codes[idx].type === "percent" ? codes[idx].discount : codes[idx].discount;
}

export function calculatePromoDiscount(code: string | null, subtotal: number): { saved: number; percent: number; label: string } | null {
  if (!code) return null;
  const codes = getPromoCodes();
  const found = codes.find(c => c.code === code.toUpperCase());
  if (!found || !found.active) return null;
  if (found.type === "percent") {
    const saved = Math.round(subtotal * (found.discount / 100) * 100) / 100;
    return { saved, percent: found.discount, label: `${found.discount}%` };
  }
  return { saved: Math.min(found.discount, subtotal), percent: 0, label: `${found.discount.toFixed(2).replace(".", ",")}€` };
}

export function getAppliedPromoCode(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("ftsd_promo_applied"); } catch { return null; }
}

export function setAppliedPromoCode(code: string | null) {
  if (code) {
    try { localStorage.setItem("ftsd_promo_applied", code.toUpperCase()); } catch {}
  } else {
    try { localStorage.removeItem("ftsd_promo_applied"); } catch {}
  }
}
