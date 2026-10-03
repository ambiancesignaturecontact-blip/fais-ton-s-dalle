// ─── Journal technique de l'application ───────────────────────
//
// 🔴 Pourquoi cette route existe maintenant :
// l'application appelle `POST /api/logs` toutes les 45 secondes
// depuis des mois (src/lib/logger.ts) pour remonter ses erreurs.
// La route n'avait JAMAIS été écrite : chaque envoi tombait sur la
// page 404 de Vercel, le marqueur « déjà envoyé » n'était jamais
// posé, et l'app réessayait indéfiniment les mêmes entrées.
//
// Conséquence concrète : l'onglet « Diag » de l'espace admin
// n'affichait que les erreurs du téléphone qu'on tenait en main.
// Impossible de savoir ce qui plante chez les clients.
//
// La route est volontairement tolérante : si la table `app_logs`
// n'existe pas encore (bloc 7 du SQL), on répond quand même 200
// pour que l'application cesse de boucler. On ne perd qu'un
// confort, jamais une commande.

import { NextRequest, NextResponse } from "next/server";
import { estAdmin } from "@/lib/admin-auth";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface Entree {
  at?: string;
  scope?: string;
  message?: string;
  level?: string;
  meta?: unknown;
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

/** Rien d'identifiant ne doit entrer ici : ni e-mail, ni téléphone. */
function nettoyer(texte: string): string {
  return texte
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/\+?\d[\d .-]{8,}\d/g, "[tel]")
    .slice(0, 500);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const entrees: Entree[] = Array.isArray(body?.entries) ? body.entries : [];
    if (!entrees.length) return NextResponse.json({ success: true, recus: 0 });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ success: true, recus: 0 });
    }

    const lignes = entrees.slice(0, 100).map((e) => ({
      at: e?.at ?? new Date().toISOString(),
      scope: String(e?.scope ?? "inconnu").slice(0, 60),
      message: nettoyer(String(e?.message ?? "")),
      level: String(e?.level ?? "error").slice(0, 10),
      platform: String(body?.platform ?? "?").slice(0, 10),
      app_version: String(body?.version ?? "?").slice(0, 20),
      meta: e?.meta ?? null,
    }));

    const res = await sb("app_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(lignes),
    });

    // Table absente (bloc 7 du SQL pas encore passé) : on accuse
    // quand même réception, sinon l'app réessaie à l'infini.
    if (!res.ok) return NextResponse.json({ success: true, recus: 0, stockes: false });

    return NextResponse.json({ success: true, recus: lignes.length, stockes: true });
  } catch {
    return NextResponse.json({ success: true, recus: 0 });
  }
}

/** GET (admin) : les 200 dernières erreurs remontées par les apps. */
export async function GET(request: NextRequest) {
  if (!(await estAdmin(request.headers.get("X-Admin-Auth")))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  const res = await sb("app_logs?select=*&order=at.desc&limit=200");
  if (!res.ok) {
    return NextResponse.json({
      logs: [],
      message: "Table app_logs absente : passez le bloc 7 de SQL-A-EXECUTER.sql.",
    });
  }
  return NextResponse.json({ logs: await res.json() });
}
