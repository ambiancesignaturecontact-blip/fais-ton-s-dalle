import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: "Admin password not configured" }, { status: 500 });
    }

    // Le mot de passe général OU un accès personnel (table
    // `admins`) : chaque membre de l'équipe peut avoir le sien,
    // révocable sans changer celui des autres.
    const identite = await verifierAdmin(password);
    if (!identite.ok) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    return NextResponse.json({ success: true, qui: identite.qui });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
