// ─── Le code à scanner de la carte de fidélité ────────────────
//
// Avant, le QR contenait le **numéro de téléphone en clair**.
// Scanné par le comptoir : un numéro s'affichait, et il fallait
// aller le chercher à la main dans l'admin. Scanné par un curieux
// dans la rue : une donnée personnelle exposée pour rien.
//
// Maintenant, le QR contient un lien signé :
//
//     https://www.faistonsdalle.com/carte/42-a1b2c3d4e5f6a7b8
//
// · le comptoir le scanne → la fiche s'ouvre, le passage se
//   valide en un geste ;
// · le client le scanne → il voit sa propre progression ;
// · un inconnu ne peut rien en faire : la signature dépend d'un
//   secret serveur, et la page n'affiche ni téléphone ni e-mail.

import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.QR_SECRET || process.env.CARTE_SECRET || "change-me";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.faistonsdalle.com"
  ).replace(/\/$/, "");
}

function signature(id: number): string {
  return createHmac("sha256", SECRET)
    .update(`carte:${id}`)
    .digest("hex")
    .slice(0, 16);
}

/** Le code court inscrit dans le QR : « 42-a1b2c3d4e5f6a7b8 ». */
export function codeCarte(id: number): string {
  return `${id}-${signature(id)}`;
}

/** L'adresse complète encodée dans le QR. */
export function lienCarte(id: number): string {
  return `${siteUrl()}/carte/${codeCarte(id)}`;
}

/**
 * Relit un code et renvoie l'identifiant client, ou null.
 * Comparaison à temps constant : pas de fuite par chronométrage.
 */
export function lireCodeCarte(code: string): number | null {
  const m = /^(\d+)-([0-9a-f]{16})$/.exec(String(code ?? "").trim());
  if (!m) return null;
  const id = Number(m[1]);
  if (!Number.isInteger(id) || id <= 0) return null;
  const a = Buffer.from(signature(id));
  const b = Buffer.from(m[2]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
