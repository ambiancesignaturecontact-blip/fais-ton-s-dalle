import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OTP_SECRET = process.env.QR_SECRET || "change-me";

// Envoi par e-mail via Resend, déjà en place sur le site.
const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "contact@faistonsdalle.com";
// Mode test explicite : sans cette variable, le code n'est JAMAIS
// renvoyé dans la réponse (sinon n'importe qui pourrait se connecter).
const ALLOW_DEBUG_CODE = process.env.OTP_DEBUG === "1";

const CODE_TTL_MIN = 10;
const RESEND_DELAY_S = 60;
const MAX_ATTEMPTS = 5;
const SESSION_DAYS = 90;

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

/** Le code n'est jamais stocké en clair */
const hashCode = (phone: string, code: string) =>
  createHmac("sha256", OTP_SECRET).update(`${phone}:${code}`).digest("hex");

/** 0612345678 / +33612345678 / 06 12 34 56 78 → +33612345678 */
function normalizePhone(raw: string): string | null {
  const d = String(raw).replace(/[^\d+]/g, "");
  if (/^\+33[1-9]\d{8}$/.test(d)) return d;
  if (/^0[1-9]\d{8}$/.test(d)) return "+33" + d.slice(1);
  if (/^33[1-9]\d{8}$/.test(d)) return "+" + d;
  return null;
}

/**
 * Envoi du code par e-mail, quand le client en a un.
 * Resend est gratuit jusqu'à 3 000 messages par mois : c'est la
 * solution la moins chère pour démarrer, avant de payer des SMS.
 */
async function sendEmail(to: string, code: string): Promise<boolean> {
  if (!to) return false;

  if (!RESEND_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `FAIS TON S'DALLE <${RESEND_FROM}>`,
        to: [to],
        subject: `${code} — ton code de connexion`,
        html: `
          <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h1 style="color:#C4161C;font-size:22px;margin:0 0 8px">FAIS TON S'DALLE</h1>
            <p style="color:#444;font-size:15px;line-height:22px">
              Voici ton code de connexion :
            </p>
            <div style="background:#F6F6F7;border-radius:12px;padding:22px;text-align:center;margin:20px 0">
              <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#111">${code}</span>
            </div>
            <p style="color:#777;font-size:13px;line-height:19px">
              Valable ${CODE_TTL_MIN} minutes. Si tu n'es pas à l'origine de
              cette demande, ignore ce message : personne ne peut accéder à
              ton compte sans ce code.
            </p>
          </div>`,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * POST /api/auth/code
 *   { action: "request", phone }        → envoie un code
 *   { action: "verify", phone, code, deviceId, name? } → { token, customer }
 *   { action: "logout" }  + X-Customer-Token
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action ?? "");

    // ═══ 1. Demande de code ═══════════════════════════════════
    if (action === "request") {
      const phone = normalizePhone(String(body?.phone ?? ""));
      if (!phone) {
        return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
      }

      // Anti-spam : un SMS par minute et par numéro
      const prev = await sb(
        `otp_codes?phone=eq.${encodeURIComponent(phone)}&select=last_sent&limit=1`
      );
      if (prev.ok) {
        const rows = await prev.json();
        if (rows?.[0]?.last_sent) {
          const since = (Date.now() - new Date(rows[0].last_sent).getTime()) / 1000;
          if (since < RESEND_DELAY_S) {
            return NextResponse.json(
              { error: `Patiente ${Math.ceil(RESEND_DELAY_S - since)} s avant un nouveau code.` },
              { status: 429 }
            );
          }
        }
      }

      const channel = body?.channel === "email" ? "email" : "sms";
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString();

      await sb("otp_codes", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          phone,
          code_hash: hashCode(phone, code),
          attempts: 0,
          expires_at: expires,
          last_sent: new Date().toISOString(),
        }),
      });

      // Le code part par e-mail (Resend, déjà en place sur le site).
      // Pas de SMS : les opérateurs facturent chaque message, et
      // l'e-mail suffit largement pour un usage restaurant.
      const cRes = await sb(
        `customers?phone=eq.${encodeURIComponent(phone)}&select=email&limit=1`
      );
      const mail = cRes.ok ? (await cRes.json())?.[0]?.email : null;
      const target = String(body?.email ?? mail ?? "").trim();

      if (!target) {
        return NextResponse.json(
          {
            error: "Aucun e-mail sur ce compte.",
            needsEmail: true,
          },
          { status: 428 }
        );
      }

      const sent = await sendEmail(target, code);

      if (!sent && !ALLOW_DEBUG_CODE) {
        // Aucun fournisseur configuré ET pas en mode test : on refuse
        // plutôt que d'exposer le code. Mieux vaut un service
        // indisponible qu'un compte accessible à tous.
        return NextResponse.json(
          { error: "Envoi impossible. Vérifie ton adresse e-mail." },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        sent,
        // Uniquement si OTP_DEBUG=1 est explicitement défini
        ...(sent ? {} : { debugCode: code, warning: "Mode test — SMS non envoyé" }),
      });
    }

    // ═══ 2. Vérification ══════════════════════════════════════
    if (action === "verify") {
      const phone = normalizePhone(String(body?.phone ?? ""));
      const code = String(body?.code ?? "").trim();
      if (!phone || !/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "Code à 6 chiffres requis" }, { status: 400 });
      }

      const res = await sb(
        `otp_codes?phone=eq.${encodeURIComponent(phone)}&select=code_hash,attempts,expires_at&limit=1`
      );
      const rows = res.ok ? await res.json() : [];
      const row = rows?.[0];
      if (!row) {
        return NextResponse.json({ error: "Demande un nouveau code" }, { status: 400 });
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: "Code expiré" }, { status: 400 });
      }
      if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Trop d'essais. Demande un nouveau code." },
          { status: 429 }
        );
      }

      const a = Buffer.from(hashCode(phone, code));
      const b = Buffer.from(String(row.code_hash));
      const ok = a.length === b.length && timingSafeEqual(a, b);

      if (!ok) {
        await sb(`otp_codes?phone=eq.${encodeURIComponent(phone)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ attempts: (row.attempts ?? 0) + 1 }),
        });
        return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
      }

      // Code consommé
      await sb(`otp_codes?phone=eq.${encodeURIComponent(phone)}`, { method: "DELETE" });

      // Compte existant, ou création
      const cRes = await sb(
        `customers?phone=eq.${encodeURIComponent(phone)}` +
          `&select=id,name,email,phone,address,fidelity_menu_count,fidelity_discount_active,fidelity_total_savings&limit=1`
      );
      let customer = cRes.ok ? (await cRes.json())?.[0] : null;

      if (!customer) {
        const name = String(body?.name ?? "").trim().slice(0, 60) || "Client";
        const cr = await sb("customers", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            phone, name, phone_verified: true, is_verified: true,
            device_id: String(body?.deviceId ?? "").slice(0, 64),
          }),
        });
        if (!cr.ok) {
          return NextResponse.json({ error: "Création du compte impossible" }, { status: 502 });
        }
        customer = (await cr.json())[0];
      } else {
        await sb(`customers?id=eq.${customer.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            phone_verified: true,
            last_login: new Date().toISOString(),
            device_id: String(body?.deviceId ?? "").slice(0, 64),
          }),
        });
      }

      // Session longue : 90 jours, le client ne se reconnecte jamais
      const token = randomBytes(32).toString("hex");
      await sb("customer_sessions", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          token,
          customer_id: customer.id,
          device_id: String(body?.deviceId ?? "").slice(0, 64),
          expires_at: new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString(),
        }),
      });

      // On rattache les commandes passées faites sans compte
      const deviceId = String(body?.deviceId ?? "");
      if (deviceId) {
        await sb(
          `orders?guest_token=eq.${encodeURIComponent(deviceId)}&customer_id=is.null`,
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ customer_id: customer.id }),
          }
        ).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email ?? null,
          address: customer.address ?? null,
          fidelity: {
            menuCount: customer.fidelity_menu_count ?? 0,
            discountActive: customer.fidelity_discount_active ?? false,
            totalSavings: Number(customer.fidelity_total_savings ?? 0),
          },
        },
      });
    }

    // ═══ 3. Déconnexion ═══════════════════════════════════════
    if (action === "logout") {
      const token = request.headers.get("X-Customer-Token") ?? "";
      if (token) {
        await sb(`customer_sessions?token=eq.${encodeURIComponent(token)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ revoked: true }),
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
