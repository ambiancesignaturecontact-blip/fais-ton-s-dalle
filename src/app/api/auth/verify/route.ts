import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = request.nextUrl.searchParams.get("email");

  if (!token) {
    return NextResponse.redirect(new URL("/email-confirme?error=missing_token", request.url));
  }

  // Rediriger vers la page de confirmation qui gère la vérification côté client
  const redirectUrl = new URL("/email-confirme", request.url);
  redirectUrl.searchParams.set("token", token);
  if (email) redirectUrl.searchParams.set("email", email);
  return NextResponse.redirect(redirectUrl);
}
