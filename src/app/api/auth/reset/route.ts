import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual, scryptSync, randomBytes } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OTP_SECRET = process.env.QR_SECRET || "change-me";

const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "contact@faistonsdalle.com";
const ALLOW_DEBUG_CODE = process.env.OTP_DEBUG === "1";

const CODE_TTL_MIN = 15;
const RESEND_DELAY_S = 60;
const MAX_ATTEMPTS = 5;

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

const hashCode = (key: string, code: string) =>
  createHmac("sha256", OTP_SECRET).update(`reset:${key}:${code}`).digest("hex");

/** Même format que /api/auth/login pour rester compatible */
function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function sendEmail(to: string, code: string): Promise<boolean> {
  if (!RESEND_KEY || !to) return false;
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
        subject: `${code} — réinitialisation de ton mot de passe`,
        html: `
          <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h1 style="color:#C4161C;font-size:22px;margin:0 0 8px">FAIS TON S'DALLE</h1>
            <p style="color:#444;font-size:15px;line-height:22px">
              Tu as demandé à réinitialiser ton mot de passe. Voici ton code :
            </p>
            <div style="background:#F6F6F7;border-radius:12px;padding:22px;text-align:center;margin:20px 0">
              <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#111">${code}</span>
            </div>
            <p style="color:#777;font-size:13px;line-height:19px">
              Valable ${CODE_TTL_MIN} minutes. Si tu n'es pas à l'origine de cette
              demande, ignore ce message : ton mot de passe reste inchangé.
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
 * POST /api/auth/reset — mot de passe oublié
 *
 *   { action: "request", email }  → code par e-mail
 *   { action: "confirm", email, code, password }
 *
 * ⚠️ La réponse à "request" est TOUJOURS identique, que le compte
 * existe ou non : sinon la route permettrait de découvrir quels
 * e-mails sont inscrits (énumération de comptes).
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action ?? "");
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      return NextResponse.json({ error: "E-mail invalide" }, { status: 400 });
    }

    // ═══ Demande de code ══════════════════════════════════════
    if (action === "request") {

      const cRes = await sb(
        `customers?email=eq.${encodeURIComponent(email)}&select=id,email&limit=1`
      );
      const customer = cRes.ok ? (await cRes.json())?.[0] : null;

      // Réponse neutre, même si le compte n'existe pas
      const neutral = {
        success: true,
        message: "Si un compte existe, un code vient d'être envoyé.",
      };
      if (!customer) return NextResponse.json(neutral);

      // Anti-spam : un envoi par minute
      const prev = await sb(
        `otp_codes?phone=eq.${encodeURIComponent("reset:" + email)}&select=last_sent&limit=1`
      );
      if (prev.ok) {
        const rows = await prev.json();
        if (rows?.[0]?.last_sent) {
          const since = (Date.now() - new Date(rows[0].last_sent).getTime()) / 1000;
          if (since < RESEND_DELAY_S) {
            return NextResponse.json(
              { error: `Patiente ${Math.ceil(RESEND_DELAY_S - since)} s.` },
              { status: 429 }
            );
          }
        }
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      await sb("otp_codes", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          phone: "reset:" + email,
          code_hash: hashCode(email, code),
          attempts: 0,
          expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
          last_sent: new Date().toISOString(),
        }),
      });

      const sent = await sendEmail(email, code);

      if (!sent && !ALLOW_DEBUG_CODE) {
        return NextResponse.json(
          { error: "Envoi impossible. Contacte le restaurant au 06 72 04 48 75." },
          { status: 503 }
        );
      }

      return NextResponse.json({
        ...neutral,
        ...(sent ? {} : { debugCode: code, warning: "Mode test" }),
      });
    }

    // ═══ Confirmation ═════════════════════════════════════════
    if (action === "confirm") {
      const code = String(body?.code ?? "").trim();
      const password = String(body?.password ?? "");

      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "Code à 6 chiffres requis" }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Mot de passe : 8 caractères minimum" },
          { status: 400 }
        );
      }

      const key = "reset:" + email;
      const res = await sb(
        `otp_codes?phone=eq.${encodeURIComponent(key)}&select=code_hash,attempts,expires_at&limit=1`
      );
      const row = res.ok ? (await res.json())?.[0] : null;
      if (!row) {
        return NextResponse.json({ error: "Demande un nouveau code" }, { status: 400 });
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: "Code expiré" }, { status: 400 });
      }
      if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
        return NextResponse.json({ error: "Trop d'essais" }, { status: 429 });
      }

      const a = Buffer.from(hashCode(email, code));
      const b = Buffer.from(String(row.code_hash));
      const ok = a.length === b.length && timingSafeEqual(a, b);

      if (!ok) {
        await sb(`otp_codes?phone=eq.${encodeURIComponent(key)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ attempts: (row.attempts ?? 0) + 1 }),
        });
        return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
      }

      const up = await sb(`customers?email=eq.${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          password_hash: hashPassword(password),
          updated_at: new Date().toISOString(),
        }),
      });
      if (!up.ok) {
        return NextResponse.json({ error: "Mise à jour impossible" }, { status: 502 });
      }

      await sb(`otp_codes?phone=eq.${encodeURIComponent(key)}`, { method: "DELETE" });

      // Par sécurité, toutes les sessions ouvertes sont fermées :
      // si quelqu'un s'était connecté, il perd l'accès.
      const cRes = await sb(
        `customers?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
      );
      const cid = cRes.ok ? (await cRes.json())?.[0]?.id : null;
      if (cid) {
        await sb(`customer_sessions?customer_id=eq.${cid}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ revoked: true }),
        }).catch(() => {});
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
