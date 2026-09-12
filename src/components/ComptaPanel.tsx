"use client";

// ─── Onglet « Compta » de l'admin du site ──────────────────────
//
// Mêmes chiffres que l'application : ils viennent des mêmes vues
// SQL, donc aucun risque de voir deux totaux différents selon
// l'écran consulté.
//
// Le siège compare ses établissements ; un gérant ne voit que le
// sien — c'est le serveur qui l'impose, pas seulement l'affichage.
//
// À brancher :  <ComptaPanel adminPassword={password} />

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Total {
  commandes: number; caTtc: number; caHt: number; tva: number;
  fraisLivraison: number; pourboires: number;
  aEncaisser: number; panierMoyen: number;
}
interface Jour {
  franchise_id: number; franchise: string; jour: string;
  commandes: number; livraisons: number; emporter: number;
  ca_ttc: number; ca_ht: number; tva: number;
  frais_livraison: number; pourboires: number;
  payees_en_ligne: number; a_encaisser: number; panier_moyen: number;
}
interface Mois {
  franchise_id: number; franchise: string; mois: string;
  commandes: number; ca_ttc: number; ca_ht: number; tva: number;
  pourboires: number; redevance_siege: number; panier_moyen: number;
}
interface Produit {
  franchise_id: number; item_name: string;
  lignes: number; quantite: number; ca_ttc: number;
}
interface Livreur {
  franchise_id: number; driver_id: number; livreur: string; code: string;
  jour: string; courses: number; pourboires: number; ca_transporte: number;
}
interface Local { id: number; name: string; city: string | null }

const PERIODES = [7, 30, 90];

const eur = (v: unknown) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    .format(Number(v ?? 0));

export default function ComptaPanel({ adminPassword }: { adminPassword: string }) {
  const [days, setDays] = useState(30);
  const [filtre, setFiltre] = useState<number | null>(null);
  const [siege, setSiege] = useState(false);
  const [locaux, setLocaux] = useState<Local[]>([]);

  const [total, setTotal] = useState<Total | null>(null);
  const [jours, setJours] = useState<Jour[]>([]);
  const [mois, setMois] = useState<Mois[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!adminPassword) { setError("Session admin expirée"); setBusy(false); return; }
    setBusy(true);
    try {
      const q = filtre ? `&franchise=${filtre}` : "";
      const [rc, rf] = await Promise.all([
        fetch(`/api/compta?days=${days}${q}`, {
          headers: { "X-Admin-Auth": adminPassword }, cache: "no-store",
        }),
        fetch("/api/franchises", {
          headers: { "X-Admin-Auth": adminPassword }, cache: "no-store",
        }),
      ]);

      if (!rc.ok) {
        const msg = rc.status === 401
          ? "Mot de passe admin refusé — reconnectez-vous"
          : rc.status === 404
          ? "Route /api/compta non déployée"
          : `Erreur ${rc.status}`;
        setError(msg);
        return;
      }
      const c = await rc.json();
      setError(null);
      setSiege(Boolean(c.siege));
      setTotal(c.total ?? null);
      setJours(c.jours ?? []);
      setMois(c.mois ?? []);
      setProduits(c.produits ?? []);
      setLivreurs(c.livreurs ?? []);

      if (rf.ok) {
        const f = await rf.json();
        setLocaux(f.franchises ?? []);
      }
    } catch {
      setError("Réseau indisponible");
    } finally {
      setBusy(false);
    }
  }, [adminPassword, days, filtre]);

  useEffect(() => { charger(); }, [charger]);

  const exporter = () => {
    const q = filtre ? `&franchise=${filtre}` : "";
    // Le téléchargement passe par un lien : l'en-tête d'authentification
    // ne peut pas voyager ainsi, on ouvre donc un onglet et le serveur
    // vérifiera la session. À défaut, on copie l'URL.
    const url = `/api/compta?days=${days}${q}&format=csv`;
    fetch(url, { headers: { "X-Admin-Auth": adminPassword } })
      .then((r) => r.blob())
      .then((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `compta-${days}j.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Export téléchargé");
      })
      .catch(() => toast.error("Export impossible"));
  };

  if (busy && !total) {
    return <div className="py-10 text-center text-sm opacity-60">Chargement…</div>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div role="alert" className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
        <button onClick={charger} className="min-h-[44px] rounded-lg bg-white/10 px-4 text-sm font-bold">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Période */}
      <div className="flex gap-2">
        {PERIODES.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            aria-pressed={days === d}
            className={`min-h-[40px] flex-1 rounded-lg text-xs font-bold ${
              days === d ? "bg-brand-red text-white" : "bg-white/5 text-white/60"
            }`}
          >
            {d} jours
          </button>
        ))}
        <button
          onClick={exporter}
          className="min-h-[40px] rounded-lg bg-emerald-600 px-4 text-xs font-bold"
        >
          Export CSV
        </button>
      </div>

      {/* Établissements — siège uniquement */}
      {siege && locaux.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltre(null)}
            aria-pressed={filtre === null}
            className={`min-h-[36px] rounded-full px-4 text-xs font-bold ${
              filtre === null ? "bg-brand-red text-white" : "bg-white/5 text-white/60"
            }`}
          >
            Tous
          </button>
          {locaux.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              aria-pressed={filtre === f.id}
              className={`min-h-[36px] rounded-full px-4 text-xs font-bold ${
                filtre === f.id ? "bg-brand-red text-white" : "bg-white/5 text-white/60"
              }`}
            >
              {f.city ?? f.name}
            </button>
          ))}
        </div>
      )}

      {/* Totaux */}
      {total && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Kpi label="Chiffre d'affaires TTC" value={eur(total.caTtc)} fort />
          <Kpi label="Commandes" value={String(total.commandes)} />
          <Kpi label="Panier moyen" value={eur(total.panierMoyen)} />
          <Kpi label="Hors taxes" value={eur(total.caHt)} />
          <Kpi label="TVA 10 %" value={eur(total.tva)} />
          <Kpi label="Pourboires livreurs" value={eur(total.pourboires)} />
        </div>
      )}

      {total && total.aEncaisser > 0 && (
        <div className="rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          {total.aEncaisser} commande{total.aEncaisser > 1 ? "s" : ""} réglée
          {total.aEncaisser > 1 ? "s" : ""} en espèces sur la période
        </div>
      )}

      {/* Jour par jour */}
      <Section titre="Jour par jour" />
      {jours.length === 0 ? (
        <p className="text-sm opacity-50">Aucune commande livrée sur la période.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white/5">
          <table className="w-full text-left text-xs">
            <thead className="text-white/40">
              <tr>
                <th className="px-3 py-2">Date</th>
                {siege && !filtre && <th className="px-3 py-2">Établissement</th>}
                <th className="px-3 py-2">Cmd</th>
                <th className="px-3 py-2">CA TTC</th>
                <th className="px-3 py-2">HT</th>
                <th className="px-3 py-2">TVA</th>
                <th className="px-3 py-2">Espèces</th>
              </tr>
            </thead>
            <tbody>
              {jours.slice(0, 30).map((j) => (
                <tr key={`${j.franchise_id}-${j.jour}`} className="border-t border-white/5">
                  <td className="px-3 py-2">
                    {new Date(j.jour).toLocaleDateString("fr-FR", {
                      weekday: "short", day: "numeric", month: "short",
                    })}
                  </td>
                  {siege && !filtre && <td className="px-3 py-2 opacity-70">{j.franchise}</td>}
                  <td className="px-3 py-2">{j.commandes}</td>
                  <td className="px-3 py-2 font-bold">{eur(j.ca_ttc)}</td>
                  <td className="px-3 py-2 opacity-70">{eur(j.ca_ht)}</td>
                  <td className="px-3 py-2 opacity-70">{eur(j.tva)}</td>
                  <td className="px-3 py-2">{j.a_encaisser || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mois */}
      {mois.length > 0 && (
        <>
          <Section titre="Par mois" />
          <div className="overflow-x-auto rounded-xl bg-white/5">
            <table className="w-full text-left text-xs">
              <thead className="text-white/40">
                <tr>
                  <th className="px-3 py-2">Mois</th>
                  {siege && !filtre && <th className="px-3 py-2">Établissement</th>}
                  <th className="px-3 py-2">Cmd</th>
                  <th className="px-3 py-2">CA TTC</th>
                  <th className="px-3 py-2">HT</th>
                  <th className="px-3 py-2">Redevance</th>
                </tr>
              </thead>
              <tbody>
                {mois.slice(0, 12).map((m) => (
                  <tr key={`${m.franchise_id}-${m.mois}`} className="border-t border-white/5">
                    <td className="px-3 py-2">
                      {new Date(m.mois).toLocaleDateString("fr-FR", {
                        month: "long", year: "numeric",
                      })}
                    </td>
                    {siege && !filtre && <td className="px-3 py-2 opacity-70">{m.franchise}</td>}
                    <td className="px-3 py-2">{m.commandes}</td>
                    <td className="px-3 py-2 font-bold">{eur(m.ca_ttc)}</td>
                    <td className="px-3 py-2 opacity-70">{eur(m.ca_ht)}</td>
                    <td className="px-3 py-2 text-orange-400">
                      {Number(m.redevance_siege) > 0 ? eur(m.redevance_siege) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Produits */}
      {produits.length > 0 && (
        <>
          <Section titre="Ce qui se vend le mieux" />
          <div className="rounded-xl bg-white/5">
            {produits.slice(0, 12).map((p, i) => (
              <div
                key={`${p.franchise_id}-${p.item_name}`}
                className={`flex items-center gap-3 px-3 py-2 text-xs ${
                  i > 0 ? "border-t border-white/5" : ""
                }`}
              >
                <span className="flex-1 truncate">{p.item_name}</span>
                <span className="opacity-60">×{p.quantite}</span>
                <span className="font-bold">{eur(p.ca_ttc)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Livreurs */}
      {livreurs.length > 0 && (
        <>
          <Section titre="Activité des livreurs" />
          <div className="rounded-xl bg-white/5">
            {livreurs.slice(0, 12).map((l, i) => (
              <div
                key={`${l.driver_id}-${l.jour}`}
                className={`flex items-center gap-3 px-3 py-2 text-xs ${
                  i > 0 ? "border-t border-white/5" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="font-bold">{l.livreur} · {l.code}</div>
                  <div className="opacity-50">
                    {new Date(l.jour).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short",
                    })} · {l.courses} course{l.courses > 1 ? "s" : ""}
                  </div>
                </div>
                <span className="font-bold">{eur(l.ca_transporte)}</span>
                {Number(l.pourboires) > 0 && (
                  <span className="text-emerald-400">+{eur(l.pourboires)}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-[11px] leading-relaxed opacity-50">
        Chiffres calculés sur les commandes livrées. TVA 10 % applicable à
        la vente à emporter et à la livraison. Les pourboires sont reversés
        intégralement aux livreurs et n&apos;entrent pas dans le chiffre
        d&apos;affaires imposable.
      </p>
    </div>
  );
}

function Kpi({ label, value, fort }: { label: string; value: string; fort?: boolean }) {
  return (
    <div className={`rounded-xl bg-white/5 p-3 ${fort ? "col-span-2 sm:col-span-1" : ""}`}>
      <div className={`font-black ${fort ? "text-xl text-orange-400" : "text-base"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] opacity-50">{label}</div>
    </div>
  );
}

function Section({ titre }: { titre: string }) {
  return <h3 className="mt-2 text-sm font-bold">{titre}</h3>;
}
