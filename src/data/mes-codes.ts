// ─── « Mes codes promo » côté site ────────────────────────────
//
// Même idée que dans l'application : le client retrouve ses codes
// dans son compte, avec leur état, au lieu de les noter quelque part
// puis de les perdre.
//
// Deux sources :
//   · ses codes PERSONNELS (récompense d'avis), rattachés à son
//     e-mail ou à son téléphone ;
//   · les codes PUBLICS encore valables, servis par /api/promos.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface MonCode {
  code: string;
  discount: number;
  type: "percent" | "fixed";
  label: string;
  personal: boolean;
  expiresAt: string | null;
  used: boolean;
  expired: boolean;
}

type LignePromo = {
  code: string;
  discount: number | string;
  type: string | null;
  label: string | null;
  max_uses: number | null;
  uses: number | null;
  expires_at: string | null;
};

function mettreEnForme(r: LignePromo, personal: boolean): MonCode {
  const expired = r.expires_at
    ? new Date(r.expires_at).getTime() < Date.now()
    : false;
  const used = r.max_uses !== null && Number(r.uses ?? 0) >= Number(r.max_uses);
  return {
    code: r.code,
    discount: Number(r.discount) || 0,
    type: r.type === "fixed" ? "fixed" : "percent",
    // L'étiquette interne « avis:<commande> » ne doit jamais s'afficher
    label: personal ? "Merci pour votre avis" : (r.label ?? ""),
    personal,
    expiresAt: r.expires_at,
    used,
    expired,
  };
}

/** Codes du client (personnels) + codes publics en cours */
export async function getMesCodes(
  email?: string | null,
  phone?: string | null
): Promise<MonCode[]> {
  const out: MonCode[] = [];

  // ─── Personnels ───────────────────────────────────────────
  if (isSupabaseConfigured() && (email || phone)) {
    try {
      const filtres = [
        email ? `owner_email.eq.${email.toLowerCase()}` : "",
        phone ? `owner_phone.eq.${phone.replace(/\D/g, "")}` : "",
      ].filter(Boolean).join(",");

      const { data, error } = await supabase!
        .from("promo_codes")
        .select("code,discount,type,label,max_uses,uses,expires_at")
        .or(filtres)
        .order("expires_at", { ascending: false });

      // Colonnes pas encore créées en base : on n'affiche rien
      // plutôt que de faire planter la page.
      if (!error && Array.isArray(data)) {
        for (const r of data as LignePromo[]) out.push(mettreEnForme(r, true));
      }
    } catch {
      /* silencieux */
    }
  }

  // ─── Publics ──────────────────────────────────────────────
  try {
    const res = await fetch("/api/promos", { cache: "no-store" });
    if (res.ok) {
      const j = (await res.json()) as { promos?: Array<Record<string, unknown>> };
      for (const p of j.promos ?? []) {
        out.push(
          mettreEnForme(
            {
              code: String(p.code),
              discount: Number(p.discount) || 0,
              type: String(p.type ?? "percent"),
              label: (p.label as string) ?? "",
              max_uses: null,
              uses: 0,
              expires_at: null,
            },
            false
          )
        );
      }
    }
  } catch {
    /* hors ligne : on garde les personnels */
  }

  return out;
}

/** Libellé de la remise : « -10 % » ou « -3,00 € » */
export function remiseTexte(c: MonCode): string {
  return c.type === "fixed"
    ? `-${c.discount.toFixed(2).replace(".", ",")} €`
    : `-${c.discount} %`;
}

/** « 30/10/2026 » */
export function jourFr(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
