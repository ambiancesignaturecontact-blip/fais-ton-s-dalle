// ─── Campagnes e-mail ─────────────────────────────────────────
//
// Outil distinct des notifications :
//   · notification push → application, écran Push, seulement ceux
//     qui ont accepté ;
//   · campagne e-mail  → ce fichier, espace restaurateur du site,
//     tout le fichier client.
//
// GET  : combien de personnes recevront, et les modèles disponibles
// POST : aperçu, envoi d'essai, ou envoi réel

import { NextRequest, NextResponse } from "next/server";
import { estAdmin } from "@/lib/admin-auth";
import { MODELES, rendreEmail, type ContenuEmail } from "@/lib/modeles-email";
import {
  destinatairesEmail, envoyerCampagneEmail, siteUrl,
} from "@/lib/campagne-email";

function contenuDepuis(body: Record<string, unknown>): ContenuEmail {
  return {
    surtitre: String(body?.surtitre ?? "").slice(0, 60),
    titre: String(body?.titre ?? "").slice(0, 120),
    message: String(body?.message ?? "").slice(0, 2000),
    cta: String(body?.cta ?? "").slice(0, 40),
    lien: String(body?.lien ?? "") || undefined,
    couleur: String(body?.couleur ?? "") || undefined,
  };
}

export async function GET(request: NextRequest) {
  if (!(await estAdmin(request.headers.get("X-Admin-Auth")))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const liste = await destinatairesEmail();
  return NextResponse.json({
    destinataires: liste.length,
    modeles: MODELES,
  });
}

/**
 * POST { action, modele?, objet, surtitre, titre, message, cta, lien, couleur }
 *
 *   action: "apercu"  → renvoie le HTML, n'envoie rien
 *   action: "essai"   → envoie à UNE adresse (la vôtre)
 *   action: "envoyer" → envoie à tout le fichier client
 */
export async function POST(request: NextRequest) {
  if (!(await estAdmin(request.headers.get("X-Admin-Auth")))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action ?? "apercu");
  const contenu = contenuDepuis(body);
  const objet = String(body?.objet ?? contenu.titre).slice(0, 120);

  if (!contenu.titre.trim() || !contenu.message.trim()) {
    return NextResponse.json(
      { error: "Il faut au moins un titre et un message" },
      { status: 400 }
    );
  }

  // ─── Aperçu : rien ne part ────────────────────────────────
  if (action === "apercu") {
    return NextResponse.json({
      html: rendreEmail(
        { ...contenu, nom: "Sophie", lienDesabonnement: `${siteUrl()}/desabonnement` },
        siteUrl()
      ),
      objet,
      destinataires: (await destinatairesEmail()).length,
    });
  }

  // ─── Essai : une seule adresse ────────────────────────────
  if (action === "essai") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
    }
    const bilan = await envoyerCampagneEmail(`[Essai] ${objet}`, contenu, [
      { email, nom: "" },
    ]);
    if (!bilan.envoyes) {
      return NextResponse.json(
        { error: "L'envoi a échoué — vérifiez la clé Resend" },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, essai: true, email });
  }

  // ─── Envoi réel ───────────────────────────────────────────
  if (action === "envoyer") {
    const bilan = await envoyerCampagneEmail(objet, contenu);
    return NextResponse.json({
      success: true,
      ...bilan,
      message:
        bilan.destinataires === 0
          ? "Aucune adresse e-mail en base."
          : `${bilan.envoyes} e-mail(s) envoyé(s) sur ${bilan.destinataires}.`,
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

export const dynamic = "force-dynamic";
