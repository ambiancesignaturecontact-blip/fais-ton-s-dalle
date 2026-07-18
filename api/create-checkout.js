// =============================================================
// 💳 API CREATE CHECKOUT — Stripe (Vercel Serverless)
// Crée une session de paiement Stripe Checkout
// =============================================================
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS
  const origin = req.headers['origin'] || '';
  const allowedOrigins = ['https://faistonsdalle.com', 'http://localhost:3000', 'http://localhost:5173'];
  if (allowedOrigins.some(o => origin.startsWith(o)) || (origin && origin.includes('faistonsdalle.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { items, total, customerName, mode, address } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Panier vide' });
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: (item.custom && typeof item.custom==='string') ? item.custom.substring(0, 100) : undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty || 1,
    }));

    const baseUrl = process.env.SITE_URL || 'https://faistonsdalle.com';
    const successUrl = `${baseUrl}?payment=success&total=${total.toFixed(2)}&mode=${mode || 'pickup'}&addr=${encodeURIComponent(address || '')}`;
    const cancelUrl = `${baseUrl}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
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
    return res.status(500).json({ error: 'Erreur lors de la cr\u00e9ation du paiement' });
  }
};
