import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * POST /api/auth/login
 * Connexion réelle vérifiée par Supabase Auth.
 * Utilisée par l'application iOS/Android.
 *
 * Body : { email, password }        → 200 { name, phone, address, verified }
 * Body : { probe: true }            → 200 { available: true }  (sonde de disponibilité)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Sonde utilisée par l'app pour savoir si le service existe
    if (body?.probe === true) {
      return NextResponse.json({ available: true });
    }

    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    // ─── Vérification du mot de passe par Supabase Auth ───────────
    const authRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!authRes.ok) {
      // 400 de Supabase = identifiants invalides
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const auth = await authRes.json();
    const userMeta = auth?.user?.user_metadata ?? {};
    const emailConfirmed = Boolean(auth?.user?.email_confirmed_at);

    // ─── Profil complémentaire (table customers) ──────────────────
    let profile: Record<string, unknown> = {};
    if (SUPABASE_SERVICE) {
      try {
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=name,phone,address,fidelity_menu_count,fidelity_discount_active`,
          {
            headers: {
              apikey: SUPABASE_SERVICE,
              Authorization: `Bearer ${SUPABASE_SERVICE}`,
            },
          }
        );
        if (pRes.ok) {
          const rows = await pRes.json();
          if (Array.isArray(rows) && rows.length) profile = rows[0];
        }
      } catch {
        /* profil optionnel */
      }
    }

    // On ne renvoie JAMAIS de token d'accès à l'application :
    // elle n'en a pas besoin et cela réduit la surface d'attaque.
    return NextResponse.json({
      success: true,
      name: (profile.name as string) || userMeta.name || email.split("@")[0],
      phone: (profile.phone as string) || "",
      address: (profile.address as string) || "",
      verified: emailConfirmed,
      fidelity: {
        menuCount: Number(profile.fidelity_menu_count ?? 0),
        discountActive: Boolean(profile.fidelity_discount_active ?? false),
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** Permet à l'app de sonder la route sans envoyer d'identifiants */
export async function GET() {
  return NextResponse.json({ available: true });
}
