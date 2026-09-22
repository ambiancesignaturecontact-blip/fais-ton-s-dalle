import type { MetadataRoute } from "next";

// Parties techniques/privées jamais servies aux robots (ni aux IA).
const PRIVATE = ["/api/", "/admin"];

// Robots des assistants et moteurs IA que l'on souhaite voir
// référencer l'établissement (GEO/AEO). Chaque groupe explicite
// reprend les interdits privés (les groupes spécifiques priment).
const AI_BOTS = [
  "GPTBot", // OpenAI (entraînement ChatGPT)
  "OAI-SearchBot", // recherche ChatGPT
  "ChatGPT-User",
  "ClaudeBot", // Anthropic Claude (entraînement)
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended", // Gemini / Google AI
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl (nombreux modèles)
  "Bytespider", // ByteDance / Doubao
  "Amazonbot", // Amazon Rufus / Alexa
  "Meta-ExternalAgent", // Meta AI
  "Meta-ExternalFetcher",
  "FacebookBot",
  "YouBot", // You.com
  "cohere-ai",
  "Diffbot",
  "webzio",
  "imagesiftbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Le restaurant souhaite être référencé et cité par les IA :
      // leurs robots ont un accès complet au contenu public.
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE,
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE,
      },
    ],
    sitemap: "https://faistonsdalle.com/sitemap.xml",
    host: "https://faistonsdalle.com",
  };
}
