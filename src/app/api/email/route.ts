import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "contact@faistonsdalle.com";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Mode démo
    if (!RESEND_API_KEY) {
      console.log("📧 Email (démo) →", to, "| Sujet:", subject);
      return NextResponse.json({ success: true, demo: true });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `FAIS TON S'DALLE <${FROM_EMAIL}>`,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) throw new Error(`Resend error: ${res.status}`);

    const data = await res.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("❌ Email error:", err);
    return NextResponse.json({ error: "Erreur d'envoi" }, { status: 500 });
  }
}
