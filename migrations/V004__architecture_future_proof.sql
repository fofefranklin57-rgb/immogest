-- ══════════════════════════════════════════════════════════════
-- MIGRATION V004 — Architecture Future-Proof
-- Version    : 004
-- Date       : 2026-06-15
-- Auteur     : ImmoGest Claude Code
-- Description: Feature flags, event log, score locataire, multi-orga
--              (Prompt 3 — Architecture Mondiale Future-Proof)
-- ══════════════════════════════════════════════════════════════

-- ── UP ───────────────────────────────────────────────────────

-- Feature Flags (activable/désactivable par tenant)
CREATE TABLE IF NOT EXISTS feature_flags (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  flag       TEXT NOT NULL,
  actif      BOOLEAN DEFAULT true,
  config     JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, flag)
);
CREATE INDEX IF NOT EXISTS idx_flags_tenant ON feature_flags(tenant_id);

-- Flags par défaut pour tenants existants
INSERT INTO feature_flags (tenant_id, flag, actif, config)
SELECT id, 'legalos',     false, '{"plan_requis":"pro"}'   FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO feature_flags (tenant_id, flag, actif, config)
SELECT id, 'marketplace', true,  '{}'                       FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO feature_flags (tenant_id, flag, actif, config)
SELECT id, 'ia',          true,  '{"model":"haiku"}'        FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO feature_flags (tenant_id, flag, actif, config)
SELECT id, 'portail_locataire', true, '{}'                  FROM tenants ON CONFLICT DO NOTHING;

-- Event Log (architecture event-driven)
CREATE TABLE IF NOT EXISTS events_log (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID,
  user_id    TEXT,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  action     TEXT NOT NULL,
  payload    JSONB DEFAULT '{}',
  ip         TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_tenant    ON events_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_entity    ON events_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_action    ON events_log(action);
CREATE INDEX IF NOT EXISTS idx_events_created   ON events_log(created_at DESC);

-- Score locataire (credit score immobilier)
CREATE TABLE IF NOT EXISTS scores_locataires (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  locataire_id    BIGINT NOT NULL,
  score           INTEGER DEFAULT 100 CHECK (score BETWEEN 0 AND 100),
  nb_retards      INTEGER DEFAULT 0,
  nb_impayes      INTEGER DEFAULT 0,
  nb_paiements    INTEGER DEFAULT 0,
  montant_total   NUMERIC DEFAULT 0,
  taux_ponctualite NUMERIC DEFAULT 100,
  derniere_maj    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, locataire_id)
);
CREATE INDEX IF NOT EXISTS idx_scores_tenant ON scores_locataires(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scores_score  ON scores_locataires(score DESC);

-- Multi-organisation : un user peut appartenir à plusieurs tenants
CREATE TABLE IF NOT EXISTS user_organisations (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL,
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'gestionnaire',
  actif      BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS idx_userorg_user   ON user_organisations(user_id);
CREATE INDEX IF NOT EXISTS idx_userorg_tenant ON user_organisations(tenant_id);

-- Colonnes architecture mondiale sur tables existantes
ALTER TABLE tenants    ADD COLUMN IF NOT EXISTS pays     TEXT DEFAULT 'CM';
ALTER TABLE tenants    ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"legalos":false,"marketplace":true,"ia":true}';
ALTER TABLE immeubles  ADD COLUMN IF NOT EXISTS pays     TEXT DEFAULT 'CM';
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS score_locataire INTEGER DEFAULT 100;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS tags     JSONB DEFAULT '[]';
ALTER TABLE paiements  ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE immeubles  ADD COLUMN IF NOT EXISTS pay_config JSONB;
ALTER TABLE immeubles  ADD COLUMN IF NOT EXISTS bailleur_id TEXT;

INSERT INTO schema_migrations (version, description)
VALUES ('V004', 'Architecture future-proof : feature_flags, events_log, scores_locataires, multi-organisation')
ON CONFLICT (version) DO NOTHING;

-- ── DOWN ─────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS user_organisations;
-- DROP TABLE IF EXISTS scores_locataires;
-- DROP TABLE IF EXISTS events_log;
-- DROP TABLE IF EXISTS feature_flags;
