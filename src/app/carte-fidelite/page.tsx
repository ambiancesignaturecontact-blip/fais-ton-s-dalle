"use client";

// ─── Carte de fidélité ────────────────────────────────────────
//
// Deux usages :
//   · sur iPhone, l'ajouter à **Apple Wallet** (fichier .pkpass) —
//     disponible dès que le certificat Apple est déposé ;
//   · partout ailleurs, cette page EST la carte : QR code à montrer
//     au comptoir, tampons, récompense. Elle marche tout de suite,
//     sans rien signer.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, RefreshCw, Gift } from "lucide-react";
import { getCurrentAccount } from "@/lib/auth";

const PALIER = 10;

type Etat = {
  nom: string;
  telephone: string;
  tampons: number;
  recompenseActive: boolean;
};

/** QR code sans dépendance : service public d'images, données minimales */
function urlQr(valeur: string): string {
  return (
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=" +
    encodeURIComponent(valeur)
  );
}

export default function CarteFidelitePage() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [walletPret, setWalletPret] = useState(false);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      const acc = await getCurrentAccount();
      if (!acc) { setEtat(null); return; }

      let tampons = 0;
      let recompenseActive = false;
      try {
        const brut = localStorage.getItem("ftsd_fidelity");
        if (brut) {
          const d = JSON.parse(brut);
          tampons = Number(d.menuCount ?? 0);
          recompenseActive = Boolean(d.discountActive);
        }
      } catch { /* carte vierge */ }

      setEtat({
        nom: acc.name || "Client",
        telephone: acc.phone || "",
        tampons,
        recompenseActive,
      });

      // Le bouton Wallet n'apparaît que si le serveur sait vraiment
      // fabriquer la carte : un bouton qui échoue vaut moins que pas
      // de bouton du tout.
      if (acc.phone) {
        const r = await fetch(
          `/api/wallet?tel=${encodeURIComponent(acc.phone)}`,
          { method: "HEAD" }
        );
        setWalletPret(r.status === 200);
      }
    } catch {
      setEtat(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { charger(); }, 0);
    return () => clearTimeout(t);
  }, [charger]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/compte"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/80">
          <ArrowLeft className="h-3.5 w-3.5" /> Mon compte
        </Link>

        <h1 className="font-heading text-2xl tracking-wider text-white">Carte de fidélité</h1>
        <p className="mt-2 text-sm text-white/60">
          {PALIER} menus achetés = <strong className="text-white">un menu offert</strong> sur
          la commande suivante.
        </p>

        {chargement && <p className="mt-8 text-sm text-white/40">Chargement…</p>}

        {!chargement && !etat && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/70">
              Connectez-vous pour afficher votre carte.
            </p>
            <Link href="/connexion"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-brand-red to-red-700 px-5 py-2.5 text-sm font-bold text-white">
              Se connecter
            </Link>
          </div>
        )}

        {!chargement && etat && (
          <>
            {/* La carte */}
            <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#E85D4A] to-[#A82D1E] p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black tracking-[2px] text-white/70">
                    FAIS TON S&apos;DALLE
                  </p>
                  <p className="mt-0.5 text-lg font-black text-white">{etat.nom}</p>
                </div>
                <span className="text-2xl">🥖</span>
              </div>

              <p className="mt-6 text-3xl font-black text-white">
                {etat.tampons} <span className="text-lg font-bold text-white/70">/ {PALIER}</span>
              </p>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/25">
                <div className="h-full rounded-full bg-white/90 transition-all"
                  style={{ width: `${Math.min(100, (etat.tampons / PALIER) * 100)}%` }} />
              </div>

              <p className="mt-2 text-[12px] font-semibold text-white/90">
                {etat.recompenseActive
                  ? "🎉 Votre menu offert vous attend"
                  : `Encore ${Math.max(0, PALIER - etat.tampons)} menu(s)`}
              </p>

              <div className="mt-5 flex justify-center rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlQr(etat.telephone || etat.nom)}
                  alt="QR code de votre carte de fidélité"
                  width={180}
                  height={180}
                  className="h-[180px] w-[180px]"
                />
              </div>
              <p className="mt-2 text-center text-[11px] text-white/80">
                Montrez ce code au comptoir
              </p>
            </div>

            {walletPret ? (
              <a
                href={`/api/wallet?tel=${encodeURIComponent(etat.telephone)}`}
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black px-4 py-3.5 text-sm font-extrabold text-white transition-transform hover:scale-[1.01]"
              >
                <Wallet className="h-4 w-4" /> Ajouter à Apple Wallet
              </a>
            ) : (
              <p className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-[11.5px] leading-4 text-white/45">
                <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                L&apos;ajout à Apple Wallet sera disponible dès que le
                certificat Apple sera en place. En attendant, cette page
                fait office de carte : ajoutez-la à votre écran d&apos;accueil.
              </p>
            )}

            <button onClick={charger}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-white/40 hover:text-white/70">
              <RefreshCw className="h-3 w-3" /> Actualiser
            </button>
          </>
        )}
      </div>
    </div>
  );
}
