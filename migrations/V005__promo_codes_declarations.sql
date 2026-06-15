-- ════════════════════════════════════════════════════════════════
-- V005 — Codes promo + table declarations + colonnes plans
-- Migration : appliquer après V004
-- ════════════════════════════════════════════════════════════════

-- ── UP ───────────────────────────────────────────────────────────

-- Tracker
INSERT INTO schema_migrations (version, description)
VALUES ('V005', 'Codes promo + declarations + colonnes plans')
ON CONFLICT (version) DO NOTHING;

-- Codes promo
CREATE TABLE IF NOT EXISTS promo_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'starter',
  duree_jours INTEGER NOT NULL DEFAULT 30,
  max_uses    INTEGER NOT NULL DEFAULT 1,
  uses        INTEGER NOT NULL DEFAULT 0,
  actif       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expire_at   TIMESTAMPTZ
);

-- Table declarations paiements locataire (si pas encore créée)
CREATE TABLE IF NOT EXISTS declarations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id     TEXT NOT NULL,
  nom_locataire    TEXT,
  montant          NUMERIC(12,2) NOT NULL,
  mois_c           INTEGER NOT NULL,
  annee_c          INTEGER NOT NULL,
  mode             TEXT DEFAULT 'especes',
  ref              TEXT,
  statut           TEXT NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending','validated','rejected')),
  date_declaration TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_traitement  TIMESTAMPTZ,
  note_gestionnaire TEXT
);

-- Colonnes plan sur tenants (si pas encore là)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan         TEXT NOT NULL DEFAULT 'gratuit';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_expire  TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS promo_code   TEXT;

-- RLS déclarations
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "declarations_tenant" ON declarations;
CREATE POLICY "declarations_tenant" ON declarations
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- RLS promo_codes (lecture publique pour vérification code)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_read" ON promo_codes;
CREATE POLICY "promo_read" ON promo_codes FOR SELECT USING (actif = true);

-- ── DOWN (pour rollback) ─────────────────────────────────────────
-- DROP TABLE IF EXISTS declarations;
-- DROP TABLE IF EXISTS promo_codes;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS plan;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS plan_expire;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS promo_code;
-- DELETE FROM schema_migrations WHERE version = 'V005';
