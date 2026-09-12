// ─── Template email de confirmation ──────────────────────────

export function buildConfirmationEmailHtml(params: {
  name: string;
  email: string;
  verificationToken: string;
  siteUrl?: string;
  /** Ligne d'horaires dynamique ("Livraison 11h30-3h · 7j/7") */
  hoursLine?: string;
}): string {
  const siteUrl = params.siteUrl || "https://faistonsdalle.com";
  const hoursLine = params.hoursLine || "Livraison 11h30-3h · 7j/7";
  const confirmLink = `${siteUrl}/api/auth/verify?token=${params.verificationToken}&email=${encodeURIComponent(params.email)}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:30px 10px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Header rouge -->
        <tr>
          <td style="background:linear-gradient(135deg,#d43d2b,#e85d4a);padding:30px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold;letter-spacing:1px;">FAIS TON S'DALLE</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Confirme ton adresse email</p>
          </td>
        </tr>

        <!-- Contenu -->
        <tr>
          <td style="padding:40px 40px 30px;">
            <p style="font-size:16px;color:#333;margin:0 0 20px;line-height:1.6;">
              Salut <strong style="color:#d43d2b;">${params.name}</strong>,
            </p>
            <p style="font-size:15px;color:#555;margin:0 0 20px;line-height:1.6;">
              Bienvenue chez <strong>FAIS TON S'DALLE</strong> ! 🎉<br><br>
              Pour activer ton compte et commencer à commander, clique sur le bouton ci-dessous :
            </p>

            <!-- Bouton -->
            <table cellpadding="0" cellspacing="0" style="margin:30px auto;">
              <tr>
                <td style="background:linear-gradient(135deg,#d43d2b,#e85d4a);border-radius:50px;padding:14px 36px;">
                  <a href="${confirmLink}" target="_blank"
                    style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;display:inline-block;">
                    ✅ Confirmer mon email
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;color:#999;margin:30px 0 0;line-height:1.5;text-align:center;">
              Ou copie ce lien dans ton navigateur :<br>
              <a href="${confirmLink}" style="color:#d43d2b;font-size:12px;word-break:break-all;">${confirmLink}</a>
            </p>

            <p style="font-size:13px;color:#999;margin:20px 0 0;line-height:1.5;border-top:1px solid #eee;padding-top:20px;">
              Si tu n'as pas créé de compte, ignore simplement cet email.<br>
              L'équipe <strong style="color:#d43d2b;">FAIS TON S'DALLE</strong> 🥪
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a0a0a;padding:20px 40px;text-align:center;">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0;line-height:1.5;">
              FAIS TON S'DALLE — 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois<br>
              ${hoursLine} · <a href="tel:+33672044875" style="color:#d43d2b;text-decoration:none;">06 72 04 48 75</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
