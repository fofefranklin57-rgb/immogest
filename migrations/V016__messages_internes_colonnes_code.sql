-- ═══════════════════════════════════════════════════════════════
-- V016 — Aligner `messages_internes` sur les colonnes utilisées par le code
-- ───────────────────────────────────────────────────────────────
-- Contexte : dérive schéma↔code. Le schéma V006 a créé la table avec
-- expediteur_id/destinataire_id/lu/created_at, mais tout le code
-- (js/app.js, js/owner.js, js/portail-locataire.js ET le Worker /db)
-- interroge/écrit sur de_user_id, pour_user_id, de_nom, pour_nom,
-- date_envoi, lu_par → PostgREST 42703 sur CHAQUE select messagerie
-- des rôles non-admin + échec des envois de messages.
-- La table est vide → on ajoute simplement les colonnes attendues
-- (additif, aucune perte de données, aucune refonte de code).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE messages_internes ADD COLUMN IF NOT EXISTS de_user_id   TEXT;
ALTER TABLE messages_internes ADD COLUMN IF NOT EXISTS pour_user_id TEXT;
ALTER TABLE messages_internes ADD COLUMN IF NOT EXISTS de_nom       TEXT;
ALTER TABLE messages_internes ADD COLUMN IF NOT EXISTS pour_nom     TEXT;
ALTER TABLE messages_internes ADD COLUMN IF NOT EXISTS date_envoi   TIMESTAMPTZ DEFAULT now();
ALTER TABLE messages_internes ADD COLUMN IF NOT EXISTS lu_par       JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_msg_pour_user ON messages_internes(pour_user_id);
CREATE INDEX IF NOT EXISTS idx_msg_de_user   ON messages_internes(de_user_id);

INSERT INTO schema_migrations (version, description)
VALUES ('V016', 'messages_internes: add de_user_id/pour_user_id/de_nom/pour_nom/date_envoi/lu_par')
ON CONFLICT (version) DO NOTHING;
