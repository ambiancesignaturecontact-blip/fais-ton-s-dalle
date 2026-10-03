import { NextRequest, NextResponse } from "next/server";
import { tamponsModele } from "@/lib/wallet-modele";
import { certificatsWallet } from "@/lib/wallet-certs";
import { bandesFidelite } from "@/lib/wallet-bandes";
import { lienCarte } from "@/lib/carte-fidelite";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.faistonsdalle.com";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ─── Carte de fidélité dans Apple Wallet ──────────────────────
//
// Un fichier .pkpass est une archive SIGNÉE : sans certificat Apple,
// iOS refuse de l'ouvrir. Il faut donc, une fois pour toutes, créer
// un « Pass Type ID » sur developer.apple.com et déposer trois
// secrets sur Vercel (voir AUDIT-BUGS.md) :
//
//   WALLET_PASS_TYPE_ID   pass.com.faistonsdalle.fidelite
//   WALLET_TEAM_ID        NK7HG53G64
//   WALLET_CERT_P12       le certificat, encodé en base64
//   WALLET_CERT_PASSWORD  son mot de passe
//   WALLET_WWDR           le certificat intermédiaire Apple, en base64
//
// Tant qu'ils manquent, la route répond 503 et l'application masque
// simplement le bouton : rien ne casse, rien ne ment au client.

const PASS_TYPE_ID = process.env.WALLET_PASS_TYPE_ID;
const TEAM_ID = process.env.WALLET_TEAM_ID;
const CERT_P12 = process.env.WALLET_CERT_P12;
// (le mot de passe est lu par wallet-certs.ts, qui ouvre le .p12)
const WWDR = process.env.WALLET_WWDR;

/** Les certificats Apple sont-ils en place ? (usage interne) */
function walletConfigure(): boolean {
  return Boolean(PASS_TYPE_ID && TEAM_ID && CERT_P12 && WWDR);
}

function sb(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}` },
    cache: "no-store",
  });
}

/**
 * HEAD /api/wallet?tel=… — l'app s'en sert pour savoir si le bouton
 * « Ajouter à Apple Wallet » doit s'afficher. Aucune donnée renvoyée.
 */
export async function HEAD(request: NextRequest) {
  const r = await GET(request);
  return new NextResponse(null, { status: r.status });
}

/**
 * GET /api/wallet?tel=0612345678
 * Renvoie la carte de fidélité au format .pkpass.
 */
export async function GET(request: NextRequest) {
  if (!walletConfigure()) {
    return NextResponse.json(
      {
        error: "Apple Wallet pas encore configuré",
        besoin: ["WALLET_PASS_TYPE_ID", "WALLET_TEAM_ID", "WALLET_CERT_P12", "WALLET_CERT_PASSWORD", "WALLET_WWDR"],
      },
      { status: 503 }
    );
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const brut = request.nextUrl.searchParams.get("tel") ?? "";
  const email = (request.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  const tel = brut.replace(/\D/g, "");

  // 🔴 Un compte créé avec « Se connecter avec Apple » n'a PAS de
  // numéro de téléphone : Apple n'en communique jamais. La carte
  // était donc impossible à fabriquer pour ces clients — ils ne
  // voyaient simplement aucun bouton, sans explication.
  // On accepte désormais l'e-mail comme identifiant.
  if (tel.length < 9 && !email) {
    return NextResponse.json(
      { error: "Numéro de téléphone ou e-mail requis" },
      { status: 400 }
    );
  }

  // 🔴 Bug trouvé le 02/10/2026 : on cherchait `phone = eq.<chiffres>`
  // alors que la base contient aussi bien « 0612345678 » que
  // « +33611924863 » ou « 06 11 92 48 63 ». Un client enregistré au
  // format international n'était JAMAIS retrouvé → 404 → l'app
  // masquait le bouton Apple Wallet. Du point de vue du gérant :
  // « Apple Wallet ne s'affiche pas », sans la moindre explication.
  //
  // On cherche donc toutes les écritures du même numéro.
  const criteres: string[] = [];
  if (tel.length >= 9) {
    const variantes = new Set<string>([brut.trim(), tel]);
    if (tel.startsWith("0")) {
      variantes.add("+33" + tel.slice(1));
      variantes.add("33" + tel.slice(1));
    }
    if (tel.startsWith("33") && tel.length >= 11) {
      variantes.add("0" + tel.slice(2));
      variantes.add("+" + tel);
    }
    for (const v of variantes) {
      if (v) criteres.push(`phone.eq.${encodeURIComponent(v)}`);
    }
  }
  if (email) criteres.push(`email.eq.${encodeURIComponent(email)}`);
  const ou = criteres.join(",");

  const res = await sb(
    `customers?or=(${ou})` +
      `&select=id,name,phone,email,fidelity_menu_count,fidelity_discount_active&limit=1`
  );
  if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
  const [client] = await res.json();
  if (!client) {
    return NextResponse.json(
      { error: "Compte introuvable", detail: "Aucun client avec ce numéro" },
      { status: 404 }
    );
  }

  // Le compteur et la récompense sont dessinés dans la bande
  // (wallet-bandes.ts) : plus aucun champ texte par-dessus.
  const tampons = Number(client.fidelity_menu_count ?? 0);

  try {
    const { PKPass } = await import("passkit-generator");

    // ⚠️ Pas de lecture disque ici.
    //
    // La version précédente faisait `model: "./public/wallet/..."`.
    // En production, Vercel répondait :
    //   Cannot import model: directory ./public/wallet/fidelite.pass not found
    // Le dossier `public/` est servi par le CDN ; rien ne garantit
    // qu'il soit présent dans le système de fichiers de la fonction.
    // Le modèle est donc embarqué dans le code (wallet-modele.ts).
    // ⚠️ passkit-generator veut du PEM, pas un .p12.
    // `certificatsWallet()` ouvre l'archive et en sort le
    // certificat et la clé (voir wallet-certs.ts).
    const certs = certificatsWallet();
    if (!certs) {
      return NextResponse.json(
        { error: "Apple Wallet pas encore configuré" },
        { status: 503 }
      );
    }

    const pass = new PKPass(
      tamponsModele(),
      certs,
      {
        serialNumber: `ftsd-${client.id}`,
        description: "Carte de fidélité FAIS TON S'DALLE",
        organizationName: "FAIS TON S'DALLE",
        passTypeIdentifier: PASS_TYPE_ID!,
        teamIdentifier: TEAM_ID!,
        logoText: "FAIS TON S'DALLE",
        foregroundColor: "rgb(255, 248, 238)",
        backgroundColor: "rgb(150, 14, 19)",
        labelColor: "rgb(233, 184, 96)",
        // Interdit le partage : une carte de fidélité se transmet
        // sinon par capture d'écran, et les tampons des autres
        // deviennent une monnaie.
        sharingProhibited: true,
        maxDistance: 150,
        // Ouvre l'application depuis la carte (bouton « Ouvrir »)
        associatedStoreIdentifiers: [6811130537],
        appLaunchURL: "faistonsdalle://carte-fidelite",
      }
    );

    // ─── Code à scanner ──────────────────────────────────────
    //
    // Avant : le QR contenait le numéro de téléphone en clair.
    // Scanné par n'importe qui, il affichait un numéro — aucune
    // utilité, et une donnée personnelle exposée.
    //
    // Maintenant : un lien signé vers la fiche de fidélité. Le
    // téléphone du comptoir le scanne, la page s'ouvre, le passage
    // se valide en un geste. Un client curieux qui le scanne voit
    // simplement sa propre progression.
    const lien = lienCarte(Number(client.id));
    // ─── La carte sort toute seule à l'approche du restaurant ──
    // iOS l'affiche sur l'écran verrouillé dans un rayon de 150 m.
    // C'est LE réflexe qu'on veut créer : le client la voit avant
    // même d'entrer.
    pass.setLocations({
      latitude: 48.9078,
      longitude: 2.5053,
      relevantText: "FAIS TON S'DALLE — votre carte de fidélité",
    });

    // La bande change avec le nombre de tampons : le client voit
    // sa progression d'un coup d'œil, sans lire un chiffre.
    // Les trois résolutions : sans le @1x à la bonne taille, iOS
    // rogne l'image (c'est ce qui « coupait » la carte).
    for (const [nom, image] of Object.entries(bandesFidelite(tampons))) {
      pass.addBuffer(nom, image);
    }

    pass.setBarcodes({
      message: lien,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: `N° ${String(client.id).padStart(5, "0")}`,
    });

    // ─── Ce qu'on lit sur la carte ───────────────────────────
    //
    // ⚠️ Sur une « storeCard », les champs d'en-tête et les champs
    // principaux s'affichent PAR-DESSUS la bande. En mettre ici
    // revenait à coller « 10 menus » en gros sur le visuel : les
    // deux se chevauchaient et c'était illisible.
    //
    // La bande porte donc tout le compteur, et on laisse ces deux
    // emplacements vides. Ne rien ajouter ici.

    pass.secondaryFields.push(
      {
        key: "titulaire",
        label: "TITULAIRE",
        value: String(client.name ?? "Client"),
      },
      {
        key: "numero",
        label: "N° DE MEMBRE",
        value: String(client.id).padStart(5, "0"),
      }
    );

    pass.auxiliaryFields.push(
      { key: "ouverture", label: "OUVERT", value: "7j/7 · 11h30 – minuit" },
      { key: "quartier", label: "ADRESSE", value: "134 all. Colonel Fabien" }
    );

    pass.backFields.push(
      {
        key: "regle",
        label: "Comment ça marche",
        value:
          "Un menu acheté = un tampon. Au 10ᵉ menu, vous recevez " +
          "un Menu Classique OFFERT. Présentez ce code au " +
          "comptoir, ou commandez simplement dans l'application : " +
          "les tampons se comptent tout seuls.",
      },
      {
        key: "commander",
        label: "Commander",
        value: `<a href="${SITE}">faistonsdalle.com</a>`,
      },
      {
        key: "horairesDetail",
        label: "Horaires",
        value:
          "Lundi au jeudi : 11h30 – minuit\n" +
          "Vendredi, samedi, dimanche : 14h30 – minuit",
      },
      {
        key: "adresseDetail",
        label: "Adresse",
        value: "134 Allée du Colonel Fabien\n93320 Les Pavillons-sous-Bois",
      },
      {
        key: "telephone",
        label: "Téléphone",
        value: '<a href="tel:+33672044875">06 72 04 48 75</a>',
      },
      {
        key: "allergenes",
        label: "Allergènes",
        value: `<a href="${SITE}/allergenes">Consulter la liste complète</a>`,
      },
      {
        key: "halal",
        label: "Nos engagements",
        value: "Viandes 100 % halal · crudités préparées chaque matin · tout est fait minute.",
      }
    );

    const buffer = pass.getAsBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="fidelite-ftsd.pkpass"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Génération impossible", detail: e instanceof Error ? e.message : "inconnue" },
      { status: 500 }
    );
  }
}
