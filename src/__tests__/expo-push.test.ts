// ─── 🔴 « Je ne reçois rien quand il y a une commande » ────────
//
// Cause trouvée le 02/10/2026 en interrogeant Expo avec les deux
// jetons réellement enregistrés :
//
//   PUSH_TOO_MANY_EXPERIENCE_IDS
//   details: { "@ktrr931/ftsd-ios": ["ExponentPushToken[-t8k…]"],
//              "@ktrr931/ftsd-go" : ["ExponentPushToken[EDqk…]"] }
//
// Les deux téléphones du restaurant venaient de deux projets Expo
// différents (l'app actuelle et l'ancienne, encore installée).
// Expo refuse LA REQUÊTE ENTIÈRE dans ce cas : aucune des deux
// notifications ne partait. Envoyés séparément, les deux jetons
// répondent `ok`.

import fs from "fs";
import path from "path";
import { envoyerExpo } from "@/lib/expo-push";

const vraiFetch = global.fetch;
afterEach(() => { global.fetch = vraiFetch; jest.resetAllMocks(); });

function fauxExpo(reponses: (corps: unknown[]) => unknown) {
  const appels: unknown[][] = [];
  global.fetch = jest.fn(async (_url: unknown, init?: { body?: string }) => {
    const corps = JSON.parse(String(init?.body ?? "[]"));
    appels.push(corps);
    return { ok: true, json: async () => reponses(corps) } as Response;
  }) as unknown as typeof fetch;
  return appels;
}

const msg = (t: string) => ({ to: t, title: "x", body: "y" });

describe("Deux projets Expo dans la même requête", () => {
  test("le lot refusé est réessayé message par message", async () => {
    const appels = fauxExpo((corps) =>
      corps.length > 1
        ? { errors: [{ code: "PUSH_TOO_MANY_EXPERIENCE_IDS" }] }
        : { data: [{ status: "ok" }] }
    );

    const r = await envoyerExpo([
      msg("ExponentPushToken[APP-NEUVE]"),
      msg("ExponentPushToken[APP-ANCIENNE]"),
    ]);

    // 1 lot groupé refusé, puis 2 envois individuels réussis
    expect(appels).toHaveLength(3);
    expect(r.sent).toBe(2);
    expect(r.errors).toBe(0);
  });

  test("sans ce repli, les deux téléphones seraient perdus", async () => {
    // Démonstration du comportement d'AVANT : un seul envoi groupé.
    const appels = fauxExpo(() => ({
      errors: [{ code: "PUSH_TOO_MANY_EXPERIENCE_IDS" }],
    }));
    const r = await envoyerExpo([msg("ExponentPushToken[A]")]);
    expect(appels).toHaveLength(1);
    expect(r.sent).toBe(0);
  });
});

describe("Hygiène des jetons", () => {
  test("un téléphone qui a désinstallé l'app est repéré", async () => {
    fauxExpo(() => ({
      data: [{ status: "error", details: { error: "DeviceNotRegistered" } }],
    }));
    const r = await envoyerExpo([msg("ExponentPushToken[MORT]")], false);
    expect(r.invalides).toEqual(["ExponentPushToken[MORT]"]);
    expect(r.errors).toBe(1);
  });

  test("les jetons qui ne sont pas des jetons Expo sont ignorés", async () => {
    const appels = fauxExpo(() => ({ data: [] }));
    const r = await envoyerExpo([msg(""), msg("pas-un-jeton")]);
    expect(appels).toHaveLength(0);
    expect(r.sent).toBe(0);
  });

  test("au-delà de 100 destinataires, on découpe", async () => {
    const appels = fauxExpo((c) => ({ data: c.map(() => ({ status: "ok" })) }));
    const r = await envoyerExpo(
      Array.from({ length: 250 }, (_, i) => msg(`ExponentPushToken[C${i}]`))
    );
    expect(appels.map((a) => a.length)).toEqual([100, 100, 50]);
    expect(r.sent).toBe(250);
  });
});

describe("Un seul chemin d'envoi dans tout le site", () => {
  const lire = (p: string) =>
    fs.readFileSync(path.join(process.cwd(), "src", p), "utf8");

  test("plus aucun appel direct à exp.host en dehors du module", () => {
    for (const f of [
      "lib/notifier-client.ts",
      "app/api/push/expo/route.ts",
      "app/api/recap/route.ts",
    ]) {
      expect(lire(f)).not.toContain("exp.host");
    }
  });
});
