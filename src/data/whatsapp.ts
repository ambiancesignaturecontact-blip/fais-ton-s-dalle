/**
 * WhatsApp message utilities for FAIS TON S'DALLE
 *
 * Tous les accents sont normalisés pour éviter le caractère `�` dans WhatsApp
 */

export const WA_NUMBERS = ["33672044875", "33744700167", "33611924863"];

/**
 * Normalise les caractères accentués en ASCII
 */
export function normalizeAccents(text: string): string {
  return text
    .replace(/[àâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[œ]/g, "oe")
    .replace(/[ÀÂÄ]/g, "A")
    .replace(/[ÉÈÊË]/g, "E")
    .replace(/[ÎÏ]/g, "I")
    .replace(/[ÔÖ]/g, "O")
    .replace(/[ÙÛÜ]/g, "U")
    .replace(/[Ç]/g, "C")
    .replace(/[Œ]/g, "OE")
    // Remove any remaining non-ASCII characters
    .replace(/[^\x00-\x7F\n\r]/g, "");
}

interface OrderItem {
  name: string;
  price: number;
  qty: number;
  customization?: string | null;
}

interface BuildOrderMessageParams {
  items: OrderItem[];
  total: number;
  customerName: string;
  customerPhone?: string;
  mode: "livraison" | "emporter";
  address?: string;
  isPaid: boolean;
  deliveryFee?: number;
}

/**
 * Construit le message WhatsApp de commande (100% ASCII)
 */
export function buildOrderMessage(params: BuildOrderMessageParams): string {
  const { items, total, customerName, customerPhone, mode, address, isPaid, deliveryFee = 2.5 } = params;

  let msg = "";
  msg += "*NOUVELLE COMMANDE";
  if (isPaid) msg += " PAYEE";
  msg += "*\n";
  msg += "\n";
  msg += mode === "livraison" ? "LIVRAISON\n" : "A EMPORTER\n";
  msg += "\n";

  // Items
  items.forEach((item) => {
    const name = normalizeAccents(item.name);
    const custom = item.customization ? normalizeAccents(item.customization) : null;
    const lineTotal = (item.price * item.qty).toFixed(2);
    msg += `${item.qty}x ${name} - ${lineTotal}€\n`;
    if (custom) {
      msg += `  [${custom}]\n`;
    }
  });

  // Delivery fee
  if (deliveryFee > 0 && mode === "livraison") {
    msg += `LIVRAISON: ${deliveryFee.toFixed(2)}€\n`;
  }

  msg += "\n";
  msg += `TOTAL: ${total.toFixed(2)}€\n`;

  // Customer info
  const safeName = normalizeAccents(customerName || "Client");
  msg += `CLIENT: ${safeName}\n`;
  if (customerPhone) {
    msg += `TEL: ${customerPhone}\n`;
  }
  if (mode === "livraison" && address) {
    const safeAddr = normalizeAccents(address);
    msg += `ADRESSE: ${safeAddr}\n`;
  }

  if (isPaid) {
    msg += "PAYE OK\n";
  }

  return msg;
}

/**
 * Ouvre WhatsApp avec le message pré-rempli
 */
export function openWhatsApp(message: string, phoneIndex: number = 0): void {
  const phone = WA_NUMBERS[phoneIndex % WA_NUMBERS.length];
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");
}
