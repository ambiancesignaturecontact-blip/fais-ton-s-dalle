// ─── Envoi du reçu PDF par e-mail ─────────────────────────────
//
// Déclenché automatiquement quand un paiement en ligne est confirmé.
// Silencieux si le client n'a pas d'adresse e-mail connue : on ne
// bloque jamais une commande pour un reçu.

import { genererRecu, ENTREPRISE, type LigneRecu } from "./recu-pdf";
import { lienAvisGoogle } from "./avis-google";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || "contact@faistonsdalle.com";

function sb(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}` },
    cache: "no-store",
  });
}

/**
 * Retrouve l'adresse e-mail du client : sur la commande, sinon sur
 * son compte (id), sinon par son numéro de téléphone.
 */
async function trouverEmail(o: Record<string, unknown>): Promise<string | null> {
  const direct = String(o.customer_email ?? "").trim();
  if (direct.includes("@")) return direct;

  try {
    if (o.customer_id) {
      const r = await sb(`customers?id=eq.${o.customer_id}&select=email&limit=1`);
      if (r.ok) {
        const [c] = await r.json();
        if (c?.email) return String(c.email);
      }
    }
    const tel = String(o.customer_phone ?? "").replace(/\D/g, "");
    if (tel.length >= 9) {
      const r = await sb(
        `customers?phone=eq.${encodeURIComponent(tel)}&select=email&limit=1`
      );
      if (r.ok) {
        const [c] = await r.json();
        if (c?.email) return String(c.email);
      }
    }
  } catch { /* pas d'e-mail : on n'envoie rien */ }
  return null;
}

/** Renvoie true si un reçu a réellement été envoyé */
export async function envoyerRecuParEmail(uuid: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY || !uuid) return false;

  try {
    const res = await sb(
      `orders?uuid=eq.${encodeURIComponent(uuid)}` +
        `&select=id,uuid,created_at,customer_name,customer_phone,customer_email,customer_id,` +
        `mode,address,total,delivery_fee,discount_applied,tip,payment_method,` +
        `order_items(item_name,quantity,item_price,customization)&limit=1`
    );
    if (!res.ok) return false;
    const [o] = (await res.json()) as Array<Record<string, unknown>>;
    if (!o) return false;

    const email = await trouverEmail(o);
    if (!email) return false;

    const lignes: LigneRecu[] = (
      (o.order_items as Array<Record<string, unknown>>) ?? []
    ).map((i) => ({
      nom: String(i.item_name ?? "Article"),
      quantite: Number(i.quantity ?? 1),
      prixUnitaire: Number(i.item_price ?? 0),
      personnalisation: (i.customization as string) ?? null,
    }));

    const pdf = await genererRecu({
      reference: `#${o.id}`,
      date: String(o.created_at ?? new Date().toISOString()),
      client: String(o.customer_name ?? "Client"),
      telephone: (o.customer_phone as string) ?? null,
      mode: String(o.mode ?? "livraison"),
      adresse: (o.address as string) ?? null,
      lignes,
      fraisLivraison: Number(o.delivery_fee ?? 0),
      remise: Number(o.discount_applied ?? 0),
      pourboire: Number(o.tip ?? 0),
      total: Number(o.total ?? 0),
      moyenPaiement: (o.payment_method as string) ?? null,
    });

    // Mode démo : pas de clé Resend configurée
    if (!RESEND_KEY) return false;

    const envoi = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${ENTREPRISE.nom} <${FROM}>`,
        to: email,
        subject: `Votre reçu — commande #${o.id}`,
        html: `
          <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:auto">
            <h2 style="color:#D43D2B;margin:0 0 8px">Merci pour votre commande !</h2>
            <p style="color:#444;font-size:14px;line-height:22px">
              Votre reçu de la commande <strong>#${o.id}</strong> est en pièce jointe
              (PDF), avec le détail et la TVA.
            </p>
            <table role="presentation" style="margin:20px 0"><tr><td
              style="background:#D43D2B;border-radius:10px">
              <a href="${lienAvisGoogle()}"
                 style="display:block;padding:13px 22px;color:#fff;font-size:15px;
                        font-weight:600;text-decoration:none">
                ⭐ Donner votre avis sur Google (10 secondes)
              </a>
            </td></tr></table>
            <p style="color:#444;font-size:13px;line-height:20px;margin:0 0 16px">
              Un avis Google, c'est ce qui nous permet d'être trouvés par
              nos voisins. Merci beaucoup 🙏
            </p>
            <p style="color:#888;font-size:12px;line-height:18px">
              Besoin d'une facture au nom d'une société ? Répondez simplement
              à cet e-mail.<br>
              Allergènes : <a href="https://faistonsdalle.com/allergenes">faistonsdalle.com/allergenes</a>
            </p>
          </div>`,
        attachments: [
          {
            filename: `recu-${o.id}.pdf`,
            content: Buffer.from(pdf).toString("base64"),
          },
        ],
      }),
    });

    return envoi.ok;
  } catch {
    return false;
  }
}
