// ─── Lien « donner son avis sur Google » ──────────────────────
//
// Pourquoi un fichier dédié : le lien était écrit en dur à deux
// endroits, et l'un d'eux valait
//   https://search.google.com/local/writereview?placeid=
// …avec un identifiant VIDE, parce que la variable
// EXPO_PUBLIC_GOOGLE_PLACE_ID n'a jamais été renseignée. L'URL
// restait « valide » : le repli n'était donc jamais déclenché et le
// client atterrissait sur une page Google en erreur.
//
// Ordre de préférence :
//  1. GOOGLE_REVIEW_URL  — le lien court de votre fiche
//     (Google Business → « Demander des avis »), du type
//     https://g.page/r/XXXXXXXXXXXX/review  → ouvre directement la
//     fenêtre de notation, c'est le meilleur taux de conversion ;
//  2. GOOGLE_PLACE_ID    — ouvre aussi la fenêtre de notation ;
//  3. repli : la recherche Maps de l'établissement. Jamais d'erreur,
//     mais le client doit cliquer « Donner un avis » lui-même.

const NOM = "FAIS TON S'DALLE";
const ADRESSE = "134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois";

export function lienAvisGoogle(): string {
  const direct =
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    process.env.GOOGLE_REVIEW_URL;
  if (direct && /^https:\/\//.test(direct)) return direct;

  const placeId =
    process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || process.env.GOOGLE_PLACE_ID;
  if (placeId && placeId.trim()) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(
      placeId.trim()
    )}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${NOM} ${ADRESSE}`
  )}`;
}

/** Vrai si le lien ouvre directement la fenêtre de notation. */
export function avisGoogleDirect(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
      process.env.GOOGLE_REVIEW_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID ||
      process.env.GOOGLE_PLACE_ID
  );
}
