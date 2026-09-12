-- ============================================================
-- FAIS TON S'DALLE — Schéma Supabase ULTRA SIMPLE v1.0
-- ============================================================
-- 1. Va dans Supabase → SQL Editor
-- 2. Colle ceci et exécute
-- 3. Va dans Supabase → Settings → API → clique sur "Reload schema cache"
-- ============================================================

-- Supprimer tout le schéma existant (si déjà créé)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;

-- 1. Newsletter
CREATE TABLE newsletter_subscribers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- 2. Commandes
CREATE TABLE orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  total NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  source TEXT DEFAULT 'web',
  mode TEXT DEFAULT 'livraison',
  address TEXT,
  delivery_fee NUMERIC(10,2) DEFAULT 2.90,
  scheduled_time TEXT,
  discount_applied NUMERIC(10,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  payment_method TEXT DEFAULT 'stripe',
  payment_id TEXT
);

-- 3. Lignes de commande
CREATE TABLE order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  item_name TEXT DEFAULT '',
  item_price NUMERIC(10,2) DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  customization TEXT,
  category TEXT,
  subtotal NUMERIC(10,2) DEFAULT 0
);

-- 4. Stock
CREATE TABLE stock (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_name TEXT DEFAULT '',
  category TEXT DEFAULT '',
  quantity INTEGER DEFAULT 999,
  unlimited BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Clients
CREATE TABLE customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT,
  password_hash TEXT DEFAULT '',
  name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  fidelity_menu_count INTEGER DEFAULT 0,
  fidelity_discount_active BOOLEAN DEFAULT false,
  fidelity_discount_used INTEGER DEFAULT 0,
  fidelity_total_savings NUMERIC(10,2) DEFAULT 0,
  fidelity_last_menu_date TIMESTAMPTZ
);

-- 6. Push
CREATE TABLE push_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Avis
CREATE TABLE reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT,
  rating INTEGER DEFAULT 5,
  comment TEXT DEFAULT '',
  is_approved BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ
);

-- Index
CREATE INDEX idx_orders_created ON orders (created_at DESC);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_customers_email ON customers (email);

-- Stock initial
INSERT INTO stock (item_name, category, quantity, unlimited) VALUES
  ('Tenders', 'viandes', 999, true),
  ('Emince poulet', 'viandes', 999, true),
  ('Blanc dinde', 'viandes', 999, true),
  ('Jambon dinde', 'viandes', 999, true),
  ('Pastrami', 'viandes', 999, true),
  ('Rosette', 'viandes', 999, true),
  ('Thon', 'viandes', 999, true),
  ('Salade', 'crudites', 999, true),
  ('Tomate', 'crudites', 999, true),
  ('Oignons', 'crudites', 999, true),
  ('Mais', 'crudites', 999, true),
  ('Carottes rapees', 'crudites', 999, true),
  ('Avocat', 'crudites', 999, true),
  ('Mayo', 'sauces', 999, true),
  ('Ketchup', 'sauces', 999, true),
  ('Algerienne', 'sauces', 999, true),
  ('Samourai', 'sauces', 999, true),
  ('Blanche', 'sauces', 999, true),
  ('Moutarde', 'sauces', 999, true),
  ('Bresil', 'sauces', 999, true),
  ('Chili', 'sauces', 999, true),
  ('Thai', 'sauces', 999, true),
  ('Cheddar', 'supplements', 999, true),
  ('Mozzarella', 'supplements', 999, true),
  ('Feta', 'supplements', 999, true),
  ('Caramel speculos', 'tiramisu', 999, true),
  ('Chocolat', 'tiramisu', 999, true),
  ('Oreo', 'tiramisu', 999, true),
  ('Kinder Bueno', 'milkshakes', 999, true),
  ('Kinder Bueno White', 'milkshakes', 999, true),
  ('Snickers', 'milkshakes', 999, true),
  ('Oreo', 'milkshakes', 999, true),
  ('KitKat', 'milkshakes', 999, true),
  ('KitKat White', 'milkshakes', 999, true),
  ('Milka', 'milkshakes', 999, true),
  ('Coca-Cola', 'boissons', 999, true),
  ('Coca Zero', 'boissons', 999, true),
  ('Oasis Tropical', 'boissons', 999, true),
  ('Ice Tea', 'boissons', 999, true),
  ('Orangina', 'boissons', 999, true),
  ('Cristaline', 'boissons', 999, true),
  ('San Pellegrino', 'boissons', 999, true),
  ('Coca-Cola Cherry', 'boissons', 999, true),
  ('Menu Leger', 'menus', 999, true),
  ('Menu Classique', 'menus', 999, true),
  ('Menu Gourmand', 'menus', 999, true),
  ('Menu Royal', 'menus', 999, true),
  ('Bowl Leger', 'menus', 999, true),
  ('Bowl Classique', 'menus', 999, true),
  ('Bowl Gourmand', 'menus', 999, true),
  ('Bowl Royal', 'menus', 999, true),
  ('Tiramisu', 'desserts', 999, true),
  ('Milkshake', 'desserts', 999, true);

-- RLS : permettre tout accès (car l'API gère la sécurité)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "all" ON newsletter_subscribers;
DROP POLICY IF EXISTS "all" ON orders;
DROP POLICY IF EXISTS "all" ON order_items;
DROP POLICY IF EXISTS "all" ON stock;
DROP POLICY IF EXISTS "all" ON customers;
DROP POLICY IF EXISTS "all" ON push_subscriptions;
DROP POLICY IF EXISTS "all" ON reviews;

CREATE POLICY "all" ON newsletter_subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON reviews FOR ALL USING (true) WITH CHECK (true);
