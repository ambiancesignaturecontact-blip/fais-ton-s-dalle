"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import { getAnalytics } from "@/lib/analytics";
import { useSettings } from "@/components/SettingsProvider";
import { summarizeHours } from "@/lib/hours";
import { toast } from "sonner";

export function ExportPDF() {
  const settings = useSettings();
  const [loading, setLoading] = useState(false);

  const generateReport = () => {
    setLoading(true);
    try {
      const data = getAnalytics();
      const period = data.month;
      const now = new Date();
      const dateStr = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      // Top produits HTML
      const topProductsHtml = data.topProducts.slice(0, 8).map((p, i) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${i + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${p.name}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${p.count}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:12px;font-weight:bold;">${p.revenue.toFixed(2).replace(".", ",")}€</td>
        </tr>
      `).join("");

      // Activité horaire HTML
      const hourlyHtml = data.hourlyActivity.map(h => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${h.hour}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${h.visits}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${h.orders}</td>
        </tr>
      `).join("");

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Rapport FAIS TON S'DALLE</title></head>
<body style="margin:0;padding:30px;font-family:Arial,sans-serif;background:#fff;color:#333;">
  
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#d43d2b,#1a0a0a);padding:30px;border-radius:12px;margin-bottom:24px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:28px;">FAIS TON S'DALLE</h1>
    <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:14px;">Rapport d'activité — ${dateStr}</p>
  </div>

  <!-- KPIs -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="width:25%;padding:16px;text-align:center;background:#f8f8f8;border-radius:8px;">
        <p style="margin:0;font-size:11px;color:#888;">Chiffre d'affaires</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#d43d2b;">${period.revenue.toFixed(2).replace(".", ",")}€</p>
      </td>
      <td style="width:8%;"></td>
      <td style="width:25%;padding:16px;text-align:center;background:#f8f8f8;border-radius:8px;">
        <p style="margin:0;font-size:11px;color:#888;">Commandes</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#333;">${period.orders}</p>
      </td>
      <td style="width:8%;"></td>
      <td style="width:25%;padding:16px;text-align:center;background:#f8f8f8;border-radius:8px;">
        <p style="margin:0;font-size:11px;color:#888;">Visites</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#333;">${period.visits}</p>
      </td>
      <td style="width:8%;"></td>
      <td style="width:25%;padding:16px;text-align:center;background:#f8f8f8;border-radius:8px;">
        <p style="margin:0;font-size:11px;color:#888;">Panier moyen</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#333;">${period.avgCart.toFixed(2).replace(".", ",")}€</p>
      </td>
    </tr>
  </table>

  <!-- Top produits -->
  <h2 style="font-size:16px;margin:0 0 10px;border-bottom:2px solid #d43d2b;padding-bottom:6px;">📊 Top produits (30 jours)</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#f0f0f0;">
        <th style="padding:8px;text-align:center;font-size:11px;">#</th>
        <th style="padding:8px;text-align:left;font-size:11px;">Produit</th>
        <th style="padding:8px;text-align:center;font-size:11px;">Ventes</th>
        <th style="padding:8px;text-align:right;font-size:11px;">CA</th>
      </tr>
    </thead>
    <tbody>${topProductsHtml}</tbody>
  </table>

  <!-- Activité horaire -->
  <h2 style="font-size:16px;margin:0 0 10px;border-bottom:2px solid #d43d2b;padding-bottom:6px;">⏰ Activité horaire</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#f0f0f0;">
        <th style="padding:8px;text-align:left;font-size:11px;">Créneau</th>
        <th style="padding:8px;text-align:center;font-size:11px;">Visites</th>
        <th style="padding:8px;text-align:center;font-size:11px;">Commandes</th>
      </tr>
    </thead>
    <tbody>${hourlyHtml}</tbody>
  </table>

  <!-- Stats globales -->
  <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
    <h3 style="font-size:14px;margin:0 0 8px;">📈 Résumé</h3>
    <table width="100%" cellpadding="4" cellspacing="0">
      <tr><td style="font-size:12px;color:#888;">Total commandes (30j)</td><td style="font-size:12px;font-weight:bold;text-align:right;">${period.orders}</td></tr>
      <tr><td style="font-size:12px;color:#888;">Total visites (30j)</td><td style="font-size:12px;font-weight:bold;text-align:right;">${period.visits}</td></tr>
      <tr><td style="font-size:12px;color:#888;">Taux de conversion</td><td style="font-size:12px;font-weight:bold;text-align:right;">${period.conversionRate}%</td></tr>
      <tr><td style="font-size:12px;color:#888;">Panier moyen</td><td style="font-size:12px;font-weight:bold;text-align:right;">${period.avgCart.toFixed(2).replace(".", ",")}€</td></tr>
      <tr><td style="font-size:12px;color:#888;">Chiffre d'affaires total</td><td style="font-size:14px;font-weight:bold;text-align:right;color:#d43d2b;">${period.revenue.toFixed(2).replace(".", ",")}€</td></tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding-top:16px;border-top:1px solid #eee;font-size:10px;color:#aaa;">
    <p style="margin:0;">FAIS TON S'DALLE — 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois</p>
    <p style="margin:2px 0 0;">Rapport généré le ${dateStr} · Livraison ${summarizeHours(settings.hours)}</p>
  </div>
</body>
</html>`;

      // Open in new window and print
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => {
          win.print();
          toast.success("Rapport prêt !");
        }, 500);
      } else {
        toast.error("Bloqueur de popup détecté");
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Export PDF</h3>
      </div>
      <p className="text-[10px] text-white/40 mb-3">
        Génère un rapport professionnel complet : CA, top produits, activité horaire, statistiques.
      </p>
      <button onClick={generateReport} disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-[11px] font-bold hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg">
        {loading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {loading ? "Génération..." : "Télécharger le rapport PDF"}
      </button>
    </div>
  );
}
