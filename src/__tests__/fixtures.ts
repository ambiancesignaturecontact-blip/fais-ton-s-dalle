import { DEFAULT_SETTINGS, type WeekHours } from "../lib/hours";

export { DEFAULT_SETTINGS };

/** Semaine type 18h–23h, tous les jours ouverts. */
export const sameDayHoursFixture: WeekHours = Object.fromEntries(
  [0, 1, 2, 3, 4, 5, 6].map((d) => [
    String(d),
    { open: "18:00", close: "23:00" },
  ])
);
