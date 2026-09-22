import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const EXPO_PUSH = "https://exp.host/--/api/v2/push/send";

export type Audience = "customer" | "admin" | "driver";

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

/** Envoi groupé vers Expo (100 messages max par lot) */
async function sendExpo(
  messages: Array<Record<string, unknown>>
): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      const json = await res.json();
      const data = json?.data ?? [];
      for (const d of data) {
        if (d?.status === "ok") sent++;
        else errors++;
      }
    } catch {
      errors += chunk.length;
    }
  }
  return { sent, errors };
}

/**
 * POST /api/push/expo
 *
 * Enregistrement d'un appareil :
 *   { action: "register", token, audience, deviceId?, orderUuid?, driverCode? }
 *
 * Envoi (admin uniquement, header X-Admin-Auth) :
 *   { action: "send", audience, title, body, data? }
 *   { action: "notify_order", orderUuid, status }   → prévient le client
 *   { action: "notify_new_order", orderId, total }  → prévient admin + livreurs
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action ?? "");
    const admin = request.headers.get("X-Admin-Auth");

    // ─── Enregistrement d'un jeton ──────────────────────────────
    if (action === "register") {
      const token = String(body?.token ?? "");
      const audience = String(body?.audience ?? "customer") as Audience;

      if (!/^ExponentPushToken\[.+\]$/.test(token) && !/^ExpoPushToken\[.+\]$/.test(token)) {
        return NextResponse.json({ error: "Jeton invalide" }, { status: 400 });
      }
      if (!["customer", "admin", "driver"].includes(audience)) {
        return NextResponse.json({ error: "Audience invalide" }, { status: 400 });
      }
      // Un jeton admin ou livreur doit être authentifié
      if (audience === "admin" && admin !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      if (audience === "driver") {
        const code = String(body?.driverCode ?? "");
        const d = await sb(`drivers?code=eq.${encodeURIComponent(code)}&active=eq.true&select=id&limit=1`)
          .then((r) => (r.ok ? r.json() : []));
        if (!Array.isArray(d) || !d.length) {
          return NextResponse.json({ error: "Code livreur invalide" }, { status: 401 });
        }
      }

      const res = await sb("expo_push_tokens", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          token,
          audience,
          device_id: body?.deviceId ?? null,
          order_uuid: body?.orderUuid ?? null,
          driver_code: body?.driverCode ?? null,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Enregistrement impossible" }, { status: 502 });
      }
      return NextResponse.json({ success: true });
    }

    // ─── Notification du client suivant sa commande ─────────────
    if (action === "notify_order") {
      if (admin !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      const uuid = String(body?.orderUuid ?? "");
      const status = String(body?.status ?? "");

      const LABELS: Record<string, { title: string; body: string }> = {
        confirmed: { title: "Commande confirmée ✅", body: "C'est validé, on s'y met !" },
        preparing: { title: "En préparation 👨‍🍳", body: "Nos équipes préparent ta commande." },
        ready:     { title: "Ta commande est prête 🥖", body: "Elle part à l'instant." },
        "en-route":{ title: "En route 🛵", body: "Ton livreur arrive dans quelques minutes." },
        delivered: { title: "Bon appétit ! 🎉", body: "Merci et à bientôt." },
        cancelled: { title: "Commande annulée", body: "Contacte-nous au 06 72 04 48 75." },
      };
      const label = LABELS[status];
      if (!label) return NextResponse.json({ error: "Statut inconnu" }, { status: 400 });

      const rows = await sb(
        `expo_push_tokens?order_uuid=eq.${encodeURIComponent(uuid)}&select=token`
      ).then((r) => (r.ok ? r.json() : []));

      const messages = (rows as any[]).map((r) => ({
        to: r.token,
        sound: "default",
        title: label.title,
        body: label.body,
        data: { url: `/order/${uuid}`, uuid, status },
      }));

      const result = await sendExpo(messages);
      return NextResponse.json({ success: true, ...result });
    }

    // ─── Nouvelle commande : alerter admin + livreurs ───────────
    if (action === "notify_new_order") {
      if (admin !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      const orderId = body?.orderId;
      const total = Number(body?.total ?? 0);
      const mode = String(body?.mode ?? "livraison");

      const rows = await sb(
        `expo_push_tokens?audience=in.(admin,driver)&select=token,audience`
      ).then((r) => (r.ok ? r.json() : []));

      const messages = (rows as any[]).map((r) => ({
        to: r.token,
        sound: "default",
        title: r.audience === "admin" ? "🛎️ Nouvelle commande" : "🛵 Commande à livrer",
        body:
          r.audience === "admin"
            ? `#${orderId} · ${total.toFixed(2)} € · ${mode === "livraison" ? "Livraison" : "À emporter"}`
            : `#${orderId} · ${total.toFixed(2)} € · prête bientôt`,
        data: { url: r.audience === "admin" ? "/admin" : "/livreur", orderId },
        priority: "high",
      }));

      const result = await sendExpo(messages);
      return NextResponse.json({ success: true, ...result });
    }

    // ─── Envoi libre (admin) ────────────────────────────────────
    if (action === "send") {
      if (admin !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      const audience = String(body?.audience ?? "customer");
      const title = String(body?.title ?? "").slice(0, 100);
      const text = String(body?.body ?? "").slice(0, 200);
      if (!title || !text) {
        return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
      }

      const rows = await sb(
        `expo_push_tokens?audience=eq.${audience}&select=token`
      ).then((r) => (r.ok ? r.json() : []));

      const messages = (rows as any[]).map((r) => ({
        to: r.token,
        sound: "default",
        title,
        body: text,
        data: body?.data ?? {},
      }));

      const result = await sendExpo(messages);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
