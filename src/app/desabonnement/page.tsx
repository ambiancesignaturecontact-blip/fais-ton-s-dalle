"use client";

// Page de retrait de la liste de diffusion, atteinte depuis le bas
// de chaque e-mail d'annonce.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Contenu() {
  const params = useSearchParams();
  const email = params.get("e") ?? "";
  const sig = params.get("s") ?? "";
  const [etat, setEtat] = useState<"attente" | "ok" | "erreur">("attente");
  const [msg, setMsg] = useState("");

  const retirer = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/desabonnement?e=${encodeURIComponent(email)}&s=${encodeURIComponent(sig)}`
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Lien invalide");
      setEtat("ok");
    } catch (e) {
      setEtat("erreur");
      setMsg(e instanceof Error ? e.message : "Lien invalide");
    }
  }, [email, sig]);

  useEffect(() => {
    const t = setTimeout(retirer, 0);
    return () => clearTimeout(t);
  }, [retirer]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0E0E10] px-6 text-center">
      <div className="max-w-sm">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#E9B860]">
          FAIS TON S&apos;DALLE
        </p>

        {etat === "attente" && (
          <p className="mt-6 text-sm text-white/50">Un instant…</p>
        )}

        {etat === "ok" && (
          <>
            <p className="mt-6 text-5xl">👋</p>
            <h1 className="mt-4 text-lg font-bold text-white">C&apos;est fait</h1>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Vous ne recevrez plus nos offres à l&apos;adresse{" "}
              <span className="text-white/80">{email}</span>.
              <br />
              Les e-mails liés à vos commandes (reçus, suivi) continuent
              d&apos;arriver : ce sont des messages de service.
            </p>
          </>
        )}

        {etat === "erreur" && (
          <>
            <p className="mt-6 text-5xl">🤔</p>
            <h1 className="mt-4 text-lg font-bold text-white">Lien invalide</h1>
            <p className="mt-2 text-sm text-white/55">{msg}</p>
            <p className="mt-2 text-xs text-white/35">
              Appelez-nous au 06 72 04 48 75, on s&apos;en occupe.
            </p>
          </>
        )}

        <Link
          href="/"
          className="mt-7 inline-block rounded-xl bg-[#C4161C] px-5 py-2.5 text-sm font-bold text-white"
        >
          Retour au site
        </Link>
      </div>
    </main>
  );
}

export default function PageDesabonnement() {
  return (
    <Suspense fallback={null}>
      <Contenu />
    </Suspense>
  );
}
