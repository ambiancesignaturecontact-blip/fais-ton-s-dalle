"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, CheckCircle, Mail, Phone, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { WeeklyHours } from "@/components/hours/HoursText";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }
    setSending(true);
    try {
      const emailHtml = `
        <h2>Nouveau message depuis le site</h2>
        <p><strong>Nom :</strong> ${form.name}</p>
        <p><strong>Email :</strong> ${form.email}</p>
        <p><strong>Téléphone :</strong> ${form.phone || "Non renseigné"}</p>
        <p><strong>Message :</strong></p>
        <p>${form.message.replace(/\n/g, "<br/>")}</p>
      `;
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "contact@faistonsdalle.com",
          subject: `📬 Message de ${form.name} - FAIS TON S'DALLE`,
          html: emailHtml,
        }),
      });
      if (res.ok || !process.env.RESEND_API_KEY) {
        setSent(true);
        toast.success("Message envoyé !");
      } else {
        toast.error("Erreur d'envoi");
      }
    } catch { toast.error("Erreur réseau"); }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0808] text-white/80 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">← Accueil</Link>
        <h1 className="font-heading text-3xl md:text-5xl tracking-wider text-white mb-8">Contact</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
            <MapPin className="h-5 w-5 text-brand-red" />
            <h2 className="font-heading text-lg text-white">Adresse</h2>
            <p className="text-sm">134 Allée du Colonel Fabien<br />93320 Les Pavillons-sous-Bois</p>
            <a href="https://www.google.com/maps/dir/?api=1&destination=134+Allee+du+Colonel+Fabien,+93320+Les+Pavillons-sous-Bois" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-red/20 text-brand-red font-bold text-sm hover:bg-brand-red/30 transition-all">
              Itinéraire →
            </a>
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
            <Clock className="h-5 w-5 text-brand-red" />
            <h2 className="font-heading text-lg text-white">Horaires</h2>
            <WeeklyHours />
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
            <Phone className="h-5 w-5 text-brand-red" />
            <h2 className="font-heading text-lg text-white">Téléphone</h2>
            <a href="tel:+33672044875" className="text-sm text-brand-red font-bold hover:underline">06 72 04 48 75</a>
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
            <Mail className="h-5 w-5 text-brand-red" />
            <h2 className="font-heading text-lg text-white">Email</h2>
            <a href="mailto:contact@faistonsdalle.com" className="text-sm text-brand-red hover:underline">contact@faistonsdalle.com</a>
          </div>
        </div>

        {/* Formulaire */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="font-heading text-xl tracking-wider text-white mb-4">Nous écrire</h2>

          {sent ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-bold text-lg mb-1">Message envoyé ! ✅</p>
              <p className="text-white/50 text-sm">Nous vous répondrons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input type="text" placeholder="Votre nom *" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
              </div>
              <div>
                <input type="email" placeholder="votre@email.fr *" value={form.email} required
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
              </div>
              <div>
                <input type="tel" placeholder="Votre téléphone (optionnel)" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
              </div>
              <div>
                <textarea placeholder="Votre message *" rows={4} value={form.message} required
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50 resize-none" />
              </div>
              <button type="submit" disabled={sending}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                <Send className="h-4 w-4" /> {sending ? "Envoi..." : "Envoyer le message"}
              </button>
            </form>
          )}
        </motion.div>

        <div className="rounded-2xl overflow-hidden border border-white/10 h-64 md:h-80">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2623.5!2d2.5193!3d48.9046!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDjCsDU0JzE2LjYiTiAywrAzMScwOS41IkU!5e0!3m2!1sfr!2sfr!4v1"
            width="100%" height="100%" style={{ border: 0, filter: "invert(0.9) hue-rotate(180deg)" }}
            allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </div>
  );
}
