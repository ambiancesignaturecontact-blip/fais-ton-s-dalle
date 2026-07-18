// =============================================================
// 📬 API NEWSLETTER — Supabase (Vercel Serverless)
// Inscription à la newsletter avec stockage Supabase
// =============================================================
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS
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
    const { email } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Fallback: si pas de Supabase configuré, on répond OK + log
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('📬 Newsletter - Supabase non configuré, email stocké en log:', email);
      return res.status(200).json({
        message: 'Inscrit avec succès !',
        note: 'Mode démo - stockage Supabase non configuré'
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email, is_active: true }])
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(200).json({ message: 'Déjà inscrit à la newsletter !' });
      }
      console.error('❌ Newsletter Supabase error:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    console.log('📬 Nouvel inscrit newsletter:', email);
    return res.status(200).json({ message: 'Inscrit avec succès à la newsletter !' });

  } catch (err) {
    console.error('❌ Newsletter error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
