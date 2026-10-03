"use client";

// ─── Campagnes e-mail, depuis l'espace restaurateur ───────────
//
// Volontairement séparé des notifications :
//   · les notifications se pilotent dans l'application ;
//   · les campagnes e-mail se composent ici, sur un écran large,
//     avec aperçu en direct — c'est plus confortable qu'au pouce.
//
// Cinq modèles finis, modifiables mot pour mot. Un envoi d'essai à
// soi-même avant la diffusion : on ne découvre pas une faute de
// frappe dans la boîte de 300 clients.

import { useCallback, useEffect, useState } from "react";
import { Mail, Eye, Send, Loader2 } from "lucide-react";
import type { Modele } from "@/lib/modeles-email";

const COULEURS = [
  { nom: "Rouge maison", valeur: "#960E13" },
  { nom: "Brique", valeur: "#A8311B" },
  { nom: "Nuit", valeur: "#1F2A44" },
  { nom: "Or foncé", valeur: "#7A5A16" },
  { nom: "Vert", valeur: "#2E5B3E" },
];

export function CampagneEmailPanel({ adminPassword }: { adminPassword: string }) {
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [destinataires, setDestinataires] = useState<number | null>(null);

  const [objet, setObjet] = useState("");
  const [surtitre, setSurtitre] = useState("");
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [cta, setCta] = useState("");
  const [couleur, setCouleur] = useState(COULEURS[0].valeur);

  const [apercu, setApercu] = useState<string | null>(null);
  const [emailEssai, setEmailEssai] = useState("");
  const [occupe, setOccupe] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const entetes = useCallback(
    () => ({ "Content-Type": "application/json", "X-Admin-Auth": adminPassword }),
    [adminPassword]
  );

  useEffect(() => {
    let vivant = true;
    fetch("/api/campagne", { headers: { "X-Admin-Auth": adminPassword } })
      .then((r) => r.json())
      .then((j) => {
        if (!vivant) return;
        setModeles(j?.modeles ?? []);
        setDestinataires(typeof j?.destinataires === "number" ? j.destinataires : null);
      })
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, [adminPassword]);

  function choisir(m: Modele) {
    setObjet(m.objet);
    setSurtitre(m.surtitre);
    setTitre(m.titre);
    setMessage(m.message);
    setCta(m.cta);
    setCouleur(m.couleur);
    setApercu(null);
    setInfo(null);
  }

  const corps = () => ({ objet, surtitre, titre, message, cta, couleur });

  async function appeler(action: string, extra: Record<string, unknown> = {}) {
    setOccupe(action);
    setInfo(null);
    try {
      const r = await fetch("/api/campagne", {
        method: "POST",
        headers: entetes(),
        body: JSON.stringify({ action, ...corps(), ...extra }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Impossible");
      return j;
    } catch (e) {
      setInfo(e instanceof Error ? e.message : "Impossible");
      return null;
    } finally {
      setOccupe(null);
    }
  }

  async function voirApercu() {
    const j = await appeler("apercu");
    if (j?.html) setApercu(j.html);
  }

  async function envoyerEssai() {
    if (!emailEssai.trim()) {
      setInfo("Indiquez l'adresse qui doit recevoir l'essai.");
      return;
    }
    const j = await appeler("essai", { email: emailEssai.trim() });
    if (j?.success) setInfo(`Essai envoyé à ${j.email}. Vérifiez votre boîte.`);
  }

  async function envoyerTout() {
    const n = destinataires ?? 0;
    if (n === 0) {
      setInfo("Aucune adresse e-mail en base.");
      return;
    }
    if (
      !window.confirm(
        `Envoyer « ${objet || titre} » à ${n} client${n > 1 ? "s" : ""} ?\n\n` +
          "C'est immédiat et irréversible."
      )
    ) {
      return;
    }
    const j = await appeler("envoyer");
    if (j?.success) setInfo(j.message ?? "Envoyé");
  }

  const pret = titre.trim().length > 0 && message.trim().length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <Mail className="h-4 w-4" /> Campagne e-mail
          </h2>
          <p className="mt-0.5 text-[11px] text-white/40">
            {destinataires === null
              ? "Chargement…"
              : destinataires === 0
              ? "Aucune adresse e-mail en base pour l'instant."
              : `${destinataires} client${destinataires > 1 ? "s" : ""} recevront ce message.`}
            {" · "}Les notifications se gèrent séparément, dans l&apos;application.
          </p>
        </div>
      </header>

      {/* ─── Modèles ───────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap gap-2">
        {modeles.map((m) => (
          <button
            key={m.id}
            onClick={() => choisir(m)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left
                       transition hover:border-white/25 hover:bg-white/[0.07]"
          >
            <span className="mr-1">{m.emoji}</span>
            <span className="text-[12px] font-semibold text-white/85">{m.nom}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ─── Rédaction ───────────────────────────────────── */}
        <section className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Champ label="Objet de l'e-mail" valeur={objet} sur={setObjet}
                 exemple="Une nouveauté vous attend 🥖" max={120} />
          <Champ label="Petite phrase au-dessus du titre" valeur={surtitre} sur={setSurtitre}
                 exemple="NOUVEAU CHEZ NOUS" max={60} />
          <Champ label="Titre" valeur={titre} sur={setTitre}
                 exemple="On a ajouté quelque chose au menu" max={120} />

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">
              Message
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              maxLength={2000}
              placeholder="Une ligne vide crée un nouveau paragraphe."
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5
                         text-[13px] leading-6 text-white placeholder:text-white/25
                         outline-none focus:border-[#C4161C]"
            />
            <span className="text-[10px] text-white/25">{message.length}/2000</span>
          </label>

          <Champ label="Texte du bouton" valeur={cta} sur={setCta}
                 exemple="Voir le menu" max={40} />

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">
              Couleur
            </span>
            <div className="mt-1.5 flex gap-2">
              {COULEURS.map((c) => (
                <button
                  key={c.valeur}
                  onClick={() => setCouleur(c.valeur)}
                  title={c.nom}
                  style={{ background: c.valeur }}
                  className={
                    "h-7 w-7 rounded-full transition " +
                    (couleur === c.valeur
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#0E0E10]"
                      : "opacity-60 hover:opacity-100")
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Aperçu et envoi ─────────────────────────────── */}
        <section className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={voirApercu}
                disabled={!pret || occupe !== null}
                className="flex items-center gap-1.5 rounded-xl bg-white/8 px-3 py-2 text-[12px]
                           font-bold text-white/85 hover:bg-white/15 disabled:opacity-40"
              >
                {occupe === "apercu" ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                     : <Eye className="h-3.5 w-3.5" />}
                Aperçu
              </button>
              <input
                type="email"
                value={emailEssai}
                onChange={(e) => setEmailEssai(e.target.value)}
                placeholder="votre@email.fr"
                className="min-w-[160px] flex-1 rounded-xl border border-white/10 bg-black/40
                           px-3 py-2 text-[12px] text-white placeholder:text-white/25
                           outline-none focus:border-[#C4161C]"
              />
              <button
                onClick={envoyerEssai}
                disabled={!pret || occupe !== null}
                className="rounded-xl bg-white/8 px-3 py-2 text-[12px] font-bold text-white/85
                           hover:bg-white/15 disabled:opacity-40"
              >
                {occupe === "essai" ? "…" : "M'envoyer un essai"}
              </button>
            </div>

            <button
              onClick={envoyerTout}
              disabled={!pret || occupe !== null || !destinataires}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl
                         bg-[#C4161C] px-4 py-3 text-sm font-bold text-white
                         transition hover:brightness-110 disabled:opacity-40"
            >
              {occupe === "envoyer" ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Send className="h-4 w-4" />}
              Envoyer à {destinataires ?? 0} client{(destinataires ?? 0) > 1 ? "s" : ""}
            </button>

            {info && (
              <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-[12px] text-white/75">
                {info}
              </p>
            )}
            <p className="mt-2 text-[10px] leading-4 text-white/25">
              Chaque e-mail contient un lien de désabonnement : c&apos;est
              obligatoire, et c&apos;est ce qui évite que vos messages
              partent en indésirables.
            </p>
          </div>

          {apercu && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
              <iframe
                title="Aperçu de l'e-mail"
                srcDoc={apercu}
                sandbox=""
                className="h-[620px] w-full"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Champ({
  label, valeur, sur, exemple, max,
}: {
  label: string;
  valeur: string;
  sur: (v: string) => void;
  exemple: string;
  max: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">
        {label}
      </span>
      <input
        value={valeur}
        onChange={(e) => sur(e.target.value)}
        placeholder={exemple}
        maxLength={max}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5
                   text-[13px] text-white placeholder:text-white/25 outline-none
                   focus:border-[#C4161C]"
      />
    </label>
  );
}
