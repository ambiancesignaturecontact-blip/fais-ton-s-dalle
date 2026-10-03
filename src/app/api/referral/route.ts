import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

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

/** Code déterministe et stable à partir de l'identifiant d'appareil */
function codeFor(deviceId: string): string {
  const h = createHash("sha256").update(`ftsd:${deviceId}`).digest("hex");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I,O,0,1
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[parseInt(h.slice(i * 2, i * 2 + 2), 16) % alphabet.length];
  }
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

/**
 * GET /api/referral?device=xxx
 * Renvoie le code de parrainage de l'appareil + ses statistiques.
 * Le code est créé automatiquement au premier appel.
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const device = (request.nextUrl.searchParams.get("device") ?? "").trim();
  if (device.length < 8) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const code = codeFor(device);

  try {
    // Création si absent (idempotent)
    const existing = await sb(
      `referrals?code=eq.${code}&select=*&limit=1`
    ).then((r) => (r.ok ? r.json() : []));

    if (!Array.isArray(existing) || existing.length === 0) {
      await sb("referrals", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ code, device_id: device }),
      });
    }

    // Statistiques : filleuls validés
    const usesRes = await sb(
      `referral_uses?referrer_code=eq.${code}&select=id,used_at,rewarded`
    );
    const uses = usesRes.ok ? await usesRes.json() : [];

    // Ce code a-t-il déjà été parrainé lui-même ?
    const asGodchild = await sb(
      `referral_uses?device_id=eq.${encodeURIComponent(device)}&select=referrer_code,consumed&limit=1`
    ).then((r) => (r.ok ? r.json() : []));

    return NextResponse.json({
      code,
      parrainCount: Array.isArray(uses) ? uses.length : 0,
      totalDiscounts: Array.isArray(uses)
        ? uses.filter((u: { rewarded?: boolean }) => u.rewarded).length
        : 0,
      godfather: Array.isArray(asGodchild) && asGodchild.length
        ? asGodchild[0].referrer_code
        : null,
      welcomeUsed: Array.isArray(asGodchild) && asGodchild.length
        ? Boolean(asGodchild[0].consumed)
        : false,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/referral
 * { action: "apply", device, code }    → applique un code parrain
 * { action: "consume", device }        → consomme le bonus après commande
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const device = String(body?.device ?? "").trim();
    const action = String(body?.action ?? "");

    if (device.length < 8) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    // ─── Appliquer un code de parrainage ────────────────────────
    if (action === "apply") {
      const code = String(body?.code ?? "").trim().toUpperCase();

      if (!/^[A-Z2-9]{3}-[A-Z2-9]{5}$/.test(code)) {
        return NextResponse.json({ error: "Format de code invalide" }, { status: 400 });
      }
      // Auto-parrainage impossible
      if (code === codeFor(device)) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas utiliser votre propre code" },
          { status: 400 }
        );
      }
      // Le code doit exister réellement
      const owner = await sb(`referrals?code=eq.${code}&select=code&limit=1`)
        .then((r) => (r.ok ? r.json() : []));
      if (!Array.isArray(owner) || owner.length === 0) {
        return NextResponse.json({ error: "Ce code n'existe pas" }, { status: 404 });
      }
      // Un seul parrainage par appareil
      const already = await sb(
        `referral_uses?device_id=eq.${encodeURIComponent(device)}&select=id&limit=1`
      ).then((r) => (r.ok ? r.json() : []));
      if (Array.isArray(already) && already.length) {
        return NextResponse.json(
          { error: "Un parrainage a déjà été utilisé sur cet appareil" },
          { status: 409 }
        );
      }

      const ins = await sb("referral_uses", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          referrer_code: code,
          device_id: device,
          consumed: false,
          rewarded: false,
        }),
      });
      if (!ins.ok) {
        return NextResponse.json({ error: "Enregistrement impossible" }, { status: 502 });
      }
      return NextResponse.json({ success: true, godfather: code });
    }

    // ─── « consume » : plus rien à consommer depuis le client ───
    //
    // Avant, n'importe qui pouvait appeler cette action avec un
    // identifiant d'appareil et brûler — ou créditer — un
    // parrainage sans avoir jamais commandé.
    //
    // Le bonus filleul est maintenant consommé par /api/order, au
    // moment exact où la commande est enregistrée. L'action reste
    // acceptée pour les anciennes versions de l'app, mais elle ne
    // fait plus rien : elle se contente de dire ce qui est en base.
    if (action === "consume") {
      const etat = await sb(
        `referral_uses?device_id=eq.${encodeURIComponent(device)}` +
          `&select=consumed&limit=1`
      ).then((r) => (r.ok ? r.json() : []));
      return NextResponse.json({
        success: true,
        consumed: Array.isArray(etat) && etat.length ? Boolean(etat[0].consumed) : false,
        note: "Le bonus est consommé automatiquement à la commande.",
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
