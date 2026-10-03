import { NextRequest, NextResponse } from "next/server";
import { estAdmin } from "@/lib/admin-auth";

// ─── Établissements (onglet « Locaux ») ────────────────────────
//
// Cette route manquait : l'onglet affichait « Route franchises non
// déployée ». L'application l'appelait déjà
// (src/lib/admin.ts, fetchFranchisesAdmin).
//
// Deux niveaux d'accès :
//   · le SIÈGE, avec le mot de passe administrateur, voit tous les
//     établissements et peut en créer ;
//   · un GÉRANT, avec le code PIN de son local, ne voit que le sien.

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

/** Siège (tous les locaux) ou gérant (le sien uniquement) */
async function qui(
  request: NextRequest
): Promise<{ ok: false } | { ok: true; siege: boolean; franchiseId: number | null }> {
  const pw = request.headers.get("X-Admin-Auth");
  if (!pw) return { ok: false };

  if (await estAdmin(pw)) {
    return { ok: true, siege: true, franchiseId: null };
  }

  // Un gérant s'identifie avec le code PIN de son établissement.
  const res = await sb(
    `franchises?admin_pin=eq.${encodeURIComponent(pw)}&active=eq.true&select=id&limit=1`
  );
  if (!res.ok) return { ok: false };
  const rows = (await res.json()) as { id: number }[];
  if (!rows.length) return { ok: false };
  return { ok: true, siege: false, franchiseId: rows[0].id };
}

const CHAMPS =
  "id,slug,name,address,city,postcode,lat,lng,phone,email,radius_km,royalty_pct,active";

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const auth = await qui(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Un gérant ne doit jamais voir le chiffre d'affaires ni les
  // coordonnées des autres établissements.
  const filtre = auth.siege ? "" : `&id=eq.${auth.franchiseId}`;
  const res = await sb(`franchises?select=${CHAMPS}${filtre}&order=id.asc`);

  if (!res.ok) {
    return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
  }

  return NextResponse.json({
    siege: auth.siege,
    franchises: await res.json(),
  });
}

/** POST — ouvrir un établissement. Réservé au siège. */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const auth = await qui(request);
  if (!auth.ok || !auth.siege) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const address = String(body?.address ?? "").trim();

  if (!name || !address) {
    return NextResponse.json(
      { error: "Nom et adresse requis" },
      { status: 400 }
    );
  }

  // Identifiant lisible, dérivé du nom : « Les Lilas » → « les-lilas ».
  const slug =
    String(body?.slug ?? "").trim() ||
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const res = await sb("franchises", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug,
      name,
      address,
      city: body?.city ?? null,
      postcode: body?.postcode ?? null,
      phone: body?.phone ?? null,
      email: body?.email ?? null,
      radius_km: Number(body?.radius_km) || 6,
      royalty_pct: Number(body?.royalty_pct) || 0,
      admin_pin: String(Math.floor(100000 + Math.random() * 900000)),
      active: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (detail.includes("23505")) {
      return NextResponse.json(
        { error: "Un établissement porte déjà ce nom" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Création impossible" }, { status: 502 });
  }

  const [cree] = await res.json();

  // Le code PIN n'est affiché qu'à la création : il permet au gérant
  // d'accéder à son espace. À noter et à transmettre.
  return NextResponse.json({ success: true, franchise: cree, pin: cree.admin_pin });
}

/** PATCH — activer ou désactiver un établissement. Siège uniquement. */
export async function PATCH(request: NextRequest) {
  const auth = await qui(request);
  if (!auth.ok || !auth.siege) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = Number(body?.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const champ of [
    "name", "address", "city", "postcode", "phone", "email",
    "radius_km", "royalty_pct", "active",
  ]) {
    if (champ in body) patch[champ] = body[champ];
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });
  }

  const res = await sb(`franchises?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
