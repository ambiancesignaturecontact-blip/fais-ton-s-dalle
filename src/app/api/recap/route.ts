import { NextRequest, NextResponse } from "next/server";
import {
  construireRecap, texteRecap, heureParis, sb,
} from "@/lib/recap";
import { envoyerExpo } from "@/lib/expo-push";
import { estAdmin } from "@/lib/admin-auth";

const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function envoyerAuxAdmins(title: string, body: string) {
  const rows = (await sb("expo_push_tokens?audience=eq.admin&select=token").then(
    (r) => (r.ok ? r.json() : [])
  )) as Array<{ token: string }>;

  if (!rows.length) return { cibles: 0, sent: 0 };

  const bilan = await envoyerExpo(
    rows.map((r) => ({
      to: r.token,
      sound: "default",
      channelId: "commandes",
      title,
      body,
      data: { url: "/admin", recap: true },
    }))
  );
  return { cibles: rows.length, sent: bilan.sent };
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const admin = await estAdmin(request.headers.get("X-Admin-Auth"));
  const cron =
    (CRON_SECRET &&
      request.headers.get("Authorization") === `Bearer ${CRON_SECRET}`) ||
    // Vercel signe ses appels de cron avec cet en-tête.
    request.headers.get("x-vercel-cron") === "1";

  if (!admin && !cron) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const recap = await construireRecap();
  const texte = texteRecap(recap);

  // Consultation manuelle depuis l'admin : on ne notifie personne,
  // on renvoie juste les chiffres. Sinon le patron se réveillerait
  // lui-même à chaque fois qu'il ouvre l'écran.
  if (admin && !cron) {
    return NextResponse.json({ ...recap, titre: texte.title, texte: texte.body });
  }

  // Appel automatique : seulement à l'heure dite (minuit à Paris).
  const h = heureParis();
  if (h !== 0) {
    return NextResponse.json({ ignore: true, heureParis: h });
  }

  const envoi = await envoyerAuxAdmins(texte.title, texte.body);
  return NextResponse.json({ ...recap, ...envoi, envoye: true });
}
