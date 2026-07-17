-- =============================================================
-- SCHÉMA PostgreSQL — FAIS TON S'DALLE
-- Menu réel (juillet 2026)
-- =============================================================

CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(10) NOT NULL DEFAULT '',
    sort_order  INT NOT NULL DEFAULT 0
);

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

CREATE TABLE IF NOT EXISTS customization_options (
    id          SERIAL PRIMARY KEY,
    group_key   VARCHAR(50) NOT NULL,
    group_label VARCHAR(100) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
    id              SERIAL PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid(),
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
    customer_name   VARCHAR(200),
    customer_phone  VARCHAR(20),
    customer_email  VARCHAR(200),
    delivery_type   VARCHAR(30) DEFAULT 'pickup'
                    CHECK (delivery_type IN ('pickup','delivery','uber_eats')),
    delivery_address TEXT,
    total           DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    notes           TEXT,
    source          VARCHAR(50) DEFAULT 'web',
    is_paid         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(200) UNIQUE NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_points (
    id              SERIAL PRIMARY KEY,
    customer_phone  VARCHAR(20) NOT NULL UNIQUE,
    customer_name   VARCHAR(200),
    points          INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    free_sandwiches INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(200) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name        VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_uuid ON orders(uuid);

-- CLEAN + SEED
DELETE FROM customization_options;
DELETE FROM menu_items;
DELETE FROM categories;

INSERT INTO categories (slug, name, icon, sort_order) VALUES
  ('menus',    'Menus Sandwichs', '🥪', 1),
  ('desserts', 'Desserts',        '🍰', 2),
  ('boissons', 'Boissons',        '🥤', 3);

INSERT INTO menu_items (category_id, name, description, price, is_customizable, is_popular, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='menus'),    'Menu Léger',    'Sandwich (viande + crudités + sauce)',    6.90, true,  true, 1),
  ((SELECT id FROM categories WHERE slug='menus'),    'Menu Classique','Sandwich + boisson',                       7.90, true,  true, 2),
  ((SELECT id FROM categories WHERE slug='menus'),    'Menu Gourmand', 'Sandwich + boisson + dessert',              9.90, true,  true, 3),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Tiramisu',      'Caramel, Chocolat ou Spéculos',             3.00, false, false,1),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Milkshake',     'Snickers, M&Ms, KitKat + coulis 0,50€',    5.00, false, false,2),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Coca-Cola',     '',                                         1.00, false, false,1),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Coca Zéro',     '',                                         1.00, false, false,2),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Pepsi',         '',                                         1.00, false, false,3),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Oasis Tropical','',                                         1.00, false, false,4),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Ice Tea',       '',                                         1.00, false, false,5),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Orangina',      '',                                         1.00, false, false,6),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Cristaline',    '',                                         1.00, false, false,7),
  ((SELECT id FROM categories WHERE slug='boissons'), 'San Pellegrino','',                                         1.00, false, false,8);

-- CUISSON
INSERT INTO customization_options (group_key, group_label, name, is_required, sort_order) VALUES
  ('cuisson', 'Cuisson', 'Froid', true, 1),
  ('cuisson', 'Cuisson', 'Chaud', true, 2);

-- VIANDES
INSERT INTO customization_options (group_key, group_label, name, is_required, sort_order) VALUES
  ('viande', 'Viande', 'Tenders',          true, 1),
  ('viande', 'Viande', 'Emincé de poulet', true, 2),
  ('viande', 'Viande', 'Blanc de dinde',   true, 3),
  ('viande', 'Viande', 'Jambon de dinde',  true, 4),
  ('viande', 'Viande', 'Pastrami',         true, 5),
  ('viande', 'Viande', 'Rosette',          true, 6),
  ('viande', 'Viande', 'Thon',             true, 7);

-- CRUDITÉS
INSERT INTO customization_options (group_key, group_label, name, is_required, sort_order) VALUES
  ('crudite', 'Crudités', 'Salade',          false, 1),
  ('crudite', 'Crudités', 'Tomate',          false, 2),
  ('crudite', 'Crudités', 'Concombre',       false, 3),
  ('crudite', 'Crudités', 'Oignons',         false, 4),
  ('crudite', 'Crudités', 'Poivrons',        false, 5),
  ('crudite', 'Crudités', 'Maïs',            false, 6),
  ('crudite', 'Crudités', 'Carottes râpées', false, 7),
  ('crudite', 'Crudités', 'Avocat',          false, 8);

-- SUPPLÉMENTS
INSERT INTO customization_options (group_key, group_label, name, is_required, sort_order) VALUES
  ('supplement', 'Suppléments', 'Cheddar',   false, 1),
  ('supplement', 'Suppléments', 'Mozzarella', false, 2),
  ('supplement', 'Suppléments', 'Feta',      false, 3);

-- SAUCES (9)
INSERT INTO customization_options (group_key, group_label, name, is_required, sort_order) VALUES
  ('sauce', 'Sauce', 'Mayo',       true, 1),
  ('sauce', 'Sauce', 'Ketchup',    true, 2),
  ('sauce', 'Sauce', 'Algérienne', true, 3),
  ('sauce', 'Sauce', 'Samouraï',   true, 4),
  ('sauce', 'Sauce', 'Blanche',    true, 5),
  ('sauce', 'Sauce', 'Moutarde',   true, 6),
  ('sauce', 'Sauce', 'Brasil',     true, 7),
  ('sauce', 'Sauce', 'Chili',      true, 8),
  ('sauce', 'Sauce', 'Thai',       true, 9);

-- TIRAMISU PARFUMS
INSERT INTO customization_options (group_key, group_label, name, is_required, sort_order) VALUES
  ('tiramisu', 'Tiramisu', 'Caramel',   true, 1),
  ('tiramisu', 'Tiramisu', 'Chocolat',  true, 2),
  ('tiramisu', 'Tiramisu', 'Spéculos',  true, 3);

-- MILKSHAKE OPTIONS
INSERT INTO customization_options (group_key, group_label, name, is_required, sort_order) VALUES
  ('milkshake', 'Milkshake', 'Snickers',     true, 1),
  ('milkshake', 'Milkshake', 'M&Ms',         true, 2),
  ('milkshake', 'Milkshake', 'KitKat',       true, 3),
  ('milkshake', 'Milkshake', 'KitKat White', true, 4),
  ('coulis', 'Coulis (+0,50€)', 'Chocolat',  false, 1),
  ('coulis', 'Coulis (+0,50€)', 'Caramel',   false, 2),
  ('coulis', 'Coulis (+0,50€)', 'Fraise',    false, 3);
