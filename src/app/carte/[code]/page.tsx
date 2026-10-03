"use client";

// ─── La page qui s'ouvre quand on scanne la carte de fidélité ──
//
// Avant, le QR de la carte Apple Wallet contenait le numéro de
// téléphone en clair : le scanner n'affichait qu'un numéro, sans
// aucune utilité, et exposait une donnée personnelle.
//
// Maintenant il mène ici :
//
//  · le client voit sa progression, joliment ;
//  · le comptoir saisit une fois le mot de passe restaurateur
//    (gardé sur l'appareil) et valide un passage en un geste.
//
// Aucune donnée sensible n'est affichée : ni téléphone, ni e-mail.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Carte {
  id: number;
  nom: string;
  tampons: number;
  seuil: number;
  restants: number;
  recompenseDisponible: boolean;
  economies: number;
}

const CLE_MDP = "ftsd_admin_pw";

export default function PageCarte() {
  const { code } = useParams<{ code: string }>();
  const [carte, setCarte] = useState<Carte | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mdp, setMdp] = useState("");
  const [occupe, setOccupe] = useState(false);

  // Lu une seule fois, hors rendu : le mot de passe du comptoir
  // reste sur l'appareil.
  const [mdpCharge, setMdpCharge] = useState(false);
  useEffect(() => {
    if (mdpCharge) return;
    const t = setTimeout(() => {
      try {
        setMdp(localStorage.getItem(CLE_MDP) ?? "");
      } catch {
        /* navigation privée */
      }
      setMdpCharge(true);
    }, 0);
    return () => clearTimeout(t);
  }, [mdpCharge]);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`/api/fidelite?code=${encodeURIComponent(String(code))}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Carte introuvable");
      setCarte(j.carte);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Carte introuvable");
    }
  }, [code]);

  useEffect(() => {
    const t = setTimeout(charger, 0);
    return () => clearTimeout(t);
  }, [charger]);

  async function tamponner(sens: "ajouter" | "retirer") {
    if (!mdp.trim()) {
      setMessage("Saisissez le mot de passe du mode restaurateur.");
      return;
    }
    setOccupe(true);
    setMessage(null);
    try {
      const r = await fetch("/api/fidelite", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Auth": mdp.trim() },
        body: JSON.stringify({ code, sens }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Impossible");
      try {
        localStorage.setItem(CLE_MDP, mdp.trim());
      } catch {
        /* tant pis */
      }
      setCarte(j.carte);
      setMessage(j.message ?? "Enregistré");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Impossible");
    } finally {
      setOccupe(false);
    }
  }

  if (erreur) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0E0E10] px-6 text-center">
        <div>
          <p className="text-5xl">🥖</p>
          <h1 className="mt-4 text-lg font-bold text-white">Carte introuvable</h1>
          <p className="mt-2 text-sm text-white/50">{erreur}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-[#C4161C] px-5 py-2.5 text-sm font-bold text-white"
          >
            Aller sur le site
          </Link>
        </div>
      </main>
    );
  }

  if (!carte) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0E0E10]">
        <p className="text-sm text-white/40">Chargement…</p>
      </main>
    );
  }

  const pourcent = Math.min(100, (carte.tampons / carte.seuil) * 100);

  return (
    <main className="min-h-screen bg-[#0E0E10] px-5 py-10 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-center text-[11px] font-bold tracking-[0.2em] text-[#E9B860]">
          FAIS TON S&apos;DALLE
        </p>

        <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-b from-[#B0141A] to-[#68090D] shadow-2xl">
          <div className="px-6 pb-6 pt-7">
            <p className="text-[11px] font-semibold tracking-wider text-white/70">
              CARTE DE FIDÉLITÉ
            </p>
            <h1 className="mt-1 text-2xl font-black">{carte.nom}</h1>
            <p className="mt-0.5 text-[11px] text-white/50">
              Membre n° {String(carte.id).padStart(5, "0")}
            </p>

            {carte.recompenseDisponible ? (
              <p className="mt-5 text-3xl font-black text-[#E9B860]">
                −20 % disponible 🎉
              </p>
            ) : (
              <>
                <p className="mt-5 text-4xl font-black">
                  {carte.tampons}
                  <span className="text-xl font-bold text-white/50"> / {carte.seuil}</span>
                </p>
                <p className="mt-1 text-sm text-white/70">
                  encore {carte.restants} menu{carte.restants > 1 ? "s" : ""} avant −20 %
                </p>
              </>
            )}

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-[#E9B860] transition-all"
                style={{ width: `${pourcent}%` }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {Array.from({ length: carte.seuil }, (_, i) => (
                <span
                  key={i}
                  className={
                    "h-6 w-6 rounded-full " +
                    (i < carte.tampons
                      ? "bg-[#E9B860] ring-2 ring-[#E9B860]/30"
                      : "border-2 border-white/30")
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {carte.economies > 0 && (
          <p className="mt-3 text-center text-[11px] text-white/40">
            {carte.economies.toFixed(2).replace(".", ",")} € économisés depuis le début
          </p>
        )}

        {/* ─── Réservé au comptoir ─────────────────────────────── */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">
            Réservé au restaurant
          </p>
          <input
            type="password"
            value={mdp}
            onChange={(e) => setMdp(e.target.value)}
            placeholder="Mot de passe du mode restaurateur"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5
                       text-sm text-white placeholder:text-white/25 outline-none
                       focus:border-[#C4161C]"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => tamponner("ajouter")}
              disabled={occupe}
              className="flex-1 rounded-xl bg-[#C4161C] px-4 py-2.5 text-sm font-bold
                         text-white transition hover:brightness-110 disabled:opacity-40"
            >
              + Valider un menu
            </button>
            <button
              onClick={() => tamponner("retirer")}
              disabled={occupe}
              className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-bold text-white/60
                         hover:bg-white/10 disabled:opacity-40"
            >
              −
            </button>
          </div>
          {message && <p className="mt-2 text-[12px] text-white/70">{message}</p>}
          <p className="mt-2 text-[10px] leading-4 text-white/25">
            Le mot de passe reste sur cet appareil. Le client, lui, ne voit
            que sa progression.
          </p>
        </section>

        <Link
          href="/"
          className="mt-6 block text-center text-[12px] text-white/40 underline"
        >
          Commander sur faistonsdalle.com
        </Link>
      </div>
    </main>
  );
}
