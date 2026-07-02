-- ══════════════════════════════════════════════════════════════
-- MIGRATION V001 — Tables CDC base ImmoGest v2
-- Version    : 001
-- Date       : 2026-06-15
-- Auteur     : ImmoGest Claude Code
-- Description: Crée les 17 tables définies dans le CDC principal
--              (owner_config, owner_logs, promo_codes, locale_profiles,
--               corbeille, marketplace_annonces manquantes + colonnes v2)
-- ══════════════════════════════════════════════════════════════

-- ── UP ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS owner_config (
  id            BIGSERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL DEFAULT '',
  settings      JSONB DEFAULT '{}'
);

INSERT INTO owner_config (password_hash)
SELECT ''
WHERE NOT EXISTS (SELECT 1 FROM owner_config);

CREATE TABLE IF NOT EXISTS owner_logs (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID,
  user_id    TEXT,
  level      TEXT DEFAULT 'info' CHECK (level IN ('info','warn','error','critical')),
  event      TEXT NOT NULL,
  message    TEXT,
  payload    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_owner_logs_tenant    ON owner_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_owner_logs_level     ON owner_logs(level);
CREATE INDEX IF NOT EXISTS idx_owner_logs_event     ON owner_logs(event);
CREATE INDEX IF NOT EXISTS idx_owner_logs_created   ON owner_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS promo_codes (
  id          BIGSERIAL PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  plan_cible  TEXT NOT NULL,
  duree_jours INTEGER DEFAULT 30,
  max_uses    INTEGER DEFAULT 1,
  used_count  INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locale_profiles (
  tenant_id        UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  pays             TEXT DEFAULT 'CM',
  devise           TEXT DEFAULT 'XAF',
  timezone         TEXT DEFAULT 'Africa/Douala',
  profil_juridique TEXT DEFAULT 'ohada',
  langue           TEXT DEFAULT 'fr',
  updated_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE locale_profiles ENABLE ROW LEVEL SECURITY;

-- Créer locale_profiles pour tenants existants
INSERT INTO locale_profiles (tenant_id)
SELECT id FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM locale_profiles)
ON CONFLICT (tenant_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS corbeille (
  id               BIGSERIAL PRIMARY KEY,
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id     BIGINT,
  locataire_data   JSONB NOT NULL DEFAULT '{}',
  paiements_data   JSONB DEFAULT '[]',
  date_suppression TIMESTAMPTZ DEFAULT now(),
  expire_at        TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);
ALTER TABLE corbeille ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_corbeille_tenant ON corbeille(tenant_id);
CREATE INDEX IF NOT EXISTS idx_corbeille_expire ON corbeille(expire_at);

-- Colonnes manquantes dans tables existantes
ALTER TABLE tenants    ADD COLUMN IF NOT EXISTS plan        TEXT DEFAULT 'gratuit';
ALTER TABLE tenants    ADD COLUMN IF NOT EXISTS plan_expire TIMESTAMPTZ;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS jour_paiement   INTEGER DEFAULT 1;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS statut_juridique TEXT DEFAULT 'normal';
ALTER TABLE paiements  ADD COLUMN IF NOT EXISTS type            TEXT DEFAULT 'loyer';
ALTER TABLE paiements  ADD COLUMN IF NOT EXISTS remisAuBailleur BOOLEAN DEFAULT false;
ALTER TABLE archives   ADD COLUMN IF NOT EXISTS tenant_id       UUID;
ALTER TABLE archives   ADD COLUMN IF NOT EXISTS immeuble_id     BIGINT;
ALTER TABLE archives   ADD COLUMN IF NOT EXISTS nb_retards      INTEGER DEFAULT 0;
ALTER TABLE archives   ADD COLUMN IF NOT EXISTS nb_impayes      INTEGER DEFAULT 0;
ALTER TABLE archives   ADD COLUMN IF NOT EXISTS montant_impaye  NUMERIC DEFAULT 0;
ALTER TABLE archives   ADD COLUMN IF NOT EXISTS score           INTEGER DEFAULT 100;
ALTER TABLE archives   ADD COLUMN IF NOT EXISTS note            TEXT;

INSERT INTO schema_migrations (version, description)
VALUES ('V001', 'Tables CDC base : owner_config, owner_logs, promo_codes, locale_profiles, corbeille + colonnes v2')
ON CONFLICT (version) DO NOTHING;

-- ── DOWN (rollback) ──────────────────────────────────────────
-- DROP TABLE IF EXISTS corbeille;
-- DROP TABLE IF EXISTS locale_profiles;
-- DROP TABLE IF EXISTS promo_codes;
-- DROP TABLE IF EXISTS owner_logs;
-- DROP TABLE IF EXISTS owner_config;
-- (ALTER TABLE ... DROP COLUMN non inclus car risque de perte de données)
