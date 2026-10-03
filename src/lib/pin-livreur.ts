// ─── Le code PIN d'un livreur : lisible par vous, pas par la base ─
//
// Demandé le 02/10/2026 : « pouvoir voir le PIN actuel, c'est pas
// pratique d'en générer un nouveau à chaque fois ».
//
// Avant : seul le **haché** était stocké. Par construction, un
// haché ne se relit pas. Quand le patron ou le livreur oubliait le
// code, la seule issue était d'en tirer un nouveau au hasard — et
// de prévenir le livreur.
//
// Maintenant, deux choses sont enregistrées :
//   · le **haché**, qui sert à la connexion (lui seul fait foi) ;
//   · une copie **chiffrée** (AES-256-GCM), que seul le serveur
//     peut relire, avec la clé `PIN_SECRET`.
//
// Une fuite de la base seule ne révèle donc aucun PIN : sans la
// clé, le texte chiffré ne vaut rien.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/** Clé dérivée du secret serveur. */
function cle(): Buffer {
  const secret =
    process.env.PIN_SECRET || process.env.QR_SECRET || "change-me";
  return createHash("sha256").update(`pin:${secret}`).digest();
}

/** PIN → texte chiffré, stockable en base. */
export function chiffrerPin(pin: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cle(), iv);
  const chiffre = Buffer.concat([c.update(String(pin), "utf8"), c.final()]);
  return [iv.toString("hex"), c.getAuthTag().toString("hex"), chiffre.toString("hex")].join(":");
}

/** Texte chiffré → PIN. Renvoie null si illisible (clé changée…). */
export function dechiffrerPin(valeur: string | null | undefined): string | null {
  if (!valeur) return null;
  try {
    const [ivHex, tagHex, dataHex] = String(valeur).split(":");
    if (!ivHex || !tagHex || !dataHex) return null;
    const d = createDecipheriv("aes-256-gcm", cle(), Buffer.from(ivHex, "hex"));
    d.setAuthTag(Buffer.from(tagHex, "hex"));
    const clair = Buffer.concat([d.update(Buffer.from(dataHex, "hex")), d.final()]);
    return clair.toString("utf8");
  } catch {
    return null;
  }
}

/** Un PIN valide : exactement 4 chiffres, et pas une suite évidente. */
export function pinValide(pin: string): boolean {
  if (!/^\d{4}$/.test(pin)) return false;
  const interdits = ["0000", "1111", "2222", "3333", "4444", "5555",
                     "6666", "7777", "8888", "9999", "1234", "0123"];
  return !interdits.includes(pin);
}

/** Un PIN au hasard, qui passe les contrôles ci-dessus. */
export function pinAuHasard(): string {
  let p = "";
  do { p = String(Math.floor(1000 + Math.random() * 9000)); } while (!pinValide(p));
  return p;
}
