import { NextRequest, NextResponse } from "next/server";
import { notifierEquipe } from "@/lib/notifier-client";
import {
  remiseFidelite, remiseParrainage, consommerFidelite, consommerParrainage,
  plafonner, arrondi,
} from "@/lib/remises";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
import { prixLigne } from "@/lib/composition";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

const DELIVERY_FEE = 2.9;

/**
 * Total de la commande, calculé par le serveur.
 *
 * 🔴 Avant, les suppléments étaient comptés en cherchant le mot
 * « Crudité » dans la composition : quatre crudités comptaient pour
 * une seule (c'est l'ÉTIQUETTE du groupe qui était comptée). Aucun
 * supplément n'était donc facturé. Tout passe maintenant par
 * `lib/composition.ts`, partagé avec la modification de commande.
 */
function calculerTotal(
  items: { name: string; price?: number; qty?: number; custom?: string | null }[],
  mode: string
): number {
  let total = 0;
  for (const item of items) {
    total += prixLigne(item.name || "", item.custom, item.price) * (item.qty || 1);
  }
  if (mode === "livraison") total += DELIVERY_FEE;
  return Math.round(total * 100) / 100;
}

async function notifyDiscord(order: Record<string, unknown>) {
  if (!DISCORD_WEBHOOK) return;
  try {
    const itemsList = (order.order_items as Array<Record<string, unknown>>) || [];
    const items = itemsList.map((i: Record<string, unknown>) =>
      `${i.quantity}x ${i.item_name}${i.customization ? ` (${i.customization})` : ""}`
    ).join("\n") || "Aucun article";

    const embed = {
      embeds: [{
        title: `🛵 Nouvelle commande #${order.id}`,
        color: 0xd43d2b,
        fields: [
          { name: "Client", value: (order.customer_name as string) || "Anonyme", inline: true },
          { name: "Total", value: `${order.total}€`, inline: true },
          { name: "Mode", value: order.mode === "livraison" ? "🚚 Livraison" : "🥡 À emporter", inline: true },
          { name: "Téléphone", value: (order.customer_phone as string) || "Non renseigné", inline: true },
          { name: "Adresse", value: (order.address as string) || "Non renseignée", inline: true },
          { name: "Articles", value: items },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "FAIS TON S'DALLE — Commandes" },
      }],
    };
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embed),
    });
  } catch {
    console.error("❌ Discord notification failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerName, customerPhone, notes, source, mode, address, scheduledTime } = body;

    // Mode de reglement choisi par le client. « card » et « applepay »
    // passent par Stripe : la commande reste en attente de paiement.
    const payMethod = String(body?.payMethod ?? "").trim();
    const enLigne = payMethod === "card" || payMethod === "applepay";

    if (!items || !items.length) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // 🔥 SÉCURITÉ : Recalculer le total côté serveur
    const totalCatalogue = calculerTotal(items, mode || "livraison");
    if (totalCatalogue <= 0) {
      return NextResponse.json({ error: "Total invalide" }, { status: 400 });
    }

    // Les frais de livraison ne sont PAS remisables : une promotion
    // « -10 % » portait sur 18,80 € (articles + livraison) côté
    // serveur et sur 15,90 € (articles) côté application. Deux
    // montants différents pour la même commande.
    const fraisLivraison = (mode || "livraison") === "livraison" ? DELIVERY_FEE : 0;
    const articlesSeuls = arrondi(totalCatalogue - fraisLivraison);

    // ─── Code promo : validé ICI, jamais côté client ───────────
    //
    // Deux défauts corrigés d'un coup.
    //
    // 1. Le serveur ignorait purement et simplement les remises. Le
    //    client voyait 14,31 € après un code -10 %, mais la commande
    //    était enregistrée à 15,90 €. Stripe encaissait le montant
    //    remisé, la base en gardait un autre : la comptabilité était
    //    fausse à chaque promotion.
    //
    // 2. Le compteur `uses` n'était jamais incrémenté. Un code limité
    //    à 10 utilisations fonctionnait indéfiniment — `max_uses` ne
    //    servait à rien.
    //
    // On ne fait jamais confiance au montant annoncé par
    // l'application : seul le CODE est transmis, le serveur retrouve
    // la remise en base et l'applique lui-même.
    let remise = 0;
    let promoAppliquee: { code: string; uses: number } | null = null;
    const codePromo = String(body?.promoCode ?? "").trim().toUpperCase();

    // Identité du client pour ce code : e-mail en priorité, sinon
    // téléphone. Sert à deux choses : vérifier qu'un code personnel
    // appartient bien à celui qui l'utilise, et empêcher le même
    // client de repasser dix fois le même code public.
    const cleClient =
      String(body?.customerEmail ?? "").trim().toLowerCase() ||
      String(customerPhone ?? "").replace(/\D/g, "") ||
      "";

    if (codePromo && SUPABASE_URL && SUPABASE_KEY) {
      try {
        // Deux essais : avec les colonnes « propriétaire », puis sans.
        // Tant que le SQL n'a pas été passé en base, ces colonnes
        // n'existent pas et PostgREST répondrait 400 — toutes les
        // remises auraient disparu d'un coup.
        const entetes = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
        const base = `${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(codePromo)}&active=eq.true`;
        let pr = await fetch(
          `${base}&select=code,discount,type,max_uses,uses,expires_at,owner_email,owner_phone&limit=1`,
          { headers: entetes }
        );
        if (!pr.ok) {
          pr = await fetch(
            `${base}&select=code,discount,type,max_uses,uses,expires_at&limit=1`,
            { headers: entetes }
          );
        }
        if (pr.ok) {
          const [promo] = await pr.json();
          const expire =
            promo?.expires_at && new Date(promo.expires_at).getTime() < Date.now();
          const epuise =
            promo?.max_uses !== null && Number(promo?.uses ?? 0) >= Number(promo?.max_uses);

          // Code personnel (récompense d'avis) : réservé à son
          // propriétaire. Une capture d'écran partagée ne donne donc
          // rien à personne d'autre.
          const proprio = promo?.owner_email || promo?.owner_phone;
          const estLeProprio =
            !proprio ||
            (promo.owner_email &&
              String(promo.owner_email).toLowerCase() ===
                String(body?.customerEmail ?? "").trim().toLowerCase()) ||
            (promo.owner_phone &&
              String(promo.owner_phone).replace(/\D/g, "") ===
                String(customerPhone ?? "").replace(/\D/g, ""));

          // Déjà utilisé par ce client ? Un code public limité à 100
          // usages restait utilisable 100 fois par la MÊME personne.
          let dejaUtilise = false;
          if (cleClient) {
            try {
              const u = await fetch(
                `${SUPABASE_URL}/rest/v1/promo_uses?code=eq.${encodeURIComponent(codePromo)}` +
                  `&customer_key=eq.${encodeURIComponent(cleClient)}&select=id&limit=1`,
                { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
              );
              if (u.ok) dejaUtilise = ((await u.json()) as unknown[]).length > 0;
            } catch { /* table absente : on ne bloque pas la commande */ }
          }

          if (promo && !expire && !epuise && estLeProprio && !dejaUtilise) {
            const valeur = Number(promo.discount) || 0;
            remise =
              promo.type === "percent"
                ? arrondi(articlesSeuls * (valeur / 100))
                : valeur;
            // Une remise ne rend jamais la commande gratuite.
            remise = Math.min(remise, articlesSeuls);
            promoAppliquee = { code: promo.code, uses: Number(promo.uses ?? 0) };
          }
        }
      } catch {
        /* promotion ignorée : la commande passe au tarif plein */
      }
    }

    // ─── Fidélité et parrainage : calculés ICI aussi ──────────
    //
    // Le panier affichait « Fidélité -20 % » et « Parrainage -15 % »
    // alors que le serveur ne connaissait que les codes promo : il
    // enregistrait le plein tarif pendant que Stripe encaissait le
    // montant remisé. Comptabilité fausse à chaque remise, et en
    // espèces le client se voyait réclamer plus que ce qu'il avait lu.
    const baseRemises = Math.max(0, articlesSeuls - remise);
    const fidelite = await remiseFidelite(
      String(customerPhone ?? ""),
      baseRemises,
      items as Array<{ name?: string; price?: number; qty?: number }>,
      String(mode ?? "emporter")
    );
    const parrainage = await remiseParrainage(
      String(body?.guestToken ?? ""),
      String(customerPhone ?? ""),
      Math.max(0, baseRemises - fidelite.remise)
    );

    // Jamais plus que le montant de la commande
    const remisesTotales = plafonner(articlesSeuls, [
      remise, fidelite.remise, parrainage.remise,
    ]);

    // ─── Pourboire livreur ────────────────────────────────────
    // Il était purement et simplement IGNORÉ : le client payait son
    // pourboire via Stripe (l'app l'ajoute au montant), mais la
    // commande enregistrée ne le mentionnait nulle part. Résultat :
    // total encaissé ≠ total en base, et le livreur ne voyait jamais
    // son pourboire.
    const pourboire = Math.max(0, Math.min(50, Number(body?.tip) || 0));

    const calculatedTotal = arrondi(totalCatalogue - remisesTotales + pourboire);

    // Mode démo (pas de Supabase configuré)
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      const demoOrder = {
        id: Math.floor(Math.random() * 1000),
        uuid: `demo-${Date.now()}`,
        customer_name: customerName || "Client",
        total: calculatedTotal,
        mode: mode || "livraison",
        address: address || "",
        customer_phone: customerPhone || "",
        order_items: items.map((i: Record<string, unknown>) => ({
          item_name: i.name,
          quantity: (i.qty as number) || 1,
          customization: (i.custom as string) || null,
        })),
      };
      await notifyDiscord(demoOrder);
      return NextResponse.json({ success: true, orderId: demoOrder.id, uuid: demoOrder.uuid, demo: true });
    }

    // 1. Créer la commande AVEC le total recalculé
    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        // ─── Commandes payables en ligne ──────────────────────
        //
        // Une commande reglee par carte ou Apple Pay n'est PAS
        // confirmee tant que le paiement n'a pas abouti. Elle entre
        // donc en « awaiting_payment », un statut que la cuisine ne
        // voit pas.
        //
        // Sans cela, il suffisait d'arriver a l'ecran de paiement et
        // de fermer l'application : la commande partait en
        // preparation sans qu'un centime ait ete encaisse.
        //
        // C'est le webhook Stripe qui la fait passer en « pending »
        // une fois le paiement confirme.
        status: enLigne ? "awaiting_payment" : "pending",
        payment_method: payMethod || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        total: calculatedTotal, // ← Sécurité : on utilise NOTRE calcul
        // Trace de la remise accordée : sans elle, impossible de
        // justifier l'écart entre le prix catalogue et l'encaissement.
        // Toutes les remises confondues : sans ça, impossible de
        // justifier l'écart entre le prix catalogue et l'encaissement.
        discount_applied: remisesTotales > 0 ? remisesTotales : null,
        notes: notes || null,
        source: source || "web",
        mode: mode || "livraison",
        address: address || null,
        scheduled_time: scheduledTime || null,
        // 🔴 La colonne a une valeur par défaut de 2,90 € en base :
        // une commande À EMPORTER se retrouvait avec des frais de
        // livraison. Invisible sur le total (calculé à part), mais
        // bien présent sur le reçu PDF et dans la comptabilité.
        delivery_fee: fraisLivraison,
        tip: pourboire,
        // Jeton de l'appareil : permet de retrouver sa commande et
        // de télécharger son reçu sans compte. Il n'était pas
        // enregistré, donc ces deux fonctions ne marchaient pas.
        guest_token: String(body?.guestToken ?? "").slice(0, 64) || null,
        customer_email: String(body?.customerEmail ?? "").trim().slice(0, 120) || null,
        is_paid: false,
      }),
    });

    if (!orderRes.ok) {
      // On lit le VRAI message de la base : « Erreur lors de la
      // création de la commande » ne dit rien au client et rien au
      // restaurateur. Ici, une règle métier refusée doit s'expliquer.
      const detail = await orderRes.text().catch(() => "");
      if (/orders_especes_retrait/.test(detail)) {
        return NextResponse.json(
          {
            error:
              "Le paiement en espèces n'est possible qu'en retrait sur place. " +
              "Choisissez la carte bancaire pour une livraison.",
          },
          { status: 400 }
        );
      }
      if (/orders_mode|orders_status/.test(detail)) {
        return NextResponse.json(
          { error: "Mode de commande refusé par le serveur." },
          { status: 400 }
        );
      }
      console.error("❌ Supabase order insert:", orderRes.status, detail.slice(0, 300));
      throw new Error(`Supabase error: ${orderRes.status}`);
    }
    const [order] = await orderRes.json();

    // ─── Prévenir la cuisine (et les livreurs) ────────────────
    // Une commande réglée en ligne attend son paiement : on ne
    // réveille personne tant que Stripe n'a pas confirmé.
    if (!enLigne) {
      await notifierEquipe({
        orderId: order.id,
        total: calculatedTotal,
        mode: mode || "livraison",
      });
    }

    // ─── Consommer fidélité et parrainage ─────────────────────
    // Après la création de la commande seulement : si l'insertion
    // avait échoué, le client aurait perdu sa récompense pour rien.
    if (fidelite.remise > 0 && fidelite.clientId) {
      await consommerFidelite(fidelite.clientId);
    }
    if (parrainage.remise > 0 && parrainage.ligneId) {
      await consommerParrainage(parrainage.ligneId);
    }

    // ─── Consommer le code promo ──────────────────────────────
    // Sans cette incrémentation, `max_uses` n'a aucun effet : un code
    // limité à dix utilisations reste valable indéfiniment.
    //
    // Non bloquant : si la mise à jour échoue, la commande existe
    // déjà et ne doit pas être perdue pour autant.
    if (promoAppliquee) {
      fetch(
        `${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(promoAppliquee.code)}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ uses: promoAppliquee.uses + 1 }),
        }
      ).catch(() => {});

      // Trace « ce client a utilisé ce code » : un index unique
      // (code, customer_key) rend la seconde tentative impossible.
      if (cleClient) {
        fetch(`${SUPABASE_URL}/rest/v1/promo_uses`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            code: promoAppliquee.code,
            customer_key: cleClient,
            order_uuid: order.uuid ?? null,
          }),
        }).catch(() => {});
      }
    }

    // 2. Insérer les lignes
    const orderItems = items.map((item: Record<string, unknown>) => {
      const prix = prixLigne(
        item.name as string,
        (item.custom as string) || null,
        item.price as number
      );
      const qte = (item.qty as number) || 1;
      return {
        order_id: order.id,
        item_name: item.name,
        item_price: prix,
        quantity: qte,
        customization: (item.custom as string) || null,
        // 🔴 Oublié depuis toujours : la colonne `subtotal` restait
        // à 0. Conséquence visible dans l'espace restaurateur du
        // site : CHAQUE ligne de chaque commande s'affichait
        // « 0,00 € ». Le total de la commande, lui, était juste —
        // d'où le sentiment que l'écran était cassé.
        subtotal: Math.round(prix * qte * 100) / 100,
      };
    });

    await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderItems),
    });

    // 3. Notifier Discord
    await notifyDiscord({
      id: order.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      total: calculatedTotal,
      mode,
      address,
      order_items: orderItems,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      uuid: order.uuid,
      message: "Commande enregistrée !",
    });
  } catch (err) {
    console.error("❌ Order error:", err);
    return NextResponse.json({ error: "Erreur lors de la création de la commande" }, { status: 500 });
  }
}
