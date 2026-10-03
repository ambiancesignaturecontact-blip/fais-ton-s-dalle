-- ============================================================
-- FAIS TON S'DALLE — Schéma Supabase v3.3 (COMPLET)
-- ============================================================
-- Exécute ceci dans Supabase → SQL Editor → New Query
-- Peut être exécuté plusieurs fois sans risque (IDEMPOTENT)
-- ============================================================

-- ─── 1. NEWS LETTER ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- ─── 2. COMMANDES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
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

-- ─── 3. LIGNES DE COMMANDE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  item_name TEXT NOT NULL DEFAULT '',
  item_price NUMERIC(10,2) DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  customization TEXT,
  category TEXT,
  subtotal NUMERIC(10,2) DEFAULT 0
);

-- ─── 4. STOCK ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  quantity INTEGER DEFAULT 999,
  unlimited BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. CLIENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT,
  password_hash TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
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

-- ─── 6. PUSH SUBSCRIPTIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. AVIS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  rating INTEGER DEFAULT 5,
  comment TEXT NOT NULL DEFAULT '',
  is_approved BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ
);

-- ─── 8. INDEX ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

-- ─── 9. STOCK INITIAL ──────────────────────────────────────────
INSERT INTO stock (item_name, category, quantity, unlimited) VALUES
  ('Tenders', 'viandes', 999, true), ('Émincé poulet', 'viandes', 999, true),
  ('Blanc dinde', 'viandes', 999, true), ('Jambon dinde', 'viandes', 999, true),
  ('Pastrami', 'viandes', 999, true), ('Rosette', 'viandes', 999, true),
  ('Thon', 'viandes', 999, true),
  ('Salade', 'crudites', 999, true), ('Tomate', 'crudites', 999, true),
  ('Oignons', 'crudites', 999, true), ('Mais', 'crudites', 999, true),
  ('Carottes râpées', 'crudites', 999, true), ('Avocat', 'crudites', 999, true),
  ('Mayo', 'sauces', 999, true), ('Ketchup', 'sauces', 999, true),
  ('Algérienne', 'sauces', 999, true), ('Samouraï', 'sauces', 999, true),
  ('Blanche', 'sauces', 999, true), ('Moutarde', 'sauces', 999, true),
  ('Brésil', 'sauces', 999, true), ('Chili', 'sauces', 999, true),
  ('Thai', 'sauces', 999, true),
  ('Cheddar', 'supplements', 999, true), ('Mozzarella', 'supplements', 999, true),
  ('Feta', 'supplements', 999, true),
  ('Caramel speculos', 'tiramisu', 999, true), ('Chocolat', 'tiramisu', 999, true),
  ('Oreo', 'tiramisu', 999, true),
  ('Kinder Bueno', 'milkshakes', 999, true), ('Kinder Bueno White', 'milkshakes', 999, true),
  ('Snickers', 'milkshakes', 999, true), ('Oreo', 'milkshakes', 999, true),
  ('KitKat', 'milkshakes', 999, true), ('KitKat White', 'milkshakes', 999, true),
  ('Milka', 'milkshakes', 999, true),
  ('Coca-Cola', 'boissons', 999, true), ('Coca Zero', 'boissons', 999, true),
  ('Oasis Tropical', 'boissons', 999, true), ('Ice Tea', 'boissons', 999, true),
  ('Orangina', 'boissons', 999, true), ('Cristaline', 'boissons', 999, true),
  ('San Pellegrino', 'boissons', 999, true), ('Coca-Cola Cherry', 'boissons', 999, true),
  ('Menu Léger', 'menus', 999, true), ('Menu Classique', 'menus', 999, true),
  ('Menu Gourmand', 'menus', 999, true), ('Menu Royal', 'menus', 999, true),
  ('Bowl Léger', 'menus', 999, true), ('Bowl Classique', 'menus', 999, true),
  ('Bowl Gourmand', 'menus', 999, true), ('Bowl Royal', 'menus', 999, true),
  ('Tiramisu', 'desserts', 999, true), ('Milkshake', 'desserts', 999, true)
ON CONFLICT (item_name) DO NOTHING;

-- ─── 10. RLS : AUTORISER TOUT LE MONDE ──────────────────────
-- Nécessaire car l'API utilise la clé anon (service_role bypass RLS automatiquement)
ALTER TABLE IF EXISTS newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON newsletter_subscribers;
DROP POLICY IF EXISTS "allow_all" ON orders;
DROP POLICY IF EXISTS "allow_all" ON order_items;
DROP POLICY IF EXISTS "allow_all" ON stock;
DROP POLICY IF EXISTS "allow_all" ON customers;
DROP POLICY IF EXISTS "allow_all" ON push_subscriptions;
DROP POLICY IF EXISTS "allow_all" ON reviews;

CREATE POLICY "allow_all" ON newsletter_subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- ✅ FIN - Les 7 tables sont créées et accessibles
