"use client";

import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics";

/**
 * Tracker — enregistre les pages vues dans localStorage
 * Ajouté dans le layout pour track chaque navigation
 */
export function Tracker() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    trackPageView(window.location.pathname);
  }, []);

  return null;
}
