// =============================================================
// 🛵 API ORDER — Serverless Function (Vercel)
// Backend Supabase pour FAIS TON S'DALLE
// =============================================================
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS
  const origin = req.headers['origin'] || '';
  const allowedOrigins = ['https://faistonsdalle.com', 'http://localhost:3000', 'http://localhost:5173'];
  if (allowedOrigins.some(o => origin.startsWith(o)) || (origin && origin.includes('faistonsdalle.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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
      console.error('Erreur r\u00e9cup\u00e9ration commandes:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // --- POST : Créer une commande ---
  if (req.method === 'POST') {
    try {
      const { items, total, customerName, customerPhone, notes, source } = req.body;

      // Input validation
      const validationError = validateOrder(req.body);
      if (validationError) return res.status(400).json({ error: validationError });

      if (!items || !items.length) {
        return res.status(400).json({ error: 'Panier vide' });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // 1. Cr\u00e9er la commande
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

      // 2. Ins\u00e9rer les lignes de commande
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

      return res.status(200).json({
        success: true,
        orderId: order.id,
        uuid: order.uuid,
        message: 'Commande enregistr\u00e9e !'
      });

    } catch (error) {
      console.error('Erreur API order:', error);
      return res.status(500).json({
        error: 'Erreur lors de la cr\u00e9ation de la commande',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'M\u00e9thode non autoris\u00e9e' });
};

// === Input Validation ===
function validateOrder(body) {
  if (!body || typeof body !== 'object') return 'Corps de requ\u00eate invalide';
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) return 'Panier vide';
  for (const item of body.items) {
    if (!item.name || typeof item.name !== 'string') return "Nom d'article invalide";
    if (!item.price || typeof item.price !== 'number' || item.price <= 0) return 'Prix invalide';
    if (!item.qty || typeof item.qty !== 'number' || item.qty < 1 || item.qty > 99) return 'Quantit\u00e9 invalide';
  }
  if (body.total && (typeof body.total !== 'number' || body.total <= 0)) return 'Total invalide';
  if (body.mode && !['livraison', 'emporter'].includes(body.mode)) return 'Mode invalide';
  if (body.address && typeof body.address !== 'string') return 'Adresse invalide';
  if (body.phone && !/^0[1-9][0-9]{8}$/.test(body.phone.replace(/[\s]/g, ''))) return 'T\u00e9l\u00e9phone invalide';
  return null;
}
