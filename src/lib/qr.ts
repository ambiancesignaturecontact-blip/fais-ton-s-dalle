import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FALLBACK = process.env.QR_SECRET || "change-me";

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

// Cache mémoire des secrets (évite un appel base à chaque scan)
let cache: { versions: Map<number, string>; active: number; at: number } | null = null;
const TTL = 300_000; // 5 minutes

async function loadSecrets() {
  const now = Date.now();
  if (cache && now - cache.at < TTL) return cache;

  const versions = new Map<number, string>();
  let active = 1;

  try {
    const res = await sb("qr_secrets?select=version,secret,active&order=version.desc");
    if (res.ok) {
      const rows = await res.json();
      for (const r of rows) {
        versions.set(Number(r.version), String(r.secret));
        if (r.active) active = Number(r.version);
      }
    }
  } catch { /* repli */ }

  // Première utilisation : on initialise la version 1 depuis l'env
  if (versions.size === 0) {
    versions.set(1, FALLBACK);
    active = 1;
    try {
      await sb("qr_secrets", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ version: 1, secret: FALLBACK, active: true }),
      });
    } catch {}
  }

  cache = { versions, active, at: now };
  return cache;
}

/** Signe un UUID avec le secret actif ; renvoie aussi la version */
export async function signQr(uuid: string): Promise<{ sig: string; version: number }> {
  const { versions, active } = await loadSecrets();
  const secret = versions.get(active) ?? FALLBACK;
  const sig = createHmac("sha256", secret).update(uuid).digest("hex").slice(0, 16);
  return { sig, version: active };
}

/**
 * Vérifie une signature.
 * Accepte TOUTES les versions connues : une rotation de secret
 * n'invalide donc jamais les commandes en cours.
 */
export async function verifyQr(uuid: string, sig: string): Promise<boolean> {
  const { versions } = await loadSecrets();
  for (const secret of versions.values()) {
    const expected = createHmac("sha256", secret).update(uuid).digest("hex").slice(0, 16);
    const a = Buffer.from(expected);
    const b = Buffer.from(sig ?? "");
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/**
 * Génère un nouveau secret et le rend actif.
 * Les anciens restent valides pour les commandes déjà émises.
 */
export async function rotateSecret(): Promise<{ version: number }> {
  const { versions } = await loadSecrets();
  const next = Math.max(0, ...versions.keys()) + 1;
  const secret = randomBytes(32).toString("hex");

  await sb("qr_secrets?active=eq.true", {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ active: false, retired_at: new Date().toISOString() }),
  });
  await sb("qr_secrets", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ version: next, secret, active: true }),
  });

  cache = null; // force le rechargement
  return { version: next };
}
