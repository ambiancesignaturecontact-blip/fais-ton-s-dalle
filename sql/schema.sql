-- =============================================================
-- SCHÉMA PostgreSQL — FAIS TON S'DALLE
-- Compatible Vercel Postgres / Supabase / Neon.tech
-- Dernière mise à jour : juillet 2026
-- =============================================================

-- 1. CATÉGORIES
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(10) NOT NULL DEFAULT '',
    sort_order  INT NOT NULL DEFAULT 0
);

-- 2. ARTICLES DU MENU
CREATE TABLE IF NOT EXISTS menu_items (
    id              SERIAL PRIMARY KEY,
    category_id     INT REFERENCES categories(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    is_customizable BOOLEAN NOT NULL DEFAULT false,
    is_popular      BOOLEAN NOT NULL DEFAULT false,
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. OPTIONS DE PERSONNALISATION
CREATE TABLE IF NOT EXISTS customization_options (
    id          SERIAL PRIMARY KEY,
    group_key   VARCHAR(50) NOT NULL,
    group_label VARCHAR(100) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true
);

-- 4. COMMANDES
CREATE TABLE IF NOT EXISTS orders (
    id              SERIAL PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid(),
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
    customer_name   VARCHAR(200),
    customer_phone  VARCHAR(20) NOT NULL,
    customer_email  VARCHAR(200),
    total           DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    notes           TEXT,
    source          VARCHAR(50) DEFAULT 'web',
    is_paid         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. LIGNES DE COMMANDE
CREATE TABLE IF NOT EXISTS order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id    INT REFERENCES menu_items(id),
    item_name       VARCHAR(200) NOT NULL,
    item_price      DECIMAL(10,2) NOT NULL,
    quantity        INT NOT NULL CHECK (quantity > 0),
    customization   TEXT,
    subtotal        DECIMAL(10,2) NOT NULL
);

-- 6. NEWSLETTER
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(200) UNIQUE NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FIDÉLITÉ (carte de fidélité)
CREATE TABLE IF NOT EXISTS loyalty_points (
    id              SERIAL PRIMARY KEY,
    customer_phone  VARCHAR(20) NOT NULL UNIQUE,
    customer_name   VARCHAR(200),
    points          INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    free_sandwiches INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ADMIN
CREATE TABLE IF NOT EXISTS admins (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(200) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name        VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEX
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_uuid ON orders(uuid);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_loyalty_phone ON loyalty_points(customer_phone);

-- =============================================================
-- SEED DATA — MENU À JOUR (juillet 2026)
-- =============================================================
INSERT INTO categories (slug, name, icon, sort_order) VALUES
  ('menus',    'Menus Sandwichs', '🥪', 1),
  ('desserts', 'Desserts',        '🍰', 2),
  ('boissons', 'Boissons',        '🥤', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, is_customizable, is_popular, sort_order)
VALUES
  ((SELECT id FROM categories WHERE slug='menus'),    'Menu Léger',    'Sandwich (viande + crudités + sauce au choix)',         6.90, true,  true,  1),
  ((SELECT id FROM categories WHERE slug='menus'),    'Menu Classique','Sandwich + 1 boisson',                                    7.90, true,  true,  2),
  ((SELECT id FROM categories WHERE slug='menus'),    'Menu Gourmand', 'Sandwich + boisson + dessert',                            9.90, true,  true,  3),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Tiramisu Maison','Fait maison',                                             3.00, false, false, 1),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Milkshake',      'Crémeux et rafraîchissant',                             5.00, false, false, 2),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Coca-Cola',      '',                                                         1.00, false, false, 1),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Coca Zéro',      '',                                                         1.00, false, false, 2),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Pepsi',          '',                                                         1.00, false, false, 3),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Oasis Tropical', '',                                                         1.00, false, false, 4),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Ice Tea',        '',                                                         1.00, false, false, 5),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Orangina',       '',                                                         1.00, false, false, 6),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Cristaline',     '',                                                         1.00, false, false, 7),
  ((SELECT id FROM categories WHERE slug='boissons'), 'San Pellegrino', '',                                                         1.00, false, false, 8)
ON CONFLICT DO NOTHING;

INSERT INTO customization_options (group_key, group_label, name, is_required, sort_order) VALUES
  ('cuisson', 'Cuisson',       'Froid',     true,  1),
  ('cuisson', 'Cuisson',       'Chaud',     true,  2),
  ('viande',  'Viande',        'Jambon blanc',    true,  1),
  ('viande',  'Viande',        'Jambon fumé',     true,  2),
  ('viande',  'Viande',        'Poulet rôti',     true,  3),
  ('viande',  'Viande',        'Dinde',           true,  4),
  ('viande',  'Viande',        'Salami',          true,  5),
  ('viande',  'Viande',        'Pastrami',        true,  6),
  ('viande',  'Viande',        'Rosbif',          true,  7),
  ('viande',  'Viande',        'Thon',            true,  8),
  ('crudite', 'Crudités',      'Salade',     false, 1),
  ('crudite', 'Crudités',      'Tomates',    false, 2),
  ('crudite', 'Crudités',      'Concombre',  false, 3),
  ('crudite', 'Crudités',      'Oignons',    false, 4),
  ('crudite', 'Crudités',      'Poivrons',   false, 5),
  ('crudite', 'Crudités',      'Maïs',       false, 6),
  ('crudite', 'Crudités',      'Carottes',   false, 7),
  ('crudite', 'Crudités',      'Cornichons', false, 8),
  ('sauce',   'Sauce',         'Mayo',       true,  1),
  ('sauce',   'Sauce',         'Ketchup',    true,  2),
  ('sauce',   'Sauce',         'Moutarde',   true,  3),
  ('sauce',   'Sauce',         'Blanche',    true,  4),
  ('sauce',   'Sauce',         'Algérienne', true,  5),
  ('sauce',   'Sauce',         'Andalouse',  true,  6),
  ('sauce',   'Sauce',         'Samouraï',   true,  7),
  ('sauce',   'Sauce',         'Huile olive',true,  8)
ON CONFLICT DO NOTHING;
