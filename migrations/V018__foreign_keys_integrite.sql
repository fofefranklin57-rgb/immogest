-- ═══════════════════════════════════════════════════════════════
-- V018 — Contraintes FK manquantes (intégrité référentielle)
-- ───────────────────────────────────────────────────────────────
-- Plusieurs tables référençaient locataires/immeubles/annonces SANS
-- contrainte FK → rien au niveau base n'empêchait les orphelins.
-- Audit du 2026-07-11 : 0 orphelin actuel → on peut poser les FK
-- sans échec de validation. Gardes idempotentes (re-exécutable).
--
-- Règles de suppression :
--   CASCADE   : la ligne enfant n'a aucun sens sans son parent
--   SET NULL  : l'enfant garde une valeur historique (contexte)
-- ═══════════════════════════════════════════════════════════════

-- declarations.locataire_id est en TEXT (table vide) → conversion en bigint d'abord
ALTER TABLE declarations
  ALTER COLUMN locataire_id TYPE bigint USING NULLIF(locataire_id, '')::bigint;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_declarations_locataire') THEN
    ALTER TABLE declarations ADD CONSTRAINT fk_declarations_locataire
      FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dossiers_locataire') THEN
    ALTER TABLE dossiers_juridiques ADD CONSTRAINT fk_dossiers_locataire
      FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dossiers_immeuble') THEN
    ALTER TABLE dossiers_juridiques ADD CONSTRAINT fk_dossiers_immeuble
      FOREIGN KEY (immeuble_id) REFERENCES immeubles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_scores_locataire') THEN
    ALTER TABLE scores_locataires ADD CONSTRAINT fk_scores_locataire
      FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_timeline_locataire') THEN
    ALTER TABLE timeline_juridique ADD CONSTRAINT fk_timeline_locataire
      FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_annonces_immeuble') THEN
    ALTER TABLE marketplace_annonces ADD CONSTRAINT fk_annonces_immeuble
      FOREIGN KEY (immeuble_id) REFERENCES immeubles(id) ON DELETE CASCADE;
  END IF;
END $$;

INSERT INTO schema_migrations (version, description)
VALUES ('V018', 'FK integrite: declarations/dossiers/scores/timeline/annonces')
ON CONFLICT (version) DO NOTHING;
