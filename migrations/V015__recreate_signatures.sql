-- ═══════════════════════════════════════════════════════════════
-- V015 — Recréation de la table `signatures` (signatures électroniques)
-- ───────────────────────────────────────────────────────────────
-- Contexte : la table `signatures` (V1) a été supprimée lors du
-- nettoyage V1→V2 (15 juin 2026) mais jamais recréée dans le schéma
-- V006. Le frontend (js/signature.js) fait toujours insert/select
-- dessus → PostgREST renvoie 42P01 "relation does not exist" →
-- le Worker retourne "Erreur base de données". On restaure la table.
-- Schéma identique à supabase_marketplace_signatures.sql (partie sig).
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS signatures (
  id                BIGSERIAL PRIMARY KEY,
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id      BIGINT,
  locataire_nom     TEXT,
  type_document     TEXT DEFAULT 'contrat_bail',
  titre_document    TEXT,
  code              TEXT UNIQUE NOT NULL,
  signature_data    TEXT,           -- base64 PNG de la signature dessinée
  signed_at         TIMESTAMPTZ DEFAULT now(),
  user_agent        TEXT,
  ip_hint           TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signatures_code   ON signatures(code);
CREATE INDEX IF NOT EXISTS idx_signatures_tenant ON signatures(tenant_id);

INSERT INTO schema_migrations (version, description)
VALUES ('V015', 'recreate signatures table')
ON CONFLICT (version) DO NOTHING;
