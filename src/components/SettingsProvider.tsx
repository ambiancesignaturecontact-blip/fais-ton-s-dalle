"use client";

// ─── Contexte « réglages du restaurant » côté site ─────────────
//
// Un seul abonnement à /api/settings pour TOUTE la page (hero, footer,
// panneau livraison, panier, contact…). L'endpoint est la même source
// de vérité que l'application mobile : un horaire modifié dans l'app
// arrive donc partout sur le site, sans déploiement.
//
// Valeur initiale = horaires par défaut, identique au rendu serveur,
// pour éviter tout écart d'hydratation ; la vraie valeur remplace
// juste après le montage.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  fetchSettings,
  type RestaurantSettings,
} from "@/lib/hours";

const SettingsContext = createContext<RestaurantSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] =
    useState<RestaurantSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      fetchSettings().then((fresh) => {
        if (!cancelled && fresh) setSettings(fresh);
      });
    };
    sync();
    const refresh = setInterval(sync, 120_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    const onOnline = () => sync();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      clearInterval(refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): RestaurantSettings {
  return useContext(SettingsContext);
}
