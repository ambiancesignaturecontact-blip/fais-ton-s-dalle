// ─── Retrait de la liste de diffusion ─────────────────────────
//
// Obligatoire (RGPD) et exigé par Gmail et Apple Mail pour que nos
// e-mails n'atterrissent pas en indésirables.
//
// Deux chemins :
//  · GET  : le client clique sur le lien en bas de l'e-mail ;
//  · POST : désabonnement « en un clic » déclenché par la
//           messagerie elle-même (en-tête List-Unsubscribe-Post).
//
// Le lien est signé : personne ne peut désabonner quelqu'un d'autre.

import { NextRequest, NextResponse } from "next/server";
import { desabonner, verifierDesabonnement } from "@/lib/campagne-email";

async function traiter(email: string, sig: string) {
  const e = email.trim().toLowerCase();
  if (!e || !verifierDesabonnement(e, sig)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  }
  const ok = await desabonner(e);
  if (!ok) {
    return NextResponse.json({ error: "Réessayez dans un instant" }, { status: 502 });
  }
  return NextResponse.json({ success: true, email: e });
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  return traiter(p.get("e") ?? "", p.get("s") ?? "");
}

export async function POST(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (p.get("e")) return traiter(p.get("e") ?? "", p.get("s") ?? "");
  const b = await request.json().catch(() => ({}));
  return traiter(String(b?.email ?? ""), String(b?.s ?? ""));
}
