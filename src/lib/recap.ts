// ─── Récapitulatif de fin de service ──────────────────────────
//
// Chaque soir à minuit, l'équipe reçoit en notification le bilan
// du service : chiffre d'affaires, nombre de commandes, pourboires
// à reverser, et surtout les ingrédients à racheter avant demain.
//
// Avant, il fallait ouvrir l'admin et additionner à la main — donc
// personne ne le faisait, et on s'apercevait d'une rupture le
// lendemain à 12 h 15, en plein coup de feu.
//
// ─── Déclenchement ─────────────────────────────────────────────
// Vercel Cron (voir vercel.json) appelle cette route à 22 h 05 ET
// 23 h 05 UTC. Pourquoi deux fois : les crons Vercel sont en UTC
// et ignorent l'heure d'été. La route ne fait quelque chose que
// s'il est réellement entre minuit et 1 h à Paris — l'autre appel
// ressort immédiatement sans rien envoyer.
//
// Accessible aussi à la main depuis l'admin (X-Admin-Auth), pour
// consulter le bilan à tout moment de la journée.


const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function sb(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  });
}

/** Heure qu'il est à Paris, quelle que soit l'heure du serveur. */
export function heureParis(d = new Date()): number {
  // ⚠️ Piège : en français, `format()` d'une heure seule rend
  // « 16 h » — et Number("16 h") vaut NaN. Le test de minuit
  // n'était donc JAMAIS vrai et le récapitulatif n'aurait jamais
  // été envoyé. On lit la partie « hour », pas la chaîne formatée.
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "";
  const n = Number(h);
  return Number.isFinite(n) ? n % 24 : -1;
}

/**
 * Début du service en cours, en UTC.
 *
 * Le service va de 11 h 30 à minuit : à 00 h 05, les commandes du
 * service qui vient de finir portent la date de la VEILLE. On
 * remonte donc au dernier 04 h 00 parisien écoulé — jamais de
 * commande à cette heure-là, c'est une coupure sûre.
 */
export function debutDuService(maintenant = new Date()): Date {
  // ⚠️ On raisonne sur la date PARISIENNE, pas la date UTC.
  //
  // À 00 h 30 à Paris le 17 juillet, il est encore le 16 en UTC
  // (22 h 30 Z). Retirer un jour à la date UTC renvoyait au 15 :
  // le récapitulatif aurait compté DEUX services au lieu d'un.
  const p = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(maintenant);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);

  const d = new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
  if (heureParis(maintenant) < 4) d.setUTCDate(d.getUTCDate() - 1);

  // 04 h 00 à Paris = 02 h 00 UTC l'été, 03 h 00 l'hiver.
  // On prend large (01 h 00 UTC) : la coupure reste en pleine nuit,
  // bien après la fermeture et bien avant l'ouverture.
  d.setUTCHours(1, 0, 0, 0);
  return d;
}

export interface Recap {
  periode: string;
  commandes: number;
  ca: number;
  panierMoyen: number;
  pourboires: number;
  livraisons: number;
  emportees: number;
  annulees: number;
  remboursements: number;
  ruptures: string[];
  topProduits: { nom: string; n: number }[];
}

export async function construireRecap(): Promise<Recap> {
  const depuis = debutDuService();

  const commandes = (await sb(
    `orders?created_at=gte.${depuis.toISOString()}` +
      `&select=id,total,tip,mode,status,refunded_amount,created_at`
  ).then((r) => (r.ok ? r.json() : []))) as Array<{
    total?: number;
    tip?: number;
    mode?: string;
    status?: string;
    refunded_amount?: number;
  }>;

  const valides = commandes.filter((o) => o.status !== "cancelled");
  const somme = (f: (o: (typeof commandes)[number]) => number) =>
    Math.round(valides.reduce((t, o) => t + (f(o) || 0), 0) * 100) / 100;

  const ca = somme((o) => Number(o.total ?? 0));
  const pourboires = somme((o) => Number(o.tip ?? 0));

  const stock = (await sb(
    "stock?select=item_name,quantity,unlimited"
  ).then((r) => (r.ok ? r.json() : []))) as Array<{
    item_name: string;
    quantity: number;
    unlimited: boolean;
  }>;

  return {
    periode: depuis.toISOString(),
    commandes: valides.length,
    ca,
    panierMoyen: valides.length
      ? Math.round((ca / valides.length) * 100) / 100
      : 0,
    pourboires,
    livraisons: valides.filter((o) => o.mode === "livraison").length,
    emportees: valides.filter((o) => o.mode !== "livraison").length,
    annulees: commandes.length - valides.length,
    remboursements: somme((o) => Number(o.refunded_amount ?? 0)),
    ruptures: stock
      .filter((s) => !s.unlimited && Number(s.quantity) <= 0)
      .map((s) => s.item_name)
      .sort(),
    topProduits: [],
  };
}

/** Le texte lu sur l'écran verrouillé : court, chiffré, actionnable. */
export function texteRecap(r: Recap): { title: string; body: string } {
  const euros = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

  if (r.commandes === 0) {
    return {
      title: "Service terminé — aucune commande",
      body:
        r.ruptures.length > 0
          ? `À racheter : ${r.ruptures.join(", ")}.`
          : "Rien à signaler, tout est en stock.",
    };
  }

  const morceaux = [
    `${euros(r.ca)} · ${r.commandes} commande${r.commandes > 1 ? "s" : ""}`,
    `panier moyen ${euros(r.panierMoyen)}`,
  ];
  if (r.pourboires > 0) morceaux.push(`${euros(r.pourboires)} de pourboires`);
  if (r.annulees > 0) morceaux.push(`${r.annulees} annulée${r.annulees > 1 ? "s" : ""}`);
  if (r.remboursements > 0) morceaux.push(`${euros(r.remboursements)} remboursés`);

  return {
    title: `📊 Service terminé — ${euros(r.ca)}`,
    body:
      morceaux.join(" · ") +
      (r.ruptures.length
        ? `\n⚠️ À racheter : ${r.ruptures.join(", ")}.`
        : "\n✅ Aucune rupture."),
  };
}

