// =============================================================
// 💳 API CREATE CHECKOUT — Stripe (Vercel Serverless)
// Crée une session de paiement Stripe Checkout
// =============================================================


// === CSRF/Origin Protection ===
const allowedOrigins = ['https://faistonsdalle.fr', 'http://localhost:3000', 'http://localhost:5173'];
const origin = event.headers['origin'] || event.headers['referer'] || '';
const isAllowed = allowedOrigins.some(o => origin.startsWith(o));
if (!isAllowed && origin && !origin.includes('faistonsdalle.vercel.app')) {
  return { statusCode: 403, body: JSON.stringify({ error: 'Origine non autorisée' }) };
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { items, total, customerName, mode, address } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Panier vide' });
    }

    // Construire les line_items pour Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.custom ? item.custom.substring(0, 100) : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Stripe utilise les centimes
      },
      quantity: item.qty || 1,
    }));

    // Ajouter les frais de livraison (optionnel)
    // si tu veux ajouter 1€ de livraison :
    // if (mode === 'livraison') {
    //   lineItems.push({
    //     price_data: {
    //       currency: 'eur',
    //       product_data: { name: 'Frais de livraison' },
    //       unit_amount: 100, // 1€
    //     },
    //     quantity: 1,
    //   });
    // }

    // Construire l'URL de retour avec les infos de commande
    const baseUrl = process.env.SITE_URL || 'https://faistonsdalle.fr';
    const successUrl = `${baseUrl}?payment=success&total=${total.toFixed(2)}&mode=${mode || 'pickup'}&addr=${encodeURIComponent(address || '')}`;
    const cancelUrl = `${baseUrl}`;

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_name: customerName || undefined,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: 'fr',
      metadata: {
        customer_name: customerName || 'Anonyme',
        mode: mode || 'pickup',
        address: address || '',
        total: total.toString(),
      },
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Erreur Stripe:', error);
    return res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
}
