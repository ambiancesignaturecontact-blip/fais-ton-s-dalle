// GET /llms-full.txt — fiche complète pour les assistants IA
// (carte détaillée, prix, composition, zones, FAQ) : llmstxt.org.
import { getServerSettings } from "@/lib/server-settings";
import { buildLlmsFullTxt } from "@/lib/llms-docs";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET() {
  const settings = await getServerSettings();
  return new Response(buildLlmsFullTxt(settings), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
    },
  });
}
