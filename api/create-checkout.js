// =============================================================
// 💳 API CREATE CHECKOUT — Stripe (Vercel Serverless)
// Crée une session de paiement Stripe Checkout
// =============================================================
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Rate limiting simple (10 requêtes max par IP par minute)
var rateLimit = {};
module.exports = async (req, res) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  rateLimit[ip] = (rateLimit[ip] || 0) + 1;
  if (rateLimit[ip] > 20) { return res.status(429).json({ error: 'Trop de requêtes' }); }
  setTimeout(function(){ rateLimit[ip]--; }, 60000);
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

    // Validation de sécurité : vérifier les prix
    var calcTotal = 0;
    for (var i = 0; i < items.length; i++) {
      if (!items[i].price || items[i].price <= 0 || items[i].qty <= 0) {
        return res.status(400).json({ error: 'Données invalides' });
      }
      calcTotal += items[i].price * items[i].qty;
    }
    if (Math.abs(calcTotal - Math.round(total * 100)) > 10) {
      console.error('❌ Tentative de fraude: prix modifié', {calcTotal, sentTotal: Math.round(total * 100), diff: calcTotal - Math.round(total * 100)});
      return res.status(400).json({ error: 'Erreur de calcul du prix' });
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: (item.custom && typeof item.custom==='string') ? item.custom.substring(0, 100) : undefined,
        },
        unit_amount: item.price,
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
    console.error('❌ Erreur Stripe:', error.message);
    console.error('🔐 Sécurité - IP:', req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    console.error('📦 Items demandés:', items ? items.length : 0);
    return res.status(500).json({ error: 'Erreur lors de la cr\u00e9ation du paiement' });
  }
};
