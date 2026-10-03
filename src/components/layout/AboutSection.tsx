"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import { RangeText, FromToText, DaysOpenText } from "@/components/hours/HoursText";

const GALLERY = [
  { src: "/images/photo-interieur-1.webp", alt: "Ambiance FAIS TON S'DALLE - Interieur du restaurant" },
  { src: "/images/photo-preparation-1.webp", alt: "Préparation d'un sandwich sur mesure par nos chefs" },
  { src: "/images/photo-cuisine-1.webp", alt: "Notre cuisine - Là où tout est préparé frais" },
  { src: "/images/photo-sandwich-1.webp", alt: "Sandwich signature FAIS TON S'DALLE" },
  { src: "/images/photo-interieur-2.webp", alt: "Salle du restaurant FAIS TON S'DALLE" },
  { src: "/images/photo-sandwich-2.webp", alt: "Notre fameux sandwich gourmand" },
  { src: "/images/photo-equipe-groupe.webp", alt: "L'équipe FAIS TON S'DALLE au complet" },
];

export function AboutSection() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <section id="ap" className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
            {/* Photo concept — pleine largeur responsive sans crop */}
            <div className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-xl"
              style={{ aspectRatio: "1536/1024" }}>
              <Image
                src="/images/photo-concept.webp"
                alt="FAIS TON S'DALLE - Ambiance et concept"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>

            <h2 className="font-heading text-2xl md:text-4xl tracking-wider text-foreground mb-6">
              LE <span className="text-gradient">CONCEPT</span>
            </h2>

            <p>
              <strong className="text-foreground">FAIS TON S&apos;DALLE</strong> — Le concept{" "}
              <strong className="text-foreground">sandwich sur mesure 100% Halal</strong>{" "}
              incontournable aux Pavillons-sous-Bois depuis 2026. Notre philosophie : choisissez votre menu, composez votre sandwich, régalez-vous. Simple, frais, généreux.
            </p>

            <div className="bg-card rounded-2xl p-6 border border-border/50 space-y-3">
              <h3 className="font-bold text-foreground">🔥 Comment ca marche ?</h3>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Choisissez votre menu : Léger (6,90€), Classique avec boisson (7,90€) ou Gourmand avec boisson + dessert (9,90€)</li>
                <li>Personnalisez votre sandwich : 7 viandes, 6 crudités, 9 sauces, 3 suppléments</li>
                <li>Ajoutez un Tiramisu maison ou un Milkshake personnalisable</li>
                <li>Nous préparons, vous dégustez — Livraison <RangeText /> ou à emporter</li>
              </ol>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50">
              <h3 className="font-bold text-foreground mb-2">🥗 Les Bowls</h3>
              <p>Envie de fraîcheur ? Composez votre bowl comme votre sandwich : 7 viandes, 6 crudités, 9 sauces, le tout dans un bowl généreux. Bowl seul 10,90€, Bowl + boisson 11,90€.</p>
            </div>

            <p className="bg-gradient-to-r from-indigo-900/20 to-indigo-800/20 rounded-2xl p-6 border border-indigo-500/10">
              <strong className="text-indigo-300"> Les soirées, notre spécialité.</strong>{" "}
              Service de livraison <FromToText />, <DaysOpenText />. Parce que la faim ne connaît pas d&apos;heure.
            </p>
          </div>

          {/* Galerie lightbox - 3 colonnes desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 mt-8" role="list" aria-label="Galerie photos">
            {GALLERY.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => setLightboxIdx(i)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="relative w-full aspect-[4/3] rounded-xl border border-border/50 overflow-hidden hover:scale-[1.03] hover:shadow-xl transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-red/50"
              >
                <Image src={img.src} alt={img.alt} fill className="object-cover" loading="lazy" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-2xl transition-opacity duration-300">🔍</span>
                </div>
              </motion.button>
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois |{" "}
            <a href="tel:+33672044875" className="text-brand-red font-bold">06 72 04 48 75</a>
          </p>
        </motion.div>
      </div>

      {/* Lightbox overlay */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 text-white/60 hover:text-white z-10 p-2">
              <X className="h-8 w-8" />
            </button>

            {lightboxIdx > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2 z-10">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}

            <motion.div
              key={lightboxIdx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-4xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={GALLERY[lightboxIdx].src} alt={GALLERY[lightboxIdx].alt} fill className="object-contain" sizes="100vw" />
              <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm p-4 pt-8 text-center">
                {GALLERY[lightboxIdx].alt}
              </p>
            </motion.div>

            {lightboxIdx < GALLERY.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2 z-10">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            )}

            <div className="absolute bottom-4 left-4 text-white/50 text-xs font-medium">
              {lightboxIdx + 1} / {GALLERY.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
