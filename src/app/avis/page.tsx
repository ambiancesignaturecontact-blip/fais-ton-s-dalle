"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: number;
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`text-2xl transition-all ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${
            star <= value ? "text-yellow-400" : "text-white/20"
          }`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function AvisPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Formulaire
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch {}
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReviews(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) {
      toast.error("Nom et commentaire requis");
      return;
    }
    if (formComment.length < 3) {
      toast.error("Commentaire trop court");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim() || null,
          rating: formRating,
          comment: formComment.trim(),
        }),
      });
      if (res.ok) {
        setSent(true);
        toast.success("Avis envoyé ! Il sera publié après modération.");
        setTimeout(() => {
          setSent(false);
          setShowForm(false);
          setFormName("");
          setFormEmail("");
          setFormRating(5);
          setFormComment("");
        }, 3000);
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSending(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-[#0d0808] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">
          ← Retour à l&apos;accueil
        </Link>

        {/* Photo équipe */}
        <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8 border-2 border-white/10 shadow-2xl">
          <Image src="/images/photo-equipe-groupe.webp" alt="L'équipe FAIS TON S'DALLE au complet" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl md:text-5xl tracking-wider text-white mb-4">Ce qu&apos;ils disent</h1>
          <div className="flex items-center justify-center gap-1 text-yellow-400 text-2xl mb-2">
            {avgRating !== "0.0" ? (
              <StarRating value={Math.round(parseFloat(avgRating))} readonly />
            ) : (
              "★★★★★"
            )}
          </div>
          <p className="text-lg text-white/60 font-semibold">
            {avgRating}/5 sur <span className="text-brand-red font-bold">{reviews.length}</span> avis
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-8 w-8 border-2 border-brand-red border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-white/40 text-sm">Chargement des avis...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
            <MessageSquare className="h-12 w-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Aucun avis pour le moment</p>
            <p className="text-white/30 text-xs mt-1">Soyez le premier à donner votre avis !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
            <AnimatePresence>
              {reviews.map((r, i) => (
                <motion.div key={r.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-2xl bg-[#1a0e0e] border border-white/20 hover:border-brand-red/50 transition-all shadow-xl shadow-black/40">
                  <div className="mb-4">
                    <StarRating value={r.rating} readonly />
                  </div>
                  <p className="text-base text-white font-semibold italic mb-3 leading-relaxed">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                  <p className="text-base font-bold text-brand-red border-t border-white/10 pt-3 mt-3">
                    — {r.name}
                    <span className="text-[10px] text-white/30 font-normal ml-2">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Formulaire d'avis */}
        {!showForm ? (
          <div className="text-center mb-8">
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-base hover:scale-105 transition-all shadow-lg">
              <Star className="h-5 w-5" /> Laisser un avis
            </button>
            <p className="text-white/30 text-xs mt-3">Votre avis nous aide à nous améliorer !</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="font-heading text-xl tracking-wider text-white mb-4">Donnez votre avis</h2>

            {sent ? (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold text-lg mb-1">Merci pour votre avis ! ✅</p>
                <p className="text-white/50 text-sm">Il sera publié après validation.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex items-center gap-4 mb-2">
                  <p className="text-white/60 text-sm font-medium">Votre note :</p>
                  <StarRating value={formRating} onChange={setFormRating} />
                </div>
                <div>
                  <input type="text" placeholder="Votre prénom *" value={formName} required
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
                </div>
                <div>
                  <input type="email" placeholder="Votre email (optionnel)" value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
                </div>
                <div>
                  <textarea placeholder="Votre commentaire *" rows={3} value={formComment} required
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50 resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                    <Send className="h-4 w-4" /> {sending ? "Envoi..." : "Envoyer mon avis"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-3 rounded-xl bg-white/5 text-white/50 text-sm font-bold hover:bg-white/10 transition-colors">
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* Photo sandwich */}
        <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden mb-8 border-2 border-white/10 shadow-xl">
          <Image src="/images/photo-sandwich-3.webp" alt="Un sandwich FAIS TON S'DALLE préparé avec soin" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-lg md:text-2xl font-heading tracking-wider text-center px-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              Envie de goûter ? <span className="text-brand-red font-bold">Commandez maintenant</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="https://share.google/ESPQC3Rl41mHxcUMy" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#25D366] text-white font-bold text-base hover:scale-105 transition-all shadow-lg shadow-[#25D366]/30">
            💬 Laisser un avis Google →
          </a>
          <Link href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 text-white/70 font-bold text-base hover:bg-white/10 hover:scale-105 transition-all border border-white/10">
            ← Retour au menu
          </Link>
        </div>
      </div>
    </div>
  );
}
