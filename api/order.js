// =============================================================
// 🛵 API ORDER — Serverless Function (Vercel)
// Fichier : /api/order.js
// Reçoit les commandes du site et envoie un email
// =============================================================

import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { items, total, customerName, customerPhone, deliveryType, notes, source } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Panier vide' });
    }

    // 1. Connexion à la base de données
    const client = createClient();
    await client.connect();

    // 2. Créer la commande
    const orderResult = await client.query(
      `INSERT INTO orders (status, customer_name, customer_phone, delivery_type, total, notes, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, uuid, created_at`,
      ['pending', customerName || null, customerPhone || null, deliveryType || 'pickup', total, notes || null, source || 'web']
    );
    const orderId = orderResult.rows[0].id;

    // 3. Insérer les lignes de commande
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, item_name, item_price, quantity, customization, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, `${item.icon || ''} ${item.name}`, item.price, item.qty, item.custom || null, item.price * item.qty]
      );
    }

    // 4. Optionnel : Envoyer un email de notification
    if (process.env.RESEND_API_KEY) {
      try {
        const itemList = items.map(i =>
          `• ${i.qty}x ${i.name} ${i.custom ? `(${i.custom})` : ''} — ${(i.price * i.qty).toFixed(2)}€`
        ).join('\n');

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'commandes@faistonsdalle.fr',
            to: process.env.EMAIL_TO || 'contact@faistonsdalle.fr',
            subject: `🛵 Nouvelle commande #${orderId}`,
            text: `Nouvelle commande #${orderId}\n\n${itemList}\n\nTotal : ${total.toFixed(2)}€\n\nClient : ${customerName || 'Anonyme'} ${customerPhone ? `- ${customerPhone}` : ''}\nType : ${deliveryType}\nDate : ${new Date().toLocaleString('fr-FR')}`
          })
        });
      } catch (emailErr) {
        console.error('Erreur envoi email:', emailErr);
        // Non bloquant
      }
    }

    await client.end();

    return res.status(200).json({
      success: true,
      orderId,
      uuid: orderResult.rows[0].uuid,
      message: 'Commande enregistrée avec succès !'
    });

  } catch (error) {
    console.error('Erreur API order:', error);
    return res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
}
