-- ══════════════════════════════════════════════════════════════
-- MIGRATION V003 — LegalOS
-- Version    : 003
-- Date       : 2026-06-15
-- Auteur     : ImmoGest Claude Code
-- Description: Couche juridique indépendante (Prompt 2 — LegalOS)
--              dossiers_juridiques, timeline_juridique, templates_docs
--              Workflow recouvrement automatisé, marketplace juridique
-- ══════════════════════════════════════════════════════════════

-- ── UP ───────────────────────────────────────────────────────

-- Dossiers juridiques
CREATE TABLE IF NOT EXISTS dossiers_juridiques (
  id               BIGSERIAL PRIMARY KEY,
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id     BIGINT,
  immeuble_id      BIGINT,
  type_dossier     TEXT DEFAULT 'loyers_impayes'
                   CHECK (type_dossier IN (
                     'loyers_impayes','expulsion','degradations',
                     'occupation_illegale','recouvrement','succession',
                     'indivision','mediation','contentieux_bail','autre'
                   )),
  statut           TEXT DEFAULT 'ouvert'
                   CHECK (statut IN ('ouvert','en_cours','suspendu','clos','gagne','perdu')),
  montant_reclame  NUMERIC DEFAULT 0,
  montant_recouvre NUMERIC DEFAULT 0,
  date_ouverture   DATE DEFAULT CURRENT_DATE,
  date_cloture     DATE,
  assigned_to      TEXT,
  priorite         TEXT DEFAULT 'normale' CHECK (priorite IN ('basse','normale','haute','urgente')),
  notes            TEXT,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE dossiers_juridiques ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dossiers_tenant  ON dossiers_juridiques(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_statut  ON dossiers_juridiques(statut);
CREATE INDEX IF NOT EXISTS idx_dossiers_loc     ON dossiers_juridiques(locataire_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_type    ON dossiers_juridiques(type_dossier);

-- Timeline juridique (chronologie automatique)
CREATE TABLE IF NOT EXISTS timeline_juridique (
  id            BIGSERIAL PRIMARY KEY,
  tenant_id     UUID NOT NULL,
  dossier_id    BIGINT REFERENCES dossiers_juridiques(id) ON DELETE CASCADE,
  locataire_id  BIGINT,
  type_action   TEXT NOT NULL
                CHECK (type_action IN (
                  'retard_detecte','relance_1','relance_2','relance_3',
                  'mise_en_demeure','commandement_payer','plainte',
                  'assignation','audience','jugement','execution',
                  'paiement_partiel','paiement_total','cloture','note'
                )),
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
CREATE INDEX IF NOT EXISTS idx_timeline_date    ON timeline_juridique(date_action DESC);

-- Templates documents juridiques (moteur générique multi-pays)
CREATE TABLE IF NOT EXISTS templates_docs (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   UUID,
  code        TEXT NOT NULL,
  titre       TEXT NOT NULL,
  pays        TEXT DEFAULT 'CM',
  langue      TEXT DEFAULT 'fr',
  juridiction TEXT DEFAULT 'ohada',
  categorie   TEXT DEFAULT 'recouvrement',
  contenu     TEXT NOT NULL,
  variables   JSONB DEFAULT '[]',
  actif       BOOLEAN DEFAULT true,
  systeme     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_uniq ON templates_docs(code, pays, langue, COALESCE(tenant_id::TEXT, 'system'));

-- Templates système OHADA (Cameroun)
INSERT INTO templates_docs (code, titre, pays, langue, juridiction, categorie, contenu, variables, systeme) VALUES
(
  'relance_1', 'Première relance loyer', 'CM', 'fr', 'ohada', 'recouvrement',
  E'Objet : Rappel de paiement de loyer\n\n{{ville}}, le {{date}}\n\nMonsieur/Madame {{nom_locataire}},\n\nSauf erreur ou omission de notre part, nous constatons que votre loyer du mois de {{mois}} {{annee}} d''un montant de {{montant}} FCFA n''a pas encore été réglé.\n\nNous vous prions de bien vouloir régulariser votre situation dans les meilleurs délais afin d''éviter toute procédure.\n\nCordialement,\n{{nom_gestionnaire}}\n{{nom_cabinet}}',
  '[{"key":"ville","label":"Ville"},{"key":"date","label":"Date"},{"key":"nom_locataire","label":"Nom du locataire"},{"key":"mois","label":"Mois concerné"},{"key":"annee","label":"Année"},{"key":"montant","label":"Montant dû (FCFA)"},{"key":"nom_gestionnaire","label":"Gestionnaire"},{"key":"nom_cabinet","label":"Cabinet"}]',
  true
),
(
  'mise_en_demeure', 'Mise en demeure', 'CM', 'fr', 'ohada', 'recouvrement',
  E'MISE EN DEMEURE\n\n{{ville}}, le {{date}}\n\nMonsieur/Madame {{nom_locataire}},\nOccupant le local N° {{appt}} sis à {{adresse_immeuble}}\n\nPar le présent courrier, nous vous mettons formellement en demeure de régler, dans un délai de 8 (huit) jours à compter de la réception du présent, la somme de {{montant_total}} FCFA représentant {{nb_mois}} mois de loyer impayé.\n\nÀ défaut de règlement dans ce délai, nous serons contraints d''engager sans autre avis les procédures judiciaires appropriées pour obtenir le paiement des sommes dues et, le cas échéant, votre expulsion.\n\nFait à {{ville}}, le {{date}}\n\n{{nom_gestionnaire}}\n{{nom_cabinet}}',
  '[{"key":"ville"},{"key":"date"},{"key":"nom_locataire"},{"key":"appt"},{"key":"adresse_immeuble"},{"key":"montant_total"},{"key":"nb_mois"},{"key":"nom_gestionnaire"},{"key":"nom_cabinet"}]',
  true
),
(
  'commandement_payer', 'Commandement de payer', 'CM', 'fr', 'ohada', 'recouvrement',
  E'COMMANDEMENT DE PAYER\n\nNous soussigné(e), {{nom_gestionnaire}}, représentant légal de {{nom_cabinet}},\n\nCOMMANDONS par le présent acte à :\n\nMonsieur/Madame {{nom_locataire}},\nOccupant le local N° {{appt}} dans l''immeuble {{nom_immeuble}}, situé à {{adresse_immeuble}},\n\nDE PAYER dans les 48 (quarante-huit) heures suivant la remise du présent commandement la somme de {{montant_total}} FCFA, se décomposant comme suit :\n- {{nb_mois}} mois de loyer impayé : {{montant_loyers}} FCFA\n- Frais de procédure : {{frais}} FCFA\n\nFAUTE DE QUOI il sera procédé à toutes voies de droit pour obtenir le paiement de la totalité des sommes dues, y compris par voie d''expulsion.\n\nFait à {{ville}}, le {{date}}\n\n{{nom_gestionnaire}}\n{{nom_cabinet}}',
  '[{"key":"ville"},{"key":"date"},{"key":"nom_locataire"},{"key":"appt"},{"key":"nom_immeuble"},{"key":"adresse_immeuble"},{"key":"montant_total"},{"key":"nb_mois"},{"key":"montant_loyers"},{"key":"frais"},{"key":"nom_gestionnaire"},{"key":"nom_cabinet"}]',
  true
)
ON CONFLICT DO NOTHING;

-- Workflow recouvrement (configurable par tenant)
CREATE TABLE IF NOT EXISTS workflow_recouvrement (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   UUID NOT NULL,
  nom         TEXT NOT NULL DEFAULT 'Workflow par défaut',
  actif       BOOLEAN DEFAULT true,
  etapes      JSONB NOT NULL DEFAULT '[
    {"jours":15,"action":"relance_1","canal":"whatsapp","auto":true},
    {"jours":30,"action":"relance_2","canal":"whatsapp","auto":true},
    {"jours":45,"action":"mise_en_demeure","canal":"document","auto":false},
    {"jours":60,"action":"commandement_payer","canal":"document","auto":false},
    {"jours":90,"action":"ouverture_dossier","canal":"system","auto":true}
  ]',
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workflow_recouvrement ENABLE ROW LEVEL SECURITY;

INSERT INTO schema_migrations (version, description)
VALUES ('V003', 'LegalOS : dossiers_juridiques, timeline_juridique, templates_docs, workflow_recouvrement')
ON CONFLICT (version) DO NOTHING;

-- ── DOWN ─────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS workflow_recouvrement;
-- DROP TABLE IF EXISTS templates_docs;
-- DROP TABLE IF EXISTS timeline_juridique;
-- DROP TABLE IF EXISTS dossiers_juridiques;
