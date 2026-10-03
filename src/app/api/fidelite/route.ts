// ─── Fiche de fidélité derrière le QR de la carte Wallet ──────
//
// GET  : lecture (le client ou le comptoir scanne le code)
// POST : ajoute ou retire un tampon — réservé au restaurant
//        (en-tête X-Admin-Auth).

import { NextRequest, NextResponse } from "next/server";
import { lireCodeCarte } from "@/lib/carte-fidelite";
import { estAdmin } from "@/lib/admin-auth";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SEUIL = 10;

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

/** Rien d'identifiant ne sort d'ici : ni téléphone, ni e-mail. */
function publique(c: Record<string, unknown>) {
  const tampons = Number(c.fidelity_menu_count ?? 0);
  return {
    id: Number(c.id),
    nom: String(c.name ?? "Client"),
    tampons,
    seuil: SEUIL,
    restants: Math.max(0, SEUIL - tampons),
    recompenseDisponible: Boolean(c.fidelity_discount_active),
    economies: Number(c.fidelity_total_savings ?? 0),
  };
}

async function charger(id: number) {
  const r = await sb(
    `customers?id=eq.${id}&select=id,name,fidelity_menu_count,` +
      `fidelity_discount_active,fidelity_total_savings&limit=1`
  );
  if (!r.ok) return null;
  const [c] = await r.json();
  return c ?? null;
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  const id = lireCodeCarte(request.nextUrl.searchParams.get("code") ?? "");
  if (!id) return NextResponse.json({ error: "Code invalide" }, { status: 400 });

  const c = await charger(id);
  if (!c) return NextResponse.json({ error: "Carte inconnue" }, { status: 404 });
  return NextResponse.json({ carte: publique(c) });
}

/**
 * POST { code, sens: "ajouter" | "retirer" }  (admin)
 *
 * Au 10ᵉ tampon, la récompense s'active et le compteur repart à 0 :
 * exactement ce que fait la fidélité dans l'application.
 */
export async function POST(request: NextRequest) {
  if (!(await estAdmin(request.headers.get("X-Admin-Auth")))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const id = lireCodeCarte(String(body?.code ?? ""));
  if (!id) return NextResponse.json({ error: "Code invalide" }, { status: 400 });

  const c = await charger(id);
  if (!c) return NextResponse.json({ error: "Carte inconnue" }, { status: 404 });

  const sens = body?.sens === "retirer" ? -1 : 1;
  let tampons = Number(c.fidelity_menu_count ?? 0) + sens;
  let actif = Boolean(c.fidelity_discount_active);
  let message = sens > 0 ? "Tampon ajouté" : "Tampon retiré";

  if (tampons < 0) tampons = 0;
  if (tampons >= SEUIL) {
    tampons = 0;
    actif = true;
    message = "🎉 10 menus atteints — remise de 20 % débloquée";
  }

  const maj = await sb(`customers?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      fidelity_menu_count: tampons,
      fidelity_discount_active: actif,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!maj.ok) {
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 502 });
  }

  const apres = await charger(id);
  return NextResponse.json({
    success: true,
    message,
    carte: apres ? publique(apres) : null,
  });
}
