-- ════════════════════════════════════════════════════════════════
-- V009 — Arriérés antérieurs sur locataires
-- ════════════════════════════════════════════════════════════════

INSERT INTO schema_migrations (version, description)
VALUES ('V009', 'Arriérés antérieurs locataires')
ON CONFLICT (version) DO NOTHING;

ALTER TABLE locataires ADD COLUMN IF NOT EXISTS arrieres      NUMERIC DEFAULT 0;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS mois_arrieres INTEGER DEFAULT 0;
