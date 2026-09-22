import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Mode démo
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.log("📬 Newsletter (démo):", email);
      return NextResponse.json({ message: "Inscrit avec succès !", demo: true });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, is_active: true }),
    });

    if (res.status === 409) {
      return NextResponse.json({ message: "Déjà inscrit à la newsletter !" });
    }
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

    console.log("📬 Nouvel inscrit:", email);
    return NextResponse.json({ message: "Inscrit avec succès à la newsletter !" });
  } catch (err) {
    console.error("❌ Newsletter error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
