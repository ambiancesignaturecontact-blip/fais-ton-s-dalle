// ─── Qui a le droit d'entrer dans l'espace restaurateur ───────
//
// Jusqu'ici : un seul mot de passe, le même pour tout le monde
// (`ADMIN_PASSWORD`). Quand quelqu'un quitte l'équipe, il faut le
// changer… et le redonner à tous les autres.
//
// Demandé le 02/10/2026 : « mets-moi admin, eren93190@gmail.com ».
//
// La table `admins` existait déjà en base — vide, et utilisée nulle
// part. Elle sert maintenant à donner un **accès personnel** à
// chaque personne de l'équipe : chacun son mot de passe, révocable
// séparément, sans toucher à celui des autres.
//
// Le mot de passe général continue de fonctionner : rien ne casse.

import { createHash, scryptSync, timingSafeEqual, randomBytes } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

/** Empreinte « sel:scrypt », même format que les comptes clients. */
export function hacherMotDePasse(mdp: string): string {
  const sel = randomBytes(16).toString("hex");
  return `${sel}:${scryptSync(mdp, sel, 64).toString("hex")}`;
}

function correspond(mdp: string, empreinte: string): boolean {
  try {
    const [sel, attendu] = String(empreinte).split(":");
    if (!sel || !attendu) return false;
    const calcule = scryptSync(mdp, sel, 64).toString("hex");
    const a = Buffer.from(calcule);
    const b = Buffer.from(attendu);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Comparaison à temps constant du mot de passe général. */
function estMotDePasseGeneral(secret: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  const a = createHash("sha256").update(secret).digest();
  const b = createHash("sha256").update(ADMIN_PASSWORD).digest();
  return timingSafeEqual(a, b);
}

// Les accès personnels changent rarement : un cache de 60 secondes
// évite d'interroger la base à chaque requête d'administration.
let cache: { at: number; lignes: Array<{ email: string; password_hash: string; name?: string }> } | null = null;

async function comptesPersonnels() {
  if (cache && Date.now() - cache.at < 60_000) return cache.lignes;
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/admins?select=email,password_hash,name`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!r.ok) return [];
    const lignes = await r.json();
    cache = { at: Date.now(), lignes: Array.isArray(lignes) ? lignes : [] };
    return cache.lignes;
  } catch {
    return [];
  }
}

export interface Identite {
  ok: boolean;
  /** Qui c'est, pour les journaux : « général » ou un e-mail. */
  qui: string;
}

/**
 * Vérifie l'en-tête `X-Admin-Auth`.
 *
 * Accepte :
 *  · le mot de passe général (`ADMIN_PASSWORD`) ;
 *  · le mot de passe personnel d'une personne inscrite dans
 *    la table `admins`.
 */
export async function verifierAdmin(secret: string | null): Promise<Identite> {
  const s = String(secret ?? "");
  if (!s) return { ok: false, qui: "" };
  if (estMotDePasseGeneral(s)) return { ok: true, qui: "général" };

  for (const c of await comptesPersonnels()) {
    if (c?.password_hash && correspond(s, c.password_hash)) {
      return { ok: true, qui: c.email || c.name || "membre de l'équipe" };
    }
  }
  return { ok: false, qui: "" };
}

/** Raccourci : vrai ou faux. */
export async function estAdmin(secret: string | null): Promise<boolean> {
  return (await verifierAdmin(secret)).ok;
}

/** Vide le cache (après ajout ou retrait d'un accès). */
export function oublierComptes() {
  cache = null;
}
