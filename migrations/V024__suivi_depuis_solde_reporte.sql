-- ═══════════════════════════════════════════════════════════════
-- V024 — Ancrage des arriérés de reprise à une DATE FIXE
-- ═══════════════════════════════════════════════════════════════
-- Problème corrigé : `mois_arrieres` était interprété par rapport à
-- AUJOURD'HUI. Le calcul créditait implicitement (mois_écoulés − mois_arrieres)
-- mois, donc la fenêtre des impayés glissait avec le temps : un locataire qui
-- ne payait plus devait éternellement le même nombre de mois. Sa dette
-- n'augmentait jamais. Vérifié : deux locataires identiques, l'un entré en
-- 2022 et l'autre en 2024, sans aucun versement, devaient tous deux 600 000.
--
-- Nouveau modèle, comptable et stable :
--   suivi_depuis   = premier mois réellement suivi dans ImmoGest
--   solde_reporte  = ce qui était dû à cette date (à-nouveau)
-- Les mois antérieurs sortent du champ du suivi une fois pour toutes, et la
-- dette s'accumule normalement à partir de suivi_depuis.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE locataires ADD COLUMN IF NOT EXISTS suivi_depuis  DATE;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS solde_reporte NUMERIC DEFAULT 0;

-- Reprise à l'identique de la situation actuelle : on fige la frontière là où
-- le calcul glissant la plaçait aujourd'hui, pour qu'aucun montant ne change
-- au moment de la migration.
--   mois_arrieres = 16 et nous sommes en août 2026
--   -> suivi_depuis = mai 2025 (16 mois dus : mai 2025 → août 2026)
-- Jamais avant la date d'entrée du locataire.
UPDATE locataires
SET suivi_depuis = GREATEST(
      COALESCE(entree, date_trunc('month', CURRENT_DATE)::date),
      (date_trunc('month', CURRENT_DATE) - ((COALESCE(mois_arrieres, 0) - 1) * INTERVAL '1 month'))::date
    )
WHERE suivi_depuis IS NULL
  AND COALESCE(mois_arrieres, 0) > 0;

-- Sans arriérés déclarés, le suivi commence à l'entrée dans les lieux.
UPDATE locataires
SET suivi_depuis = entree
WHERE suivi_depuis IS NULL
  AND entree IS NOT NULL;

-- Le solde reporté démarre à zéro : dans l'ancien modèle, la dette de reprise
-- s'exprimait entièrement en mois entiers, désormais portés par suivi_depuis.
-- Le champ `arrieres` est conservé en l'état à titre d'archive de la saisie
-- d'origine — il n'est plus lu par aucun calcul.
UPDATE locataires
SET solde_reporte = 0
WHERE solde_reporte IS NULL;

INSERT INTO schema_migrations (version, description) VALUES
  ('V024', 'locataires.suivi_depuis + solde_reporte — arrieres ancres a une date fixe')
ON CONFLICT (version) DO NOTHING;
