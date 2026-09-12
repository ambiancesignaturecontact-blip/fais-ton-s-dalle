"use client";

import { Printer } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/components/SettingsProvider";
import { summarizeHours } from "@/lib/hours";

interface OrderItem {
  id: number;
  item_name: string;
  item_price: number;
  quantity: number;
  customization: string | null;
  subtotal: number;
  category: string | null;
}

interface Order {
  id: number;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  mode: string | null;
  address: string | null;
  is_paid: boolean;
  scheduled_time: string | null;
  order_items: OrderItem[];
}

export function TicketPrint({ order }: { order: Order }) {
  const settings = useSettings();
  const hoursLine = `Livraison ${summarizeHours(settings.hours)}`;
  const printTicket = () => {
    try {
      const itemsHtml = order.order_items?.map((i) => `
        <tr>
          <td style="font-size:11px;padding:2px 0;text-align:center;">${i.quantity}</td>
          <td style="font-size:11px;padding:2px 0;padding-left:4px;">${i.item_name}</td>
          <td style="font-size:11px;padding:2px 0;text-align:right;">${i.subtotal.toFixed(2)}€</td>
        </tr>
        ${i.customization ? `<tr><td colspan="3" style="font-size:9px;color:#666;padding:0 0 4px 12px;font-style:italic;">${i.customization}</td></tr>` : ""}
      `).join("");

      const mode = order.mode === "livraison" ? "🚚 LIVRAISON" : "🥡 À EMPORTER";
      const paid = order.is_paid ? "✅ PAYÉ" : "⏳ ATTENTE PAIEMENT";

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ticket #${order.id}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; padding: 4mm 2mm; font-size: 10px; color: #000; }
  h1 { font-size: 14px; text-align: center; margin: 0 0 2px; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  .total { font-size: 14px; font-weight: bold; text-align: center; }
  .footer { text-align: center; font-size: 9px; color: #666; margin-top: 4px; }
</style></head><body>
  <h1>🏪 FAIS TON S'DALLE</h1>
  <div style="text-align:center;font-size:9px;margin-bottom:4px;">
    134 Allée du Colonel Fabien<br>93320 Les Pavillons-sous-Bois<br>06 72 04 48 75
  </div>
  <div class="divider"></div>
  <div style="font-size:11px;font-weight:bold;">#${order.id} — ${mode}</div>
  <div style="font-size:9px;margin:2px 0;">${new Date(order.created_at).toLocaleString("fr-FR")}</div>
  <div style="font-size:9px;color:#c00;font-weight:bold;">${paid}</div>
  ${order.scheduled_time ? `<div style="font-size:9px;color:#6366f1;">🕐 ${order.scheduled_time}</div>` : ""}
  ${order.customer_name ? `<div style="font-size:9px;">👤 ${order.customer_name}</div>` : ""}
  ${order.customer_phone ? `<div style="font-size:9px;">📞 ${order.customer_phone}</div>` : ""}
  ${order.address ? `<div style="font-size:9px;">📍 ${order.address}</div>` : ""}
  <div class="divider"></div>
  <table>${itemsHtml}</table>
  <div class="divider"></div>
  <div class="total">TOTAL : ${order.total.toFixed(2)}€</div>
  <div class="divider"></div>
  <div class="footer">
    FAIS TON S'DALLE<br>${hoursLine}
  </div>
</body></html>`;

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => {
          win.print();
          toast.success("Ticket envoyé à l'imprimante !");
        }, 300);
      } else {
        toast.error("Bloqueur de popup. Autorise les popups pour imprimer.");
      }
    } catch {}
  };

  return (
    <button onClick={printTicket}
      className="px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-300 text-[8px] font-bold hover:bg-indigo-500/25 border border-indigo-500/20 flex items-center gap-1">
      <Printer className="h-2.5 w-2.5" /> Ticket
    </button>
  );
}
