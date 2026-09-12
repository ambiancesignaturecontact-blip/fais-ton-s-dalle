import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, token } = body;

    if (!email || !name || !token) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Horaires courants (partagés avec l'app) dans le pied de l'email
    const [{ getServerSettings }, { summarizeHours }] = await Promise.all([
      import("@/lib/server-settings"),
      import("@/lib/hours"),
    ]);
    const settings = await getServerSettings();

    const emailHtml = (await import("@/lib/email-templates/confirmation")).buildConfirmationEmailHtml({
      name,
      email,
      verificationToken: token,
      hoursLine: `Livraison ${summarizeHours(settings.hours)}`,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://faistonsdalle.com";
    const confirmLink = `${siteUrl}/email-confirme?token=${token}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY) {
      // Mode production : envoi via Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "FAIS TON S'DALLE <noreply@faistonsdalle.com>",
          to: email,
          subject: "Confirme ton adresse email - FAIS TON S'DALLE",
          html: emailHtml,
        }),
      });

      if (!res.ok) {
        console.error("Email send error:", await res.text());
        return NextResponse.json({ error: "Erreur d'envoi" }, { status: 500 });
      }

      return NextResponse.json({ success: true, sent: true });
    }

    // Mode démo : pas de clé Resend → on logge le lien dans la console
    console.log("═══════════════════════════════════════════");
    console.log("📧 EMAIL DE CONFIRMATION (mode démo)");
    console.log("À :", email);
    console.log("Lien :", confirmLink);
    console.log("═══════════════════════════════════════════");

    return NextResponse.json({ success: true, sent: false, demo: true, confirmLink });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
