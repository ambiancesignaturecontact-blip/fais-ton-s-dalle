// ─── Envoi des notifications : un seul chemin pour tout ────────
//
// 🔴 LA panne, trouvée le 02/10/2026 en interrogeant Expo
// directement avec les deux jetons enregistrés :
//
//   {"code":"PUSH_TOO_MANY_EXPERIENCE_IDS",
//    "message":"All push notification messages in the same request
//               must be for the same project",
//    "details":{"@ktrr931/ftsd-ios":["ExponentPushToken[-t8k…]"],
//               "@ktrr931/ftsd-go" :["ExponentPushToken[EDqk…]"]}}
//
// Les deux téléphones du restaurant venaient de DEUX projets Expo
// différents : l'application actuelle (`ftsd-ios`) et l'ancienne
// (`ftsd-go`, encore installée sur le second appareil).
//
// Expo refuse **la requête entière** quand elle mélange deux
// projets. Et comme on envoyait tous les jetons en un seul appel,
// **AUCUNE notification de commande ne partait**. Ni au premier
// téléphone, ni au second. Envoyés séparément, les deux jetons
// répondent pourtant `ok`.
//
// C'est exactement le symptôme décrit : « je ne reçois rien quand
// il y a une commande ».
//
// Ce module est désormais le SEUL chemin d'envoi :
//  · découpe en lots de 100 (limite d'Expo) ;
//  · si Expo refuse un lot parce qu'il mélange des projets, on
//    réessaie message par message — personne n'est perdu ;
//  · les jetons morts (`DeviceNotRegistered`) sont supprimés de la
//    base : un téléphone désinstallé ne doit pas faire échouer les
//    envois des autres pendant des mois.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Surchargeable uniquement pour les tests de bout en bout.
// En production, la variable n'existe pas.
const EXPO_PUSH =
  process.env.EXPO_PUSH_URL || "https://exp.host/--/api/v2/push/send";

export interface MessageExpo {
  to: string;
  [cle: string]: unknown;
}

export interface ResultatEnvoi {
  /** Notifications réellement acceptées par Expo */
  sent: number;
  /** Notifications refusées */
  errors: number;
  /** Jetons devenus invalides (application désinstallée) */
  invalides: string[];
}

interface ReponseExpo {
  data?: Array<{ status?: string; details?: { error?: string } }>;
  errors?: Array<{ code?: string }>;
}

async function poster(lot: MessageExpo[]): Promise<ReponseExpo | null> {
  try {
    const res = await fetch(EXPO_PUSH, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(lot),
    });
    return (await res.json()) as ReponseExpo;
  } catch {
    return null;
  }
}

function depouiller(
  lot: MessageExpo[],
  json: ReponseExpo | null,
  bilan: ResultatEnvoi
) {
  const data = json?.data ?? [];
  data.forEach((d, i) => {
    if (d?.status === "ok") {
      bilan.sent++;
      return;
    }
    bilan.errors++;
    if (d?.details?.error === "DeviceNotRegistered" && lot[i]?.to) {
      bilan.invalides.push(lot[i].to);
    }
  });
  // Réponse sans `data` : tout le lot est perdu
  if (!data.length) bilan.errors += lot.length;
}

/** Supprime les jetons d'appareils qui n'ont plus l'application. */
async function purger(jetons: string[]) {
  if (!jetons.length || !SUPABASE_URL || !SUPABASE_KEY) return;
  const liste = jetons.map((t) => `"${t}"`).join(",");
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/expo_push_tokens?token=in.(${encodeURIComponent(liste)})`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
      }
    );
  } catch {
    /* le ménage réessaiera au prochain envoi */
  }
}

/**
 * Envoie des notifications. Ne lève jamais.
 *
 * @param nettoyer supprime les jetons morts de la base (défaut : oui)
 */
export async function envoyerExpo(
  messages: MessageExpo[],
  nettoyer = true
): Promise<ResultatEnvoi> {
  const bilan: ResultatEnvoi = { sent: 0, errors: 0, invalides: [] };
  const valides = messages.filter(
    (m) => typeof m?.to === "string" && m.to.startsWith("Expo")
  );
  if (!valides.length) return bilan;

  for (let i = 0; i < valides.length; i += 100) {
    const lot = valides.slice(i, i + 100);
    const json = await poster(lot);

    // ⚠️ Le cas qui cassait tout : Expo rejette le lot entier.
    // On ne baisse pas les bras, on envoie un par un.
    const refusGlobal = (json?.errors ?? []).length > 0 && !(json?.data ?? []).length;
    // Inutile de réessayer un lot d'un seul message : ce serait le
    // même appel, et le même refus.
    if ((refusGlobal || !json) && lot.length > 1) {
      for (const message of lot) {
        depouiller([message], await poster([message]), bilan);
      }
      continue;
    }

    depouiller(lot, json, bilan);
  }

  if (nettoyer && bilan.invalides.length) await purger(bilan.invalides);
  return bilan;
}
