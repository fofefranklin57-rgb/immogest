-- ═══════════════════════════════════════════════════════════════
--  ImmoGest — Migration : tables archives & corbeille
--  À exécuter dans Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════


-- ── 1. TABLE ARCHIVES (permanente, jamais effacée) ─────────────

CREATE TABLE IF NOT EXISTS archives (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  locataire_id    TEXT,                          -- ID original dans l'app
  nom             TEXT    NOT NULL,
  prenom          TEXT,
  telephone       TEXT,
  email           TEXT,
  cin             TEXT,                          -- pièce d'identité
  immeuble_nom    TEXT,
  immeuble_id     TEXT,
  local_num       TEXT,
  loyer           NUMERIC DEFAULT 0,
  charges         NUMERIC DEFAULT 0,
  date_entree     DATE,
  date_sortie     DATE,
  duree_mois      INTEGER DEFAULT 0,             -- calculé automatiquement
  motif           TEXT    DEFAULT 'inconnu',     -- voir valeurs ci-dessous
  -- motif possible : 'depart_volontaire' | 'fin_bail' | 'expulsion'
  --                  | 'suppression_immeuble' | 'suppression_manuelle'
  nb_paiements    INTEGER DEFAULT 0,
  nb_retards      INTEGER DEFAULT 0,
  nb_impayes      INTEGER DEFAULT 0,
  montant_impaye  NUMERIC DEFAULT 0,
  note            TEXT,                          -- observations libres
  score           INTEGER DEFAULT 100,           -- score calculé 0-100
  mode            TEXT    DEFAULT 'entreprise',  -- 'individuel' | 'entreprise'
  created_at      TIMESTAMPTZ DEFAULT now()
);


-- ── 2. TABLE CORBEILLE (temporaire, expire après 30 jours) ─────

CREATE TABLE IF NOT EXISTS corbeille (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  locataire_id     TEXT,
  locataire_data   JSONB   NOT NULL,             -- snapshot complet du locataire
  date_suppression TIMESTAMPTZ DEFAULT now(),
  expire_at        TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  mode             TEXT    DEFAULT 'entreprise'
);


-- ── 3. INDEX pour les recherches rapides ───────────────────────

-- Recherche par nom (vérification nouveau locataire)
CREATE INDEX IF NOT EXISTS idx_archives_nom
  ON archives (LOWER(nom));

-- Recherche par téléphone
CREATE INDEX IF NOT EXISTS idx_archives_telephone
  ON archives (telephone);

-- Recherche par email
CREATE INDEX IF NOT EXISTS idx_archives_email
  ON archives (email);

-- Filtrage par mode (individuel / entreprise)
CREATE INDEX IF NOT EXISTS idx_archives_mode
  ON archives (mode);

-- Nettoyage corbeille expirée
CREATE INDEX IF NOT EXISTS idx_corbeille_expire
  ON corbeille (expire_at);


-- ── 4. FUNCTION : calcul automatique du score ──────────────────

CREATE OR REPLACE FUNCTION calcul_score_locataire(
  p_nb_paiements   INTEGER,
  p_nb_retards     INTEGER,
  p_nb_impayes     INTEGER,
  p_montant_impaye NUMERIC,
  p_motif          TEXT
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 100;
BEGIN
  -- Pénalités retards (-5 par retard)
  score := score - (p_nb_retards * 5);

  -- Pénalités impayés (-15 par impayé)
  score := score - (p_nb_impayes * 15);

  -- Pénalité montant impayé important (-10 si > 100 000)
  IF p_montant_impaye > 100000 THEN
    score := score - 10;
  END IF;

  -- Pénalité motif expulsion
  IF p_motif = 'expulsion' THEN
    score := score - 20;
  END IF;

  -- Bonus départ propre sans aucun incident
  IF p_nb_retards = 0 AND p_nb_impayes = 0 AND p_motif = 'depart_volontaire' THEN
    score := score + 10;
  END IF;

  -- Borner entre 0 et 100
  score := GREATEST(0, LEAST(100, score));

  RETURN score;
END;
$$ LANGUAGE plpgsql;


-- ── 5. TRIGGER : calcul score automatique à l'insertion ────────

CREATE OR REPLACE FUNCTION trigger_calcul_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.score := calcul_score_locataire(
    NEW.nb_paiements,
    NEW.nb_retards,
    NEW.nb_impayes,
    NEW.montant_impaye,
    NEW.motif
  );

  -- Calcul durée en mois si dates présentes
  IF NEW.date_entree IS NOT NULL AND NEW.date_sortie IS NOT NULL THEN
    NEW.duree_mois := EXTRACT(YEAR FROM AGE(NEW.date_sortie, NEW.date_entree)) * 12
                    + EXTRACT(MONTH FROM AGE(NEW.date_sortie, NEW.date_entree));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_archives_score
  BEFORE INSERT OR UPDATE ON archives
  FOR EACH ROW EXECUTE FUNCTION trigger_calcul_score();


-- ── 6. FUNCTION : nettoyage corbeille expirée ──────────────────
--    (à appeler manuellement ou via un cron Supabase)

CREATE OR REPLACE FUNCTION vider_corbeille_expiree()
RETURNS INTEGER AS $$
DECLARE
  nb INTEGER;
BEGIN
  SELECT COUNT(*) INTO nb FROM corbeille WHERE expire_at < now();
  DELETE FROM corbeille WHERE expire_at < now();
  RETURN nb;
END;
$$ LANGUAGE plpgsql;


-- ── 7. ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE archives  ENABLE ROW LEVEL SECURITY;
ALTER TABLE corbeille ENABLE ROW LEVEL SECURITY;

-- Politique : accès complet avec la clé anon (à affiner selon vos besoins)
CREATE POLICY "acces_archives"  ON archives  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acces_corbeille" ON corbeille FOR ALL USING (true) WITH CHECK (true);


-- ── FIN ────────────────────────────────────────────────────────
-- Vérification : les tables doivent apparaître dans Table Editor
SELECT 'archives'  AS table_name, COUNT(*) AS lignes FROM archives
UNION ALL
SELECT 'corbeille' AS table_name, COUNT(*) AS lignes FROM corbeille;


-- ═══════════════════════════════════════════════════════════════
--  ImmoGest — Migration : table declarations
--  À exécuter dans Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS declarations (
  id               SERIAL PRIMARY KEY,
  locataire_id     INTEGER,
  montant          INTEGER NOT NULL DEFAULT 0,
  date_paiement    DATE,
  mois_c           INTEGER,
  annee_c          INTEGER,
  mois_fin         INTEGER,
  annee_fin        INTEGER,
  periode_label    TEXT,
  mode             TEXT    DEFAULT 'especes',
  ref              TEXT,
  obs              TEXT,
  statut           TEXT    DEFAULT 'pending',
  date_declaration TIMESTAMPTZ DEFAULT now(),
  date_validation  DATE,
  note_comptable   TEXT,
  montant_valide   INTEGER,
  pay_id           INTEGER,
  receipt_id       TEXT,
  nom_locataire    TEXT,
  appt_locataire   TEXT,
  nom_immeuble     TEXT,
  photo_url        TEXT,
  declared_by      TEXT    DEFAULT 'locataire',
  type             TEXT    DEFAULT 'locataire'
);

CREATE INDEX IF NOT EXISTS idx_declarations_locataire ON declarations (locataire_id);
CREATE INDEX IF NOT EXISTS idx_declarations_statut    ON declarations (statut);

ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acces_declarations" ON declarations FOR ALL USING (true) WITH CHECK (true);

-- Bucket Storage pour les photos de reçus (à créer dans Supabase Dashboard → Storage)
-- Nom du bucket : declarations
-- Public : true


-- ═══════════════════════════════════════════════════════════════
--  ImmoGest — Migration : users_app + parametres (sync multi-device)
--  À exécuter dans Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. TABLE users_app (comptes utilisateurs synchronisés) ─────

CREATE TABLE IF NOT EXISTS users_app (
  id                   TEXT PRIMARY KEY,
  version              TEXT NOT NULL DEFAULT 'entreprise',
  role                 TEXT NOT NULL DEFAULT 'locataire',
  nom                  TEXT NOT NULL DEFAULT '',
  username             TEXT,
  tel                  TEXT,
  password             TEXT,
  pin                  TEXT,
  immeubles            JSONB DEFAULT '[]'::jsonb,
  locataire_id         INTEGER,
  iid                  INTEGER,
  custom_perms         JSONB DEFAULT '{}'::jsonb,
  first_login          BOOLEAN DEFAULT false,
  must_change_password BOOLEAN DEFAULT false,
  actif                BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users_app ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acces_users_app" ON users_app FOR ALL USING (true) WITH CHECK (true);

-- ── 2. TABLE parametres (settings globaux : theme, momo, cabinet) ──

CREATE TABLE IF NOT EXISTS parametres (
  id         TEXT PRIMARY KEY,
  settings   JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acces_parametres" ON parametres FOR ALL USING (true) WITH CHECK (true);

-- ── Vérification ───────────────────────────────────────────────
SELECT 'users_app'  AS table_name, COUNT(*) AS lignes FROM users_app
UNION ALL
SELECT 'parametres' AS table_name, COUNT(*) AS lignes FROM parametres;
