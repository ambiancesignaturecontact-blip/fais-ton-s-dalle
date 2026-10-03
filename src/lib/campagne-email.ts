// ─── Annonces : toucher TOUS les clients enregistrés ──────────
//
// Demandé le 02/10/2026 : « que tous les clients enregistrés dans
// la base reçoivent les annonces, sans avoir à mettre à jour
// l'application à chaque fois ».
//
// Ce qui est possible, et ce qui ne l'est pas :
//
//  · une **notification push** exige un jeton, donc l'application
//    installée ET l'autorisation accordée. iOS ne permet rien
//    d'autre, aucune application au monde n'y échappe ;
//  · un **e-mail**, lui, part à tous ceux dont on a l'adresse.
//
// Les deux outils restent SÉPARÉS, volontairement :
//   · les notifications se pilotent depuis l'application
//     (écran Push) et ne touchent que ceux qui ont accepté ;
//   · les campagnes e-mail se composent depuis l'espace
//     restaurateur du site, avec des modèles prêts à l'emploi,
//     et touchent tout le fichier client.
//
// Aucune mise à jour de l'application n'est nécessaire pour
// envoyer une campagne : tout se passe sur le site.
//
// ─── Désabonnement ─────────────────────────────────────────────
// Obligatoire (RGPD). Chaque e-mail porte un lien de retrait, et
// la désinscription est enregistrée dans `newsletter_subscribers`
// (`is_active = false`) — table qui existait déjà : aucun SQL à
// passer.

import { createHmac, timingSafeEqual } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || "contact@faistonsdalle.com";
const SECRET = process.env.QR_SECRET || "change-me";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.faistonsdalle.com"
  ).replace(/\/$/, "");
}

function sb(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

// ─── Lien de désabonnement, signé ──────────────────────────────

function signer(email: string): string {
  return createHmac("sha256", SECRET)
    .update(`stop:${email.toLowerCase()}`)
    .digest("hex")
    .slice(0, 16);
}

export function lienDesabonnement(email: string): string {
  const e = encodeURIComponent(email.toLowerCase());
  return `${siteUrl()}/desabonnement?e=${e}&s=${signer(email)}`;
}

export function verifierDesabonnement(email: string, sig: string): boolean {
  const a = Buffer.from(signer(email));
  const b = Buffer.from(String(sig ?? ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

// ─── Qui reçoit quoi ───────────────────────────────────────────

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Les adresses retirées de la liste de diffusion. */
async function desabonnes(): Promise<Set<string>> {
  const out = new Set<string>();
  if (!SUPABASE_URL || !SUPABASE_KEY) return out;
  try {
    const r = await sb("newsletter_subscribers?is_active=eq.false&select=email");
    if (!r.ok) return out;
    for (const l of (await r.json()) as Array<{ email: string }>) {
      if (l?.email) out.add(String(l.email).toLowerCase());
    }
  } catch {
    /* en cas de doute, on n'envoie pas plus : la liste reste vide */
  }
  return out;
}

export interface Destinataire {
  email: string;
  nom: string;
}

/** Tous les clients joignables par e-mail, désabonnés exclus. */
export async function destinatairesEmail(): Promise<Destinataire[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const stop = await desabonnes();

  const r = await sb("customers?select=email,name&order=id.asc&limit=5000");
  if (!r.ok) return [];
  const lignes = (await r.json()) as Array<{ email?: string; name?: string }>;

  const vus = new Set<string>();
  const out: Destinataire[] = [];
  for (const c of lignes) {
    const e = String(c?.email ?? "").trim().toLowerCase();
    if (!EMAIL_VALIDE.test(e) || vus.has(e) || stop.has(e)) continue;
    vus.add(e);
    out.push({ email: e, nom: String(c?.name ?? "").trim() || "" });
  }
  return out;
}

/** Enregistre un retrait de la liste. */
export async function desabonner(email: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  const e = email.toLowerCase();
  try {
    const existe = await sb(
      `newsletter_subscribers?email=eq.${encodeURIComponent(e)}&select=id&limit=1`
    ).then((r) => (r.ok ? r.json() : []));

    const corps = JSON.stringify({
      email: e,
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
    });

    const r = Array.isArray(existe) && existe.length
      ? await sb(`newsletter_subscribers?email=eq.${encodeURIComponent(e)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: corps,
        })
      : await sb("newsletter_subscribers", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: corps,
        });
    return r.ok;
  } catch {
    return false;
  }
}

// ─── Envoi ─────────────────────────────────────────────────────

import { rendreEmail, type ContenuEmail } from "./modeles-email";

export interface BilanEmail {
  envoyes: number;
  echecs: number;
  destinataires: number;
}

/** Le HTML d'un e-mail, pour un destinataire donné. */
export function corpsEmail(contenu: ContenuEmail, email: string, nom?: string): string {
  return rendreEmail(
    { ...contenu, nom: nom || contenu.nom, lienDesabonnement: lienDesabonnement(email) },
    siteUrl()
  );
}

/**
 * Envoie la campagne. Ne lève jamais.
 * Resend accepte 100 messages par lot.
 *
 * @param destinataires liste explicite (sert aussi à l'envoi d'essai)
 */
export async function envoyerCampagneEmail(
  objet: string,
  contenu: ContenuEmail,
  destinataires?: Destinataire[]
): Promise<BilanEmail> {
  const liste = destinataires ?? (await destinatairesEmail());
  const bilan: BilanEmail = { envoyes: 0, echecs: 0, destinataires: liste.length };
  if (!RESEND_KEY || !liste.length) return bilan;

  for (let i = 0; i < liste.length; i += 100) {
    const lot = liste.slice(i, i + 100).map((d) => ({
      from: `FAIS TON S'DALLE <${FROM}>`,
      to: [d.email],
      subject: objet,
      html: corpsEmail(contenu, d.email, d.nom),
      headers: {
        // Désabonnement en un clic depuis Gmail / Apple Mail.
        // Sans ces en-têtes, les messages finissent en indésirables.
        "List-Unsubscribe": `<${lienDesabonnement(d.email)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }));

    try {
      const r = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lot),
      });
      if (r.ok) bilan.envoyes += lot.length;
      else bilan.echecs += lot.length;
    } catch {
      bilan.echecs += lot.length;
    }
  }
  return bilan;
}
