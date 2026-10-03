// ─── Certificats Apple Wallet : accepte tous les formats ───────
//
// 🔴 Deuxième panne trouvée en testant la génération de bout en
// bout (01/10/2026).
//
// La route passait directement le contenu de `WALLET_CERT_P12` à
// passkit-generator :
//
//     signerCert: Buffer.from(CERT_P12, "base64"),
//     signerKey:  Buffer.from(CERT_P12, "base64"),
//
// Or passkit-generator veut du **PEM**, pas un `.p12`. Un `.p12`,
// c'est une archive binaire chiffrée qui CONTIENT le certificat et
// la clé. Résultat :
//
//     Invalid PEM formatted message.
//
// Autrement dit : même avec les cinq variables correctement
// remplies sur Vercel, la carte n'aurait jamais été générée.
//
// Ce module ouvre le `.p12` avec son mot de passe, en sort le
// certificat et la clé au format PEM, et accepte aussi :
//   · du PEM collé directement ;
//   · un `.cer` Apple au format DER (converti en PEM).
//
// Le résultat est mis en cache : déchiffrer un PKCS#12 à chaque
// carte serait du gaspillage.

import forge from "node-forge";

export interface CertificatsWallet {
  wwdr: string;
  signerCert: string;
  signerKey: string;
  signerKeyPassphrase?: string;
}

const estPem = (s: string) => s.includes("-----BEGIN");

/** DER (binaire) → PEM. Les `.cer` d'Apple sont souvent en DER. */
function derVersPem(bin: Buffer, type: "CERTIFICATE" | "PRIVATE KEY"): string {
  const b64 = bin.toString("base64").replace(/(.{64})/g, "$1\n").trim();
  return `-----BEGIN ${type}-----\n${b64}\n-----END ${type}-----\n`;
}

/** Normalise un certificat quel que soit ce qu'on nous donne. */
export function certificatSeul(valeur: string): string {
  const brut = Buffer.from(valeur.trim(), "base64");
  const texte = brut.toString("utf8");
  if (estPem(texte)) return texte;
  if (estPem(valeur)) return valeur; // PEM collé en clair
  return derVersPem(brut, "CERTIFICATE");
}

/**
 * Ouvre un `.p12` et en extrait le certificat et la clé, en PEM.
 * Lève une erreur explicite si le mot de passe est faux — c'est
 * l'erreur la plus fréquente et la plus pénible à diagnostiquer.
 */
export function ouvrirP12(
  p12Base64: string,
  motDePasse: string
): { cert: string; key: string } {
  const der = Buffer.from(p12Base64.trim(), "base64");
  const asn1 = forge.asn1.fromDer(der.toString("binary"));

  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, motDePasse);
  } catch {
    throw new Error(
      "Le mot de passe du certificat (.p12) est refusé — vérifiez WALLET_CERT_PASSWORD."
    );
  }

  const sacsCert = p12.getBags({ bagType: forge.pki.oids.certBag });
  const cert = sacsCert[forge.pki.oids.certBag]?.[0]?.cert;

  const sacsCle =
    p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
      forge.pki.oids.pkcs8ShroudedKeyBag
    ] ?? p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];
  const cle = sacsCle?.[0]?.key;

  if (!cert) throw new Error("Aucun certificat trouvé dans le .p12.");
  if (!cle) throw new Error("Aucune clé privée trouvée dans le .p12.");

  return {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(cle),
  };
}

let cache: CertificatsWallet | null = null;

/**
 * Les certificats prêts pour passkit-generator.
 * Renvoie null si la configuration est incomplète (l'application
 * masque alors simplement le bouton).
 */
export function certificatsWallet(): CertificatsWallet | null {
  if (cache) return cache;

  const p12 = process.env.WALLET_CERT_P12;
  const motDePasse = process.env.WALLET_CERT_PASSWORD ?? "";
  const wwdrBrut = process.env.WALLET_WWDR;
  if (!p12 || !wwdrBrut) return null;

  const wwdr = certificatSeul(wwdrBrut);

  // Cas 1 : on nous a donné du PEM directement (cert + clé séparés)
  const pemCert = process.env.WALLET_CERT_PEM;
  const pemKey = process.env.WALLET_KEY_PEM;
  if (pemCert && pemKey) {
    cache = {
      wwdr,
      signerCert: certificatSeul(pemCert),
      signerKey: Buffer.from(pemKey.trim(), "base64").toString("utf8").includes("-----BEGIN")
        ? Buffer.from(pemKey.trim(), "base64").toString("utf8")
        : pemKey,
      signerKeyPassphrase: motDePasse || undefined,
    };
    return cache;
  }

  // Cas 2 : un vrai .p12 — on l'ouvre et on en sort les deux pièces.
  const { cert, key } = ouvrirP12(p12, motDePasse);
  cache = {
    wwdr,
    signerCert: cert,
    signerKey: key,
    // La clé ressort déchiffrée du .p12 : plus de phrase secrète.
    signerKeyPassphrase: undefined,
  };
  return cache;
}
