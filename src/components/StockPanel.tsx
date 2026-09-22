"use client";

// ─── Écran « Stock » de l'admin du site ────────────────────────
//
// Remplace l'ancien panneau. Ce qu'il corrige :
//
//  • l'ancien appelait saveStock(state) SANS mot de passe → chaque
//    PATCH repartait en 401, l'erreur était avalée, et le message
//    « Stock mis à jour ✅ » s'affichait quand même. Le patron
//    croyait avoir signalé une rupture : rien n'était enregistré et
//    l'application mobile n'en voyait évidemment rien.
//
//  • il n'affichait jamais d'erreur. Ici, un échec est visible et
//    l'état est rechargé depuis le serveur après enregistrement :
//    on montre ce qui est réellement en base, pas ce qu'on espérait.
//
//  • rafraîchissement automatique toutes les 20 s, pour que deux
//    postes (téléphone du patron + caisse) ne se contredisent pas.
//
// Le composant reçoit le mot de passe admin déjà saisi à la
// connexion : <StockPanel adminPassword={password} />

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  STOCK_CATEGORIES,
  getDefaultStock,
  getStock,
  saveStock,
  resetStock,
  type Stock,
} from "@/lib/stock";

export default function StockPanel({ adminPassword }: { adminPassword: string }) {
  const [stock, setStock] = useState<Stock>(getDefaultStock());
  const [serverStock, setServerStock] = useState<Stock | null>(null);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);

  const load = useCallback(async () => {
    const s = await getStock(true);
    setServerStock(s);
    setSyncedAt(new Date());
    // On n'écrase jamais une saisie en cours
    if (!dirtyRef.current) setStock(s);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const update = (name: string, patch: Partial<Stock[string]>) => {
    setStock((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));
    setDirty(true);
    setError(null);
  };

  const onSave = async () => {
    if (!adminPassword) {
      setError("Session admin expirée — reconnectez-vous");
      return;
    }
    setSaving(true);
    setError(null);
    const r = await saveStock(stock, adminPassword, serverStock);
    setSaving(false);

    if (!r.ok) {
      // Plus jamais de faux « ✅ » : l'échec est affiché tel quel
      setError(r.error ?? "Enregistrement impossible");
      toast.error(r.error ?? "Enregistrement impossible");
      return;
    }
    if (r.changed === 0) {
      toast("Aucune modification");
    } else {
      toast.success(
        `${r.changed} article${r.changed > 1 ? "s" : ""} mis à jour — visible dans l'app`
      );
    }
    setDirty(false);
    await load();
  };

  const onReset = async () => {
    if (!confirm("Tout remettre en disponible ?")) return;
    setSaving(true);
    const r = await resetStock(adminPassword);
    setSaving(false);
    if (!r.ok) { setError(r.error ?? "Échec"); toast.error(r.error ?? "Échec"); return; }
    setDirty(false);
    await load();
    toast.success("Stock réinitialisé");
  };

  const q = search.trim().toLowerCase();
  const cats = STOCK_CATEGORIES
    .map((c) => ({
      ...c,
      items: c.items.filter(
        (i) => !q || i.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
      ),
    }))
    .filter((c) => c.items.length > 0);

  const epuises = Object.entries(stock).filter(
    ([, c]) => c && !c.unlimited && c.quantity <= 0
  ).length;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm">
          <span className="font-bold">{epuises}</span> article
          {epuises > 1 ? "s" : ""} en rupture
        </div>
        <div className="text-xs opacity-60">
          {syncedAt
            ? `Synchronisé à ${syncedAt.toLocaleTimeString("fr-FR")}`
            : "Chargement…"}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un article"
          className="ml-auto rounded-lg bg-black/30 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {/* Articles */}
      {cats.map((cat) => (
        <section key={cat.key} className="rounded-xl bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide opacity-70">
            {cat.label}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((name) => {
              const cell = stock[name] ?? { quantity: 999, unlimited: true };
              const soldOut = !cell.unlimited && cell.quantity <= 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    update(
                      name,
                      soldOut
                        ? { quantity: 999, unlimited: true }
                        : { quantity: 0, unlimited: false }
                    )
                  }
                  aria-pressed={soldOut}
                  aria-label={`${name} — ${soldOut ? "épuisé" : "disponible"}, appuyer pour changer`}
                  className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    soldOut
                      ? "bg-red-500/20 text-red-300 line-through"
                      : "bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  <span>{name}</span>
                  <span className="text-xs font-bold">
                    {soldOut ? "ÉPUISÉ" : "OK"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Actions */}
      <div className="sticky bottom-0 flex gap-2 bg-black/80 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving}
          className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 font-bold disabled:opacity-40"
        >
          {saving ? "Enregistrement…" : dirty ? "Enregistrer" : "À jour"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="min-h-[48px] rounded-xl bg-white/10 px-4 text-sm disabled:opacity-40"
        >
          Tout remettre
        </button>
      </div>
    </div>
  );
}
