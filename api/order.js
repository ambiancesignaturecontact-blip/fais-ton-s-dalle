// =============================================================
// 🛵 API ORDER — Serverless Function (Vercel)
// Backend Supabase pour FAIS TON S'DALLE
// =============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- GET : Récupérer les commandes (pour admin) ---
  if (req.method === 'GET') {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return res.status(200).json({ orders });
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // --- POST : Créer une commande ---
  if (req.method === 'POST') {
    try {
      const { items, total, customerName, customerPhone, notes, source } = req.body;

      if (!items || !items.length) {
        return res.status(400).json({ error: 'Panier vide' });
      }

      // Initialiser Supabase avec la clé anon (côté client)
      // Pour l'écriture, on utilise SERVICE_ROLE pour bypass RLS
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // 1. Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          status: 'pending',
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          total: total,
          notes: notes || null,
          source: source || 'web'
        })
        .select('id, uuid, created_at')
        .single();

      if (orderError) throw orderError;

      // 2. Insérer les lignes de commande
      const orderItems = items.map(item => ({
        order_id: order.id,
        item_name: item.name,
        item_price: item.price,
        quantity: item.qty || 1,
        customization: item.custom || null,
        subtotal: (item.price * (item.qty || 1))
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Notification WhatsApp (optionnel, via appel API)
      if (process.env.WHATSAPP_NUMBER) {
        try {
          const itemList = items.map(i =>
            `* ${i.qty || 1}x ${i.name}${i.custom ? ' (' + i.custom.substring(0, 40) + '...)' : ''} - ${(i.price * (i.qty || 1)).toFixed(2)}€`
          ).join('%0a');

          const msg = `🥪 *NOUVELLE COMMANDE #${order.id}*%0a%0a${itemList}%0a%0a📦 *Total: ${total.toFixed(2)}€*%0a👤 ${customerName || 'Anonyme'} ${customerPhone ? '- ' + customerPhone : ''}%0a⏱️ ${new Date().toLocaleString('fr-FR')}%0a%0a📞 Répondre au client`;

          // Appel à l'API WhatsApp Business (optionnel)
          // Pour l'instant, le message est prêt à être envoyé
          console.log('Message WhatsApp prêt:', msg);
        } catch (waErr) {
          console.error('Erreur WhatsApp:', waErr);
        }
      }

      return res.status(200).json({
        success: true,
        orderId: order.id,
        uuid: order.uuid,
        message: 'Commande enregistrée !'
      });

    } catch (error) {
      console.error('Erreur API order:', error);
      return res.status(500).json({
        error: 'Erreur lors de la création de la commande',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
