"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Mail, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { GoogleReviews } from "@/components/reviews/GoogleReviews";
import { HoursSummary } from "@/components/hours/HoursText";

type InfoItem = {
  icon: LucideIcon;
  title: string;
  content?: string;
  contentNode?: ReactNode;
  href?: string;
};

export function ContactSection() {
  return (
    <section id="con" className="py-16 md:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-2xl md:text-3xl tracking-wider text-center mb-10">
            CONTACT
          </h2>

          {/* Contact grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {([
              { icon: MapPin, title: "Adresse", content: "134 Allée du Colonel Fabien\n93320 Les Pavillons-sous-Bois" },
              { icon: Clock, title: "Horaires", contentNode: <HoursSummary /> },
              { icon: Phone, title: "Téléphone", content: "06 72 04 48 75", href: "tel:+33672044875" },
              { icon: Mail, title: "Email", content: "contact@faistonsdalle.com", href: "mailto:contact@faistonsdalle.com" },
            ] as InfoItem[]).map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-4 border border-border/50 hover:border-brand-red/20 transition-all duration-300 group">
                <item.icon className="h-5 w-5 text-brand-red mb-2" />
                <h3 className="font-heading text-sm tracking-wider mb-1 text-foreground">{item.title}</h3>
                {"contentNode" in item ? (
                  <p className="text-xs text-muted-foreground">{item.contentNode}</p>
                ) : item.href ? (
                  <a href={item.href} className="text-xs text-muted-foreground hover:text-brand-red transition-colors whitespace-pre-line">{item.content}</a>
                ) : (
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{item.content}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Avis Google dynamiques */}
          <div className="mb-10">
            <h3 className="font-heading text-lg tracking-wider text-center mb-4">Ce qu&apos;ils disent</h3>
            <GoogleReviews />
          </div>

          {/* Newsletter */}
          <div className="bg-gradient-to-r from-brand-red to-brand-red-light rounded-2xl md:rounded-3xl p-5 md:p-10 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
            <div className="relative z-10">
              <h3 className="font-heading text-lg md:text-2xl tracking-wider mb-2">NEWSLETTER</h3>
              <p className="text-sm text-white/80 md:text-white/90 mb-4 md:mb-6">Promos et nouveautés</p>
              <form onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as HTMLFormElement).querySelector("input");
                  if (input?.value) {
                    fetch("/api/newsletter", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: input.value }),
                    }).then((res) => {
                      if (res.ok) { input!.value = ""; toast.success("Inscrit à la newsletter !"); }
                      else { toast.error("Erreur d'inscription"); }
                    }).catch(() => { toast.error("Erreur réseau"); });
                  }
                }}
                className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto">
                <input type="email" placeholder="ton@email.fr" required
                  className="w-full px-5 py-3.5 md:py-3 rounded-full text-sm md:text-base text-foreground bg-white border-none focus:outline-none focus:ring-2 focus:ring-white/30" />
                <button type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 md:py-3 rounded-full bg-white text-brand-red font-bold text-sm md:text-base hover:scale-105 transition-transform active:scale-95 shadow-lg">
                  S&apos;inscrire →
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
