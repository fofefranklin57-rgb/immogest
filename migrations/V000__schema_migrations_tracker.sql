-- ══════════════════════════════════════════════════════════════
-- MIGRATION V000 — Tracker de migrations
-- Version    : 000
-- Date       : 2026-06-15
-- Auteur     : ImmoGest Claude Code
-- Description: Crée la table de suivi des migrations versionnées
-- ══════════════════════════════════════════════════════════════

-- ── UP ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at  TIMESTAMPTZ DEFAULT now(),
  applied_by  TEXT DEFAULT 'system',
  checksum    TEXT
);

INSERT INTO schema_migrations (version, description, applied_by)
VALUES ('V000', 'Tracker de migrations versionnées', 'system')
ON CONFLICT (version) DO NOTHING;

-- ── DOWN (rollback) ──────────────────────────────────────────
-- DROP TABLE IF EXISTS schema_migrations;
