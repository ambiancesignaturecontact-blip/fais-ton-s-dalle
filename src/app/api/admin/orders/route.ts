import { NextRequest, NextResponse } from "next/server";
import { notifierClient, uuidDeCommande } from "@/lib/notifier-client";
import { prixLigne, lireComposition, ecrireComposition } from "@/lib/composition";
import { estAdmin } from "@/lib/admin-auth";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
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

async function guard(request: NextRequest) {
  const pw = request.headers.get("X-Admin-Auth");
  if (!pw || !(await estAdmin(pw))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  return null;
}

const VALID_STATUS = [
  "pending", "confirmed", "preparing", "ready",
  "en-route", "delivered", "cancelled",
];

/** GET /api/admin/orders — toutes les commandes + articles */
export async function GET(request: NextRequest) {
  const bad = await guard(request);
  if (bad) return bad;

  // ─── Les commandes non payees restent invisibles ──────────
  //
  // Une commande reglee par carte entre en « awaiting_payment » et
  // n'y reste que le temps du paiement. Si le client abandonne, elle
  // ne doit jamais apparaitre en cuisine : sinon on prepare — et on
  // livre — sans avoir encaisse.
  //
  // Le webhook Stripe la bascule en « pending » des que le paiement
  // est confirme ; elle apparait alors normalement.
  const res = await sb(
    "orders?select=*,order_items(*)&status=neq.awaiting_payment" +
      "&order=created_at.desc&limit=200"
  );
  if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
  return NextResponse.json({ orders: await res.json() });
}

/**
 * PUT /api/admin/orders — modifier les lignes d'une commande
 *
 * { orderId, lignes: [{ id, quantity }] }
 *
 * Le cas réel : le client rappelle, « enlevez le Coca » ou « mettez
 * deux menus au lieu d'un ». Jusqu'ici il fallait annuler puis
 * ressaisir toute la commande — et le numéro changeait, le livreur
 * suivait l'ancienne, la compta comptait deux fois.
 *
 * Règles :
 *   · on ne modifie QUE les quantités (0 = retirer la ligne) ;
 *   · le total est recalculé côté serveur, à partir des prix
 *     enregistrés sur la commande — pas de prix venu du navigateur ;
 *   · une commande livrée ou annulée n'est plus modifiable.
 */
export async function PUT(request: NextRequest) {
  const who = request.headers.get("X-Admin-Auth");
  if (!(await estAdmin(who))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const orderId = Number(body?.orderId);
    const lignes = Array.isArray(body?.lignes) ? body.lignes : [];
    if (!Number.isInteger(orderId) || !lignes.length) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const res = await sb(
      `orders?id=eq.${orderId}&select=id,status,total,delivery_fee,discount_applied,tip,` +
        `order_items(id,item_name,item_price,quantity)&limit=1`
    );
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
    const [o] = await res.json();
    if (!o) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    if (["delivered", "cancelled"].includes(String(o.status))) {
      return NextResponse.json(
        { error: "Commande terminée : elle ne peut plus être modifiée." },
        { status: 409 }
      );
    }

    const actuelles = (o.order_items ?? []) as Array<{
      id: number; item_name: string; item_price: number; quantity: number;
      customization?: string | null;
    }>;

    // Une demande peut porter sur la quantité, sur la composition,
    // ou sur les deux. Une composition absente = inchangée.
    const demande = new Map<number, { q: number; composition?: string }>();
    for (const l of lignes) {
      const id = Number(l?.id);
      if (!Number.isInteger(id)) continue;
      const ligneActuelle = actuelles.find((a) => a.id === id);
      const q = l?.quantity === undefined
        ? (ligneActuelle?.quantity ?? 1)
        : Math.max(0, Math.min(99, Number(l.quantity)));
      if (!Number.isFinite(q)) continue;

      let composition: string | undefined;
      if (typeof l?.composition === "string") {
        // On relit puis on réécrit : la composition est normalisée,
        // et les mentions de prix sont recalculées, jamais relues.
        composition = ecrireComposition(lireComposition(l.composition));
      }
      demande.set(id, { q, composition });
    }

    // Appliquer : suppression (0) ou nouvelle quantité
    for (const ligne of actuelles) {
      const d = demande.get(ligne.id);
      if (!d) continue;

      if (d.q === 0) {
        await sb(`order_items?id=eq.${ligne.id}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        });
        continue;
      }

      const compositionFinale = d.composition ?? ligne.customization ?? null;
      // Le prix suit la composition : retirer un supplément doit
      // faire baisser l'addition, en ajouter doit la faire monter.
      const prixUnitaire = prixLigne(ligne.item_name, compositionFinale);
      const change =
        d.q !== ligne.quantity ||
        (d.composition !== undefined && d.composition !== (ligne.customization ?? "")) ||
        prixUnitaire !== Number(ligne.item_price);

      if (change) {
        await sb(`order_items?id=eq.${ligne.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            quantity: d.q,
            customization: compositionFinale,
            item_price: prixUnitaire,
            subtotal: Math.round(prixUnitaire * d.q * 100) / 100,
          }),
        });
        // La suite du calcul doit voir le nouveau prix.
        ligne.item_price = prixUnitaire;
        ligne.customization = compositionFinale;
      }
    }

    // Un panier vide n'a plus de sens : on refuse plutôt que de
    // laisser une commande à 0 € en cuisine.
    const restantes = actuelles.filter((l) => (demande.get(l.id)?.q ?? l.quantity) > 0);
    if (!restantes.length) {
      return NextResponse.json(
        { error: "Une commande ne peut pas être vidée. Annulez-la plutôt." },
        { status: 400 }
      );
    }

    // Recalcul : articles + livraison − remise + pourboire
    const articles = restantes.reduce(
      (s, l) => s + Number(l.item_price) * (demande.get(l.id)?.q ?? l.quantity),
      0
    );
    const nouveauTotal =
      Math.round(
        (articles +
          Number(o.delivery_fee ?? 0) -
          Number(o.discount_applied ?? 0) +
          Number(o.tip ?? 0)) * 100
      ) / 100;

    const maj = await sb(`orders?id=eq.${orderId}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        total: Math.max(0, nouveauTotal),
        updated_at: new Date().toISOString(),
      }),
    });
    if (!maj.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

    // Le client est prévenu : son montant a changé.
    try {
      const uuid = await uuidDeCommande(orderId);
      if (uuid) await notifierClient(uuid, "modifiee");
    } catch { /* jamais bloquant */ }

    return NextResponse.json({
      success: true,
      orderId,
      total: Math.max(0, nouveauTotal),
      lignes: restantes.length,
    });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

/** PATCH /api/admin/orders — { orderId, status } */
export async function PATCH(request: NextRequest) {
  const bad = await guard(request);
  if (bad) return bad;

  try {
    const body = await request.json();
    const orderId = Number(body?.orderId);
    const status = String(body?.status ?? "");

    if (!Number.isInteger(orderId) || !status) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 });
    }
    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: "Statut inconnu" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "delivered") patch.delivered_at = new Date().toISOString();

    // ─── Assignation automatique au passage en "prête" ──────────
    // Une commande en livraison prête sans livreur est assignée au
    // premier livreur actif (par ordre de création). Sans ça, elle
    // reste dans la file « disponibles » et personne ne la prend.
    let assignedDriver: { id: number; name: string; code: string } | null = null;
    if (status === "ready") {
      const cur = await sb(`orders?id=eq.${orderId}&select=mode,driver_id&limit=1`);
      if (cur.ok) {
        const [o] = await cur.json();
        if (o && o.mode === "livraison" && !o.driver_id) {
          const dRes = await sb(
            "drivers?active=eq.true&select=id,name,code&order=created_at.asc&limit=1"
          );
          if (dRes.ok) {
            const drivers = await dRes.json();
            if (Array.isArray(drivers) && drivers.length) {
              assignedDriver = drivers[0];
              patch.driver_id = drivers[0].id;
            }
          }
        }
      }
    }

    const res = await sb(`orders?id=eq.${orderId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

    // Notification push au livreur assigné
    if (assignedDriver) {
      try {
        // On vise le livreur ASSIGNÉ : avant, les 20 premiers jetons
        // livreurs recevaient « Commande #42 t'a été assignée »,
        // y compris ceux qui n'avaient rien à livrer.
        const tRes = await sb(
          `expo_push_tokens?audience=eq.driver` +
            `&driver_code=eq.${encodeURIComponent(assignedDriver.code)}` +
            `&select=token&limit=5`
        );
        if (tRes.ok) {
          const rows = (await tRes.json()) as Array<{ token: string }>;
          const tokens = rows.map((r) => r.token).filter(Boolean);
          if (tokens.length) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                tokens.map((to) => ({
                  to,
                  sound: "default",
                  channelId: "livreur",
                  priority: "high",
                  title: "Nouvelle course 🛵",
                  body: `Commande #${orderId} t'a été assignée.`,
                  data: { orderId, type: "assignment" },
                }))
              ),
            });
          }
        }
      } catch {
        // Une notification qui échoue ne doit jamais bloquer la commande
      }
    }

    // ─── Le client est prévenu, à chaque étape ────────────────
    // Avant : il ne recevait RIEN entre « commande passée » et le
    // coup de sonnette. Le suivi existait dans l'app, encore
    // fallait-il penser à l'ouvrir.
    try {
      const uuid = await uuidDeCommande(orderId);
      if (uuid) await notifierClient(uuid, status);
    } catch { /* jamais bloquant */ }

    // Une commande annulée ou livrée n'a plus de suivi GPS
    if (status === "cancelled" || status === "delivered") {
      const o = await sb(`orders?id=eq.${orderId}&select=uuid&limit=1`);
      if (o.ok) {
        const rows = await o.json();
        if (Array.isArray(rows) && rows[0]?.uuid) {
          await sb(`driver_positions?order_uuid=eq.${rows[0].uuid}`, { method: "DELETE" });
        }
      }
    }

    return NextResponse.json({
      success: true, orderId, status,
      assignedTo: assignedDriver ? assignedDriver.name : null,
    });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/orders?orderId=123
 * Suppression définitive d'une commande (et de ses articles).
 *
 * ⚠️ Cette route n'existait pas : le gérant ne pouvait pas effacer
 * une commande de test ou un doublon depuis l'application.
 *
 * Garde-fou : on refuse de supprimer une commande payée non
 * remboursée, pour éviter d'effacer une trace comptable.
 * Le paramètre ?force=1 permet de passer outre en connaissance de cause.
 */
export async function DELETE(request: NextRequest) {
  const bad = await guard(request);
  if (bad) return bad;

  const sp = request.nextUrl.searchParams;
  const orderId = Number(sp.get("orderId"));
  const force = sp.get("force") === "1";

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "orderId requis" }, { status: 400 });
  }

  // 1. La commande existe-t-elle ?
  const look = await sb(`orders?id=eq.${orderId}&select=id,uuid,is_paid,status&limit=1`);
  if (!look.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
  const rows = await look.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }
  const order = rows[0];

  // 2. Garde-fou comptable
  if (order.is_paid && order.status !== "cancelled" && !force) {
    return NextResponse.json(
      {
        error:
          "Commande payée : annule-la d'abord (ou rembourse le client). " +
          "Ajoute ?force=1 pour forcer la suppression.",
      },
      { status: 409 }
    );
  }

  // 3. Nettoyage des dépendances
  await sb(`order_items?order_id=eq.${orderId}`, { method: "DELETE" });
  if (order.uuid) {
    await sb(`driver_positions?order_uuid=eq.${order.uuid}`, { method: "DELETE" });
  }

  // 4. Suppression
  const del = await sb(`orders?id=eq.${orderId}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  if (!del.ok) return NextResponse.json({ error: "Suppression impossible" }, { status: 502 });

  return NextResponse.json({ success: true, deleted: orderId });
}
