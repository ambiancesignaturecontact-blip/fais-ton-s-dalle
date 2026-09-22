// ─── Code de remise à 6 chiffres ───────────────────────────────
//
// À l'arrivée du livreur, le client lui dicte 6 chiffres. Le livreur
// les saisit dans son application ; le serveur recalcule la même
// valeur et valide la livraison.
//
// Pourquoi un code plutôt qu'un QR seul :
//   · pas de caméra à autoriser, pas de problème de luminosité ;
//   · ça marche sur un écran fissuré, ou lu à voix haute ;
//   · aussi sûr que le QR, car dérivé du MÊME HMAC serveur — un
//     client ne peut pas fabriquer un code valide, il ne connaît pas
//     le secret.
//
// ⚠️ Cette fonction est la SEULE définition de la règle côté site.
// Elle doit rester identique à :
//   · `deliveryCode()` dans l'app  (ftsd-go/src/lib/driver.ts)
//   · la vérification dans POST /api/driver, action « deliver »
// Toute divergence rendrait les codes invalides à la porte du client,
// livreur et client se renvoyant la faute sans comprendre.

/** Longueur du code affiché */
export const LONGUEUR_CODE = 6;

/**
 * Dérive le code à 6 chiffres depuis la signature HMAC de la commande.
 *
 * On prend les 8 premiers caractères hexadécimaux (32 bits), modulo
 * un million. Le `padStart` est indispensable : sans lui, un code
 * commençant par un zéro serait affiché sur 5 chiffres et refusé à la
 * saisie.
 *
 * @param sig signature renvoyée par `signQr()`
 * @returns 6 chiffres, ou "------" si la signature est absente/trop courte
 */
export function codeLivraison(sig: string | null | undefined): string {
  if (!sig || sig.length < 8) return "-".repeat(LONGUEUR_CODE);
  const n = parseInt(sig.slice(0, 8), 16);
  if (!Number.isFinite(n)) return "-".repeat(LONGUEUR_CODE);
  return String(n % 1_000_000).padStart(LONGUEUR_CODE, "0");
}

/** Le code est-il exploitable (6 chiffres réels, pas un gabarit vide) ? */
export function codeValide(code: string | null | undefined): boolean {
  return !!code && /^\d{6}$/.test(code);
}

/**
 * Découpe le code en deux groupes de trois pour l'affichage : « 042 891 ».
 * On lit et on dicte un numéro à voix haute nettement plus sûrement
 * groupé que d'un seul bloc de six chiffres.
 */
export function formaterCode(code: string): string {
  if (!codeValide(code)) return code;
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
