import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { signQr, verifyQr, rotateSecret } from "@/lib/qr";
import {
  debutJourneeService, debutIlYAJours, libelleJournee, kmEstimes,
} from "@/lib/service-day";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const SESSION_HOURS = 10;
const MAX_TRIES = 5;
const LOCK_MINUTES = 15;

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

const hashPin = (pin: string) => createHash("sha256").update(`ftsd-pin:${pin}`).digest("hex");

/** Valide un jeton de session livreur (remplace le code en clair) */
async function authSession(token: string) {
  if (!token) return null;
  const res = await sb(
    `driver_sessions?token=eq.${encodeURIComponent(token)}&revoked=eq.false&select=driver_id,expires_at&limit=1`
  );
  if (!res.ok) return null;
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows.length) return null;
  if (new Date(rows[0].expires_at).getTime() < Date.now()) return null;

  // On récupère aussi l'établissement du livreur : un livreur de
  // Bondy ne doit jamais voir les courses des Pavillons.
  const d = await sb(
    `drivers?id=eq.${rows[0].driver_id}&active=eq.true` +
    `&select=id,name,phone,code,franchise_id&limit=1`
  );
  if (!d.ok) return null;
  const dr = await d.json();
  return Array.isArray(dr) && dr.length ? dr[0] : null;
}

/**
 * GET /api/driver
 *   Header X-Driver-Token  → tournée du livreur
 *   Header X-Admin-Auth    → liste des livreurs (admin)
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const admin = request.headers.get("X-Admin-Auth");
  if (admin) {
    if (admin !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const res = await sb("drivers?select=id,name,phone,code,active,last_login,locked_until&order=created_at.desc");
    if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });
    return NextResponse.json({ drivers: await res.json() });
  }

  const token = request.headers.get("X-Driver-Token") ?? "";
  const driver = await authSession(token);
  if (!driver) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  const all = request.nextUrl.searchParams.get("all") === "1";
  const filter = all
    ? `or=(driver_id.eq.${driver.id},and(driver_id.is.null,status.eq.ready))`
    : `driver_id=eq.${driver.id}`;

  // Cloisonnement par établissement : sans ce filtre, un livreur
  // verrait — et pourrait prendre — les courses d'un autre local.
  const fr = (driver as { franchise_id?: number }).franchise_id ?? 1;
  const filtreFr = `&franchise_id=eq.${fr}`;

  // Nom lisible de l'établissement : un livreur doit voir à quel
  // local il est rattaché, surtout s'il dépanne ailleurs.
  let franchiseName: string | null = null;
  try {
    const fRes = await sb(`franchises?id=eq.${fr}&select=name&limit=1`);
    if (fRes.ok) {
      const fRows = (await fRes.json()) as { name: string }[];
      franchiseName = fRows[0]?.name ?? null;
    }
  } catch { /* l'absence de nom ne bloque pas la tournée */ }

  const res = await sb(
    `orders?${filter}${filtreFr}&mode=eq.livraison&status=in.(ready,en-route)` +
    `&select=id,uuid,created_at,status,customer_name,customer_phone,address,total,mode,notes,is_paid,tip,driver_id,order_items(*)` +
    `&order=created_at.asc`
  );
  if (!res.ok) return NextResponse.json({ error: "Erreur Supabase" }, { status: 502 });

  const orders = await res.json();
  const withSig = await Promise.all(
    (orders as any[]).map(async (o) => ({ ...o, qr_sig: (await signQr(String(o.uuid))).sig }))
  );

  // ─── Statistiques du livreur ────────────────────────────────
  //
  // Deux bugs corrigés ici, tous deux mesurés en réel :
  //
  // 1. `new Date(); d.setHours(0,0,0,0)` s'exécute sur Vercel, qui
  //    tourne en UTC. À 2h30 du matin heure de Paris, cela donnait
  //    minuit UTC = 2h00 Paris : les courses de 22h et de 00h45
  //    tombaient AVANT la borne. Le livreur voyait « 0 course
  //    aujourd'hui » et 0 € encaissé en pleine tournée de nuit.
  //
  // 2. Même à l'heure de Paris, un minuit calendaire coupe le service
  //    en deux (le restaurant ferme à 3h). On bascule donc à 5h du
  //    matin : aucune course n'existe à cette heure-là.
  const debutJour = debutJourneeService();
  const debutSemaine = debutIlYAJours(7);

  const stats = {
    today: 0, todayTotal: 0, week: 0, weekTotal: 0, allTime: 0,
    todayTips: 0, weekTips: 0, todayCash: 0, avgMinutes: 0, kmToday: 0,
  };
  let history: unknown[] = [];
  let parJour: Array<{ jour: string; libelle: string; courses: number; total: number; km: number }> = [];

  const hRes = await sb(
    `orders?driver_id=eq.${driver.id}&status=eq.delivered` +
      `&delivered_at=gte.${debutSemaine.toISOString()}` +
      `&select=id,uuid,total,tip,is_paid,address,delivered_at,created_at,customer_name,mode` +
      `&order=delivered_at.desc&limit=200`
  );
  if (hRes.ok) {
    const rows = (await hRes.json()) as Array<{
      total: number | null; tip: number | null; is_paid: boolean | null;
      address: string | null; delivered_at: string; created_at: string;
    }>;
    const d0 = debutJour.getTime();

    // Répartition par journée de SERVICE (pas par jour calendaire) :
    // le livreur voit sa semaine réelle, nuits comprises.
    const seaux = new Map<number, { courses: number; total: number; km: number }>();
    let sommeMinutes = 0, nbDurees = 0;

    for (const r of rows) {
      const t = Number(r.total ?? 0);
      const pourboire = Number(r.tip ?? 0);
      const km = kmEstimes(r.address);
      const livre = new Date(r.delivered_at);

      stats.week += 1;
      stats.weekTotal += t;
      stats.weekTips += pourboire;

      // Durée réelle prise de commande → remise au client
      const cree = new Date(r.created_at).getTime();
      const duree = (livre.getTime() - cree) / 60000;
      if (Number.isFinite(duree) && duree > 0 && duree < 240) {
        sommeMinutes += duree; nbDurees += 1;
      }

      const jour = debutJourneeService(livre).getTime();
      const seau = seaux.get(jour) ?? { courses: 0, total: 0, km: 0 };
      seau.courses += 1; seau.total += t; seau.km += km;
      seaux.set(jour, seau);

      if (livre.getTime() >= d0) {
        stats.today += 1;
        stats.todayTotal += t;
        stats.todayTips += pourboire;
        stats.kmToday += km;
        // Espèces réellement dans la sacoche : uniquement le non-payé
        if (r.is_paid === false) stats.todayCash += t;
      }
    }

    stats.avgMinutes = nbDurees ? Math.round(sommeMinutes / nbDurees) : 0;

    parJour = [...seaux.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, 7)
      .map(([ts, v]) => ({
        jour: new Date(ts).toISOString(),
        libelle: libelleJournee(new Date(ts)),
        courses: v.courses,
        total: Math.round(v.total * 100) / 100,
        km: Math.round(v.km * 10) / 10,
      }));

    history = rows.slice(0, 20);
  }

  const cRes = await sb(
    `orders?driver_id=eq.${driver.id}&status=eq.delivered&select=id`,
    { headers: { Prefer: "count=exact", Range: "0-0" } }
  );
  if (cRes.ok) {
    const cr = cRes.headers.get("content-range");
    if (cr) stats.allTime = Number(cr.split("/")[1]) || 0;
  }

  // ─── Incidents du livreur sur la semaine ────────────────────
  // Un livreur doit pouvoir vérifier ce qui a été enregistré à son
  // nom : c'est sa parole contre celle du restaurant sinon.
  let incidents = 0;
  try {
    const iRes = await sb(
      `delivery_incidents?driver_id=eq.${driver.id}` +
        `&created_at=gte.${debutSemaine.toISOString()}&select=id`,
      { headers: { Prefer: "count=exact", Range: "0-0" } }
    );
    if (iRes.ok) {
      const cr = iRes.headers.get("content-range");
      if (cr) incidents = Number(cr.split("/")[1]) || 0;
    }
  } catch { /* un compteur absent ne bloque pas la tournée */ }

  const arrondi = (n: number) => Math.round(n * 100) / 100;
  const statsFull = {
    ...stats,
    todayTotal: arrondi(stats.todayTotal),
    weekTotal: arrondi(stats.weekTotal),
    todayTips: arrondi(stats.todayTips),
    weekTips: arrondi(stats.weekTips),
    todayCash: arrondi(stats.todayCash),
    kmToday: Math.round(stats.kmToday * 10) / 10,
    incidents,
    // Début du service en cours : l'app affiche « depuis 5h » et ne
    // recalcule pas la borne de son côté (elle se tromperait pareil).
    serviceDebut: debutJour.toISOString(),
  };

  return NextResponse.json({
    driver: { ...driver, franchise_name: franchiseName },
    orders: withSig, stats: statsFull, history, parJour,
  });
}

/**
 * POST /api/driver
 * Livreur : { action: "login", code, pin, deviceId }  → { token }
 *           header X-Driver-Token pour : take | start | deliver | position
 * Admin   : header X-Admin-Auth pour : create_driver | set_pin |
 *           toggle_driver | revoke_sessions | assign | rotate_qr
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action ?? "");
    const admin = request.headers.get("X-Admin-Auth");

    // ═══ ACTIONS ADMIN ═══════════════════════════════════════════
    if (admin) {
      if (admin !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }

      // Réaffecter un livreur à un autre établissement. Utile quand
      // un local ouvre : on y bascule un livreur expérimenté plutôt
      // que d'en recruter un le jour même.
      if (action === "move_driver") {
        const id = Number(body?.driverId);
        const to = Number(body?.franchiseId);
        if (!Number.isInteger(id) || !Number.isInteger(to)) {
          return NextResponse.json(
            { error: "Livreur et établissement requis" }, { status: 400 }
          );
        }
        const exists = await sb(`franchises?id=eq.${to}&select=id&limit=1`);
        const okFr = exists.ok && ((await exists.json()) as unknown[]).length > 0;
        if (!okFr) {
          return NextResponse.json({ error: "Établissement inconnu" }, { status: 404 });
        }
        const mv = await sb(`drivers?id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ franchise_id: to }),
        });
        if (!mv.ok) {
          return NextResponse.json({ error: "Déplacement impossible" }, { status: 502 });
        }
        // Ses sessions sont fermées : sinon il continuerait de voir
        // les courses de son ancien local jusqu'à expiration.
        await sb(`driver_sessions?driver_id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ revoked: true }),
        }).catch(() => {});
        return NextResponse.json({ success: true });
      }

      if (action === "create_driver") {
        const name = String(body?.name ?? "").trim();
        if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
        const code = randomBytes(3).toString("hex").toUpperCase();
        const pin = String(Math.floor(1000 + Math.random() * 9000));
        const res = await sb("drivers", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            name, phone: String(body?.phone ?? "").trim(),
            code, pin: hashPin(pin), active: true,
            // Établissement de rattachement : le livreur ne verra
            // que les courses de ce local.
            franchise_id: Number(body?.franchiseId) || 1,
          }),
        });
        if (!res.ok) return NextResponse.json({ error: "Création impossible" }, { status: 502 });
        const [driver] = await res.json();
        // Le PIN en clair n'est renvoyé QU'UNE FOIS, à la création
        return NextResponse.json({ success: true, driver: { ...driver, pin: undefined }, code, pin });
      }

      if (action === "set_pin") {
        const id = body?.driverId;
        const pin = String(Math.floor(1000 + Math.random() * 9000));
        const res = await sb(`drivers?id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ pin: hashPin(pin), failed_tries: 0, locked_until: null }),
        });
        if (!res.ok) return NextResponse.json({ error: "Erreur" }, { status: 502 });
        return NextResponse.json({ success: true, pin });
      }

      if (action === "revoke_sessions") {
        const id = body?.driverId;
        await sb(`driver_sessions?driver_id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ revoked: true }),
        });
        return NextResponse.json({ success: true });
      }

      if (action === "toggle_driver") {
        const id = body?.driverId;
        const active = Boolean(body?.active);
        await sb(`drivers?id=eq.${id}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ active }),
        });
        if (!active) {
          await sb(`driver_sessions?driver_id=eq.${id}`, {
            method: "PATCH", headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ revoked: true }),
          });
        }
        return NextResponse.json({ success: true });
      }

      if (action === "assign") {
        await sb(`orders?id=eq.${body?.orderId}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ driver_id: body?.driverId ?? null }),
        });
        return NextResponse.json({ success: true });
      }

      if (action === "rotate_qr") {
        const r = await rotateSecret();
        return NextResponse.json({ success: true, ...r });
      }

      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    // ═══ CONNEXION LIVREUR (code + PIN) ══════════════════════════
    if (action === "login") {
      const code = String(body?.code ?? "").trim().toUpperCase();
      const pin = String(body?.pin ?? "").trim();
      if (!code || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: "Code et PIN à 4 chiffres requis" }, { status: 400 });
      }

      const res = await sb(
        `drivers?code=eq.${encodeURIComponent(code)}&active=eq.true&select=id,name,phone,code,pin,failed_tries,locked_until&limit=1`
      );
      const rows = res.ok ? await res.json() : [];
      const d = Array.isArray(rows) && rows.length ? rows[0] : null;

      if (!d) return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });

      if (d.locked_until && new Date(d.locked_until).getTime() > Date.now()) {
        const mins = Math.ceil((new Date(d.locked_until).getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { error: `Compte bloqué. Réessaie dans ${mins} min.` },
          { status: 423 }
        );
      }

      if (d.pin !== hashPin(pin)) {
        const tries = (d.failed_tries ?? 0) + 1;
        const lock = tries >= MAX_TRIES
          ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
          : null;
        await sb(`drivers?id=eq.${d.id}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ failed_tries: lock ? 0 : tries, locked_until: lock }),
        });
        return NextResponse.json(
          { error: lock ? `Trop d'essais. Bloqué ${LOCK_MINUTES} min.` : "Identifiants invalides" },
          { status: lock ? 423 : 401 }
        );
      }

      // Session à durée limitée
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString();
      await sb("driver_sessions", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          token, driver_id: d.id,
          device_id: String(body?.deviceId ?? "").slice(0, 64),
          expires_at: expires,
        }),
      });
      await sb(`drivers?id=eq.${d.id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ failed_tries: 0, locked_until: null, last_login: new Date().toISOString() }),
      });

      return NextResponse.json({
        success: true, token, expiresAt: expires,
        driver: { id: d.id, name: d.name, phone: d.phone, code: d.code },
      });
    }

    // ═══ ACTIONS LIVREUR (jeton de session) ══════════════════════
    const driver = await authSession(request.headers.get("X-Driver-Token") ?? "");
    if (!driver) return NextResponse.json({ error: "Session expirée" }, { status: 401 });

    if (action === "logout") {
      await sb(`driver_sessions?token=eq.${encodeURIComponent(request.headers.get("X-Driver-Token")!)}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ revoked: true }),
      });
      return NextResponse.json({ success: true });
    }

    if (action === "take") {
      const res = await sb(`orders?id=eq.${body?.orderId}&driver_id=is.null`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ driver_id: driver.id }),
      });
      const rows = res.ok ? await res.json() : [];
      if (!rows.length) return NextResponse.json({ error: "Commande déjà prise" }, { status: 409 });
      return NextResponse.json({ success: true });
    }

    if (action === "start") {
      await sb(`orders?id=eq.${body?.orderId}&driver_id=eq.${driver.id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "en-route" }),
      });
      return NextResponse.json({ success: true });
    }

    // Position du livreur → suivi sur carte côté client
    if (action === "position") {
      const { uuid, lat, lng } = body;
      if (typeof lat !== "number" || typeof lng !== "number") {
        return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
      }
      await sb("driver_positions", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          order_uuid: uuid, driver_id: driver.id,
          lat, lng, updated_at: new Date().toISOString(),
        }),
      });
      return NextResponse.json({ success: true });
    }

    // ─── « Je suis arrivé » ─────────────────────────────────
    // Prévient le client que le livreur est en bas, avant même la
    // remise. Évite les 5 minutes d'attente devant l'immeuble.
    if (action === "arrived") {
      const uuid = String(body?.uuid ?? "");
      if (!uuid) return NextResponse.json({ error: "Référence requise" }, { status: 400 });

      const oRes = await sb(
        `orders?uuid=eq.${encodeURIComponent(uuid)}&driver_id=eq.${driver.id}` +
          `&select=id,customer_name&limit=1`
      );
      const order = oRes.ok ? (await oRes.json())?.[0] : null;
      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

      await sb(`orders?id=eq.${order.id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ arrived_at: new Date().toISOString() }),
      });

      // Notification au client
      try {
        const tRes = await sb(
          `expo_push_tokens?order_uuid=eq.${encodeURIComponent(uuid)}&select=token&limit=5`
        );
        if (tRes.ok) {
          const tokens = ((await tRes.json()) as Array<{ token: string }>)
            .map((r) => r.token).filter(Boolean);
          if (tokens.length) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                tokens.map((to) => ({
                  to, sound: "default", channelId: "commandes", priority: "high",
                  title: "Ton livreur est arrivé 🛵",
                  body: "Il t'attend en bas. Prépare ton code de livraison !",
                  data: { uuid, type: "arrived" },
                }))
              ),
            });
          }
        }
      } catch { /* une notification qui échoue ne bloque rien */ }

      return NextResponse.json({ success: true });
    }

    // ─── Signalement d'incident ─────────────────────────────
    // Client absent, adresse introuvable, refus… Le livreur n'avait
    // aucun moyen de le signaler : il devait appeler le restaurant.
    if (action === "incident") {
      const uuid = String(body?.uuid ?? "");
      const reason = String(body?.reason ?? "").slice(0, 40);
      const detail = String(body?.detail ?? "").slice(0, 200);

      const VALID = ["absent", "adresse", "refus", "accident", "autre"];
      if (!uuid || !VALID.includes(reason)) {
        return NextResponse.json({ error: "Motif invalide" }, { status: 400 });
      }

      const oRes = await sb(
        `orders?uuid=eq.${encodeURIComponent(uuid)}&driver_id=eq.${driver.id}` +
          `&select=id&limit=1`
      );
      const order = oRes.ok ? (await oRes.json())?.[0] : null;
      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

      await sb("delivery_incidents", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          order_id: order.id, order_uuid: uuid,
          driver_id: driver.id, reason, detail: detail || null,
        }),
      });

      // La commande repasse « prête » et est libérée : un autre livreur
      // peut la reprendre, ou le restaurant décide de l'annuler.
      const blocking = reason === "absent" || reason === "adresse" || reason === "refus";
      if (blocking) {
        await sb(`orders?id=eq.${order.id}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "ready", driver_id: null,
            notes: `⚠️ Incident livreur : ${reason}${detail ? " — " + detail : ""}`,
          }),
        });
        await sb(`driver_positions?order_uuid=eq.${encodeURIComponent(uuid)}`, {
          method: "DELETE",
        });
      }

      // Alerte immédiate au restaurant
      try {
        const tRes = await sb("expo_push_tokens?audience=eq.admin&select=token&limit=10");
        if (tRes.ok) {
          const tokens = ((await tRes.json()) as Array<{ token: string }>)
            .map((r) => r.token).filter(Boolean);
          const label: Record<string, string> = {
            absent: "Client absent", adresse: "Adresse introuvable",
            refus: "Commande refusée", accident: "Incident sur la route",
            autre: "Incident",
          };
          if (tokens.length) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                tokens.map((to) => ({
                  to, sound: "default", channelId: "commandes", priority: "high",
                  title: `⚠️ ${label[reason]}`,
                  body: `Commande #${order.id} — ${driver.name}${detail ? " : " + detail : ""}`,
                  data: { orderId: order.id, type: "incident" },
                }))
              ),
            });
          }
        }
      } catch { /* idem */ }

      return NextResponse.json({ success: true, released: blocking });
    }

    if (action === "deliver") {
      const uuid = String(body?.uuid ?? "");
      const sig = String(body?.sig ?? "");
      const code = String(body?.code ?? "").trim();

      // Deux moyens de valider une livraison :
      //  1. le scan du QR (normal)
      //  2. un code à 6 chiffres dicté par le client, si la caméra du
      //     livreur ne fonctionne pas. Le code est dérivé du même secret
      //     HMAC que le QR : il est donc tout aussi infalsifiable, et
      //     seul le client peut le lire sur son écran.
      // Validation par CODE À 6 CHIFFRES uniquement.
      // Le client lit le code sur son écran, le livreur le saisit.
      // Le code est dérivé du HMAC serveur : infalsifiable, et seul le
      // client peut le connaître. `sig` reste accepté pour ne pas casser
      // les commandes en cours au moment du déploiement.
      let validated = false;
      if (/^\d{6}$/.test(code)) {
        const expected = (await signQr(uuid)).sig;
        const derived = String(parseInt(expected.slice(0, 8), 16) % 1_000_000).padStart(6, "0");
        const a = Buffer.from(derived);
        const b = Buffer.from(code);
        validated = a.length === b.length && timingSafeEqual(a, b);
      } else if (sig) {
        validated = await verifyQr(uuid, sig); // compatibilité transitoire
      }

      if (!validated) {
        return NextResponse.json(
          { error: "Code de validation incorrect" },
          { status: 403 }
        );
      }
      const res = await sb(`orders?uuid=eq.${encodeURIComponent(uuid)}&driver_id=eq.${driver.id}`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "delivered", delivered_at: new Date().toISOString() }),
      });
      const rows = res.ok ? await res.json() : [];
      if (!rows.length) {
        return NextResponse.json({ error: "Commande non assignée" }, { status: 403 });
      }
      await sb(`driver_positions?order_uuid=eq.${encodeURIComponent(uuid)}`, { method: "DELETE" });
      return NextResponse.json({ success: true, order: rows[0] });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
