// Régénère src/lib/wallet-modele.ts depuis public/wallet/fidelite.pass/
//   node outils/generer-modele-wallet.mjs
import fs from "fs";
import path from "path";

const DOSSIER = "public/wallet/fidelite.pass";
const SORTIE = "src/lib/wallet-modele.ts";

const fichiers = fs.readdirSync(DOSSIER).sort();
let total = 0;
const blocs = fichiers.map((f) => {
  const b = fs.readFileSync(path.join(DOSSIER, f));
  total += b.length;
  const b64 = b.toString("base64");
  const morceaux = b64.match(/.{1,100}/g) ?? [];
  return `  "${f}":\n` + morceaux.map((m) => `    "${m}" +`).join("\n").slice(0, -2) + ",";
});

const entete = `// ─── Modèle de la carte Apple Wallet, embarqué dans le code ────
//
// Généré par outils/generer-modele-wallet.mjs — ne pas éditer à la main.
//
// La route lisait le modèle sur le disque ; en production Vercel a
// répondu « Cannot import model: directory … not found » : le dossier
// public/ n'est pas garanti présent dans la fonction serverless.
// Tout est donc embarqué ici : aucune lecture disque, rien à perdre.
//
// Poids des actifs : ${Math.round(total / 1024)} Ko.

/** Nom du fichier → contenu encodé en base64. */
export const MODELE_WALLET: Record<string, string> = {
`;

const pied = `};

/** Le modèle, prêt à être passé à passkit-generator. */
export function tamponsModele(): Record<string, Buffer> {
  const out: Record<string, Buffer> = {};
  for (const [nom, b64] of Object.entries(MODELE_WALLET)) {
    out[nom] = Buffer.from(b64, "base64");
  }
  return out;
}
`;

fs.writeFileSync(SORTIE, entete + blocs.join("\n") + "\n" + pied);
console.log(`${fichiers.length} fichiers · ${Math.round(total / 1024)} Ko → ${SORTIE}`);
