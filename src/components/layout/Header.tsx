"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ShoppingBag, Menu, X, User, Gift, MapPin, Globe } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { isLoggedIn, getSession } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { RangeText } from "@/components/hours/HoursText";
import Link from "next/link";

const NAV_ITEMS = [
  { id: "acc", label: "Accueil", emoji: "🏠" },
  { id: "menu", label: "Menu", emoji: "🥪" },
  { id: "ap", label: "Infos", emoji: "ℹ️" },
  { id: "contact-page", label: "Contact", emoji: "📞" },
  { id: "avis", label: "Avis", emoji: "⭐" },
  { id: "blog", label: "Blog", emoji: "📝" },
  { id: "histoire", label: "Histoire", emoji: "📖" },
];

export function Header() {
  const { itemCount } = useCart();
  const { lang, setLang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("acc");
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef(0);

  // Detect scroll for compact header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on scroll
  useEffect(() => {
    if (!isOpen) return;
    const onScroll = () => setIsOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  // Trap focus when mobile menu is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Swipe to close mobile menu
  useEffect(() => {
    if (!isOpen) return;
    const el = menuRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (dx > 80) setIsOpen(false);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isOpen]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setIsOpen(false);
    if (id === "blog" || id === "histoire" || id === "contact-page" || id === "avis" || id === "engagement" || id === "confidentialite") {
      window.location.href = `/${id === "contact-page" ? "contact" : id}`;
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-lg shadow-black/5" : "bg-black/20 backdrop-blur-sm"
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between safe-top">
        {/* Logo */}
        <button
          onClick={() => scrollTo("acc")}
          className="flex items-center gap-2 md:gap-3 shrink-0"
          aria-label="Retour en haut de page"
          title="FAIS TON S'DALLE"
        >
          <Image
            src="/images/logo.webp"
            alt="FAIS TON S'DALLE logo"
            width={300}
            height={200}
            className="h-9 md:h-12 w-auto rounded-lg md:rounded-xl shadow-lg"
            sizes="300px"
            priority
          />
          <div className="text-left">
            <h1 className="font-heading text-sm md:text-lg tracking-wider text-white/90 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              FAIS TON S&apos;DALLE
            </h1>
            <p className="text-[0.35rem] md:text-[0.4rem] tracking-[2px] md:tracking-[3px] uppercase text-white/50 font-body hidden sm:block">
              Sandwichs sur mesure
            </p>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-brand-red to-brand-red-light text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-current={activeSection === item.id ? "true" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Fidelity badge */}
          {isLoggedIn() && (() => { try { const d = JSON.parse(localStorage.getItem("ftsd_fidelity") || "{}"); return d.discountActive; } catch { return false; } })() && (
            <Link href="/compte?tab=fidelite"
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[9px] font-bold hover:bg-amber-500/25 transition-colors">
              <Gift className="h-3 w-3" /> -10%
            </Link>
          )}
          {/* Suivi button */}
          <Link href="/suivi"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold hover:bg-indigo-500/20 transition-colors">
            <MapPin className="h-3 w-3" /> Suivi
          </Link>
          {/* Language toggle */}
          <button onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 text-white/60 border border-white/10 text-[10px] font-bold hover:bg-white/10 transition-colors"
            title={lang === "fr" ? "Switch to English" : "Passer en français"}>
            <Globe className="h-3 w-3" /> {lang === "fr" ? "EN" : "FR"}
          </button>
          {/* Compte button */}
          <Link href={isLoggedIn() ? "/compte" : "/connexion"}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/70 hover:bg-white/10 text-xs font-bold transition-colors border border-white/10">
            <User className="h-3.5 w-3.5" />
            {isLoggedIn() ? getSession()?.name?.split(" ")[0] || "Compte" : "Connexion"}
          </Link>

          {/* Mobile menu toggle */}
          <button
            ref={menuButtonRef}
            className="md:hidden rounded-full w-9 h-9 flex items-center justify-center hover:bg-muted/50 transition-colors touch-target"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            role="navigation"
            aria-label="Navigation mobile"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden border-t border-border/20 bg-[#1a1a2e] backdrop-blur-2xl shadow-2xl"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-heading tracking-wider transition-all touch-target text-white/90 ${
                    activeSection === item.id
                      ? "bg-gradient-to-r from-brand-red to-brand-red-light text-white shadow-lg shadow-brand-red/30"
                      : "text-white/80 hover:bg-white/10 active:bg-white/15"
                  }`}
                  aria-current={activeSection === item.id ? "true" : undefined}
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  {item.label}
                </motion.button>
              ))}

              {/* Mobile suivi link */}
              <motion.a href="/suivi"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-heading tracking-wider text-indigo-300/80 hover:bg-white/10 active:bg-white/15 touch-target"
              >
                <MapPin className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                Suivre ma commande
              </motion.a>

              {/* Mobile cart link */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent("ftsd:openCart"));
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-heading tracking-wider text-white/80 hover:bg-white/10 active:bg-white/15 touch-target mt-2 border-t border-white/10 pt-3"
                aria-label="Voir le panier"
              >
                <ShoppingBag className="h-5 w-5 text-brand-red" aria-hidden="true" />
                Voir le panier
                {itemCount > 0 && (
                  <span className="ml-auto bg-gradient-to-r from-brand-red to-brand-red-light text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </motion.button>

              <button onClick={() => { setLang(lang === "fr" ? "en" : "fr"); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-heading tracking-wider text-white/60 hover:bg-white/10 active:bg-white/15 touch-target"
                aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}>
                🌐 {lang === "fr" ? "English" : "Français"}
              </button>
              <div className="pt-3 pb-1 text-center text-[10px] text-white/40" aria-hidden="true">
                FAIS TON S&apos;DALLE — Livraison <RangeText />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
