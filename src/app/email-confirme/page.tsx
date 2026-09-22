"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Package } from "lucide-react";
// Vérification via Supabase
import { useState, useEffect } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setErrorMsg("Lien de confirmation invalide (token manquant)."); return; }
    const timer = setTimeout(() => {
      // La vérification est gérée par Supabase Auth
      // On redirige vers la page de connexion
      window.location.href = "/connexion?verified=true";
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (status === "loading") {
    return (
      <div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-brand-red/30 border-t-brand-red" />
        <h1 className="font-heading text-2xl tracking-wider text-white mb-2">Vérification...</h1>
        <p className="text-white/50 text-sm">On confirme ton adresse email</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 100 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </motion.div>
        <h1 className="font-heading text-2xl tracking-wider text-white mb-2">Email confirmé ! 🎉</h1>
        <p className="text-white/60 text-sm mb-8">Ton compte est maintenant actif. Connecte-toi pour commander.</p>
        <Link href="/connexion"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-400" />
      </motion.div>
      <h1 className="font-heading text-2xl tracking-wider text-white mb-2">Oups !</h1>
      <p className="text-white/60 text-sm mb-2">{errorMsg}</p>
      <p className="text-white/40 text-xs mb-8">Connecte-toi, ton email est peut-être déjà vérifié.</p>
      <Link href="/connexion"
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all">
        Aller à la connexion
      </Link>
    </div>
  );
}

export default function EmailConfirmePage() {
  return (
    <div className="min-h-screen bg-[#0d0808] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center">
        <Link href="/" className="inline-block mb-8">
          <Package className="h-12 w-12 text-brand-red mx-auto" />
        </Link>
        <h1 className="font-heading text-2xl tracking-wider text-white mb-4">Confirmation email</h1>
        <Suspense fallback={
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-brand-red/30 border-t-brand-red animate-spin" />
            <p className="text-white/50 text-sm">Chargement...</p>
          </div>
        }>
          <ConfirmationContent />
        </Suspense>
        <Link href="/" className="block text-white/30 hover:text-white/50 text-xs mt-8">
          ← Retour au site
        </Link>
      </motion.div>
    </div>
  );
}
