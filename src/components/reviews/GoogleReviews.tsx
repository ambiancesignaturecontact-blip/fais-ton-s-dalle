"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Review {
  author: string;
  text: string;
  rating: number;
  time: string;
}

const FALLBACK_REVIEWS: Review[] = [
  { author: "Sophie M.", text: "Les meilleurs sandwichs du 93 ! Toujours frais et bien garnis.", rating: 5, time: "Il y a 2 jours" },
  { author: "Karim L.", text: "Service rapide même tard, les tenders sont incroyables !", rating: 5, time: "Il y a 1 semaine" },
  { author: "Fatima Z.", text: "Enfin un vrai fast-food halal de qualité près de chez moi.", rating: 5, time: "Il y a 2 semaines" },
  { author: "Alex D.", text: "Le milkshake Snickers est une tuerie !", rating: 5, time: "Il y a 3 semaines" },
  { author: "Jordan P.", text: "Livraison super rapide même à 1h du matin. Merci !", rating: 5, time: "Il y a 1 mois" },
  { author: "Dr. Samir K.", text: "Le menu gourmand est mon sauveur de nuit de garde.", rating: 5, time: "Il y a 1 mois" },
  { author: "Marie L.", text: "Je prends toujours algérienne + samouraï, un régal !", rating: 5, time: "Il y a 1 mois" },
  { author: "Hassan M.", text: "Enfin un vrai fast food halal de qualité. Bravo !", rating: 5, time: "Il y a 2 mois" },
];

export function GoogleReviews() {
  const [reviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [visible, setVisible] = useState(4);

  const displayed = reviews.slice(0, visible);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="flex text-yellow-400">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="h-5 w-5 fill-current" />
          ))}
        </div>
        <span className="text-sm font-bold text-white">4.5/5</span>
        <span className="text-xs text-white/40">— 150+ avis</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayed.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-brand-red/20 flex items-center justify-center text-sm font-bold text-brand-red">
                {r.author[0]}
              </div>
              <div>
                <p className="text-xs font-semibold text-white/90">{r.author}</p>
                <p className="text-[9px] text-white/40">{r.time}</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <span key={j} className="text-yellow-400 text-[10px]">★</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-white/60 italic leading-relaxed">&ldquo;{r.text}&rdquo;</p>
          </motion.div>
        ))}
      </div>

      {visible < reviews.length && (
        <button
          onClick={() => setVisible(reviews.length)}
          className="w-full py-2 text-xs text-brand-red font-semibold hover:underline"
        >
          Voir les {reviews.length} avis →
        </button>
      )}

      <div className="text-center mt-4">
        <a
          href="https://share.google/ESPQC3Rl41mHxcUMy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
        >
          <Star className="h-3.5 w-3.5 text-yellow-400" />
          Laisser un avis Google
        </a>
      </div>
    </div>
  );
}
