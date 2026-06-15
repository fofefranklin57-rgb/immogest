-- ══════════════════════════════════════════════════════════════
-- MIGRATION V002 — Marketplace multi-pays + annonces
-- Version    : 002
-- Date       : 2026-06-15
-- Auteur     : ImmoGest Claude Code
-- Description: Marketplace immobilière mondiale (Prompt 1 — Vision Stratégique)
--              Architecture multi-pays, catégories, premium, enchères futures
-- ══════════════════════════════════════════════════════════════

-- ── UP ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_annonces (
  id             BIGSERIAL PRIMARY KEY,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  immeuble_id    BIGINT,
  titre          TEXT NOT NULL,
  description    TEXT,
  loyer          NUMERIC,
  charges        NUMERIC DEFAULT 0,
  caution        NUMERIC DEFAULT 0,
  ville          TEXT,
  quartier       TEXT,
  adresse        TEXT,
  pays           TEXT DEFAULT 'CM',
  devise         TEXT DEFAULT 'XAF',
  type_local     TEXT,
  categorie      TEXT DEFAULT 'location_residentielle'
                 CHECK (categorie IN (
                   'location_residentielle','location_commerciale',
                   'bureau','colocation','location_saisonniere',
                   'vente','luxe','professionnel','industriel'
                 )),
  superficie     NUMERIC,
  nb_pieces      INTEGER,
  photos         JSONB DEFAULT '[]',
  statut         TEXT DEFAULT 'pending' CHECK (statut IN ('pending','active','inactive','vendu','loue')),
  premium        BOOLEAN DEFAULT false,
  premium_niveau INTEGER DEFAULT 0 CHECK (premium_niveau BETWEEN 0 AND 5),
  premium_expire TIMESTAMPTZ,
  budget_pub     NUMERIC DEFAULT 0,
  notchpay_ref   TEXT,
  vues           INTEGER DEFAULT 0,
  contacts       INTEGER DEFAULT 0,
  geoloc         JSONB,
  tags           JSONB DEFAULT '[]',
  canal_fb       BOOLEAN DEFAULT false,
  canal_ig       BOOLEAN DEFAULT false,
  canal_wa       BOOLEAN DEFAULT false,
  canal_tiktok   BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE marketplace_annonces ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mkt_pays      ON marketplace_annonces(pays);
CREATE INDEX IF NOT EXISTS idx_mkt_ville     ON marketplace_annonces(ville);
CREATE INDEX IF NOT EXISTS idx_mkt_statut    ON marketplace_annonces(statut);
CREATE INDEX IF NOT EXISTS idx_mkt_categorie ON marketplace_annonces(categorie);
CREATE INDEX IF NOT EXISTS idx_mkt_premium   ON marketplace_annonces(premium, premium_niveau DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_tenant    ON marketplace_annonces(tenant_id);

-- Prestataires (réseau mondial — Phase 3)
CREATE TABLE IF NOT EXISTS prestataires (
  id           BIGSERIAL PRIMARY KEY,
  tenant_id    UUID,
  nom          TEXT NOT NULL,
  categorie    TEXT NOT NULL,
  sous_categorie TEXT,
  telephone    TEXT,
  email        TEXT,
  site_web     TEXT,
  ville        TEXT,
  pays         TEXT DEFAULT 'CM',
  geoloc       JSONB,
  note_moy     NUMERIC DEFAULT 0 CHECK (note_moy BETWEEN 0 AND 5),
  nb_avis      INTEGER DEFAULT 0,
  nb_missions  INTEGER DEFAULT 0,
  verifie      BOOLEAN DEFAULT false,
  premium      BOOLEAN DEFAULT false,
  budget_pub   NUMERIC DEFAULT 0,
  actif        BOOLEAN DEFAULT true,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_presta_pays      ON prestataires(pays);
CREATE INDEX IF NOT EXISTS idx_presta_categorie ON prestataires(categorie);
CREATE INDEX IF NOT EXISTS idx_presta_ville     ON prestataires(ville);
CREATE INDEX IF NOT EXISTS idx_presta_note      ON prestataires(note_moy DESC);

INSERT INTO schema_migrations (version, description)
VALUES ('V002', 'Marketplace multi-pays + prestataires réseau mondial')
ON CONFLICT (version) DO NOTHING;

-- ── DOWN ─────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS prestataires;
-- DROP TABLE IF EXISTS marketplace_annonces;
