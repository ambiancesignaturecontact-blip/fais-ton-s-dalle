"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, Package } from "lucide-react";
import { login, register} from "@/lib/auth";
import { toast } from "sonner";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifiedMsg, setVerifiedMsg] = useState("");

  useEffect(() => {
    const verified = searchParams.get("verified");
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (emailParam) setEmail(emailParam);
    if (verified === "true") setMode("login");

    if (verified === "true") {
      setVerifiedMsg("✅ Email confirmé ! Connectez-vous.");
      toast.success("Email confirmé !");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const result = await login(email, password);
      if (result.success) {
        toast.success(`Bon retour ${result.name} !`);
        router.push("/compte");
      } else {
        toast.error(result.error || "Erreur de connexion");
      }
    } else {
      if (!name.trim()) { toast.error("Veuillez entrer votre nom"); setLoading(false); return; }
      const result = await register(email, password, name);
      if (result.success) {
        setMode("login");
        toast.success("Compte créé ! Vérifie tes emails 📧");
        // Envoi de l'email de confirmation
        fetch("/api/auth/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, token: "vt_" + Math.random().toString(36).substring(2, 10) }),
        }).then(async (res) => {
          const data = await res.json();
          if (data.demo && data.confirmLink) {
            // Mode démo : afficher le lien cliquable
            setVerifiedMsg('🧪 Mode démo — <a href="' + data.confirmLink + '" style="color:#86efac;font-weight:bold;text-decoration:underline;">Clique ici pour confirmer ton email</a>');
          }
        }).catch(() => {});
      } else {
        toast.error(result.error || "Erreur d'inscription");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0808] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Package className="h-10 w-10 text-brand-red mx-auto" />
          </Link>
          <h1 className="font-heading text-2xl tracking-wider text-white">
            {mode === "login" ? "Connexion" : "Inscription"}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {mode === "login" ? "Connectez-vous pour commander" : "Créez votre compte fidélité"}
          </p>
        </div>

        {verifiedMsg && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <div className="text-sm text-green-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: verifiedMsg }} />
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex mb-6 bg-white/5 rounded-xl p-0.5">
            <button onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "login" ? "bg-brand-red text-white" : "text-white/50"}`}>
              Connexion
            </button>
            <button onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "register" ? "bg-brand-red text-white" : "text-white/50"}`}>
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input type="text" placeholder="Votre prénom *" value={name} required
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input type="email" placeholder="votre@email.fr *" value={email} required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input type={showPwd ? "text" : "password"} placeholder="Mot de passe *" value={password} required minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-red/50" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-white/30 text-xs mt-4">
              Pas encore de compte ?{" "}
              <button onClick={() => setMode("register")} className="text-brand-red font-semibold hover:underline">Inscrivez-vous</button>
            </p>
          )}

          <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <p className="text-[11px] text-amber-300/80 text-center leading-relaxed">
              🎁 <strong className="text-amber-300">Programme fidélité :</strong> 6 menus achetés → 10% de réduction sur tout !
            </p>
          </div>
        </div>

        <Link href="/" className="block text-center text-white/30 hover:text-white/50 text-xs mt-6">
          ← Retour au site
        </Link>
      </motion.div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0808] flex items-center justify-center"><p className="text-white/50">Chargement...</p></div>}>
      <ConnexionForm />
    </Suspense>
  );
}
