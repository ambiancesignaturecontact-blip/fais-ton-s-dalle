// GET /llms.txt — fiche courte pour les assistants IA (llmstxt.org).
// Généré dynamiquement : horaires et infos toujours à jour.
import { getServerSettings } from "@/lib/server-settings";
import { buildLlmsTxt } from "@/lib/llms-docs";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET() {
  const settings = await getServerSettings();
  return new Response(buildLlmsTxt(settings), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
    },
  });
}
