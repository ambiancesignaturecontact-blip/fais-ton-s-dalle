// =============================================================
// 📬 API NOTIFY ORDER — Notification des autres numéros
// Reçoit les commandes et les logge (email/SMS à configurer)
// =============================================================

module.exports = async (req, res) => {
  const origin = req.headers['origin'] || '';
  const allowedOrigins = ['https://faistonsdalle.com', 'http://localhost:3000', 'http://localhost:5173'];
  if (allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('faistonsdalle.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { msg, phones } = req.body || {};

    if (!msg) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Log dans Vercel (visible dans le dashboard)
    console.log('📦 NOUVELLE COMMANDE (notifications)');
    console.log('📱 Autres numéros à notifier:', phones ? phones.join(', ') : 'aucun');
    console.log('📝 Commande:', msg);

    // Si tu veux recevoir par email plus tard, décommente et configure :
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ ... });

    return res.status(200).json({
      success: true,
      message: 'Commande enregistrée',
      phones: phones || []
    });

  } catch (err) {
    console.error('❌ Notify error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
