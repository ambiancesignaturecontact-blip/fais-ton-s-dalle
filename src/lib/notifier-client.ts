// ─── Notifications client, étape par étape ────────────────────
//
// Ce qui n'allait pas : la route /api/push/expo savait envoyer un
// « notify_order », mais PERSONNE ne l'appelait. Concrètement, un
// client passait commande et n'entendait plus jamais parler de rien
// jusqu'à ce que le livreur sonne. Le suivi existait… dans l'app,
// à condition de penser à l'ouvrir.
//
// Maintenant chaque changement de statut déclenche la notification,
// directement depuis le serveur, sans appel HTTP à soi-même (un
// aller-retour de plus = un point de panne de plus).

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
import { lienAvisGoogle } from "./avis-google";
import { envoyerExpo } from "./expo-push";


export type StatutCommande =
  | "confirmed" | "preparing" | "ready" | "en-route"
  | "arrived" | "delivered" | "cancelled" | "modifiee";

/**
 * Textes des notifications.
 *
 * Vouvoiement : ce sont des messages clients. Les anciens textes
 * tutoyaient (« Ta commande est prête ») alors que toute l'app
 * vouvoie — ça se remarque immédiatement.
 */
export const ETAPES: Record<StatutCommande, { title: string; body: string }> = {
  confirmed: {
    title: "Commande confirmée ✅",
    body: "C'est validé, on s'y met tout de suite.",
  },
  preparing: {
    title: "En préparation 👨‍🍳",
    body: "Votre sandwich est en train d'être composé.",
  },
  ready: {
    title: "Votre commande est prête 🥖",
    body: "Elle part à l'instant.",
  },
  "en-route": {
    title: "En route 🛵",
    body: "Votre livreur vient de partir. Suivez-le en direct dans l'app.",
  },
  arrived: {
    title: "Votre livreur est arrivé 🛵",
    body: "Il vous attend en bas. Préparez votre code de livraison !",
  },
  delivered: {
    title: "Bon appétit ! 🎉",
    // On envoie directement sur Google : c'est la fiche Google qui
    // fait venir de nouveaux clients, pas notre base interne.
    body: "Merci ! Un avis Google de 10 secondes nous aide énormément 🙏",
  },
  modifiee: {
    title: "Commande modifiée ✏️",
    body: "Le restaurant a ajusté votre commande. Le nouveau montant est dans l'app.",
  },
  cancelled: {
    title: "Commande annulée",
    body: "Appelez-nous au 06 72 04 48 75, on vous explique.",
  },
};

/** Étapes assez urgentes pour percer un mode Concentration iOS */
const URGENTES: StatutCommande[] = ["ready", "en-route", "arrived"];

function estStatut(v: string): v is StatutCommande {
  return Object.prototype.hasOwnProperty.call(ETAPES, v);
}

/**
 * Prévient le client d'un changement d'étape.
 *
 * Ne lève jamais : une notification qui échoue ne doit pas empêcher
 * une commande d'avancer. Renvoie le nombre d'appareils touchés.
 */
export async function notifierClient(
  orderUuid: string,
  statut: string
): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return 0;
  if (!orderUuid || !estStatut(statut)) return 0;

  const etape = ETAPES[statut];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/expo_push_tokens` +
        `?order_uuid=eq.${encodeURIComponent(orderUuid)}&select=token&limit=10`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return 0;

    const tokens = ((await res.json()) as Array<{ token: string }>)
      .map((r) => r.token)
      .filter((t) => typeof t === "string" && t.startsWith("Expo"));

    if (!tokens.length) return 0;

    const messages = tokens.map((to) => ({
      to,
      sound: "default",
      channelId: "commandes",
      priority: "high",
      // iOS 15+ : traverse « Ne pas déranger » pour les étapes où le
      // client doit vraiment réagir (le livreur est en bas).
      ...(URGENTES.includes(statut) ? { interruptionLevel: "time-sensitive" } : {}),
      title: etape.title,
      body: etape.body,
      // Où atterrit le client quand il appuie sur la notification.
      // Pour « livré », on l'emmène droit sur la fiche Google : le
      // détour par l'avis interne faisait perdre 90 % des gens.
      data:
        statut === "delivered"
          ? {
              url: lienAvisGoogle(),
              externe: true,
              uuid: orderUuid,
              status: statut,
            }
          : { url: `/order/${orderUuid}`, uuid: orderUuid, status: statut },
    }));

    const bilan = await envoyerExpo(messages);
    return bilan.sent;
  } catch {
    return 0;
  }
}

/** Retrouve l'uuid d'une commande à partir de son id numérique */
export async function uuidDeCommande(orderId: number): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=uuid&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const [row] = (await res.json()) as Array<{ uuid?: string }>;
    return row?.uuid ?? null;
  } catch {
    return null;
  }
}


// ─── Côté maison : cuisine et livreurs ────────────────────────
//
// 🔴 La route « notify_new_order » existait… sans aucun appelant.
// La cuisine ne découvrait une commande qu'au rafraîchissement de
// l'écran, et les livreurs devaient surveiller l'app à la main.

export async function notifierEquipe(params: {
  orderId: number | string;
  total: number;
  mode: string;
  /** Code du livreur à viser en priorité (commande assignée) */
  driverCode?: string | null;
}): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return 0;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/expo_push_tokens` +
        `?audience=in.(admin,driver)&select=token,audience,driver_code`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return 0;

    const rows = (await res.json()) as Array<{
      token: string; audience: string; driver_code: string | null;
    }>;

    const livraison = params.mode === "livraison";
    const messages = rows
      // Une commande à emporter ne concerne pas les livreurs :
      // les réveiller pour rien, c'est le meilleur moyen qu'ils
      // coupent les notifications.
      .filter((r) => r.audience === "admin" || livraison)
      .filter((r) => typeof r.token === "string" && r.token.startsWith("Expo"))
      .map((r) => ({
        to: r.token,
        sound: "default",
        channelId: r.audience === "admin" ? "commandes" : "livreur",
        priority: "high",
        interruptionLevel: "time-sensitive",
        title: r.audience === "admin" ? "🛎️ Nouvelle commande" : "🛵 Commande à livrer",
        body:
          `#${params.orderId} · ${Number(params.total).toFixed(2)} € · ` +
          (livraison ? "Livraison" : "À emporter"),
        data: {
          url: r.audience === "admin" ? "/admin" : "/livreur",
          orderId: params.orderId,
          type: "new_order",
        },
      }));

    if (!messages.length) return 0;

    const bilan = await envoyerExpo(messages);
    return bilan.sent;
  } catch {
    return 0;
  }
}

// ─── Suivi des livraisons, côté patron ─────────────────────────
//
// Demandé le 01/10/2026 : « moi recevoir notif commande quand ya
// livraison ». Jusqu'ici l'admin n'était prévenu QUE de l'arrivée
// d'une nouvelle commande. Une fois le livreur parti, plus rien :
// impossible de savoir si la course avait été prise, si le client
// était absent, ou si la tournée était finie — sauf à rouvrir
// l'admin toutes les cinq minutes.
//
// Les étapes retenues sont celles où il y a quelque chose à faire
// ou à savoir. On ne notifie PAS « en route » : elle tombe deux
// secondes après « course prise », ce serait du bruit.

export type EtapeLivraison = "prise" | "arrive" | "livree" | "incident";

const ETAPES_ADMIN: Record<EtapeLivraison, string> = {
  prise: "🛵 Course prise",
  arrive: "📍 Livreur arrivé chez le client",
  livree: "✅ Commande livrée",
  incident: "⚠️ Incident de livraison",
};

/**
 * Prévient les téléphones du restaurant (audience « admin »).
 * Ne lève jamais : une notification ratée ne doit pas empêcher un
 * livreur de valider sa course.
 */
export async function notifierAdmins(
  etape: EtapeLivraison,
  corps: string,
  donnees: Record<string, unknown> = {}
): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return 0;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/expo_push_tokens?audience=eq.admin&select=token`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return 0;

    const tokens = ((await res.json()) as Array<{ token: string }>)
      .map((r) => r.token)
      .filter((t) => typeof t === "string" && t.startsWith("Expo"));
    if (!tokens.length) return 0;

    const bilan = await envoyerExpo(
      tokens.map((to) => ({
        to,
        sound: "default",
        channelId: "commandes",
        priority: "high",
        // Un incident réveille même en mode Concentration : il y a
        // un client qui attend et une commande à récupérer.
        ...(etape === "incident" ? { interruptionLevel: "time-sensitive" } : {}),
        title: ETAPES_ADMIN[etape],
        body: corps,
        data: { url: "/admin", type: "livraison", etape, ...donnees },
      }))
    );
    return bilan.sent;
  } catch {
    return 0;
  }
}

/** « #42 · 15,90 € · 2,00 € de pourboire » */
export function resumeCommande(o: {
  id?: number | string;
  total?: number | string;
  tip?: number | string;
  customer_name?: string | null;
}): string {
  const euro = (n: unknown) => `${Number(n ?? 0).toFixed(2).replace(".", ",")} €`;
  const bouts = [`#${o.id ?? "?"}`, euro(o.total)];
  if (Number(o.tip ?? 0) > 0) bouts.push(`${euro(o.tip)} de pourboire 🎉`);
  if (o.customer_name) bouts.push(String(o.customer_name));
  return bouts.join(" · ");
}
