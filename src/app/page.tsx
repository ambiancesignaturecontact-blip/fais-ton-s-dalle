"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/hero/Hero";
import { MenuSection } from "@/components/menu/MenuSection";
import { AboutSection } from "@/components/layout/AboutSection";
import { FaqSection } from "@/components/layout/FaqSection";
import { ContactSection } from "@/components/layout/ContactSection";
import { Footer } from "@/components/layout/Footer";
import { CartSheet } from "@/components/cart/CartSheet";

export default function Home() {
  useEffect(() => {
    const onCart = () => {
      const cartFabs = document.querySelectorAll('[data-cart-trigger]');
      cartFabs.forEach((el) => (el as HTMLButtonElement).click());
    };
    window.addEventListener("ftsd:openCart", onCart);
    return () => window.removeEventListener("ftsd:openCart", onCart);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <MenuSection />
      <AboutSection />
      <FaqSection />
      <ContactSection />
      <Footer />
      <CartSheet />
    </main>
  );
}
