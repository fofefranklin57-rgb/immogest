-- ═══════════════════════════════════════════════════════════════
-- V019 — Unicité de `parametres` par tenant (1 ligne de réglages / cabinet)
-- ───────────────────────────────────────────────────────────────
-- `parametres` est sémantiquement une table singleton par tenant, mais
-- rien ne l'imposait : deux enregistrements concurrents au tout premier
-- save (avant que la 1ère ligne existe) pouvaient créer des doublons.
-- Le code (js/app.js) fait déjà select→update/insert et est désormais
-- tolérant au conflit ; cette contrainte est la garantie au niveau base.
-- Audit du 2026-07-11 : 0 tenant avec >1 ligne → contrainte posable.
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_parametres_tenant') THEN
    ALTER TABLE parametres ADD CONSTRAINT uq_parametres_tenant UNIQUE (tenant_id);
  END IF;
END $$;

INSERT INTO schema_migrations (version, description)
VALUES ('V019', 'parametres: UNIQUE(tenant_id) — anti-doublon réglages')
ON CONFLICT (version) DO NOTHING;
