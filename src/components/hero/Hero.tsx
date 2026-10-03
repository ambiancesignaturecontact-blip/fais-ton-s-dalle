"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import Image from "next/image";
import { ArrowRight, Sandwich, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/components/SettingsProvider";
import { formatRange, mainSlot } from "@/lib/hours";

const PARTICLES = [
  { emoji: "🥪", x: "8%", delay: 0, duration: 14 },
  { emoji: "🥩", x: "28%", delay: 3, duration: 16 },
  { emoji: "🥗", x: "50%", delay: 6, duration: 13 },
  { emoji: "🧀", x: "75%", delay: 8, duration: 12 },
];

export function Hero() {
  const { t } = useI18n();
  const settings = useSettings();
  // Plage horaire principale de la semaine (l'app peut la changer)
  const range = formatRange(mainSlot(settings.hours));
  const SLOGAN = t("hero.slogan").replace("{hours}", range);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sloganIdx, setSloganIdx] = useState(0);
  const [sloganVisible, setSloganVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSloganVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sloganVisible) return;
    if (sloganIdx >= SLOGAN.length) return;
    const timer = setTimeout(() => setSloganIdx((prev) => prev + 1), 35);
    return () => clearTimeout(timer);
  }, [sloganIdx, sloganVisible, SLOGAN.length]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const mouseX = useSpring(useMotionValue(0), { stiffness: 100, damping: 30 });
  const mouseY = useSpring(useMotionValue(0), { stiffness: 100, damping: 30 });

  const orb1X = useTransform(mouseX, [-20, 20], [-40, 40]);
  const orb1Y = useTransform(mouseY, [-20, 20], [-40, 40]);
  const orb2X = useTransform(mouseX, [-20, 20], [30, -30]);
  const orb2Y = useTransform(mouseY, [-20, 20], [30, -30]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x * 20);
      mouseY.set(y * 20);
    },
    [mouseX, mouseY]
  );

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="acc"
      className="relative min-h-[70dvh] md:min-h-[90dvh] flex items-center justify-center overflow-hidden pt-14 md:pt-16 scroll-mt-16"
      onMouseMove={handleMouseMove}
      aria-label="Section accueil"
    >
      {/* Photo de fond subtile */}
      <div className="absolute inset-0 opacity-15" aria-hidden="true">
        <Image src="/images/photo-interieur-2.webp" alt="Ambiance du restaurant FAIS TON S'DALLE" fill className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808]" aria-hidden="true" />
      <div className="absolute inset-0 opacity-[0.10]" aria-hidden="true">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%]" style={{ background: "conic-gradient(from 0deg at 50% 50%, rgba(212,61,43,0.5), rgba(232,159,46,0.25), rgba(212,61,43,0.5), rgba(232,159,46,0.25), rgba(212,61,43,0.5))", animation: "spin 30s linear infinite" }} />
      </div>
      <div className="absolute inset-0" aria-hidden="true">
        <motion.div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(212,61,43,0.16), transparent 70%)", x: orb1X, y: orb1Y }} />
        <motion.div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(232,159,46,0.12), transparent 70%)", x: orb2X, y: orb2Y }} />
      </div>
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <motion.div key={i} className="absolute text-xl md:text-3xl" style={{ left: p.x }}
            initial={{ opacity: 0, y: "120%" }}
            animate={{ opacity: [0, 0.7, 0.4, 0], y: ["120%", "40%", "-20%", "-130%"], x: [0, Math.sin(i) * 30, Math.sin(i + 1) * 60, 0], rotate: [0, 360, 720, 1080], scale: [0.8, 1, 1.1, 0.5] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          >{p.emoji}</motion.div>
        ))}
      </div>

      <motion.div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center" style={{ y: heroY, opacity, scale }}>
        {/* Badge premium */}
        <div className="mb-4 md:mb-8">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 md:gap-3 px-2.5 md:px-5 py-1 md:py-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-xl shadow-lg">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 md:h-4 w-3.5 md:w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span className="text-[10px] md:text-xs font-bold text-yellow-300">4.5</span>
            </span>
            <span className="w-px h-3 md:h-3.5 bg-white/20" aria-hidden="true" />
            <span className="text-[10px] md:text-xs font-bold text-white tracking-wider uppercase">Halal</span>
            <span className="w-px h-3 md:h-3.5 bg-white/20" aria-hidden="true" />
            <span className="text-[10px] md:text-xs font-bold text-white tracking-wider uppercase">🌙 {range}</span>
            <span className="w-px h-3 md:h-3.5 bg-white/20" aria-hidden="true" />
            <span className="text-[10px] md:text-xs font-bold text-white tracking-wider">93320</span>
          </div>
        </div>

        {/* Logo impactant - remplace le texte */}
        <h1 className="mb-3 md:mb-6 flex justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.3 }}
            className="relative w-[280px] h-[200px] md:w-[500px] md:h-[340px]"
          >
            <Image
              src="/images/logo.webp"
              alt="FAIS TON S'DALLE — Sandwichs sur mesure Halal aux Pavillons-sous-Bois 93320, livraison le soir et la nuit"
              fill
              className="object-contain drop-shadow-[0_0_60px_rgba(212,61,43,0.3)]"
              sizes="(max-width: 768px) 280px, 500px"
              priority
            />
          </motion.div>
        </h1>

        {/* Sous-titre animé */}
        <div className="mb-4 md:mb-8">
          <p className="text-white/70 text-[10px] md:text-sm font-mono tracking-wider leading-relaxed min-h-[1.2em]">
            {sloganVisible ? SLOGAN.substring(0, sloganIdx) : ""}
            {sloganVisible && sloganIdx < SLOGAN.length && (
              <span className="inline-block w-[1.5px] h-2.5 md:h-4 bg-brand-red ml-0.5 animate-pulse" />
            )}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 px-2">
          <Button size="lg" onClick={scrollToMenu}
            className="bg-gradient-to-r from-brand-red to-brand-red-light text-white w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-6 rounded-full text-sm md:text-base font-bold shadow-lg shadow-brand-red/30 hover:shadow-xl transition-all duration-300">
            <Sandwich className="mr-1.5 h-4 w-4 md:h-5 md:w-5 inline" aria-hidden="true" /> {t("hero.cta")}
            <ArrowRight className="ml-1.5 h-4 w-4 md:h-5 md:w-5 inline" aria-hidden="true" />
          </Button>
          <a href="https://wa.me/33672044875" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 text-sm md:text-base transition-all duration-300">
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-[#25D366]" aria-hidden="true" /> {t("hero.order")}
          </a>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 md:h-28 bg-gradient-to-t from-[#1a0a0a] to-transparent pointer-events-none" aria-hidden="true" />
      </motion.div>
    </section>
  );
}
