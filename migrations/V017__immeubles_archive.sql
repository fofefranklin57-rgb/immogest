-- ═══════════════════════════════════════════════════════════════
-- V017 — Colonnes d'archivage sur `immeubles`
-- ───────────────────────────────────────────────────────────────
-- Contexte : la fonctionnalité d'archivage d'immeuble est entièrement
-- codée (js/immeubles.js confirmerArchivage/charger, js/app.js vue
-- Archives + restauration) et lit/écrit/filtre sur `archive` et
-- `date_archive`. Mais ces colonnes n'existent pas dans la table
-- → l'upsert d'archivage renvoie PostgREST 42703/PGRST204
-- → « Erreur base de données » au clic sur 📦 Archiver.
-- Ajout additif (aucune donnée impactée).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS archive      BOOLEAN     DEFAULT false;
ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS date_archive TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_immeubles_archive ON immeubles(tenant_id, archive);

INSERT INTO schema_migrations (version, description)
VALUES ('V017', 'immeubles: add archive + date_archive columns')
ON CONFLICT (version) DO NOTHING;
