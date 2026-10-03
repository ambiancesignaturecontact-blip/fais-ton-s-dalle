import { NextRequest, NextResponse } from "next/server";
import { estAdmin } from "@/lib/admin-auth";

// ─── Comptabilité (onglet « Compta ») ──────────────────────────
//
// Cette route manquait : l'onglet affichait « Route compta non
// déployée ». L'application l'appelait déjà
// (src/lib/admin.ts, fetchCompta).
//
// Tous les montants sont calculés à partir des commandes
// RÉELLEMENT LIVRÉES. Une commande annulée, en attente de paiement
// ou encore en cours ne doit jamais entrer dans le chiffre
// d'affaires.
//
// TVA : la restauration à emporter et livrée relève du taux réduit
// de 10 % en France. Le prix affiché au client est TTC.

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Taux de TVA applicable à la restauration à emporter et livrée */
const TVA = 0.10;

function sb(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function qui(
  request: NextRequest
): Promise<{ ok: false } | { ok: true; siege: boolean; franchiseId: number | null }> {
  const pw = request.headers.get("X-Admin-Auth");
  if (!pw) return { ok: false };
  if (await estAdmin(pw)) {
    return { ok: true, siege: true, franchiseId: null };
  }
  const res = await sb(
    `franchises?admin_pin=eq.${encodeURIComponent(pw)}&active=eq.true&select=id&limit=1`
  );
  if (!res.ok) return { ok: false };
  const rows = (await res.json()) as { id: number }[];
  if (!rows.length) return { ok: false };
  return { ok: true, siege: false, franchiseId: rows[0].id };
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

interface Commande {
  id: number;
  total: number | string | null;
  delivery_fee: number | string | null;
  tip: number | string | null;
  mode: string | null;
  payment_method: string | null;
  driver_id: number | null;
  franchise_id: number | null;
  delivered_at: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const auth = await qui(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const jours = Math.min(Math.max(Number(request.nextUrl.searchParams.get("days")) || 30, 1), 365);
  const demande = Number(request.nextUrl.searchParams.get("franchise"));

  // Un gérant est cantonné à son établissement, quoi qu'il demande.
  const franchiseId = auth.siege
    ? (Number.isInteger(demande) && demande > 0 ? demande : null)
    : auth.franchiseId;

  const depuis = new Date(Date.now() - jours * 86400_000).toISOString();

  let q =
    `orders?select=id,total,delivery_fee,tip,mode,payment_method,driver_id,` +
    `franchise_id,delivered_at,created_at` +
    `&status=eq.delivered&created_at=gte.${depuis}&order=created_at.asc&limit=5000`;
  if (franchiseId) q += `&franchise_id=eq.${franchiseId}`;

  const res = await sb(q);
  if (!res.ok) {
    return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
  }
  const commandes = (await res.json()) as Commande[];

  const nb = (v: unknown) => Number(v ?? 0) || 0;

  // ─── Totaux ────────────────────────────────────────────────
  let caTtc = 0, fraisLivraison = 0, pourboires = 0, aEncaisser = 0;

  for (const c of commandes) {
    const t = nb(c.total);
    caTtc += t;
    fraisLivraison += nb(c.delivery_fee);
    pourboires += nb(c.tip);
    // Les espèces n'ont pas transité par Stripe : c'est ce qui doit
    // se trouver dans la caisse.
    if (c.payment_method === "cash" || c.payment_method === "especes") {
      aEncaisser += t;
    }
  }

  // Le pourboire est reversé au livreur : il n'entre ni dans le
  // chiffre d'affaires ni dans l'assiette de TVA.
  const baseTva = caTtc - pourboires;
  const caHt = baseTva / (1 + TVA);
  const tva = baseTva - caHt;

  const total = {
    commandes: commandes.length,
    caTtc: arrondi(caTtc),
    caHt: arrondi(caHt),
    tva: arrondi(tva),
    fraisLivraison: arrondi(fraisLivraison),
    pourboires: arrondi(pourboires),
    aEncaisser: arrondi(aEncaisser),
    panierMoyen: commandes.length ? arrondi(caTtc / commandes.length) : 0,
  };

  // ─── Par jour ──────────────────────────────────────────────
  const parJour = new Map<string, { commandes: number; ca: number }>();
  for (const c of commandes) {
    const j = (c.delivered_at ?? c.created_at).slice(0, 10);
    const e = parJour.get(j) ?? { commandes: 0, ca: 0 };
    e.commandes += 1;
    e.ca += nb(c.total);
    parJour.set(j, e);
  }
  const joursListe = [...parJour.entries()].map(([jour, v]) => ({
    jour, commandes: v.commandes, ca_ttc: arrondi(v.ca),
  }));

  // ─── Par mois ──────────────────────────────────────────────
  const parMois = new Map<string, { commandes: number; ca: number }>();
  for (const c of commandes) {
    const m = (c.delivered_at ?? c.created_at).slice(0, 7);
    const e = parMois.get(m) ?? { commandes: 0, ca: 0 };
    e.commandes += 1;
    e.ca += nb(c.total);
    parMois.set(m, e);
  }
  const moisListe = [...parMois.entries()].map(([mois, v]) => ({
    mois,
    commandes: v.commandes,
    ca_ttc: arrondi(v.ca),
    ca_ht: arrondi(v.ca / (1 + TVA)),
    tva: arrondi(v.ca - v.ca / (1 + TVA)),
  }));

  // ─── Par produit ───────────────────────────────────────────
  let produits: unknown[] = [];
  if (commandes.length) {
    const ids = commandes.map((c) => c.id).join(",");
    const ir = await sb(
      `order_items?select=order_id,item_name,quantity,price&order_id=in.(${ids})&limit=20000`
    );
    if (ir.ok) {
      const lignes = (await ir.json()) as {
        order_id: number; item_name: string;
        quantity: number | null; price: number | string | null;
      }[];
      const franchiseParCommande = new Map(
        commandes.map((c) => [c.id, c.franchise_id ?? 1])
      );
      const agg = new Map<string, {
        franchise_id: number; item_name: string;
        lignes: number; quantite: number; ca_ttc: number;
      }>();
      for (const l of lignes) {
        const f = franchiseParCommande.get(l.order_id) ?? 1;
        const cle = `${f}|${l.item_name}`;
        const e = agg.get(cle) ?? {
          franchise_id: f, item_name: l.item_name,
          lignes: 0, quantite: 0, ca_ttc: 0,
        };
        const qte = Number(l.quantity ?? 1) || 1;
        e.lignes += 1;
        e.quantite += qte;
        e.ca_ttc += nb(l.price) * qte;
        agg.set(cle, e);
      }
      produits = [...agg.values()]
        .map((p) => ({ ...p, ca_ttc: arrondi(p.ca_ttc) }))
        .sort((a, b) => b.ca_ttc - a.ca_ttc);
    }
  }

  // ─── Par livreur ───────────────────────────────────────────
  const parLivreur = new Map<number, { courses: number; ca: number; pourboires: number }>();
  for (const c of commandes) {
    if (!c.driver_id) continue;
    const e = parLivreur.get(c.driver_id) ?? { courses: 0, ca: 0, pourboires: 0 };
    e.courses += 1;
    e.ca += nb(c.total);
    e.pourboires += nb(c.tip);
    parLivreur.set(c.driver_id, e);
  }

  let livreurs: unknown[] = [];
  if (parLivreur.size) {
    const ids = [...parLivreur.keys()].join(",");
    const dr = await sb(`drivers?select=id,name,code&id=in.(${ids})`);
    const noms = dr.ok
      ? new Map(((await dr.json()) as { id: number; name: string; code: string }[])
          .map((d) => [d.id, d]))
      : new Map();
    livreurs = [...parLivreur.entries()].map(([id, v]) => ({
      driver_id: id,
      name: noms.get(id)?.name ?? `Livreur ${id}`,
      code: noms.get(id)?.code ?? "",
      courses: v.courses,
      ca_ttc: arrondi(v.ca),
      pourboires: arrondi(v.pourboires),
    })).sort((a, b) => b.courses - a.courses);
  }

  return NextResponse.json({
    siege: auth.siege,
    total,
    jours: joursListe,
    mois: moisListe,
    produits,
    livreurs,
  });
}
