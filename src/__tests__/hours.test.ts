import {
  DEFAULT_HOURS,
  DEFAULT_SETTINGS,
  DAY_LABELS,
  daysOpenText,
  describeSettings,
  formatClock,
  formatHour,
  formatRange,
  formatRangeSpaced,
  fromToSentence,
  getActiveSession,
  getNextOpening,
  groupHours,
  mainSlot,
  openingHoursSpecs,
  parseHours,
  summarizeHours,
  weeklyRows,
  type RestaurantSettings,
  type WeekHours,
} from "../lib/hours";

// Mercredi 10 sept. 2026 = getDay() 4 ; on se base sur des dates fixes.
const tue = (h: number, m = 0) => new Date(2026, 8, 8, h, m); // mardi (2)
const wed = (h: number, m = 0) => new Date(2026, 8, 9, h, m); // mercredi (3)

const sameDayHours: WeekHours = Object.fromEntries(
  [0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), { open: "18:00", close: "23:00" }])
);

describe("formatHour", () => {
  test("formate les heures pile et demi", () => {
    expect(formatHour("03:00")).toBe("3h");
    expect(formatHour("23:00")).toBe("23h");
    expect(formatHour("11:30")).toBe("11h30");
  });
  test("formatClock", () => {
    expect(formatClock(wed(0, 5))).toBe("0h05");
    expect(formatClock(wed(23, 40))).toBe("23h40");
  });
  test("7 libellés de jour", () => expect(DAY_LABELS.length).toBe(7));
});

describe("getActiveSession — horaires par défaut 11h30→03h00", () => {
  test("ouvert l'après-midi : fin le lendemain 3h", () => {
    const s = getActiveSession(DEFAULT_HOURS, tue(12));
    expect(s).not.toBeNull();
    expect(s!.end.getDay()).toBe(3); // mercredi
    expect(s!.end.getHours()).toBe(3);
  });

  test("ouvert à 2h du matin via la session de la veille", () => {
    const s = getActiveSession(DEFAULT_HOURS, wed(2));
    expect(s).not.toBeNull();
    expect(s!.end.getDay()).toBe(3);
    expect(s!.end.getHours()).toBe(3);
    expect(s!.open).toBe("11:30");
  });

  test("fermé entre 3h et 11h30", () => {
    expect(getActiveSession(DEFAULT_HOURS, wed(5))).toBeNull();
    expect(getActiveSession(DEFAULT_HOURS, wed(11, 29))).toBeNull();
  });

  test("ouvert dès 11h30", () => {
    expect(getActiveSession(DEFAULT_HOURS, wed(11, 30))).not.toBeNull();
  });
});

describe("getActiveSession — plage jour 18h→23h", () => {
  test("ouvert à 22h, ferme à 23h le même jour", () => {
    const s = getActiveSession(sameDayHours, tue(22));
    expect(s).not.toBeNull();
    expect(s!.end.getDay()).toBe(2);
    expect(s!.end.getHours()).toBe(23);
  });
  test("fermé après 23h", () => {
    expect(getActiveSession(sameDayHours, tue(23, 30))).toBeNull();
  });
  test("fermé avant 18h", () => {
    expect(getActiveSession(sameDayHours, tue(17, 59))).toBeNull();
  });
});

describe("getNextOpening", () => {
  test("réouverture le jour même à 11h30", () => {
    const n = getNextOpening(DEFAULT_HOURS, wed(5));
    expect(n).not.toBeNull();
    expect(n!.dayOffset).toBe(0);
    expect(n!.open).toBe("11:30");
  });

  test("réouverture le lendemain après fermeture du soir", () => {
    const n = getNextOpening(sameDayHours, tue(23, 30));
    expect(n).not.toBeNull();
    expect(n!.dayOffset).toBe(1);
    expect(n!.date.getDay()).toBe(3);
    expect(n!.open).toBe("18:00");
  });

  test("saute le jour de fermeture hebdomadaire", () => {
    const hours: WeekHours = { ...sameDayHours, "2": null }; // mardi fermé
    const n = getNextOpening(hours, tue(19));
    expect(n).not.toBeNull();
    expect(n!.dayOffset).toBe(1);
    expect(n!.date.getDay()).toBe(3); // mercredi
  });

  test("null si tout est fermé", () => {
    const closed: WeekHours = Object.fromEntries(
      [0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), null])
    );
    expect(getNextOpening(closed, tue(12))).toBeNull();
  });
});

describe("describeSettings — messages du panneau bas-gauche", () => {
  test("l'après-midi : livraison jusqu'à l'heure de fermeture réelle", () => {
    const v = describeSettings(DEFAULT_SETTINGS, tue(12));
    expect(v.tone).toBe("open");
    expect(v.line1).toBe("🌙 Livraison jusqu'à 3h");
    expect(v.line2).toBe("Ouvert 11h30 → 3h");
  });

  test("horaires customs 18h-23h : affiche 23h, pas 3h", () => {
    const s: RestaurantSettings = {
      ...DEFAULT_SETTINGS,
      hours: sameDayHours,
    };
    const v = describeSettings(s, tue(20));
    expect(v.tone).toBe("open");
    expect(v.line1).toBe("🌙 Livraison jusqu'à 23h");
  });

  test("deux dernières heures de nuit : alerte et heure livraison", () => {
    const v = describeSettings(DEFAULT_SETTINGS, tue(1, 30));
    expect(v.tone).toBe("urgent");
    expect(v.line1).toBe("⏰ Plus que 1h30");
    expect(v.line2).toBe("Livré avant 2h00");
  });

  test("jamais de promesse de livraison après la fermeture", () => {
    const v = describeSettings(DEFAULT_SETTINGS, tue(2, 50));
    expect(v.tone).toBe("urgent");
    expect(v.line1).toBe("⏰ Plus que 10 min");
    expect(v.line2).toBe("Livré avant 3h00");
  });

  test("fermé le matin : réouverture calculée du jour", () => {
    const v = describeSettings(DEFAULT_SETTINGS, wed(5));
    expect(v.tone).toBe("closed");
    expect(v.line1).toBe("Réouverture à 11h30");
  });

  test("fermeture exceptionnelle depuis l'app : message + réouverture", () => {
    const s: RestaurantSettings = {
      ...DEFAULT_SETTINGS,
      closed_now: true,
      closed_message: "Congés, on revient vite",
    };
    const v = describeSettings(s, wed(5));
    expect(v.tone).toBe("closed");
    expect(v.line1).toContain("Congés");
    expect(v.line2).toBe("Réouverture à 11h30");
  });

  test("jour de fermeture hebdomadaire : réouverture le lendemain", () => {
    const s: RestaurantSettings = {
      ...DEFAULT_SETTINGS,
      hours: { ...sameDayHours, "2": null }, // mardi fermé
    };
    const v = describeSettings(s, tue(19));
    expect(v.tone).toBe("closed");
    expect(v.line1).toBe("Réouverture demain à 18h");
  });

  test("tout fermé : message générique", () => {
    const closed: WeekHours = Object.fromEntries(
      [0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), null])
    );
    const v = describeSettings(
      { ...DEFAULT_SETTINGS, hours: closed },
      tue(12)
    );
    expect(v.tone).toBe("closed");
    expect(v.line1).toBe("Fermé pour le moment");
  });

  test("livraison désactivée : propose le retrait", () => {
    const s: RestaurantSettings = {
      ...DEFAULT_SETTINGS,
      accepts_delivery: false,
    };
    const v = describeSettings(s, tue(12));
    expect(v.line1).toBe("🌙 Retrait jusqu'à 3h");
  });
});

describe("parseHours (validation partagée API)", () => {
  test("semaine par défaut valide", () => {
    expect(parseHours(DEFAULT_HOURS)).not.toBeNull();
  });
  test("rejette un horaire mal formé", () => {
    const bad = { ...DEFAULT_HOURS, "1": { open: "25:00", close: "03:00" } };
    expect(parseHours(bad)).toBeNull();
  });
  test("accepte les jours fermés (null)", () => {
    const h = { ...DEFAULT_HOURS, "2": null };
    expect(parseHours(h)?.["2"]).toBeNull();
  });
});

describe("helpers d'affichage", () => {
  test("formatRange", () => {
    expect(formatRange({ open: "11:30", close: "03:00" })).toBe("11h30-3h");
    expect(formatRange(null)).toBe("Fermé");
    expect(formatRangeSpaced({ open: "18:00", close: "23:00" })).toBe("18h - 23h");
  });

  test("fromToSentence ajoute « du matin » après minuit", () => {
    expect(fromToSentence({ open: "11:30", close: "03:00" })).toBe(
      "de 11h30 à 3h du matin"
    );
    expect(fromToSentence({ open: "18:00", close: "23:00" })).toBe(
      "de 18h à 23h"
    );
  });

  test("semaine uniforme : résumé compact + 7j/7", () => {
    expect(summarizeHours(DEFAULT_HOURS)).toBe("11h30-3h · 7j/7");
    expect(daysOpenText(DEFAULT_HOURS)).toBe("7j/7");
    expect(daysOpenText(DEFAULT_HOURS, true)).toBe("7 jours sur 7");
  });

  test("mainSlot = plage la plus fréquente", () => {
    const h: WeekHours = { ...sameDayHours };
    (h as Record<string, unknown>)["5"] = { open: "11:30", close: "03:00" };
    (h as Record<string, unknown>)["6"] = { open: "11:30", close: "03:00" };
    expect(mainSlot(h)).toEqual({ open: "18:00", close: "23:00" });
  });

  test("un jour de fermeture : résumé groupé et libellé des jours", () => {
    const h: WeekHours = { ...DEFAULT_HOURS, "2": null }; // mardi fermé
    expect(openCount(h)).toBe(6);
    expect(daysOpenText(h)).toContain("mardi");
    const groups = groupHours(h);
    // Lun ouvert / Mar fermé / Mer-Dim ouverts
    expect(groups[0].days).toEqual([1]);
    expect(groups[1].slot).toBeNull();
    expect(groups[1].days).toEqual([2]);
    expect(summarizeHours(h)).toContain("Mar fermé");
  });

  test("weeklyRows : 7 lignes lundi → dimanche, jour fermé noté", () => {
    const rows = weeklyRows({ ...DEFAULT_HOURS, "2": null });
    expect(rows).toHaveLength(7);
    expect(rows[0].label).toBe("Lundi");
    expect(rows[6].label).toBe("Dimanche");
    expect(rows[1].text).toBe("Fermé");
  });

  test("openingHoursSpecs schema.org : pas de spec les jours fermés", () => {
    const specs = openingHoursSpecs(DEFAULT_HOURS);
    expect(specs).toHaveLength(1);
    expect(specs[0].dayOfWeek).toHaveLength(7);
    expect(specs[0].opens).toBe("11:30");
    expect(specs[0].closes).toBe("03:00");

    const partial = openingHoursSpecs({ ...DEFAULT_HOURS, "2": null });
    const allDays = partial.flatMap((s) => s.dayOfWeek);
    expect(allDays).not.toContain("Tuesday");
    expect(allDays).toContain("Monday");
  });
});

function openCount(h: WeekHours): number {
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => h[String(d)]).length;
}
