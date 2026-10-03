import { NextRequest, NextResponse } from "next/server";
import { ETAPES, notifierClient } from "@/lib/notifier-client";
import { envoyerExpo, MessageExpo } from "@/lib/expo-push";
import { estAdmin } from "@/lib/admin-auth";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;


export type Audience = "customer" | "admin" | "driver";

function sb(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

/**
 * Envoi groupé.
 *
 * Toute la mécanique (lots de 100, repli message par message quand
 * Expo refuse un lot mélangeant deux projets, purge des jetons
 * morts) vit dans `lib/expo-push.ts` — un seul chemin pour tout le
 * site.
 */
async function sendExpo(
  messages: Array<Record<string, unknown>>
): Promise<{ sent: number; errors: number }> {
  const { sent, errors } = await envoyerExpo(
    messages as unknown as MessageExpo[]
  );
  return { sent, errors };
}

/**
 * POST /api/push/expo
 *
 * Enregistrement d'un appareil :
 *   { action: "register", token, audience, deviceId?, orderUuid?, driverCode? }
 *
 * Envoi (admin uniquement, header X-Admin-Auth) :
 *   { action: "send", audience, title, body, data? }
 *   { action: "notify_order", orderUuid, status }   → prévient le client
 *   { action: "notify_new_order", orderId, total }  → prévient admin + livreurs
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action ?? "");
    const admin = request.headers.get("X-Admin-Auth");

    // ─── Enregistrement d'un jeton ──────────────────────────────
    if (action === "register") {
      const token = String(body?.token ?? "");
      const audience = String(body?.audience ?? "customer") as Audience;

      if (!/^ExponentPushToken\[.+\]$/.test(token) && !/^ExpoPushToken\[.+\]$/.test(token)) {
        return NextResponse.json({ error: "Jeton invalide" }, { status: 400 });
      }
      if (!["customer", "admin", "driver"].includes(audience)) {
        return NextResponse.json({ error: "Audience invalide" }, { status: 400 });
      }
      // Un jeton admin ou livreur doit être authentifié
      if (audience === "admin" && !(await estAdmin(admin))) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      // ─── Livreur : code OU jeton de session ─────────────────
      //
      // 🔴 Bug trouvé : l'application envoie ici le JETON DE SESSION
      // du livreur (c'est ce qu'elle a en mémoire), alors que le
      // serveur cherchait un CODE livreur (« LIV001 »). Aucune
      // correspondance → 401 → **aucun livreur n'était enregistré,
      // donc aucun livreur ne recevait de notification**.
      //
      // On accepte maintenant les deux, et on stocke toujours le
      // vrai code : c'est lui qui permet de viser le bon livreur.
      let codeLivreur: string | null = null;
      if (audience === "driver") {
        const brut = String(body?.driverCode ?? "").trim();
        if (!brut) {
          return NextResponse.json({ error: "Code livreur requis" }, { status: 401 });
        }

        const parCode = await sb(
          `drivers?code=eq.${encodeURIComponent(brut)}&active=eq.true&select=id,code&limit=1`
        ).then((r) => (r.ok ? r.json() : []));

        if (Array.isArray(parCode) && parCode.length) {
          codeLivreur = String(parCode[0].code);
        } else {
          const session = await sb(
            `driver_sessions?token=eq.${encodeURIComponent(brut)}&revoked=eq.false` +
              `&select=driver_id,expires_at&limit=1`
          ).then((r) => (r.ok ? r.json() : []));
          const s = Array.isArray(session) ? session[0] : null;
          if (s && new Date(s.expires_at).getTime() > Date.now()) {
            const d = await sb(
              `drivers?id=eq.${s.driver_id}&active=eq.true&select=code&limit=1`
            ).then((r) => (r.ok ? r.json() : []));
            if (Array.isArray(d) && d.length) codeLivreur = String(d[0].code);
          }
        }

        if (!codeLivreur) {
          return NextResponse.json({ error: "Session livreur invalide" }, { status: 401 });
        }
      }

      // ─── Ce qu'on écrit, et surtout ce qu'on n'écrase PAS ────
      //
      // 🔴 Bug : on écrivait `order_uuid: body.orderUuid ?? null`.
      // L'application réenregistre son jeton à chaque démarrage
      // (pour recevoir les offres même sans commande en cours) :
      // ce `null` effaçait le lien avec la commande EN COURS, et
      // le client cessait net de recevoir « votre livreur est
      // arrivé ». On ne touche à `order_uuid` que s'il est fourni.
      // ─── 🔴 Ne JAMAIS rétrograder un téléphone du restaurant ──
      //
      // L'application enregistre le jeton en « customer » à chaque
      // lancement (pour recevoir les annonces). Le téléphone du
      // patron, lui, est « admin » depuis qu'il a saisi le mot de
      // passe du mode restaurateur.
      //
      // Comme c'est le MÊME jeton, le lancement suivant écrasait
      // « admin » par « customer » : il aurait cessé de recevoir
      // les notifications de commande, sans aucun signe.
      //
      // Un enregistrement « customer » non authentifié ne peut donc
      // plus abaisser un jeton déjà admin ou livreur.
      let audienceFinale = audience;
      if (audience === "customer") {
        const existant = await sb(
          `expo_push_tokens?token=eq.${encodeURIComponent(token)}&select=audience&limit=1`
        ).then((r) => (r.ok ? r.json() : []));
        const avant = Array.isArray(existant) ? existant[0]?.audience : null;
        if (avant === "admin" || avant === "driver") audienceFinale = avant;
      }

      const ligne: Record<string, unknown> = {
        token,
        audience: audienceFinale,
        device_id: body?.deviceId ?? null,
        updated_at: new Date().toISOString(),
      };
      if (body?.orderUuid) ligne.order_uuid = String(body.orderUuid);
      if (codeLivreur) ligne.driver_code = codeLivreur;

      // ─── Consentement aux offres ─────────────────────────────
      // Le client a dit oui aux notifications : il devient
      // joignable pour les annonces (nouveau menu, promo du jour),
      // qu'il ait déjà commandé ou non. S'il refuse plus tard,
      // on repasse le drapeau à false — on ne supprime pas la
      // ligne, elle sert toujours au suivi de ses commandes.
      if (typeof body?.marketingOptin === "boolean") {
        ligne.marketing_optin = body.marketingOptin;
        ligne.optin_at = body.marketingOptin ? new Date().toISOString() : null;
      }

      const res = await sb("expo_push_tokens", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(ligne),
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Enregistrement impossible" }, { status: 502 });
      }
      return NextResponse.json({ success: true });
    }

    // ─── Notification du client suivant sa commande ─────────────
    if (action === "notify_order") {
      if (!(await estAdmin(admin))) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      const uuid = String(body?.orderUuid ?? "");
      const status = String(body?.status ?? "");

      // Textes centralisés : le même message part d'ici, de l'admin,
      // du livreur et du webhook Stripe. Plus de version qui tutoie
      // d'un côté et vouvoie de l'autre.
      if (!Object.prototype.hasOwnProperty.call(ETAPES, status)) {
        return NextResponse.json({ error: "Statut inconnu" }, { status: 400 });
      }
      const envoyes = await notifierClient(uuid, status);
      return NextResponse.json({ success: true, sent: envoyes, errors: 0 });
    }

    // ─── Nouvelle commande : alerter admin + livreurs ───────────
    if (action === "notify_new_order") {
      if (!(await estAdmin(admin))) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      const orderId = body?.orderId;
      const total = Number(body?.total ?? 0);
      const mode = String(body?.mode ?? "livraison");

      const rows = await sb(
        `expo_push_tokens?audience=in.(admin,driver)&select=token,audience`
      ).then((r) => (r.ok ? r.json() : []));

      const messages = (rows as Array<{ token: string; audience?: string }>).map((r) => ({
        to: r.token,
        sound: "default",
        title: r.audience === "admin" ? "🛎️ Nouvelle commande" : "🛵 Commande à livrer",
        body:
          r.audience === "admin"
            ? `#${orderId} · ${total.toFixed(2)} € · ${mode === "livraison" ? "Livraison" : "À emporter"}`
            : `#${orderId} · ${total.toFixed(2)} € · prête bientôt`,
        data: { url: r.audience === "admin" ? "/admin" : "/livreur", orderId },
        priority: "high",
      }));

      const result = await sendExpo(messages);
      return NextResponse.json({ success: true, ...result });
    }

    // ─── Envoi libre (admin) ────────────────────────────────────
    if (action === "send") {
      if (!(await estAdmin(admin))) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      const audience = String(body?.audience ?? "customer");
      const title = String(body?.title ?? "").slice(0, 100);
      const text = String(body?.body ?? "").slice(0, 200);
      if (!title || !text) {
        return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
      }

      // ─── Qui reçoit l'annonce ? ──────────────────────────────
      //
      // Tous ceux qui ont accepté les notifications — qu'ils aient
      // déjà commandé ou non. Avant, seuls les appareils liés à une
      // commande étaient enregistrés : un client qui avait installé
      // l'app sans commander n'était joignable par personne.
      //
      // On respecte quand même le refus explicite : `marketing_optin`
      // à false = la personne a décoché « Offres et nouveautés »
      // dans son profil. Elle continue de recevoir le suivi de ses
      // commandes, mais plus les annonces.
      // ─── « Que tout le monde reçoive l'annonce » ─────────────
      //
      // Demandé le 02/10/2026. Jusqu'ici, une annonce ne visait que
      // l'audience « customer ». Or le téléphone du patron et celui
      // du livreur sont enregistrés en « admin » / « driver » : ils
      // ne recevaient jamais les annonces, et le compteur affichait
      // « 0 destinataire » alors que des appareils étaient bien là.
      //
      // Une annonce s'adresse maintenant à **tous les appareils de
      // l'application** qui n'ont pas refusé les offres. Seul
      // `audience: "admin"` reste ciblé (c'est le bouton « m'envoyer
      // un test »).
      const filtre =
        audience === "customer"
          ? `marketing_optin=not.is.false`
          : `audience=eq.${encodeURIComponent(audience)}`;

      const rows = await sb(`expo_push_tokens?${filtre}&select=token`).then((r) =>
        r.ok ? r.json() : []
      );

      const messages = (rows as Array<{ token: string }>).map((r) => ({
        to: r.token,
        sound: "default",
        channelId: audience === "customer" ? "promos" : "commandes",
        title,
        body: text,
        data: body?.data ?? {},
      }));

      // Notifications uniquement. Les campagnes e-mail sont un
      // outil distinct (`/api/campagne`) : on ne mélange pas les
      // deux, ni dans le code ni dans l'interface.
      if (!messages.length) {
        return NextResponse.json({
          success: true,
          sent: 0,
          errors: 0,
          cibles: 0,
          message:
            "Aucun appareil joignable : personne n'a encore accepté " +
            "les notifications dans l'application.",
        });
      }

      const result = await sendExpo(messages);
      return NextResponse.json({
        success: true,
        cibles: messages.length,
        ...result,
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * GET /api/push/expo  (admin)
 *
 * Combien d'appareils sont réellement joignables, par audience.
 * Sans ce compteur, l'admin envoyait une annonce « réussie » à
 * zéro destinataire sans jamais le savoir.
 */
export async function GET(request: NextRequest) {
  if (!(await estAdmin(request.headers.get("X-Admin-Auth")))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  try {
    const rows = (await sb(
      "expo_push_tokens?select=audience,marketing_optin"
    ).then((r) => (r.ok ? r.json() : []))) as Array<{
      audience?: string;
      marketing_optin?: boolean | null;
    }>;

    const clients = rows.filter((r) => r.audience === "customer");
    const joignablesPush = rows.filter((r) => r.marketing_optin !== false).length;

    return NextResponse.json({
      clients: clients.length,
      notifications: joignablesPush,
      // Une annonce touche TOUS les appareils qui n'ont pas refusé,
      // y compris les téléphones du restaurant : c'est le chiffre
      // affiché avant d'envoyer.
      // Ce que l'application affiche avant d'envoyer : les
      // appareils qui recevront vraiment la notification.
      clientsOffres: joignablesPush,
      admins: rows.filter((r) => r.audience === "admin").length,
      livreurs: rows.filter((r) => r.audience === "driver").length,
      total: rows.length,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
