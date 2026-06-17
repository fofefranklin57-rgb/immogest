-- V007 — CRM Leads Marketplace
-- Suivi des contacts générés par les annonces publiques

CREATE TABLE IF NOT EXISTS marketplace_leads (
  id            BIGSERIAL PRIMARY KEY,
  annonce_id    BIGINT REFERENCES marketplace_annonces(id) ON DELETE SET NULL,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE SET NULL,

  -- Contact
  type          TEXT NOT NULL CHECK (type IN ('whatsapp','telephone','visite','information','message','partage')),
  statut        TEXT NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau','contacte','visite_planifiee','converti','perdu')),

  -- Visiteur (anonyme ou identifié)
  nom           TEXT,
  telephone     TEXT,
  email         TEXT,
  message       TEXT,

  -- Contexte
  source        TEXT,           -- facebook, whatsapp, google, direct, telegram...
  ip            TEXT,
  user_agent    TEXT,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour dashboards gestionnaire
CREATE INDEX IF NOT EXISTS idx_leads_annonce   ON marketplace_leads(annonce_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant    ON marketplace_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_statut    ON marketplace_leads(statut);
CREATE INDEX IF NOT EXISTS idx_leads_created   ON marketplace_leads(created_at DESC);

-- RLS : gestionnaire voit uniquement ses leads
ALTER TABLE marketplace_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_tenant_isolation ON marketplace_leads
  USING (
    tenant_id = (
      SELECT tenant_id FROM users_app
      WHERE id = auth.uid()::text
      LIMIT 1
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON marketplace_leads
  FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();

-- Vue analytique par annonce
CREATE OR REPLACE VIEW marketplace_leads_stats AS
SELECT
  annonce_id,
  COUNT(*)                                          AS total_leads,
  COUNT(*) FILTER (WHERE type = 'whatsapp')         AS clics_whatsapp,
  COUNT(*) FILTER (WHERE type = 'visite')           AS demandes_visite,
  COUNT(*) FILTER (WHERE type = 'partage')          AS partages,
  COUNT(*) FILTER (WHERE statut = 'converti')       AS conversions,
  MAX(created_at)                                   AS dernier_lead
FROM marketplace_leads
GROUP BY annonce_id;
