// ─── Reçu de commande au format PDF ───────────────────────────
//
// Demandé par les clients professionnels (note de frais) et utile à
// tout le monde : jusqu'ici, la seule trace d'une commande payée
// était un e-mail HTML et l'historique dans l'app.
//
// Ce n'est pas une facture au sens fiscal (pas de numérotation
// séquentielle certifiée) : c'est un reçu. La mention est écrite
// noir sur blanc en bas du document.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface LigneRecu {
  nom: string;
  quantite: number;
  prixUnitaire: number;
  personnalisation?: string | null;
}

export interface DonneesRecu {
  reference: string;
  date: string | Date;
  client: string;
  telephone?: string | null;
  mode: "livraison" | "emporter" | string;
  adresse?: string | null;
  lignes: LigneRecu[];
  fraisLivraison: number;
  remise: number;
  pourboire: number;
  total: number;
  moyenPaiement?: string | null;
  codePromo?: string | null;
}

const ROUGE = rgb(0.83, 0.24, 0.17);
const NOIR = rgb(0.1, 0.1, 0.1);
const GRIS = rgb(0.45, 0.45, 0.45);

/** TVA restauration à emporter / livraison : 10 % */
export const TAUX_TVA = 0.1;

export const ENTREPRISE = {
  nom: "FAIS TON S'DALLE",
  adresse: "134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois",
  siret: "803 191 600 00037",
  telephone: "06 72 04 48 75",
  email: "contact@faistonsdalle.com",
};

/** « card » → « carte bancaire » : le reçu est lu par un humain */
export function moyenPaiementFr(code?: string | null): string {
  const c = String(code ?? "").toLowerCase();
  if (c.includes("apple")) return "Apple Pay";
  if (c.includes("stripe") || c.includes("card") || c.includes("carte")) return "carte bancaire";
  if (c.includes("cash") || c.includes("espece") || c.includes("espèce")) return "espèces";
  if (c.includes("tr") || c.includes("ticket")) return "titre-restaurant";
  return c ? c : "";
}

function euro(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} EUR`;
}

function dateFr(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()} à ${p(date.getHours())}h${p(date.getMinutes())}`;
}

/**
 * Les polices standard PDF ne connaissent pas tous les caractères
 * (emojis, ligatures, œ). Un caractère inconnu fait ÉCHOUER la
 * génération : mieux vaut nettoyer que ne rien produire du tout.
 */
function nettoyer(s: string): string {
  return String(s ?? "")
    .replace(/œ/g, "oe").replace(/Œ/g, "OE")
    .replace(/æ/g, "ae").replace(/Æ/g, "AE")
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-").replace(/…/g, "...")
    .replace(/\u00a0/g, " ")
    // Tout ce qui sort du latin-1 imprimable (emojis compris)
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

/**
 * Calcule la TVA. Le pourboire n'est PAS une prestation : il sort de
 * la base imposable (même règle que l'onglet Compta).
 */
export function detailTva(total: number, pourboire: number) {
  const baseTtc = Math.max(0, total - pourboire);
  const ht = Math.round((baseTtc / (1 + TAUX_TVA)) * 100) / 100;
  const tva = Math.round((baseTtc - ht) * 100) / 100;
  return { baseTtc, ht, tva };
}

/** Génère le reçu. Renvoie les octets du PDF. */
export async function genererRecu(d: DonneesRecu): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Recu ${d.reference} - ${ENTREPRISE.nom}`);
  pdf.setProducer(ENTREPRISE.nom);
  pdf.setCreationDate(new Date());

  const page = pdf.addPage([595.28, 841.89]); // A4
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);

  const M = 50;
  let y = 790;

  const ecrire = (
    texte: string,
    opts: { x?: number; taille?: number; font?: typeof normal; couleur?: typeof NOIR; droite?: boolean } = {}
  ) => {
    const t = nettoyer(texte);
    const size = opts.taille ?? 10;
    const font = opts.font ?? normal;
    const x = opts.droite
      ? 545.28 - font.widthOfTextAtSize(t, size)
      : (opts.x ?? M);
    page.drawText(t, { x, y, size, font, color: opts.couleur ?? NOIR });
  };

  // ─── En-tête ────────────────────────────────────────────────
  ecrire(ENTREPRISE.nom, { taille: 20, font: gras, couleur: ROUGE });
  ecrire("REÇU", { taille: 20, font: gras, couleur: GRIS, droite: true });
  y -= 18;
  ecrire(ENTREPRISE.adresse, { taille: 8.5, couleur: GRIS });
  y -= 11;
  ecrire(`SIRET ${ENTREPRISE.siret} · ${ENTREPRISE.telephone}`, { taille: 8.5, couleur: GRIS });
  y -= 11;
  ecrire(ENTREPRISE.email, { taille: 8.5, couleur: GRIS });

  y -= 28;
  page.drawLine({
    start: { x: M, y }, end: { x: 545.28, y },
    thickness: 1.5, color: ROUGE,
  });

  // ─── Commande ───────────────────────────────────────────────
  y -= 24;
  ecrire(`Commande ${d.reference}`, { taille: 13, font: gras });
  ecrire(dateFr(d.date), { taille: 10, couleur: GRIS, droite: true });

  y -= 18;
  ecrire(`Client : ${d.client}`, { taille: 10 });
  if (d.telephone) { y -= 13; ecrire(`Téléphone : ${d.telephone}`, { taille: 10 }); }
  y -= 13;
  ecrire(
    d.mode === "livraison"
      ? `Livraison : ${d.adresse ?? "-"}`
      : "Retrait sur place",
    { taille: 10 }
  );

  // ─── Lignes ─────────────────────────────────────────────────
  y -= 26;
  ecrire("Désignation", { taille: 9, font: gras, couleur: GRIS });
  ecrire("Montant", { taille: 9, font: gras, couleur: GRIS, droite: true });
  y -= 6;
  page.drawLine({
    start: { x: M, y }, end: { x: 545.28, y },
    thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
  });
  y -= 16;

  for (const l of d.lignes) {
    const montant = l.prixUnitaire * l.quantite;
    ecrire(`${l.quantite} x ${l.nom}`, { taille: 10.5, font: gras });
    ecrire(euro(montant), { taille: 10.5, droite: true });
    if (l.personnalisation) {
      y -= 12;
      // Découpe simple pour ne jamais déborder de la page
      const texte = nettoyer(l.personnalisation);
      const max = 92;
      for (let i = 0; i < texte.length && i < max * 3; i += max) {
        ecrire(texte.slice(i, i + max), { x: M + 10, taille: 8.5, couleur: GRIS });
        if (i + max < texte.length) y -= 10;
      }
    }
    y -= 18;
    if (y < 160) break; // garde-fou : on ne déborde jamais sur le pied
  }

  // ─── Totaux ─────────────────────────────────────────────────
  y -= 4;
  page.drawLine({
    start: { x: 320, y }, end: { x: 545.28, y },
    thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
  });
  y -= 16;

  const sousTotal =
    d.lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

  const ligneTotal = (label: string, valeur: string, fort = false) => {
    ecrire(label, { x: 320, taille: fort ? 12 : 10, font: fort ? gras : normal });
    ecrire(valeur, { taille: fort ? 12 : 10, font: fort ? gras : normal, droite: true });
    y -= fort ? 20 : 14;
  };

  ligneTotal("Sous-total", euro(sousTotal));
  if (d.remise > 0) {
    ligneTotal(d.codePromo ? `Remise (${nettoyer(d.codePromo)})` : "Remise", `-${euro(d.remise)}`);
  }
  if (d.fraisLivraison > 0) ligneTotal("Frais de livraison", euro(d.fraisLivraison));
  if (d.pourboire > 0) ligneTotal("Pourboire livreur", euro(d.pourboire));
  ligneTotal("TOTAL PAYÉ", euro(d.total), true);

  const { ht, tva } = detailTva(d.total, d.pourboire);
  ecrire(`Dont TVA 10 % : ${euro(tva)} — total HT : ${euro(ht)}`, {
    x: 320, taille: 8.5, couleur: GRIS,
  });
  y -= 12;
  if (d.pourboire > 0) {
    ecrire("Le pourboire n'est pas soumis à TVA.", { x: 320, taille: 8, couleur: GRIS });
    y -= 12;
  }
  const paiement = moyenPaiementFr(d.moyenPaiement);
  if (paiement) {
    ecrire(`Réglé par ${nettoyer(paiement)}`, { x: 320, taille: 8.5, couleur: GRIS });
  }

  // ─── Pied de page ───────────────────────────────────────────
  const pied = [
    "Merci de votre commande !",
    "Reçu justificatif d'achat — ne constitue pas une facture au sens de l'article 289 du CGI.",
    "Pour une facture au nom d'une société, écrivez à " + ENTREPRISE.email + ".",
    "Allergènes : faistonsdalle.com/allergenes",
  ];
  let yPied = 96;
  for (const [i, ligne] of pied.entries()) {
    const t = nettoyer(ligne);
    const size = i === 0 ? 11 : 8;
    const font = i === 0 ? gras : normal;
    page.drawText(t, {
      x: (595.28 - font.widthOfTextAtSize(t, size)) / 2,
      y: yPied,
      size,
      font,
      color: i === 0 ? ROUGE : GRIS,
    });
    yPied -= i === 0 ? 20 : 12;
  }

  return pdf.save();
}
