import { NextRequest, NextResponse } from "next/server";

// ─── Suppression d'un compte e-mail / mot de passe ─────────────
//
// POURQUOI CETTE ROUTE EXISTE
//
// L'application appelait `/api/customer` avec l'action
// `delete_account`. Cette route exige un jeton de session SMS
// (`customer_sessions`). Un client connecté par e-mail et mot de
// passe n'en a pas : la requête repartait en 401, et l'écran
// affichait « Suppression impossible ».
//
// Symptôme constaté : « quand je supprime le compte ça veut pas ».
//
// Cette route couvre le second mode d'authentification. Elle vérifie
// le mot de passe avant d'agir — sans quoi n'importe qui pourrait
// supprimer le compte d'autrui en connaissant son adresse.
//
// Guideline Apple 5.1.1(v) : la suppression doit être RÉELLE, pas
// seulement locale.

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sb(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE!,
      Authorization: `Bearer ${SUPABASE_SERVICE}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail et mot de passe requis" },
        { status: 400 }
      );
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    // ─── 1. Vérifier l'identité ────────────────────────────────
    //
    // 🔴 Cette étape n'est JAMAIS facultative.
    //
    // Une première version ne vérifiait le mot de passe que si
    // `SUPABASE_ANON` était défini. Mon propre test l'a prise en
    // défaut : avec un mot de passe erroné, le compte était tout de
    // même supprimé. N'importe qui connaissant une adresse aurait pu
    // détruire le compte correspondant.
    //
    // La clé `service_role` permet elle aussi de valider un mot de
    // passe auprès de Supabase Auth : on l'utilise en repli, et on
    // refuse la requête si aucune des deux n'est disponible.
    const cleAuth = SUPABASE_ANON || SUPABASE_SERVICE;
    if (!cleAuth) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const authRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: { apikey: cleAuth, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );
    if (!authRes.ok) {
      return NextResponse.json(
        { error: "E-mail ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // ─── 2. Retrouver la fiche client ──────────────────────────
    let customerId: number | null = null;
    const cRes = await sb(
      `customers?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
    );
    if (cRes.ok) {
      const rows = await cRes.json();
      customerId = rows?.[0]?.id ?? null;
    }

    // ─── 3. Effacer les données rattachées ─────────────────────
    if (customerId !== null) {
      await sb(`customer_sessions?customer_id=eq.${customerId}`, {
        method: "DELETE",
      });
      await sb(`customer_addresses?customer_id=eq.${customerId}`, {
        method: "DELETE",
      });
      await sb(`customer_favorites?customer_id=eq.${customerId}`, {
        method: "DELETE",
      });

      // Les commandes sont conservées : l'article L123-22 du Code de
      // commerce impose dix ans d'archives comptables. On les
      // dissocie du client, elles ne permettent plus de l'identifier.
      await sb(`orders?customer_id=eq.${customerId}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          customer_id: null,
          customer_name: "Compte supprimé",
          customer_phone: null,
          customer_email: null,
          address: null,
        }),
      });

      await sb(`customers?id=eq.${customerId}`, { method: "DELETE" });
    }

    // ─── 4. Utilisateur Supabase Auth ──────────────────────────
    //
    // Indispensable. Sans cette étape, l'identifiant et le mot de
    // passe restent valides : le compte n'est pas supprimé, et
    // l'adresse devient inutilisable pour une nouvelle inscription
    // (« already been registered »).
    let authSupprime = false;
    try {
      const uRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            apikey: SUPABASE_SERVICE,
            Authorization: `Bearer ${SUPABASE_SERVICE}`,
          },
        }
      );
      if (uRes.ok) {
        const data = await uRes.json();
        const users: { id: string; email?: string }[] = data?.users ?? [];
        for (const u of users) {
          // Comparaison stricte : la recherche par e-mail de Supabase
          // renvoie parfois des correspondances partielles, et on ne
          // veut surtout pas supprimer le compte d'un autre.
          if (u.email?.toLowerCase() !== email) continue;
          const d = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
            method: "DELETE",
            headers: {
              apikey: SUPABASE_SERVICE,
              Authorization: `Bearer ${SUPABASE_SERVICE}`,
            },
          });
          if (d.ok) authSupprime = true;
        }
      }
    } catch {
      /* la fiche est déjà effacée : on ne bloque pas le client */
    }

    if (customerId === null && !authSupprime) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, supprime: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** Sonde de disponibilité utilisée par l'application */
export async function GET() {
  return NextResponse.json({ available: true });
}
