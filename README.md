-- =============================================================
-- MIGRATION STOCK — FAIS TON S'DALLE
-- Ajoute la gestion des stocks aux menu_items
-- Exécuter DANS CET ORDRE dans Supabase SQL Editor
-- =============================================================

-- 1. Ajouter les colonnes de stock à menu_items
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS stock_qty INT NOT NULL DEFAULT 999 CHECK (stock_qty >= 0),
  ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5;

-- 2. Créer la table stock_history pour le suivi
CREATE TABLE IF NOT EXISTS stock_history (
    id              SERIAL PRIMARY KEY,
    menu_item_id    INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    change_qty      INT NOT NULL,  -- négatif = sortie, positif = réappro
    reason          VARCHAR(100) NOT NULL DEFAULT 'order', -- 'order', 'restock', 'adjustment'
    order_id        INT REFERENCES orders(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_history_item ON stock_history(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON stock_history(created_at);

-- 3. Fonction pour décrémenter le stock automatiquement à la commande
CREATE OR REPLACE FUNCTION decrement_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Décrémente le stock pour chaque item de la commande
    UPDATE menu_items
    SET stock_qty = stock_qty - NEW.quantity
    WHERE id = NEW.menu_item_id AND NEW.menu_item_id IS NOT NULL;

    -- Enregistre dans l'historique
    INSERT INTO stock_history (menu_item_id, change_qty, reason, order_id)
    VALUES (NEW.menu_item_id, -NEW.quantity, 'order', NEW.order_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger sur order_items
DROP TRIGGER IF EXISTS trg_decrement_stock ON order_items;
CREATE TRIGGER trg_decrement_stock
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION decrement_stock();

-- 5. Fonction pour réapprovisionner
CREATE OR REPLACE FUNCTION restock_item(
    p_item_id INT,
    p_qty INT,
    p_reason VARCHAR DEFAULT 'restock'
) RETURNS VOID AS $$
BEGIN
    UPDATE menu_items SET stock_qty = stock_qty + p_qty WHERE id = p_item_id;
    INSERT INTO stock_history (menu_item_id, change_qty, reason)
    VALUES (p_item_id, p_qty, p_reason);
END;
$$ LANGUAGE plpgsql;

-- 6. Mettre à jour les stocks initiaux (valeurs réelles à ajuster)
UPDATE menu_items SET stock_qty = 50, low_stock_threshold = 10 WHERE name = 'Menu Léger';
UPDATE menu_items SET stock_qty = 50, low_stock_threshold = 10 WHERE name = 'Menu Classique';
UPDATE menu_items SET stock_qty = 40, low_stock_threshold = 10 WHERE name = 'Menu Gourmand';
UPDATE menu_items SET stock_qty = 30, low_stock_threshold = 5  WHERE name = 'Tiramisu';
UPDATE menu_items SET stock_qty = 25, low_stock_threshold = 5  WHERE name = 'Milkshake';
UPDATE menu_items SET stock_qty = 100, low_stock_threshold = 20 WHERE name = 'Coca-Cola';
UPDATE menu_items SET stock_qty = 80, low_stock_threshold = 15  WHERE name = 'Coca Zéro';
UPDATE menu_items SET stock_qty = 80, low_stock_threshold = 15  WHERE name = 'Pepsi';
UPDATE menu_items SET stock_qty = 60, low_stock_threshold = 10  WHERE name = 'Oasis Tropical';
UPDATE menu_items SET stock_qty = 60, low_stock_threshold = 10  WHERE name = 'Ice Tea';
UPDATE menu_items SET stock_qty = 50, low_stock_threshold = 10  WHERE name = 'Orangina';
UPDATE menu_items SET stock_qty = 100, low_stock_threshold = 20 WHERE name = 'Cristaline';
UPDATE menu_items SET stock_qty = 40, low_stock_threshold = 10  WHERE name = 'San Pellegrino';

-- 7. Vue pour voir les stocks bas
CREATE OR REPLACE VIEW low_stock_view AS
SELECT id, name, stock_qty, low_stock_threshold
FROM menu_items
WHERE stock_qty <= low_stock_threshold AND is_active = true
ORDER BY stock_qty ASC;
