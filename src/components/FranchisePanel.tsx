"use client";

// ─── Onglet « Établissements » de l'admin du site ──────────────
//
// Ouvrir un local crée automatiquement son catalogue (les 53
// articles) et reprend les horaires d'un établissement modèle.
//
// Chaque local reçoit son propre code d'accès. Avec ce code, le
// gérant ne voit QUE son établissement : stock, commandes,
// livreurs, comptabilité. Le cloisonnement est appliqué par le
// serveur, pas seulement masqué à l'écran.
//
// À brancher :  <FranchisePanel adminPassword={password} />

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Franchise {
  id: number;
  slug: string;
  name: string;
  address: string;
  city: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  royalty_pct: number | null;
  active: boolean;
}

interface Driver {
  id: number;
  name: string;
  code: string;
  franchise_id?: number;
  active?: boolean;
}

export default function FranchisePanel({ adminPassword }: { adminPassword: string }) {
  const [locaux, setLocaux] = useState<Franchise[]>([]);
  const [livreurs, setLivreurs] = useState<Driver[]>([]);
  const [siege, setSiege] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ouvrir, setOuvrir] = useState(false);

  const [f, setF] = useState({
    nom: "", slug: "", adresse: "", ville: "", cp: "",
    tel: "", lat: "", lng: "", pin: "", redevance: "0",
  });
  const [envoi, setEnvoi] = useState(false);

  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const charger = useCallback(async () => {
    if (!adminPassword) { setError("Session admin expirée"); setBusy(false); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/franchises", {
        headers: { "X-Admin-Auth": adminPassword }, cache: "no-store",
      });
      if (!r.ok) {
        setError(
          r.status === 401 ? "Mot de passe admin refusé — reconnectez-vous"
          : r.status === 404 ? "Route /api/franchises non déployée"
          : `Erreur ${r.status}`
        );
        return;
      }
      const j = await r.json();
      setError(null);
      setSiege(Boolean(j.siege));
      setLocaux(j.franchises ?? []);

      // Livreurs, pour la réaffectation entre établissements
      const rd = await fetch("/api/driver", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Auth": adminPassword },
        body: JSON.stringify({ action: "list_drivers" }),
      });
      if (rd.ok) {
        const d = await rd.json();
        setLivreurs(d.drivers ?? []);
      }
    } catch {
      setError("Réseau indisponible");
    } finally {
      setBusy(false);
    }
  }, [adminPassword]);

  useEffect(() => { charger(); }, [charger]);

  const creer = async () => {
    if (!f.nom.trim() || !f.adresse.trim()) {
      setError("Le nom et l'adresse sont obligatoires");
      return;
    }
    if (f.pin.trim().length < 8) {
      setError("Le code d'accès du local doit faire au moins 8 caractères");
      return;
    }
    if (!f.lat || !f.lng) {
      setError(
        "Les coordonnées sont indispensables : sans elles, aucun client " +
        "ne sera dirigé vers ce local."
      );
      return;
    }

    setEnvoi(true);
    try {
      const r = await fetch("/api/franchises", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Auth": adminPassword },
        body: JSON.stringify({
          slug: f.slug.trim() || f.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24),
          name: f.nom.trim(),
          address: f.adresse.trim(),
          city: f.ville.trim() || undefined,
          postcode: f.cp.trim() || undefined,
          phone: f.tel.trim() || undefined,
          lat: Number(f.lat), lng: Number(f.lng),
          adminPin: f.pin.trim(),
          royaltyPct: Number(f.redevance) || 0,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setError(j?.error ?? `Erreur ${r.status}`);
        return;
      }
      toast.success("Établissement ouvert");
      window.alert(
        `${f.nom}\n\n${j?.init || "Catalogue copié."}\n\n` +
        `Code d'accès : ${f.pin}\n\n` +
        "Notez-le : il ne sera plus affiché. Communiquez-le au gérant, " +
        "il lui donne accès à son local uniquement."
      );
      setOuvrir(false);
      setF({ nom: "", slug: "", adresse: "", ville: "", cp: "", tel: "", lat: "", lng: "", pin: "", redevance: "0" });
      charger();
    } catch {
      setError("Réseau indisponible");
    } finally {
      setEnvoi(false);
    }
  };

  const basculer = async (fr: Franchise) => {
    const r = await fetch("/api/franchises", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Admin-Auth": adminPassword },
      body: JSON.stringify({ id: fr.id, active: !fr.active }),
    });
    if (!r.ok) { toast.error("Action impossible"); return; }
    charger();
  };

  const deplacer = async (driverId: number, franchiseId: number) => {
    const r = await fetch("/api/driver", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Auth": adminPassword },
      body: JSON.stringify({ action: "move_driver", driverId, franchiseId }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      toast.error(j?.error ?? "Déplacement impossible");
      return;
    }
    toast.success("Livreur réaffecté — ses sessions ont été fermées");
    charger();
  };

  if (busy && !locaux.length) {
    return <div className="py-10 text-center text-sm opacity-60">Chargement…</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {!siege && (
        <div className="rounded-lg bg-white/5 px-3 py-2 text-xs leading-relaxed opacity-70">
          Vous êtes connecté à votre établissement. Le stock, les horaires,
          les livreurs et la comptabilité affichés ne concernent que ce local.
        </div>
      )}

      {/* Établissements */}
      {locaux.map((fr) => (
        <div key={fr.id} className="rounded-xl bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-bold">{fr.name}</div>
              <div className="text-[11px] opacity-40">#{fr.slug}</div>
            </div>
            {siege && (
              <button
                onClick={() => basculer(fr)}
                aria-pressed={fr.active}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-bold ${
                  fr.active ? "bg-emerald-600 text-white" : "bg-white/10 text-white/50"
                }`}
              >
                {fr.active ? "Ouvert" : "Fermé"}
              </button>
            )}
          </div>

          <div className="mt-2 space-y-1 text-xs opacity-70">
            <div>📍 {fr.address}{fr.city ? `, ${fr.postcode ?? ""} ${fr.city}` : ""}</div>
            {!!fr.phone && <div>📞 {fr.phone}</div>}
            {fr.lat == null && (
              <div className="text-red-400">
                ⚠️ Coordonnées manquantes : aucun client ne sera dirigé ici.
              </div>
            )}
            {siege && Number(fr.royalty_pct) > 0 && (
              <div className="text-orange-400">
                Redevance siège : {fr.royalty_pct} % du chiffre d&apos;affaires HT
              </div>
            )}
          </div>

          {/* Livreurs de ce local */}
          {siege && livreurs.length > 0 && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide opacity-50">
                Livreurs
              </div>
              {livreurs
                .filter((d) => (d.franchise_id ?? 1) === fr.id)
                .map((d) => (
                  <div key={d.id} className="flex items-center gap-2 py-1 text-xs">
                    <span className="flex-1">{d.name} · {d.code}</span>
                    <select
                      value={fr.id}
                      onChange={(e) => deplacer(d.id, Number(e.target.value))}
                      aria-label={`Réaffecter ${d.name} à un autre établissement`}
                      className="rounded-md bg-black/40 px-2 py-1 text-xs"
                    >
                      {locaux.map((o) => (
                        <option key={o.id} value={o.id}>{o.city ?? o.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              {livreurs.filter((d) => (d.franchise_id ?? 1) === fr.id).length === 0 && (
                <div className="text-xs opacity-40">Aucun livreur rattaché.</div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Ouverture */}
      {siege && !ouvrir && (
        <button
          onClick={() => setOuvrir(true)}
          className="min-h-[48px] w-full rounded-xl bg-white/5 text-sm font-bold"
        >
          + Ouvrir un établissement
        </button>
      )}

      {siege && ouvrir && (
        <div className="space-y-2 rounded-xl bg-white/5 p-4">
          <h3 className="mb-2 font-bold">Nouvel établissement</h3>

          <Champ label="Nom" value={f.nom} onChange={maj("nom")}
            placeholder="FAIS TON S'DALLE — Bondy" />
          <Champ label="Identifiant court" value={f.slug} onChange={maj("slug")}
            placeholder="bondy" hint="Lettres et tirets. Généré si vide." />
          <Champ label="Adresse" value={f.adresse} onChange={maj("adresse")}
            placeholder="12 rue de Paris" />
          <div className="flex gap-2">
            <div className="w-28"><Champ label="Code postal" value={f.cp} onChange={maj("cp")} placeholder="93140" /></div>
            <div className="flex-1"><Champ label="Ville" value={f.ville} onChange={maj("ville")} placeholder="Bondy" /></div>
          </div>
          <Champ label="Téléphone" value={f.tel} onChange={maj("tel")} placeholder="06 00 00 00 00" />
          <div className="flex gap-2">
            <div className="flex-1"><Champ label="Latitude" value={f.lat} onChange={maj("lat")} placeholder="48.9025" /></div>
            <div className="flex-1"><Champ label="Longitude" value={f.lng} onChange={maj("lng")} placeholder="2.4839" /></div>
          </div>
          <p className="text-[11px] leading-relaxed opacity-50">
            Les coordonnées déterminent quel local sert quel client.
            Trouvez-les sur Google Maps : clic droit sur l&apos;adresse,
            les deux nombres s&apos;affichent en haut du menu.
          </p>
          <Champ label="Code d'accès du gérant" value={f.pin} onChange={maj("pin")}
            placeholder="8 caractères minimum"
            hint="Donne accès à CE local uniquement. Ne sera plus affiché ensuite." />
          <Champ label="Redevance siège (%)" value={f.redevance} onChange={maj("redevance")}
            placeholder="0" hint="Pourcentage du chiffre d'affaires hors taxes. 0 si aucune." />

          <p className="text-[11px] leading-relaxed opacity-60">
            Le catalogue des 53 articles et les horaires seront copiés depuis
            l&apos;établissement historique. Le nouveau local pourra ensuite
            les ajuster librement.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={creer}
              disabled={envoi}
              className="min-h-[46px] flex-1 rounded-xl bg-emerald-600 font-bold disabled:opacity-40"
            >
              {envoi ? "Ouverture…" : "Ouvrir l'établissement"}
            </button>
            <button
              onClick={() => { setOuvrir(false); setError(null); }}
              className="min-h-[46px] rounded-xl bg-white/10 px-4 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Champ({ label, value, onChange, placeholder, hint }: {
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold opacity-60">{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        className="min-h-[42px] w-full rounded-md bg-black/40 px-3 text-sm"
      />
      {!!hint && <p className="mt-1 text-[10px] leading-snug opacity-40">{hint}</p>}
    </div>
  );
}
