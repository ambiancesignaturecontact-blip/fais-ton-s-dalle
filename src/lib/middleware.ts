import { NextRequest, NextResponse } from "next/server";

/**
 * Limitation de débit (rate limiting) sur toutes les routes /api.
 *
 * Implémentation en mémoire : suffisante et gratuite pour ton volume.
 * Chaque instance Vercel garde son propre compteur — un attaquant
 * déterminé pourrait contourner en tapant plusieurs régions, mais cela
 * bloque déjà 99 % des abus (scripts, boucles, scrapers).
 *
 * Pour du strict, il faudrait Upstash Redis (payant au-delà du gratuit).
 */

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

// Limites par fenêtre de temps, selon la sensibilité de la route
const RULES: { pattern: RegExp; limit: number; windowMs: number; label: string }[] = [
  // Création de commande : le plus sensible (pollution de base)
  { pattern: /^\/api\/order$/,            limit: 8,   windowMs: 60_000,  label: "commande" },
  { pattern: /^\/api\/checkout$/,         limit: 10,  windowMs: 60_000,  label: "paiement" },
  { pattern: /^\/api\/payment-intent$/,   limit: 10,  windowMs: 60_000,  label: "paiement" },
  // Authentification : anti force brute
  { pattern: /^\/api\/auth\/login$/,      limit: 6,   windowMs: 300_000, label: "connexion" },
  { pattern: /^\/api\/admin\/login$/,     limit: 5,   windowMs: 900_000, label: "admin" },
  { pattern: /^\/api\/driver$/,           limit: 60,  windowMs: 60_000,  label: "livreur" },
  // Parrainage : anti-création massive de codes
  { pattern: /^\/api\/referral$/,         limit: 20,  windowMs: 60_000,  label: "parrainage" },
  // Avis : anti-spam
  { pattern: /^\/api\/reviews$/,          limit: 15,  windowMs: 60_000,  label: "avis" },
  // Analytics : envois groupés fréquents
  { pattern: /^\/api\/analytics$/,        limit: 40,  windowMs: 60_000,  label: "analytics" },
  { pattern: /^\/api\/push\//,            limit: 30,  windowMs: 60_000,  label: "push" },
  // Défaut pour toute autre route /api
  { pattern: /^\/api\//,                  limit: 100, windowMs: 60_000,  label: "api" },
];

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return ip;
}

/** Purge périodique pour éviter que la Map ne grossisse indéfiniment */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Les lectures simples ne sont pas limitées (sauf routes sensibles)
  const rule = RULES.find((r) => r.pattern.test(path));
  if (!rule) return NextResponse.next();
  if (req.method === "GET" && !/login|driver|referral|analytics/.test(path)) {
    return NextResponse.next();
  }

  const now = Date.now();
  sweep(now);

  const key = `${rule.label}:${clientKey(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return NextResponse.next();
  }

  bucket.count++;

  if (bucket.count > rule.limit) {
    const retry = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      {
        error: "Trop de requêtes. Réessaie dans quelques instants.",
        retryAfter: retry,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retry),
          "X-RateLimit-Limit": String(rule.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(rule.limit));
  res.headers.set("X-RateLimit-Remaining", String(rule.limit - bucket.count));
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
