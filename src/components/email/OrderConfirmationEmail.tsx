/**
 * Template email de confirmation de commande
 * Utilisé par /api/email pour envoyer un récapitulatif au client
 */
export function buildOrderConfirmationHtml(params: {
  customerName: string;
  orderId: number;
  items: { name: string; price: number; qty: number; customization?: string | null }[];
  total: number;
  mode: string;
  address?: string;
  estimatedDelivery: string;
  /** Ligne d'horaires dynamique ("Livraison 11h30-3h · 7j/7") */
  hoursLine?: string;
}) {
  const { customerName, orderId, items, total, mode, address, estimatedDelivery,
    hoursLine = "Livraison 11h30-3h · 7j/7" } = params;

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>${item.qty}x ${item.name}</strong>
        ${item.customization ? `<br/><span style="color:#888;font-size:12px;">${item.customization}</span>` : ""}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
        ${(item.price * item.qty).toFixed(2).replace(".", ",")}€
      </td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header rouge -->
          <tr>
            <td style="background:linear-gradient(135deg,#d43d2b,#e85d4a);padding:30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">FAIS TON S'DALLE</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Commande confirmée ✅</p>
            </td>
          </tr>

          <!-- Contenu -->
          <tr>
            <td style="padding:30px;">
              <p style="margin:0 0 5px;font-size:16px;">Salut <strong>${escHtml(customerName)}</strong> !</p>
              <p style="margin:0 0 20px;color:#666;font-size:14px;">Ta commande <strong>#${orderId}</strong> est bien confirmée ✅</p>

              <!-- Infos livraison -->
              <table width="100%" cellpadding="10" cellspacing="0" style="background:#fafafa;border-radius:12px;margin-bottom:20px;">
                <tr>
                  <td style="font-size:13px;color:#888;">Mode</td>
                  <td style="font-size:13px;font-weight:bold;text-align:right;">
                    ${mode === "livraison" ? "🚚 Livraison" : "🥡 À emporter"}
                  </td>
                </tr>
                ${address ? `<tr><td style="font-size:13px;color:#888;">Adresse</td><td style="font-size:13px;text-align:right;">${escHtml(address)}</td></tr>` : ""}
                <tr>
                  <td style="font-size:13px;color:#888;">Livraison estimée</td>
                  <td style="font-size:13px;font-weight:bold;text-align:right;">${estimatedDelivery}</td>
                </tr>
              </table>

              <!-- Articles -->
              <h3 style="font-size:14px;margin:0 0 10px;">Récapitulatif</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="8" cellspacing="0" style="margin-top:10px;">
                <tr>
                  <td style="font-size:16px;font-weight:bold;">Total</td>
                  <td style="font-size:18px;font-weight:bold;color:#d43d2b;text-align:right;">
                    ${total.toFixed(2).replace(".", ",")}€
                  </td>
                </tr>
              </table>

              <!-- Bouton -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:25px;">
                <tr>
                  <td align="center">
                    <a href="https://faistonsdalle.com" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#d43d2b,#e85d4a);color:#fff;text-decoration:none;border-radius:50px;font-size:14px;font-weight:bold;">
                      Voir le menu →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin-top:20px;color:#888;font-size:12px;text-align:center;">
                Une question ? Contacte-nous sur <a href="https://wa.me/33672044875" style="color:#25D366;">WhatsApp</a>
                ou au <a href="tel:+33672044875" style="color:#d43d2b;">06 72 04 48 75</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;padding:20px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#888;font-size:11px;">
                FAIS TON S'DALLE — 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois<br/>
                ${hoursLine}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
