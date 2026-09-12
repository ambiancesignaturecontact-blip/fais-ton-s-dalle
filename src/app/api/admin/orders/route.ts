import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

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

function guard(request: NextRequest) {
  const pw = request.headers.get("X-Admin-Auth");
  if (!pw || pw !== ADMIN_PASSWORD) {
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
  const bad = guard(request);
  if (bad) return bad;

  const res = await sb(
    "orders?select=*,order_items(*)&order=created_at.desc&limit=200"
  );
  if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
  return NextResponse.json({ orders: await res.json() });
}

/** PATCH /api/admin/orders — { orderId, status } */
export async function PATCH(request: NextRequest) {
  const bad = guard(request);
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
        const tRes = await sb(
          `expo_push_tokens?audience=eq.driver&select=token&limit=20`
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
  const bad = guard(request);
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
