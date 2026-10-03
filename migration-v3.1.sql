-- ============================================================
-- FAIS TON S'DALLE — Migration v3.0 → v3.1
-- ============================================================
-- Ajoute : push_subscriptions (notifications push)
--          reviews (avis clients avec modération)
-- ============================================================

-- ─── 1. Push subscriptions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_order_id ON push_subscriptions (order_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email ON push_subscriptions (email);

-- ─── 2. Avis clients ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews (is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews (created_at DESC);

-- ─── 3. RLS ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "svc push_subscriptions all" ON push_subscriptions;
DROP POLICY IF EXISTS "anon push_subscriptions insert" ON push_subscriptions;
DROP POLICY IF EXISTS "anon push_subscriptions select" ON push_subscriptions;
DROP POLICY IF EXISTS "svc reviews all" ON reviews;
DROP POLICY IF EXISTS "anon reviews insert" ON reviews;
DROP POLICY IF EXISTS "anon reviews select" ON reviews;

CREATE POLICY "svc push_subscriptions all" ON push_subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "anon push_subscriptions insert" ON push_subscriptions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon push_subscriptions select" ON push_subscriptions FOR SELECT TO anon USING (true);

CREATE POLICY "svc reviews all" ON reviews FOR ALL TO service_role USING (true);
CREATE POLICY "anon reviews insert" ON reviews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon reviews select" ON reviews FOR SELECT TO anon USING (true);
