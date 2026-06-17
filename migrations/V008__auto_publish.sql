-- V008 : Publication automatique des locaux libérés
-- Colonnes immeuble (marketing + 3D)
ALTER TABLE immeubles
  ADD COLUMN IF NOT EXISTS visite_3d_url        TEXT,
  ADD COLUMN IF NOT EXISTS description_marketing TEXT,
  ADD COLUMN IF NOT EXISTS commodites            JSONB DEFAULT '[]'::jsonb;

-- Colonnes annonce (score, mode auto, lien local, 3D)
ALTER TABLE marketplace_annonces
  ADD COLUMN IF NOT EXISTS visite_3d_url      TEXT,
  ADD COLUMN IF NOT EXISTS score_qualite      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mode_auto          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS appt               TEXT,
  ADD COLUMN IF NOT EXISTS contact_telephone  TEXT;

-- Table de déclencheurs de publication (audit workflow)
CREATE TABLE IF NOT EXISTS marketplace_workflow (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   UUID NOT NULL,
  annonce_id  BIGINT REFERENCES marketplace_annonces(id) ON DELETE CASCADE,
  locataire_id BIGINT,
  immeuble_id  BIGINT,
  appt         TEXT,
  evenement    TEXT NOT NULL,  -- 'local.libere' | 'pre_annonce.creee' | 'annonce.publiee' | 'annonce.archivee'
  details      JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketplace_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_workflow" ON marketplace_workflow
  USING (tenant_id::text = auth.uid()::text);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_workflow_tenant    ON marketplace_workflow(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_annonce   ON marketplace_workflow(annonce_id);
CREATE INDEX IF NOT EXISTS idx_annonces_appt      ON marketplace_annonces(immeuble_id, appt);
