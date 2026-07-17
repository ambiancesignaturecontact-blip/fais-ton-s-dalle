# 📬 Newsletter — Configuration Supabase

## Table déjà créée
La table `newsletter_subscribers` existe déjà dans votre schéma SQL.

## Étapes pour connecter la newsletter

### 1. Créer un endpoint API `/api/newsletter.js`

```javascript
// api/newsletter.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://faistonsdalle.fr');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email }])
    .select();

  if (error) {
    if (error.code === '23505') { // duplicate
      return res.status(200).json({ message: 'Déjà inscrit !' });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }

  return res.status(200).json({ message: 'Inscrit avec succès !' });
};
```

### 2. Ajouter `@supabase/supabase-js` dans package.json
```bash
npm install @supabase/supabase-js
```

### 3. Mettre à jour `vercel.json`
Ajouter la route :
```json
{ "source": "/api/newsletter", "destination": "/api/newsletter.js" }
```

### 4. Mettre à jour la fonction `nl()` dans index.html

Remplacer le contenu de `function nl(e)` par :

```javascript
function nl(e) {
  e.preventDefault();
  var v = e.target.querySelector('input');
  if (!v || !v.value) return;
  var x = new XMLHttpRequest();
  x.open('POST', '/api/newsletter', true);
  x.setRequestHeader('Content-Type', 'application/json');
  x.onload = function() {
    if (x.status === 200) {
      ts('✅ Inscrit à la newsletter !');
      v.value = '';
    } else {
      ts('❌ Erreur, réessaie plus tard');
    }
  };
  x.onerror = function() { ts('❌ Erreur réseau'); };
  x.send(JSON.stringify({ email: v.value }));
}
```

### 5. Vérifier les logs Supabase
Dans Supabase Dashboard → Table Editor → `newsletter_subscribers`
