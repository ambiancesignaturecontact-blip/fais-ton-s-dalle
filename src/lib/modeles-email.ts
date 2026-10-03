// ─── Modèles d'e-mail prêts à l'emploi ────────────────────────
//
// Campagnes e-mail, séparées des notifications : deux outils, deux
// écrans, deux boutons. Le push s'adresse à ceux qui ont
// l'application ; l'e-mail à tout le fichier client.
//
// Cinq modèles finis, modifiables mot pour mot avant l'envoi. Le
// rendu est volontairement sobre et robuste : tableaux HTML,
// styles en ligne, aucune police externe — c'est ce qui passe
// partout, Outlook compris.

export interface Modele {
  id: string;
  nom: string;
  emoji: string;
  /** Petite phrase au-dessus du titre */
  surtitre: string;
  objet: string;
  titre: string;
  message: string;
  cta: string;
  /** Couleur dominante du bandeau */
  couleur: string;
}

export const MODELES: Modele[] = [
  {
    id: "nouveaute",
    nom: "Nouveauté au menu",
    emoji: "🆕",
    surtitre: "NOUVEAU CHEZ NOUS",
    objet: "Une nouveauté vous attend 🥖",
    titre: "On a ajouté quelque chose au menu",
    message:
      "Nouvelle recette, même exigence : viande halal, crudités préparées le matin, tout fait minute devant vous.\n\nÀ découvrir dès aujourd'hui, sur place ou en livraison.",
    cta: "Voir le menu",
    couleur: "#960E13",
  },
  {
    id: "weekend",
    nom: "Offre du week-end",
    emoji: "🎉",
    surtitre: "CE WEEK-END SEULEMENT",
    objet: "Votre week-end commence ici 🎉",
    titre: "Une offre jusqu'à dimanche soir",
    message:
      "Du vendredi au dimanche, on vous gâte.\n\nCommandez en ligne ou passez nous voir : la cuisine reste ouverte jusqu'à minuit.",
    cta: "J'en profite",
    couleur: "#A8311B",
  },
  {
    id: "tard",
    nom: "Ouvert tard",
    emoji: "🌙",
    surtitre: "OUVERT JUSQU'À MINUIT",
    objet: "Petite faim ce soir ? 🌙",
    titre: "On est encore là",
    message:
      "La cuisine tourne jusqu'à minuit, 7 jours sur 7.\n\nLivraison aux Pavillons-sous-Bois et alentours, en 25 minutes en moyenne.",
    cta: "Commander maintenant",
    couleur: "#1F2A44",
  },
  {
    id: "fidelite",
    nom: "Carte de fidélité",
    emoji: "⭐",
    surtitre: "VOTRE CARTE DE FIDÉLITÉ",
    objet: "10 menus achetés = le 10ᵉ offert ⭐",
    titre: "Votre fidélité vous rapporte",
    message:
      "Un menu acheté, un tampon. Au dixième, votre menu est offert.\n\nAjoutez votre carte à Apple Wallet depuis l'application : elle se met à jour toute seule.",
    cta: "Voir ma carte",
    couleur: "#7A5A16",
  },
  {
    id: "retour",
    nom: "Vous nous manquez",
    emoji: "👋",
    surtitre: "ÇA FAIT UN MOMENT",
    objet: "Vous nous manquez 👋",
    titre: "Ça fait un moment qu'on ne vous a pas vu",
    message:
      "Le menu a évolué, la carte des sauces aussi.\n\nOn serait content de vous revoir — on vous prépare ça comme vous l'aimez.",
    cta: "Revenir commander",
    couleur: "#2E5B3E",
  },
];

export function modeleParId(id: string): Modele | null {
  return MODELES.find((m) => m.id === id) ?? null;
}

// ─── Rendu ────────────────────────────────────────────────────

export interface ContenuEmail {
  surtitre?: string;
  titre: string;
  message: string;
  cta?: string;
  lien?: string;
  couleur?: string;
  /** Prénom du destinataire, s'il est connu */
  nom?: string;
  /** Lien de retrait de la liste (obligatoire en vrai envoi) */
  lienDesabonnement?: string;
}

function echapper(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Les sauts de ligne deviennent des paragraphes. */
function paragraphes(texte: string): string {
  return echapper(texte)
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;color:#3a3a3a;font-size:15px;line-height:25px">${p.replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("");
}

export function rendreEmail(c: ContenuEmail, site: string): string {
  const couleur = c.couleur || "#960E13";
  const bonjour = c.nom ? `Bonjour ${echapper(c.nom)},` : "Bonjour,";
  const lien = c.lien || site;
  const logo = `${site}/images/logo-512.png`;

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${echapper(c.titre)}</title></head>
<body style="margin:0;padding:0;background:#f2efe9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2efe9">
<tr><td align="center" style="padding:28px 12px">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">

    <!-- Bandeau -->
    <tr><td style="background:${couleur};padding:26px 28px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td style="vertical-align:middle">
          <img src="${logo}" width="46" height="46" alt="FAIS TON S'DALLE"
               style="display:block;border-radius:12px;background:#fff">
        </td>
        <td style="vertical-align:middle;padding-left:12px">
          <div style="color:#ffffff;font-size:15px;font-weight:800;letter-spacing:0.5px">
            FAIS TON S'DALLE
          </div>
          <div style="color:rgba(255,255,255,0.72);font-size:11px">
            Sandwicherie halal · Les Pavillons-sous-Bois
          </div>
        </td>
      </tr></table>

      ${
        c.surtitre
          ? `<div style="margin-top:22px;color:#E9B860;font-size:11px;
                         letter-spacing:2.4px;font-weight:700">${echapper(c.surtitre)}</div>`
          : ""
      }
      <h1 style="margin:7px 0 0;color:#ffffff;font-size:24px;line-height:31px;font-weight:800">
        ${echapper(c.titre)}
      </h1>
    </td></tr>

    <!-- Corps -->
    <tr><td style="padding:26px 28px 6px">
      <p style="margin:0 0 16px;color:#6b6b6b;font-size:14px">${bonjour}</p>
      ${paragraphes(c.message)}
    </td></tr>

    <!-- Bouton -->
    ${
      c.cta
        ? `<tr><td style="padding:10px 28px 28px">
             <table role="presentation" cellpadding="0" cellspacing="0">
               <tr><td style="background:${couleur};border-radius:12px">
                 <a href="${lien}" style="display:block;padding:14px 30px;color:#ffffff;
                    font-size:15px;font-weight:700;text-decoration:none">${echapper(c.cta)}</a>
               </td></tr>
             </table>
           </td></tr>`
        : ""
    }

    <!-- Infos pratiques -->
    <tr><td style="padding:0 28px 26px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#faf8f5;border-radius:14px">
        <tr><td style="padding:16px 18px">
          <div style="color:#8a8a8a;font-size:12px;line-height:20px">
            <strong style="color:#4a4a4a">134 Allée du Colonel Fabien</strong><br>
            93320 Les Pavillons-sous-Bois<br>
            7j/7 · 11h30 – minuit · <a href="tel:+33672044875"
              style="color:#8a8a8a">06 72 04 48 75</a>
          </div>
        </td></tr>
      </table>
    </td></tr>

    <!-- Pied -->
    <tr><td style="padding:16px 28px 22px;border-top:1px solid #efeae2;background:#fdfcfa">
      <p style="margin:0;color:#a3a3a3;font-size:11px;line-height:18px">
        Vous recevez ce message parce que vous avez un compte chez nous.
        ${
          c.lienDesabonnement
            ? `<a href="${c.lienDesabonnement}" style="color:#a3a3a3">Ne plus recevoir nos offres</a>.`
            : ""
        }
        <br>
        <a href="${site}/allergenes" style="color:#a3a3a3">Allergènes</a> ·
        <a href="${site}/mentions-legales" style="color:#a3a3a3">Mentions légales</a>
      </p>
    </td></tr>

  </table>

</td></tr></table>
</body></html>`;
}
