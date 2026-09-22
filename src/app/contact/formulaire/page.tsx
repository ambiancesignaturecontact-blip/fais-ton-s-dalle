"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, CheckCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ContactFormulairePage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
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
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "contact@faistonsdalle.com",
          subject: `📩 Nouveau message de ${form.name}`,
          html: `
            <h2>Nouveau message depuis le site</h2>
            <p><strong>Nom :</strong> ${form.name}</p>
            <p><strong>Email :</strong> ${form.email}</p>
            <hr/>
            <p>${form.message.replace(/\n/g, "<br/>")}</p>
          `,
        }),
      });
      if (res.ok) {
        setSent(true);
        toast.success("Message envoyé !");
      } else {
        toast.error("Erreur d'envoi");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h1 className="font-heading text-2xl text-white mb-2">Message envoyé !</h1>
          <p className="text-white/60 text-sm mb-6">On te répond dans les plus brefs délais.</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold text-sm">Retour à l&apos;accueil</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] py-20 px-4">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">← Retour</Link>
        
        <h1 className="font-heading text-3xl tracking-wider text-white mb-2">Nous contacter</h1>
        <p className="text-white/50 text-sm mb-8">Une question ? Une réclamation ? Écris-nous !</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Ton nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-red/50 transition-colors" />
          <input type="email" placeholder="Ton email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-red/50 transition-colors" />
          <textarea placeholder="Ton message *" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-red/50 transition-colors resize-none" />
          <button type="submit" disabled={sending}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-red-light text-white font-bold text-sm shadow-lg shadow-brand-red/20 hover:scale-[1.02] transition-all disabled:opacity-50">
            {sending ? "Envoi..." : <><Send className="h-4 w-4 inline mr-2" />Envoyer</>}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-white/10">
          <p className="text-white/40 text-xs mb-3">Ou contacte-nous directement sur WhatsApp</p>
          <a href="https://wa.me/33672044875" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:scale-105 transition-all">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
