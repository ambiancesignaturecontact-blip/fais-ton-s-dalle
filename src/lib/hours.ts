// ─── Horaires du restaurant : source de vérité unique ──────────
//
// Les horaires sont stockés dans la table Supabase `settings` (ligne
// id = 1, colonne `hours` en JSON) et exposés par /api/settings.
// L'application mobile ET l'admin du site lisent/écrivent cette même
// ligne : il n'y a aucun horaire en dur dans les écrans clients.
//
// Format de `hours` :
//   { "0": { "open": "11:30", "close": "03:00" }, …, "6": null }
//   clés 0..6 = jour JS getDay() (0 = dimanche, 1 = lundi … 6 = samedi)
//   null = jour de fermeture
//   close < open (ex. 11:30 → 03:00) = fermeture après minuit

export type DayHours = { open: string; close: string } | null;
export type WeekHours = Record<string, DayHours>;

export type RestaurantSettings = {
  closed_now: boolean;
  closed_message: string;
  closed_until: string | null;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  prep_minutes: number;
  hours: WeekHours;
};

/** Horaires par défaut : 7j/7, 11h30 → 03h00 */
export const DEFAULT_HOURS: WeekHours = {
  "0": { open: "11:30", close: "03:00" },
  "1": { open: "11:30", close: "03:00" },
  "2": { open: "11:30", close: "03:00" },
  "3": { open: "11:30", close: "03:00" },
  "4": { open: "11:30", close: "03:00" },
  "5": { open: "11:30", close: "03:00" },
  "6": { open: "11:30", close: "03:00" },
};

export const DEFAULT_SETTINGS: RestaurantSettings = {
  closed_now: false,
  closed_message: "",
  closed_until: null,
  accepts_delivery: true,
  accepts_pickup: true,
  prep_minutes: 20,
  hours: DEFAULT_HOURS,
};

export const DAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Normalise une heure saisie côté app ("11:30", "11h30", "11.5", "9:00") */
export function normalizeTime(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  let m = s.match(/^(\d{1,2}):([0-5]\d)$/); // 11:30 / 9:05
  if (!m) m = s.match(/^(\d{1,2})h([0-5]\d)?$/); // 11h30 / 11h / 9h
  if (!m) m = s.match(/^(\d{1,2})\.([0-5]\d)$/); // 11.30
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] !== undefined ? Number(m[2]) : 0;
  if (h > 24 || (h === 24 && min > 0)) return null;
  const hh = h === 24 ? 0 : h;
  return `${String(hh).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function slotFromUnknown(raw: unknown): DayHours | undefined {
  // undefined = jour absent (on ne le force pas), null = fermé
  if (raw === null) return null;
  if (!raw || typeof raw !== "object") return undefined;
  const open = normalizeTime((raw as { open?: unknown }).open);
  const close = normalizeTime((raw as { close?: unknown }).close);
  if (!open || !close || open === close) return undefined;
  return { open, close };
}

/**
 * Normalisation TOLÉRANTE des horaires tels qu'écrits par l'app ou un
 * autre client. Accepte :
 *  - clés JS "0".."6" (0 = dimanche) — format officiel du site ;
 *  - clés "1".."7" où 7 = dimanche (lundi = 1, convention courante) ;
 *  - un tableau de 7 entrées [lun..dim] ;
 *  - heures "11:30", "11h30", "9:05", "11h" ;
 *  - jours manquants (considérés fermés) et jours explicitement null.
 * Retourne null si aucune journée ouverte valide ne peut être lue :
 * l'appelant retombe alors sur les horaires par défaut.
 */
export function normalizeHours(input: unknown): WeekHours | null {
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (Array.isArray(input)) {
    // tableau lundi..dimanche (7 postes)
    if (input.length !== 7) return null;
    const obj: Record<string, unknown> = {};
    const mondayFirst = [1, 2, 3, 4, 5, 6, 0];
    input.forEach((v, i) => {
      obj[String(mondayFirst[i])] = v;
    });
    input = obj;
  }
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;

  // Convention lundi=1 … dimanche 7 : on ramène 7 → 0
  if (!("0" in src) && "7" in src) {
    src["0"] = src["7"];
    delete src["7"];
  }

  const out: WeekHours = {};
  let openDays = 0;
  for (let d = 0; d < 7; d++) {
    if (!(String(d) in src)) {
      out[String(d)] = null; // jour non fourni = fermé
      continue;
    }
    const slot = slotFromUnknown(src[String(d)]);
    if (slot === undefined) return null; // valeur illisible : prudence
    out[String(d)] = slot;
    if (slot) openDays++;
  }
  return openDays > 0 ? out : null;
}

/**
 * Valide des horaires reçus de l'admin : exactement 7 jours au format
 * HH:MM, tous présents (null = fermé). Stricte, contrairement à
 * normalizeHours utilisé pour les écritures potentielles de l'app.
 */
export function parseHours(input: unknown): WeekHours | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const out: WeekHours = {};
  for (let d = 0; d < 7; d++) {
    const raw = src[String(d)];
    if (raw === null) {
      out[String(d)] = null;
      continue;
    }
    if (!raw || typeof raw !== "object") return null;
    const { open, close } = raw as { open?: unknown; close?: unknown };
    if (typeof open !== "string" || typeof close !== "string") return null;
    if (!HHMM.test(open) || !HHMM.test(close)) return null;
    if (open === close) return null; // plage vide ou 24 h : ambigu
    out[String(d)] = { open, close };
  }
  return out;
}

/**
 * Lit les réglages courants via /api/settings (même endpoint que l'app).
 * `no-store` : une fermeture en urgence ou un horaire modifié depuis
 * l'application doit se voir tout de suite sur le site.
 * Retourne null si le réseau échoue — l'appelant garde ses valeurs.
 */
export async function fetchSettings(): Promise<RestaurantSettings | null> {
  try {
    const r = await fetch(`/api/settings?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json();
    return {
      ...DEFAULT_SETTINGS,
      ...j,
      hours: j?.hours ?? DEFAULT_HOURS,
    };
  } catch {
    return null;
  }
}

/** "11:30" → 690 minutes */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** "03:00" → "3h", "11:30" → "11h30", "23:00" → "23h" */
export function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** Une Date → "1h05" (heures sur 24 h, sans zéro initial) */
export function formatClock(date: Date): string {
  return `${date.getHours()}h${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Formatage des heures DANS LE PETIT ENCADRÉ vivant (carré vert/rouge).
 * Même style compact que formatHour, mais minuit s'écrit "00h00"
 * (jamais "0h", jugé ambigu) et une Date minuit donne aussi "00h00".
 */
export function formatPanelHour(hhmm: string): string {
  if (hhmm === "00:00") return "00h00";
  return formatHour(hhmm);
}

/** Équivalent Date de formatPanelHour : minuit → "00h00" */
export function formatPanelClock(date: Date): string {
  if (date.getHours() === 0 && date.getMinutes() === 0) return "00h00";
  return formatClock(date);
}

function atTime(day: Date, hhmm: string): Date {
  const d = new Date(day);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export type Session = {
  start: Date;
  end: Date;
  open: string;
  close: string;
};

/**
 * La session en cours à l'instant `now`, ou null si fermé.
 * On regarde aussi la veille : une plage qui traverse minuit
 * (11:30 → 03:00) est encore ouverte aux petites heures du matin.
 */
export function getActiveSession(
  hours: WeekHours,
  now: Date
): Session | null {
  for (const offset of [-1, 0]) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const slot = hours[String(day.getDay())];
    if (!slot) continue;

    const start = atTime(day, slot.open);
    const end = atTime(day, slot.close);
    if (toMinutes(slot.close) <= toMinutes(slot.open)) {
      end.setDate(end.getDate() + 1); // fermeture après minuit
    }
    if (now.getTime() >= start.getTime() && now.getTime() < end.getTime()) {
      return { start, end, open: slot.open, close: slot.close };
    }
  }
  return null;
}

export type NextOpening = {
  date: Date;
  /** 0 = aujourd'hui, 1 = demain… */
  dayOffset: number;
  open: string;
};

/** La prochaine réouverture (cherche sur les 8 jours à venir). */
export function getNextOpening(
  hours: WeekHours,
  now: Date
): NextOpening | null {
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const slot = hours[String(day.getDay())];
    if (!slot) continue;
    const date = atTime(day, slot.open);
    if (date.getTime() > now.getTime()) {
      return { date, dayOffset: offset, open: slot.open };
    }
  }
  return null;
}

function reopeningLabel(next: NextOpening): string {
  const time = formatHour(next.open);
  if (next.dayOffset === 0) return `Réouverture à ${time}`;
  if (next.dayOffset === 1) return `Réouverture demain à ${time}`;
  return `Réouverture ${DAY_LABELS[next.date.getDay()].toLowerCase()} à ${time}`;
}

export type LiveStatus = {
  /** urgent = 2 dernières heures, open = ouvert, closed = fermé */
  tone: "urgent" | "open" | "closed";
  line1: string;
  line2?: string;
};

/**
 * Ce que le petit panneau fixe doit afficher à l'instant `now`,
 * calculé à partir des réglages dynamiques (ceux que l'app modifie).
 */
export function describeSettings(
  s: RestaurantSettings,
  now: Date
): LiveStatus {
  // Fermeture exceptionnelle / temporaire pilotée depuis l'app
  if (s.closed_now) {
    const next = getNextOpening(s.hours, now);
    return {
      tone: "closed",
      line1: s.closed_message
        ? `⛔ ${s.closed_message.slice(0, 34)}`
        : "⛔ Fermé exceptionnellement",
      line2: next ? reopeningLabel(next) : undefined,
    };
  }

  const session = getActiveSession(s.hours, now);

  if (session) {
    const minsLeft = Math.floor((session.end.getTime() - now.getTime()) / 60000);

    // Deux dernières heures : alerte + heure de livraison garantie
    if (minsLeft >= 0 && minsLeft <= 120) {
      const h = Math.floor(minsLeft / 60);
      const m = minsLeft % 60;
      const line1 =
        h > 0
          ? `⏰ Plus que ${h}h${String(m).padStart(2, "0")}`
          : `⏰ Plus que ${m} min`;
      // On ne promet pas une livraison après la fermeture
      const deliveredAt = new Date(
        Math.min(now.getTime() + 30 * 60000, session.end.getTime())
      );
      return {
        tone: "urgent",
        line1,
        line2: `Livré avant ${formatPanelClock(deliveredAt)}`,
      };
    }

    const action = s.accepts_delivery ? "Livraison" : "Retrait";
    return {
      tone: "open",
      line1: `🌙 ${action} jusqu'à ${formatPanelHour(session.close)}`,
      line2: `Ouvert ${formatPanelHour(session.open)} → ${formatPanelHour(session.close)}`,
    };
  }

  // Fermé : on indique la prochaine réouverture réelle
  const next = getNextOpening(s.hours, now);
  if (!next) return { tone: "closed", line1: "Fermé pour le moment" };
  return { tone: "closed", line1: reopeningLabel(next) };
}

// ─── Helpers d'affichage (footer, hero, page contact, emails…) ──

/** Jours en ordre lundi → dimanche (clés getDay() JS) */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DAY_LABELS_SHORT = [
  "", // indice getDay() : 0 = dimanche
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
];

export const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function slotKey(slot: DayHours): string {
  return slot ? `${slot.open}-${slot.close}` : "__closed__";
}

/** "11h30-3h" (le tiret seul, pour les badges compacts) */
export function formatRange(slot: DayHours): string {
  if (!slot) return "Fermé";
  return `${formatHour(slot.open)}-${formatHour(slot.close)}`;
}

/** "11h30 - 3h" (espaces, pour les listings) */
export function formatRangeSpaced(slot: DayHours): string {
  if (!slot) return "Fermé";
  return `${formatHour(slot.open)} - ${formatHour(slot.close)}`;
}

/**
 * "3h du matin" quand on ferme après minuit (close ≤ 12h),
 * sinon "23h". Pour les phrases : « de 11h30 à 3h du matin ».
 */
export function formatCloseLong(slot: DayHours): string {
  if (!slot) return "";
  const crosses = toMinutes(slot.close) < toMinutes(slot.open);
  const closeH = Number(slot.close.split(":")[0]);
  const base = formatHour(slot.close);
  return crosses && closeH < 12 ? `${base} du matin` : base;
}

/** "de 11h30 à 3h du matin" */
export function fromToSentence(slot: DayHours): string {
  if (!slot) return "fermé";
  return `de ${formatHour(slot.open)} à ${formatCloseLong(slot)}`;
}

/** Plage la plus fréquente de la semaine — celle à montrer en vignette */
export function mainSlot(hours: WeekHours): DayHours {
  const counts = new Map<string, { slot: DayHours; n: number }>();
  for (const d of WEEK_ORDER) {
    const slot = hours[String(d)] ?? null;
    if (!slot) continue;
    const k = slotKey(slot);
    const cur = counts.get(k);
    if (cur) cur.n++;
    else counts.set(k, { slot, n: 1 });
  }
  let best: DayHours = null;
  let bestN = 0;
  for (const { slot, n } of counts.values()) {
    if (n > bestN) {
      best = slot;
      bestN = n;
    }
  }
  return best ?? DEFAULT_HOURS["1"];
}

export function openDayCount(hours: WeekHours): number {
  return WEEK_ORDER.filter((d) => hours[String(d)]).length;
}

export type HoursGroup = { days: number[]; slot: DayHours };

/** Regroupe les jours consécutifs ayant la même plage (ou fermés). */
export function groupHours(hours: WeekHours): HoursGroup[] {
  const groups: HoursGroup[] = [];
  for (const d of WEEK_ORDER) {
    const slot = hours[String(d)] ?? null;
    const last = groups[groups.length - 1];
    if (last && slotKey(last.slot) === slotKey(slot)) {
      last.days.push(d);
    } else {
      groups.push({ days: [d], slot });
    }
  }
  return groups;
}

/** "Lun" ou "Lun au Ven" (noms courts, début de phrase géré ailleurs) */
export function shortDaysLabel(days: number[]): string {
  if (days.length === 1) return DAY_LABELS_SHORT[days[0]];
  return `${DAY_LABELS_SHORT[days[0]]} au ${DAY_LABELS_SHORT[days[days.length - 1]]}`;
}

/** "Lundi" ou "Lundi au vendredi" */
export function longDaysLabel(days: number[]): string {
  if (days.length === 1) return DAY_LABELS[days[0]];
  return `${DAY_LABELS[days[0]]} au ${DAY_LABELS[days[days.length - 1]].toLowerCase()}`;
}

/**
 * Résumé compact sur une ligne : "11h30-3h · 7j/7" si semaine uniforme,
 * sinon les groupes : "11h30-3h Lun au Jeu · Ven fermé · 18h-23h Sam-Dim".
 */
export function summarizeHours(hours: WeekHours): string {
  const groups = groupHours(hours);
  if (
    groups.length === 1 &&
    groups[0].days.length === 7 &&
    groups[0].slot !== null
  ) {
    return `${formatRange(groups[0].slot)} · 7j/7`;
  }
  return groups
    .map((g) =>
      g.slot
        ? `${formatRange(g.slot)} ${shortDaysLabel(g.days)}`
        : `${shortDaysLabel(g.days)} fermé`
    )
    .join(" · ");
}

/** "7j/7" ou, si un jour de repos existe, "6j/7 (fermé le mardi)" */
export function daysOpenText(hours: WeekHours, long = false): string {
  const n = openDayCount(hours);
  if (n === 7) return long ? "7 jours sur 7" : "7j/7";
  const closed = WEEK_ORDER.filter((d) => !hours[String(d)]);
  const names = closed.map((d) => DAY_LABELS[d].toLowerCase());
  const list =
    names.length <= 2 ? names.join(" et ") : `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
  return long
    ? `6 jours sur 7 (fermé ${list})`
    : `${n}j/7 (fermé ${list})`;
}

export type WeekRow = { day: number; label: string; slot: DayHours; text: string };

/** Une ligne par jour (lundi → dimanche) pour la page contact */
export function weeklyRows(hours: WeekHours): WeekRow[] {
  return WEEK_ORDER.map((d) => {
    const slot = hours[String(d)] ?? null;
    return {
      day: d,
      label: DAY_LABELS[d],
      slot,
      text: slot ? formatRangeSpaced(slot) : "Fermé",
    };
  });
}

export type OpeningSpec = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

/** Spécifications schema.org à partir des horaires (un groupe par plage) */
export function openingHoursSpecs(hours: WeekHours): OpeningSpec[] {
  return groupHours(hours)
    .filter((g) => g.slot !== null)
    .map((g) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: g.days.map((d) => SCHEMA_DAYS[d]),
      opens: g.slot!.open,
      closes: g.slot!.close,
    }));
}

/** Plage du jour (pour un badge « aujourd'hui »), sinon la plage principale */
export function todayRange(hours: WeekHours, now: Date): DayHours {
  return hours[String(now.getDay())] ?? mainSlot(hours);
}
