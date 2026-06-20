-- V013 — Ajout colonne code_invitation dans users_app
-- Manquait dans le schéma initial (V006), nécessaire pour portail locataire/bailleur

ALTER TABLE users_app
  ADD COLUMN IF NOT EXISTS code_invitation TEXT DEFAULT NULL;

COMMENT ON COLUMN users_app.code_invitation IS
  'Code d''accès portail pour locataire et bailleur. Effacé après première connexion, régénérable par admin.';
