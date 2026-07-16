-- ═══════════════════════════════════════════════════════════════
-- V020 — RLS LOCKDOWN (CRITIQUE / SÉCURITÉ)
-- ═══════════════════════════════════════════════════════════════
--
-- PROBLÈME
-- V006 a créé des policies `CREATE POLICY "service_role_all" ... FOR ALL USING (true)`
-- SANS clause `TO service_role`. En PostgreSQL, l'absence de `TO` vaut `TO PUBLIC` :
-- la policy s'applique donc AUSSI aux rôles `anon` et `authenticated`.
-- Or la clé ANON est publiée en clair dans marche.html / portail-*.html / index.html.bak,
-- pages servies publiquement sur immogest-34w.pages.dev.
--
-- Conséquence mesurée le 2026-07-16 : 18 tables sur 19 étaient lisibles ET modifiables
-- par n'importe qui sur Internet, dont `tenants.password_hash` et les 34 `locataires`.
--
-- SOLUTION
-- Le Worker se connecte avec la clé `service_role`, qui **bypasse le RLS nativement** :
-- il n'a besoin d'AUCUNE policy. On peut donc tout verrouiller sans impact sur l'app.
-- RLS activé + zéro policy = refus par défaut pour anon/authenticated. C'est déjà l'état
-- de la table `evenements` (seule table saine avant ce correctif).
--
-- ⚠️ IMPACT ASSUMÉ
-- Les pages autonomes legacy (marche.html, portail-locataire.html, portail-bailleur.html)
-- interrogent Supabase en direct avec la clé anon → elles perdront leur accès données.
-- Elles sont DÉJÀ cassées (elles requêtent `annonces`, `agents`, `maintenance_requests`
-- qui n'existent plus — 404) et ne sont liées depuis aucune page de l'app.
-- L'app réelle (index.html + js/) passe exclusivement par le Worker → non impactée.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Supprimer toute policy ouverte à anon / authenticated / public ──
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        roles = '{public}'
        OR roles && ARRAY['anon','authenticated']::name[]
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Policy supprimée : %.% -> %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;

-- ── 2. Activer RLS sur TOUTES les tables du schéma public ──
-- (RLS actif + aucune policy => anon/authenticated n'ont plus aucun accès ;
--  service_role continue de tout faire en bypass.)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- ── 3. Retirer les privilèges directs d'anon/authenticated (ceinture + bretelles) ──
-- Même sans policy, un GRANT résiduel n'ouvre rien tant que RLS est actif,
-- mais on retire le privilège pour éviter toute régression future.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- ── 4. Vérification (doit renvoyer 0 ligne) ──
-- SELECT tablename, policyname, roles FROM pg_policies
-- WHERE schemaname='public' AND (roles='{public}' OR roles && ARRAY['anon','authenticated']::name[]);
--
-- SELECT tablename FROM pg_tables t WHERE schemaname='public'
--   AND NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.relname=t.tablename AND c.relrowsecurity);

INSERT INTO schema_migrations (version, description) VALUES
  ('V020', 'RLS lockdown — fermeture acces anon public (critique)')
ON CONFLICT (version) DO NOTHING;
