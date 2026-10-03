"use client";

// ─── Section « Questions fréquentes » visible dans la page ──────
//
// Les assistants IA (ChatGPT, Gemini, Perplexity, AI Overviews) citent
// prioritairement les réponses présentes dans le HTML, pas seulement
// dans le JSON-LD. Cette section reprend, en texte crawlable, les
// questions/réponses de src/data/faq.ts (aussi exposées en FAQPage
// structuré). Le balisage est sémantique : section / h2 / h3 / p.

import { FAQ_ENTRIES, HOURS_QUESTION } from "@/data/faq";
import { FromToText, DaysOpenText } from "@/components/hours/HoursText";

export function FaqSection() {
  const entries = [
    {
      q: HOURS_QUESTION,
      a: (
        <>
          Nous livrons <FromToText />, <DaysOpenText long />, dans tout le
          93 (Seine-Saint-Denis). Les horaires à jour sont affichés en
          direct sur le site et dans l&apos;application.
        </>
      ),
    },
    ...FAQ_ENTRIES.map((e) => ({ q: e.q, a: e.a })),
  ];

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="py-16 md:py-24 px-4 border-t border-border/30"
    >
      <div className="max-w-3xl mx-auto">
        <h2
          id="faq-title"
          className="font-heading text-2xl md:text-4xl tracking-wider text-center text-foreground mb-3"
        >
          Questions <span className="text-brand-red">fréquentes</span>
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-10">
          Horaires, commande, livraison, viande halal : les réponses
          essentielles sur FAIS TON S&apos;DALLE.
        </p>

        <dl className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.q}
              className="rounded-2xl bg-card border border-border/50 p-5"
            >
              <dt>
                <h3 className="font-bold text-foreground text-sm md:text-base">
                  {entry.q}
                </h3>
              </dt>
              <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {entry.a}
              </dd>
            </div>
          ))}
        </dl>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Une autre question ? Appelez ou écrivez sur WhatsApp au{" "}
          <a
            href="tel:+33672044875"
            className="text-brand-red font-bold hover:underline"
          >
            06 72 04 48 75
          </a>
          .
        </p>
      </div>
    </section>
  );
}
