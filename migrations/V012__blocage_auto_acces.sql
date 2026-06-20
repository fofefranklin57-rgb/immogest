-- V012 — Blocage automatique d'accès après libération / résiliation
-- Ajoute date_blocage_auto et motif_blocage dans users_app

ALTER TABLE users_app
  ADD COLUMN IF NOT EXISTS date_blocage_auto TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS motif_blocage TEXT DEFAULT NULL;

COMMENT ON COLUMN users_app.date_blocage_auto IS
  'Date à laquelle l''accès sera automatiquement bloqué (ex: J+15 après libération locataire ou résiliation contrat immeuble)';

COMMENT ON COLUMN users_app.motif_blocage IS
  'Raison du blocage planifié : liberation | contrat_rompu | manuel';

-- Index pour le cron daily qui doit trouver vite les users à bloquer
CREATE INDEX IF NOT EXISTS idx_users_app_blocage_auto
  ON users_app (date_blocage_auto)
  WHERE date_blocage_auto IS NOT NULL AND actif = true;
