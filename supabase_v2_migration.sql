-- ══════════════════════════════════════════════════════════════
-- IMMOGEST v2 — Migration complète
-- Intègre : tables manquantes CDC + LegalOS + Marketplace multi-pays
--            + Feature Flags + Event-Driven + Architecture mondiale
-- À exécuter dans Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- SECTION 1 : TABLES CDC MANQUANTES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS owner_config (
  id            BIGSERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL DEFAULT '',
  settings      JSONB DEFAULT '{}'
);
INSERT INTO owner_config (password_hash)
SELECT ''
WHERE NOT EXISTS (SELECT 1 FROM owner_config);

CREATE TABLE IF NOT EXISTS owner_logs (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID,
  user_id    TEXT,
  level      TEXT DEFAULT 'info',
  event      TEXT NOT NULL,
  message    TEXT,
  payload    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_owner_logs_tenant ON owner_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_owner_logs_event  ON owner_logs(event);

CREATE TABLE IF NOT EXISTS promo_codes (
  id          BIGSERIAL PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  plan_cible  TEXT NOT NULL,
  duree_jours INTEGER DEFAULT 30,
  max_uses    INTEGER DEFAULT 1,
  used_count  INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locale_profiles (
  tenant_id        UUID PRIMARY KEY,
  pays             TEXT DEFAULT 'CM',
  devise           TEXT DEFAULT 'XAF',
  timezone         TEXT DEFAULT 'Africa/Douala',
  profil_juridique TEXT DEFAULT 'ohada',
  langue           TEXT DEFAULT 'fr',
  updated_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE locale_profiles ENABLE ROW LEVEL SECURITY;
INSERT INTO locale_profiles (tenant_id)
SELECT id FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM locale_profiles)
ON CONFLICT (tenant_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS corbeille (
  id               BIGSERIAL PRIMARY KEY,
  tenant_id        UUID NOT NULL,
  locataire_id     BIGINT,
  locataire_data   JSONB NOT NULL DEFAULT '{}',
  paiements_data   JSONB DEFAULT '[]',
  date_suppression TIMESTAMPTZ DEFAULT now(),
  expire_at        TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);
ALTER TABLE corbeille ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_corbeille_tenant   ON corbeille(tenant_id);
CREATE INDEX IF NOT EXISTS idx_corbeille_expire   ON corbeille(expire_at);

CREATE TABLE IF NOT EXISTS marketplace_annonces (
  id               BIGSERIAL PRIMARY KEY,
  tenant_id        UUID NOT NULL,
  immeuble_id      BIGINT,
  titre            TEXT NOT NULL,
  description      TEXT,
  loyer            NUMERIC,
  ville            TEXT,
  quartier         TEXT,
  pays             TEXT DEFAULT 'CM',
  devise           TEXT DEFAULT 'XAF',
  type_local       TEXT,
  categorie        TEXT DEFAULT 'location_residentielle',
  photos           JSONB DEFAULT '[]',
  statut           TEXT DEFAULT 'pending',
  premium          BOOLEAN DEFAULT false,
  premium_expire   TIMESTAMPTZ,
  premium_niveau   INTEGER DEFAULT 0,
  notchpay_ref     TEXT,
  vues             INTEGER DEFAULT 0,
  contacts         INTEGER DEFAULT 0,
  geoloc           JSONB,
  tags             JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE marketplace_annonces ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mkt_pays    ON marketplace_annonces(pays);
CREATE INDEX IF NOT EXISTS idx_mkt_ville   ON marketplace_annonces(ville);
CREATE INDEX IF NOT EXISTS idx_mkt_statut  ON marketplace_annonces(statut);
CREATE INDEX IF NOT EXISTS idx_mkt_premium ON marketplace_annonces(premium);

-- ─────────────────────────────────────────────────────────────
-- SECTION 2 : LEGALOS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dossiers_juridiques (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  locataire_id    BIGINT,
  immeuble_id     BIGINT,
  type_dossier    TEXT DEFAULT 'loyers_impayes',
  statut          TEXT DEFAULT 'ouvert',
  montant_reclame NUMERIC DEFAULT 0,
  montant_recouvre NUMERIC DEFAULT 0,
  date_ouverture  DATE DEFAULT CURRENT_DATE,
  date_cloture    DATE,
  assigned_to     TEXT,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE dossiers_juridiques ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dossiers_tenant   ON dossiers_juridiques(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_statut   ON dossiers_juridiques(statut);
CREATE INDEX IF NOT EXISTS idx_dossiers_loc      ON dossiers_juridiques(locataire_id);

CREATE TABLE IF NOT EXISTS timeline_juridique (
  id            BIGSERIAL PRIMARY KEY,
  tenant_id     UUID NOT NULL,
  dossier_id    BIGINT REFERENCES dossiers_juridiques(id) ON DELETE CASCADE,
  locataire_id  BIGINT,
  type_action   TEXT NOT NULL,
  titre         TEXT NOT NULL,
  description   TEXT,
  document_url  TEXT,
  document_data JSONB,
  effectuee_par TEXT,
  date_action   TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE timeline_juridique ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_timeline_dossier ON timeline_juridique(dossier_id);
CREATE INDEX IF NOT EXISTS idx_timeline_tenant  ON timeline_juridique(tenant_id);
CREATE INDEX IF NOT EXISTS idx_timeline_loc     ON timeline_juridique(locataire_id);

CREATE TABLE IF NOT EXISTS templates_docs (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   UUID,
  code        TEXT NOT NULL,
  titre       TEXT NOT NULL,
  pays        TEXT DEFAULT 'CM',
  langue      TEXT DEFAULT 'fr',
  juridiction TEXT DEFAULT 'ohada',
  contenu     TEXT NOT NULL,
  variables   JSONB DEFAULT '[]',
  actif       BOOLEAN DEFAULT true,
  systeme     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_code_pays ON templates_docs(code, pays, langue);

INSERT INTO templates_docs (code, titre, pays, langue, juridiction, contenu, variables, systeme) VALUES
(
  'relance_1', 'Première relance loyer', 'CM', 'fr', 'ohada',
  'Objet : Rappel de paiement de loyer\n\nYaoundé, le {{date}}\n\nMonsieur/Madame {{nom_locataire}},\n\nNous vous rappelons que votre loyer du mois de {{mois}} d''un montant de {{montant}} FCFA n''a pas encore été réglé.\n\nNous vous prions de bien vouloir régulariser votre situation dans les meilleurs délais.\n\nCordialement,\n{{nom_gestionnaire}}\n{{nom_cabinet}}',
  ''[{"key":"date","label":"Date"},{"key":"nom_locataire","label":"Nom du locataire"},{"key":"mois","label":"Mois concerné"},{"key":"montant","label":"Montant dû"},{"key":"nom_gestionnaire","label":"Gestionnaire"},{"key":"nom_cabinet","label":"Cabinet"}]'',
  true
),
(
  'mise_en_demeure', 'Mise en demeure', 'CM', 'fr', 'ohada',
  'MISE EN DEMEURE\n\nYaoundé, le {{date}}\n\nMonsieur/Madame {{nom_locataire}},\nOccupant le local {{appt}} sis à {{adresse_immeuble}}\n\nNous vous mettons formellement en demeure de régler dans un délai de 8 (huit) jours à compter de la réception du présent courrier la somme de {{montant_total}} FCFA représentant {{nb_mois}} mois de loyer impayé.\n\nA défaut de règlement dans ce délai, nous serons contraints de saisir les autorités compétentes pour obtenir votre expulsion.\n\nFait à Yaoundé, le {{date}}\n{{nom_gestionnaire}}\n{{nom_cabinet}}',
  ''[{"key":"date"},{"key":"nom_locataire"},{"key":"appt"},{"key":"adresse_immeuble"},{"key":"montant_total"},{"key":"nb_mois"},{"key":"nom_gestionnaire"},{"key":"nom_cabinet"}]'',
  true
),
(
  'commandement_payer', 'Commandement de payer', 'CM', 'fr', 'ohada',
  'COMMANDEMENT DE PAYER\n\nNous soussigné(e), {{nom_gestionnaire}}, gérant(e) de {{nom_cabinet}},\n\nCOMMANDONS par le présent acte à Monsieur/Madame {{nom_locataire}}, occupant le local {{appt}} dans l''immeuble {{nom_immeuble}}, de payer dans les 48 heures la somme de {{montant_total}} FCFA, représentant {{nb_mois}} mois de loyer impayé, faute de quoi il sera procédé à toutes les voies de droit nécessaires.\n\nFait à Yaoundé, le {{date}}\n{{nom_gestionnaire}}',
  ''[{"key":"date"},{"key":"nom_locataire"},{"key":"appt"},{"key":"nom_immeuble"},{"key":"montant_total"},{"key":"nb_mois"},{"key":"nom_gestionnaire"},{"key":"nom_cabinet"}]'',
  true
)
ON CONFLICT (code, pays, langue) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SECTION 3 : FEATURE FLAGS & EVENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_flags (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID,
  flag       TEXT NOT NULL,
  actif      BOOLEAN DEFAULT true,
  config     JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, flag)
);

CREATE TABLE IF NOT EXISTS events_log (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID,
  user_id    TEXT,
  entity     TEXT,
  entity_id  TEXT,
  action     TEXT NOT NULL,
  payload    JSONB DEFAULT '{}',
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_tenant ON events_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events_log(entity, entity_id);

-- ─────────────────────────────────────────────────────────────
-- SECTION 4 : PRESTATAIRES (réseau mondial, Phase 3)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prestataires (
  id           BIGSERIAL PRIMARY KEY,
  tenant_id    UUID,
  nom          TEXT NOT NULL,
  categorie    TEXT NOT NULL,
  telephone    TEXT,
  email        TEXT,
  ville        TEXT,
  pays         TEXT DEFAULT 'CM',
  geoloc       JSONB,
  note_moy     NUMERIC DEFAULT 0,
  nb_avis      INTEGER DEFAULT 0,
  verifie      BOOLEAN DEFAULT false,
  premium      BOOLEAN DEFAULT false,
  budget_pub   NUMERIC DEFAULT 0,
  actif        BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_presta_pays      ON prestataires(pays);
CREATE INDEX IF NOT EXISTS idx_presta_categorie ON prestataires(categorie);
CREATE INDEX IF NOT EXISTS idx_presta_ville     ON prestataires(ville);

-- ─────────────────────────────────────────────────────────────
-- SECTION 5 : COLONNES MANQUANTES TABLES EXISTANTES
-- ─────────────────────────────────────────────────────────────

ALTER TABLE tenants   ADD COLUMN IF NOT EXISTS plan        TEXT DEFAULT 'gratuit';
ALTER TABLE tenants   ADD COLUMN IF NOT EXISTS plan_expire TIMESTAMPTZ;
ALTER TABLE tenants   ADD COLUMN IF NOT EXISTS pays        TEXT DEFAULT 'CM';
ALTER TABLE tenants   ADD COLUMN IF NOT EXISTS features    JSONB DEFAULT '{"legalos":false,"marketplace":true,"ia":true}';

ALTER TABLE locataires ADD COLUMN IF NOT EXISTS jour_paiement   INTEGER DEFAULT 1;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS statut_juridique TEXT DEFAULT 'normal';
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS score_locataire INTEGER DEFAULT 100;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS tags            JSONB DEFAULT '[]';

ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS bailleur_id TEXT;
ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS pay_config  JSONB;
ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS pays        TEXT DEFAULT 'CM';

ALTER TABLE paiements ADD COLUMN IF NOT EXISTS remisAuBailleur BOOLEAN DEFAULT false;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS type            TEXT DEFAULT 'loyer';
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS reference       TEXT;

ALTER TABLE archives  ADD COLUMN IF NOT EXISTS tenant_id       UUID;
ALTER TABLE archives  ADD COLUMN IF NOT EXISTS immeuble_id     BIGINT;
ALTER TABLE archives  ADD COLUMN IF NOT EXISTS nb_retards      INTEGER DEFAULT 0;
ALTER TABLE archives  ADD COLUMN IF NOT EXISTS nb_impayes      INTEGER DEFAULT 0;
ALTER TABLE archives  ADD COLUMN IF NOT EXISTS montant_impaye  NUMERIC DEFAULT 0;
ALTER TABLE archives  ADD COLUMN IF NOT EXISTS score           INTEGER DEFAULT 100;
ALTER TABLE archives  ADD COLUMN IF NOT EXISTS note            TEXT;

-- ─────────────────────────────────────────────────────────────
-- SECTION 6 : VÉRIFICATION
-- ─────────────────────────────────────────────────────────────

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
