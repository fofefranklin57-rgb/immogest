-- ═══════════════════════════════════════════════════════════════
-- IMMOGEST — Tables Marketplace + Signatures électroniques
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Table annonces (marketplace) ──────────────────────────────
CREATE TABLE IF NOT EXISTS annonces (
  id                BIGSERIAL PRIMARY KEY,
  tenant_id         UUID,
  titre             TEXT NOT NULL,
  type              TEXT NOT NULL,  -- appartement|maison|studio|chambre|meuble|hotel|commercial
  description       TEXT,
  ville             TEXT,
  quartier          TEXT,
  adresse           TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  prix              BIGINT DEFAULT 0,
  prix_negociable   BOOLEAN DEFAULT false,
  periode           TEXT DEFAULT 'mois',  -- mois|jour|an
  surface           INTEGER,
  nb_pieces         INTEGER,
  nb_chambres       INTEGER,
  nb_sdb            INTEGER,
  meuble            BOOLEAN DEFAULT false,
  climatise         BOOLEAN DEFAULT false,
  gardien           BOOLEAN DEFAULT false,
  parking           BOOLEAN DEFAULT false,
  photos            TEXT[] DEFAULT '{}',
  video_url         TEXT,
  whatsapp          TEXT,
  disponible        BOOLEAN DEFAULT true,
  date_disponibilite DATE,
  badge_verifie     BOOLEAN DEFAULT false,
  badge_meilleur_prix BOOLEAN DEFAULT false,
  actif             BOOLEAN DEFAULT true,
  vues              INTEGER DEFAULT 0,
  date_publication  TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Politiques RLS annonces
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "annonces_select" ON annonces FOR SELECT USING (actif = true);
CREATE POLICY "annonces_insert" ON annonces FOR INSERT WITH CHECK (true);
CREATE POLICY "annonces_update" ON annonces FOR UPDATE USING (true) WITH CHECK (true);

-- Fonction pour incrémenter les vues
CREATE OR REPLACE FUNCTION increment_annonce_vues(annonce_id BIGINT)
RETURNS void AS $$
  UPDATE annonces SET vues = vues + 1 WHERE id = annonce_id;
$$ LANGUAGE sql;

-- ── Table signatures (signatures électroniques) ───────────────
CREATE TABLE IF NOT EXISTS signatures (
  id                BIGSERIAL PRIMARY KEY,
  tenant_id         UUID,
  locataire_id      BIGINT,
  locataire_nom     TEXT,
  type_document     TEXT DEFAULT 'contrat_bail',
  titre_document    TEXT,
  code              TEXT UNIQUE NOT NULL,
  signature_data    TEXT,           -- base64 PNG de la signature dessinée
  signed_at         TIMESTAMPTZ DEFAULT NOW(),
  user_agent        TEXT,
  ip_hint           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Politiques RLS signatures
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signatures_select" ON signatures FOR SELECT USING (true);
CREATE POLICY "signatures_insert" ON signatures FOR INSERT WITH CHECK (true);
CREATE POLICY "signatures_update" ON signatures FOR UPDATE USING (true) WITH CHECK (true);

-- Index pour recherche rapide par code
CREATE INDEX IF NOT EXISTS idx_signatures_code ON signatures(code);
CREATE INDEX IF NOT EXISTS idx_annonces_ville ON annonces(ville);
CREATE INDEX IF NOT EXISTS idx_annonces_type ON annonces(type);
