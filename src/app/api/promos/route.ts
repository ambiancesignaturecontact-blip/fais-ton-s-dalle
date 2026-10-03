import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Codes PERSONNELS (récompense d'avis) : leur étiquette commence par
 * « avis: ». Ils ne doivent JAMAIS apparaître dans la liste publique,
 * sinon n'importe qui pourrait lire le cadeau d'un autre client et
 * l'utiliser avant lui — ils sont à usage unique.
 */
function estPersonnel(label: string | null): boolean {
  return typeof label === "string" && label.startsWith("avis:");
}

/** L'étiquette interne ne sort jamais telle quelle */
function etiquettePublique(label: string | null): string {
  if (estPersonnel(label)) return "Merci pour votre avis";
  return label ?? "";
}

type Ligne = {
  code: string; discount: number; type: string; label: string | null;
  max_uses: number | null; uses: number;
  expires_at?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
};

async function lire(query: string): Promise<Ligne[] | null> {
  const appel = (q: string) =>
    fetch(`${SUPABASE_URL}/rest/v1/promo_codes?${q}`, {
      headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: "no-store",
    });

  let res = await appel(query);

  // Les colonnes owner_email / owner_phone arrivent avec le SQL de
  // migration. Tant qu'elles manquent, PostgREST répond 400 : on
  // retente sans elles plutôt que de casser tous les codes promo.
  if (!res.ok && /owner_(email|phone)/.test(query)) {
    res = await appel(
      query
        .replace(",owner_email,owner_phone", "")
        .replace("&owner_email=is.null&owner_phone=is.null", "")
    );
  }
  if (!res.ok) return null;
  return (await res.json()) as Ligne[];
}

const utilisable = (r: Ligne) => r.max_uses === null || r.uses < r.max_uses;

/**
 * GET /api/promos            → codes publics actifs (liste de l'app)
 * GET /api/promos?code=XXXX  → vérifie UN code précis, personnel compris
 *
 * Le second cas existe pour les codes de remerciement : ils sont
 * uniques, donc absents de la liste publique. Sans lui, l'app
 * affichait « Code invalide » sur un cadeau parfaitement valable.
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ promos: [] });
  }

  const demande = (request.nextUrl.searchParams.get("code") ?? "").trim().toUpperCase();
  const now = new Date().toISOString();

  try {
    // ─── Vérification d'un code précis ──────────────────────
    if (demande) {
      // Format volontairement strict : pas d'injection dans l'URL
      if (!/^[A-Z0-9-]{3,32}$/.test(demande)) {
        return NextResponse.json({ error: "Code invalide" }, { status: 404 });
      }
      const rows = await lire(
        `code=eq.${encodeURIComponent(demande)}&active=eq.true` +
          `&select=code,discount,type,label,max_uses,uses,expires_at,owner_email,owner_phone&limit=1`
      );
      const r = rows?.[0];
      if (!r) return NextResponse.json({ error: "Code invalide" }, { status: 404 });
      if (!utilisable(r)) {
        return NextResponse.json({ error: "Code déjà utilisé" }, { status: 404 });
      }
      if (r.expires_at && new Date(r.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: "Code expiré" }, { status: 404 });
      }

      // Code personnel : on refuse tout de suite s'il n'appartient
      // pas à celui qui le saisit. Sans ce contrôle, le panier
      // affichait la remise puis le serveur la retirait au paiement
      // — le client comprenait qu'on lui avait volé sa réduction.
      const proprio = r.owner_email || r.owner_phone;
      if (proprio) {
        const email = (request.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
        const tel = (request.nextUrl.searchParams.get("phone") ?? "").replace(/\D/g, "");
        const ok =
          (r.owner_email && email && String(r.owner_email).toLowerCase() === email) ||
          (r.owner_phone && tel && String(r.owner_phone).replace(/\D/g, "") === tel);
        if (!ok) {
          return NextResponse.json(
            { error: "Ce code est personnel : il appartient à un autre compte." },
            { status: 403 }
          );
        }
      }
      return NextResponse.json(
        {
          promo: {
            code: r.code,
            discount: r.discount,
            type: r.type,
            label: etiquettePublique(r.label),
          },
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // ─── Liste publique ─────────────────────────────────────
    const rows = await lire(
      `active=eq.true&or=(expires_at.is.null,expires_at.gt.${now})` +
        `&select=code,discount,type,label,max_uses,uses,owner_email,owner_phone`
    );
    if (!rows) return NextResponse.json({ promos: [] });

    const promos = rows
      .filter(utilisable)
      .filter((r) => !estPersonnel(r.label) && !r.owner_email && !r.owner_phone)
      .map((r) => ({
        code: r.code, discount: r.discount, type: r.type, label: r.label ?? "",
      }));

    return NextResponse.json(
      { promos },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ promos: [] });
  }
}
