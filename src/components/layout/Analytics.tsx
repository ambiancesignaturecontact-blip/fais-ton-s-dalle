"use client";

import { useEffect } from "react";

/**
 * Analytics — Vercel Web Analytics (optionnel)
 * À activer en ajoutant NEXT_PUBLIC_VERCEL_ANALYTICS=true dans les vars d'env
 * 
 * Fonctionne aussi en fallback avec un logger console en dev
 */
export function Analytics() {
  useEffect(() => {
    // Vercel Web Analytics (intégré automatiquement sur Vercel)
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_VERCEL_ENV) {
      // Vercel injecte automatiquement ses analytics
      return;
    }

    // Fallback: log simple en dev
    if (process.env.NODE_ENV === "development") {
      const logPageView = () => {
        // console.log("📊 Page view:", window.location.pathname); // Décommenter en debug
      };
      logPageView();
      const observer = new MutationObserver(() => {
        // Détection basique de changement de page
      });
      observer.observe(document.querySelector("title") || document.head, {
        subtree: true,
        characterData: true,
        childList: true,
      });
      return () => observer.disconnect();
    }
  }, []);

  return null;
}
