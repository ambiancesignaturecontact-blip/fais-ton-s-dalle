"use client";

import { useState, useEffect } from "react";
import { QrCode, Copy, Check, Download } from "lucide-react";
import QRCodeLib from "qrcode";

export function QRCodeCard() {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const url = "https://faistonsdalle.com/#menu";

  useEffect(() => {
    QRCodeLib.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: "#1a0a0a", light: "#ffffff" },
    }).then((dataUrl: string) => {
      setQrDataUrl(dataUrl);
    }).catch(() => {});
  }, [url]);

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "faistonsdalle-qr-code.png";
    a.click();
  };

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4 text-brand-red" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">QR Code tables</h3>
        </div>
        {qrDataUrl && (
          <button onClick={downloadQR}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-white/60 text-[9px] font-bold hover:bg-white/20 transition-colors">
            <Download className="h-3 w-3" /> Télécharger
          </button>
        )}
      </div>
      <p className="text-[10px] text-white/40 mb-3">
        Imprime et colle sur les tables → les clients scannent et commandent direct !
      </p>

      {/* Vrai QR code */}
      <div className="flex justify-center mb-3">
        {qrDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={qrDataUrl} alt="QR Code FAIS TON S'DALLE" className="w-40 h-40 rounded-xl shadow-lg" />
        ) : (
          <div className="w-40 h-40 rounded-xl bg-white/5 flex items-center justify-center">
            <QrCode className="h-10 w-10 text-white/20" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
        <code className="text-[9px] text-white/60 truncate flex-1">{url}</code>
        <button onClick={copyLink}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-brand-red/15 text-brand-red text-[9px] font-bold hover:bg-brand-red/25 transition-colors">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}
