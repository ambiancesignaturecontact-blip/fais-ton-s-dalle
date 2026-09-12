import { NextRequest, NextResponse } from "next/server";
import { signQr } from "@/lib/qr";
import { codeLivraison } from "@/lib/delivery-code";

// ─── Suivi public d'une commande ───────────────────────────────
//
// Pourquoi cette route existe :
//
// La page /suivi appelait `/api/admin/orders` avec un en-tête bidon
// `X-Admin-Auth: client-request`, récupérait les 200 dernières
// commandes du restaurant, puis cherchait la bonne côté navigateur.
//
// Deux problèmes, tous deux vérifiés en production :
//
//  1. 🔴 ÇA NE MARCHE PLUS. Depuis que l'authentification admin est
//     appliquée, la route répond 401. La page de suivi du site est
//     donc CASSÉE : elle affiche « Commande non trouvée » quel que
//     soit le numéro saisi.
//
//  2. 🔴 SI ÇA AVAIT MARCHÉ, C'ÉTAIT PIRE. La réponse contenait
//     `select=*` sur TOUTES les commandes : noms, téléphones,
//     adresses complètes de tous les clients, envoyés au navigateur
//     de n'importe quel visiteur. Une fuite de données massive.
//
// Cette route corrige les deux : elle ne renvoie QU'UNE commande,
// et uniquement les champs nécessaires au suivi.
//
// ─── Sur la sécurité du numéro court ───────────────────────────
//
// Un numéro de commande est devinable (42, 43, 44…). On ne peut donc
// pas exposer les mêmes informations que sur l'UUID, qui est un
// secret. La règle appliquée ici :
//
//   · numéro seul        → statut, mode, horaire. Rien de nominatif.
//   · numéro + téléphone → le code de remise en plus.
//
// Le téléphone sert de preuve de possession. Sans lui, un curieux
// qui tape « 42 » voit qu'une commande existe et où elle en est,
// mais n'obtient ni identité, ni adresse, ni code de remise.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sb(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  });
}

/** Garde les seuls chiffres : « 06 72 04 48 75 » et « +33672044875 » se rejoignent */
function chiffres(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}

/**
 * Compare deux numéros de téléphone français par leurs 9 derniers
 * chiffres : « 0672044875 » et « +33672044875 » désignent la même
 * ligne. Sans cette normalisation, un client qui a saisi son numéro
 * au format international à la commande ne se reconnaîtrait plus.
 */
function memeTelephone(a: string, b: string): boolean {
  const x = chiffres(a), y = chiffres(b);
  if (!x || !y) return false;
  return x.slice(-9) === y.slice(-9) && x.slice(-9).length === 9;
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const p = request.nextUrl.searchParams;
  const ref = (p.get("ref") ?? "").trim();
  const tel = (p.get("tel") ?? "").trim();

  if (!ref) {
    return NextResponse.json({ error: "Référence requise" }, { status: 400 });
  }

  // Deux formats acceptés : le numéro court (42) ou l'UUID complet.
  const estUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  const estNumero = /^\d{1,9}$/.test(ref);

  if (!estUuid && !estNumero) {
    return NextResponse.json({ error: "Référence invalide" }, { status: 400 });
  }

  const filtre = estUuid
    ? `uuid=eq.${encodeURIComponent(ref)}`
    : `id=eq.${Number(ref)}`;

  // `customer_phone` est lu pour la vérification, jamais renvoyé.
  const res = await sb(
    `orders?${filtre}&select=id,uuid,status,mode,created_at,scheduled_time,` +
      `customer_phone,arrived_at&limit=1`
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 502 });
  }

  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const o = rows[0];

  // L'UUID est un secret : le connaître suffit. Le numéro court est
  // devinable, on exige alors le téléphone pour les infos sensibles.
  const identifie = estUuid || (!!tel && memeTelephone(tel, o.customer_phone ?? ""));

  // ─── Code de remise ─────────────────────────────────────────
  // Émis uniquement en livraison, une fois la commande prête ou en
  // route, et seulement pour quelqu'un qui a prouvé être le client.
  let delivery_code: string | null = null;
  if (
    identifie &&
    o.mode === "livraison" &&
    (o.status === "ready" || o.status === "en-route")
  ) {
    try {
      delivery_code = codeLivraison((await signQr(String(o.uuid))).sig);
    } catch {
      delivery_code = null;
    }
  }

  return NextResponse.json(
    {
      id: o.id,
      status: o.status,
      mode: o.mode,
      created_at: o.created_at,
      scheduled_time: o.scheduled_time ?? null,
      arrived_at: o.arrived_at ?? null,
      delivery_code,
      // Indique à l'interface s'il faut demander le téléphone pour
      // débloquer le code, plutôt que de laisser le client deviner.
      identifie,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
