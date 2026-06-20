-- ════════════════════════════════════════════════════════════════
-- V010 — Email sur users_app + photo_360 marketplace
-- ════════════════════════════════════════════════════════════════

INSERT INTO schema_migrations (version, description)
VALUES ('V010', 'Email users_app + photo_360 marketplace')
ON CONFLICT (version) DO NOTHING;

ALTER TABLE users_app ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE marketplace_annonces ADD COLUMN IF NOT EXISTS photo_360 TEXT;
