"use client";

/**
 * Système de parrainage — localStorage
 * Chaque client a un code FTSD-XXXXX unique
 * Parrainer = -10% pour le parrain ET le filleul
 */

const STORAGE_KEY = "ftsd_parrainage";
const PARRAIN_KEY = "ftsd_parrain_code";

export interface ParrainageData {
  code: string;
  parrainCount: number;
  totalDiscounts: number;
}

function generateCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${suffix}`;
}

export function getParrainage(name?: string): ParrainageData {
  if (typeof window === "undefined") return { code: "", parrainCount: 0, totalDiscounts: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Créer un nouveau code
  const data: ParrainageData = {
    code: generateCode(name || "FTSD"),
    parrainCount: 0,
    totalDiscounts: 0,
  };
  saveParrainage(data);
  return data;
}

export function saveParrainage(data: ParrainageData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function getParrainCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARRAIN_KEY);
}

export function applyParrainCode(code: string): boolean {
  if (!code || code.length < 5) return false;
  try {
    localStorage.setItem(PARRAIN_KEY, code.toUpperCase());
    return true;
  } catch { return false; }
}

export function trackParrainage(): void {
  try {
    const p = getParrainage();
    p.parrainCount += 1;
    p.totalDiscounts += 1;
    saveParrainage(p);
  } catch {}
}

export function getParrainDiscount(): { active: boolean; code: string | null } {
  const code = getParrainCode();
  if (!code) return { active: false, code: null };
  return { active: true, code };
}
