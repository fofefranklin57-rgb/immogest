-- V011 — Système d'autorisations granulaires
-- Ajoute permissions (overrides JSONB) et immeubles_assignes (JSONB array) dans users_app

ALTER TABLE users_app
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS immeubles_assignes JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN users_app.permissions IS
  'Overrides des permissions par rapport aux défauts du rôle. Ex: {"juridique": false, "rapports": true}';

COMMENT ON COLUMN users_app.immeubles_assignes IS
  'Liste des IDs immeubles accessibles (pour gestionnaire et agent). Vide = tous les immeubles du tenant.';
