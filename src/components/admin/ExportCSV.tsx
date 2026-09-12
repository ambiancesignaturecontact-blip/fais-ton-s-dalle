"use client";
/* eslint-disable */

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

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
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  mode: string | null;
  address: string | null;
  delivery_fee: number | null;
  is_paid: boolean;
  scheduled_time: string | null;
  order_items: OrderItem[];
}

export function ExportCSV({ orders }: { orders: Order[] }) {
  const [loading, setLoading] = useState(false);

  const exportCSV = () => {
    setLoading(true);
    try {
      if (orders.length === 0) {
        toast.error("Aucune commande a exporter");
        return;
      }

      var headers = ["ID","Date","Statut","Client","Telephone","Mode","Adresse","Cre-neau","Paye","Articles","Total HT","Frais livraison","Total TTC"];

      var csv = "\uFEFF" + headers.join(",") + "\n";

      for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var items = [];
        if (o.order_items) {
          for (var j = 0; j < o.order_items.length; j++) {
            var item = o.order_items[j];
            var s = item.quantity + "x " + item.item_name;
            if (item.customization) s += " (" + item.customization + ")";
            items.push(s);
          }
        }
        var itemsStr = items.join(" / ");
        var mode = o.mode === "livraison" ? "Livraison" : "A emporter";
        var paid = o.is_paid ? "Oui" : "Non";
        var sub = (o.total - (o.delivery_fee || 0)).toFixed(2);
        var fee = (o.delivery_fee || 0).toFixed(2);
        var total = o.total.toFixed(2);

        var row = [
          o.id,
          new Date(o.created_at).toLocaleString("fr-FR"),
          o.status,
          o.customer_name || "",
          o.customer_phone || "",
          mode,
          o.address || "",
          o.scheduled_time || "",
          paid,
          itemsStr,
          sub,
          fee,
          total
        ];

        var escapedRow = [];
        for (var k = 0; k < row.length; k++) {
          var val = String(row[k]);
          escapedRow.push('"' + val.replace(/"/g, '""') + '"');
        }
        csv += escapedRow.join(",") + "\n";
      }

      var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "ftsd-commandes-" + new Date().toISOString().slice(0, 10) + ".csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(orders.length + " commandes exportees !");
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileSpreadsheet className="h-4 w-4 text-green-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Export CSV</h3>
      </div>
      <p className="text-[10px] text-white/40 mb-3">
        Exporte toutes les commandes ({orders.length}) en CSV pour Excel/Google Sheets.
      </p>
      <button onClick={exportCSV} disabled={loading || orders.length === 0}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-green-700 to-emerald-600 text-white text-[11px] font-bold hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg">
        {loading ? "Export..." : <Download className="h-4 w-4" />}
        {loading ? "Generation..." : "Telecharger CSV (" + orders.length + " lignes)"}
      </button>
    </div>
  );
}
