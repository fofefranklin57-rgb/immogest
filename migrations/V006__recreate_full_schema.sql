-- V006 — Recréation schéma complet V2 (après reset total)
-- À coller dans : https://supabase.com/dashboard/project/uggxfmwpttfsfcirmeqx/sql/new

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Tracker de migrations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Tenants (racine) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nom_cabinet TEXT DEFAULT '',
  mode TEXT DEFAULT 'entreprise',
  plan TEXT DEFAULT 'gratuit',
  plan_expire TIMESTAMPTZ,
  promo_code TEXT,
  pays TEXT DEFAULT 'CM',
  features JSONB DEFAULT '{"legalos":false,"marketplace":true,"ia":true}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Users app ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users_app (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'gestionnaire',
  nom TEXT NOT NULL,
  telephone TEXT,
  password TEXT,
  pin TEXT,
  immeubles JSONB DEFAULT '[]',
  locataire_id BIGINT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Invite codes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'gestionnaire',
  immeubles JSONB DEFAULT '[]',
  used BOOLEAN DEFAULT false,
  expire_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. Immeubles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS immeubles (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom_immeuble TEXT NOT NULL,
  nom TEXT,
  nom_proprio TEXT,
  tel_proprio TEXT,
  ville TEXT,
  quartier TEXT,
  adresse TEXT,
  pays TEXT DEFAULT 'CM',
  apparts INTEGER DEFAULT 0,
  studios INTEGER DEFAULT 0,
  chambres INTEGER DEFAULT 0,
  duplex INTEGER DEFAULT 0,
  couleur TEXT DEFAULT '#0E6AAF',
  bailleur_id TEXT,
  pay_config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. Locataires ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locataires (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  immeuble_id BIGINT REFERENCES immeubles(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  telephone TEXT,
  whatsapp TEXT,
  appt TEXT,
  type_local TEXT DEFAULT 'appartement',
  loyer NUMERIC DEFAULT 0,
  caution NUMERIC DEFAULT 0,
  entree DATE,
  statut TEXT DEFAULT 'actif',
  statut_juridique TEXT DEFAULT 'normal',
  jour_paiement INTEGER DEFAULT 1,
  observations TEXT,
  score_locataire INTEGER DEFAULT 100,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 7. Paiements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paiements (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id BIGINT REFERENCES locataires(id) ON DELETE CASCADE,
  montant NUMERIC NOT NULL,
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  date_paiement DATE DEFAULT CURRENT_DATE,
  mode_paiement TEXT DEFAULT 'especes',
  type TEXT DEFAULT 'loyer',
  reference TEXT,
  "remisAuBailleur" BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 8. Archives ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archives (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id BIGINT,
  immeuble_id BIGINT,
  nom TEXT NOT NULL,
  telephone TEXT,
  immeuble_nom TEXT,
  local_num TEXT,
  loyer NUMERIC,
  date_entree DATE,
  date_sortie DATE,
  motif TEXT DEFAULT 'depart_volontaire',
  note TEXT,
  nb_retards INTEGER DEFAULT 0,
  nb_impayes INTEGER DEFAULT 0,
  montant_impaye NUMERIC DEFAULT 0,
  score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 9. Parametres ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parametres (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  devise TEXT DEFAULT 'FCFA',
  langue TEXT DEFAULT 'fr',
  notif_wa BOOLEAN DEFAULT true,
  notif_sms BOOLEAN DEFAULT false,
  jour_relance INTEGER DEFAULT 5,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 10. Messages internes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS messages_internes (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expediteur_id TEXT,
  destinataire_id TEXT,
  sujet TEXT,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 11. Abonnements ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS abonnements (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  montant NUMERIC NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  statut TEXT DEFAULT 'actif',
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 12. Declarations (portail locataire) ────────────────────
CREATE TABLE IF NOT EXISTS declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id TEXT NOT NULL,
  nom_locataire TEXT,
  montant NUMERIC(12,2) NOT NULL,
  mois_c INTEGER NOT NULL,
  annee_c INTEGER NOT NULL,
  mode TEXT DEFAULT 'especes',
  ref TEXT,
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending','validated','rejected')),
  date_declaration TIMESTAMPTZ DEFAULT now(),
  date_traitement TIMESTAMPTZ,
  note_gestionnaire TEXT
);

-- ── 13. Locale profiles ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS locale_profiles (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  pays TEXT DEFAULT 'CM',
  devise TEXT DEFAULT 'XAF',
  timezone TEXT DEFAULT 'Africa/Douala',
  profil_juridique TEXT DEFAULT 'ohada',
  langue TEXT DEFAULT 'fr',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 14. Corbeille ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corbeille (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id BIGINT,
  locataire_data JSONB NOT NULL DEFAULT '{}',
  paiements_data JSONB DEFAULT '[]',
  date_suppression TIMESTAMPTZ DEFAULT now(),
  expire_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- ── 15. Owner config ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_config (
  id BIGSERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL DEFAULT '',
  settings JSONB DEFAULT '{}'
);
INSERT INTO owner_config (password_hash) VALUES ('')
  ON CONFLICT DO NOTHING;

-- ── 16. Owner logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID,
  level TEXT DEFAULT 'info' CHECK (level IN ('info','warn','error','critical')),
  event TEXT NOT NULL,
  message TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 17. Marketplace annonces ────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_annonces (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  immeuble_id BIGINT,
  titre TEXT NOT NULL,
  description TEXT,
  loyer NUMERIC,
  charges NUMERIC DEFAULT 0,
  caution NUMERIC DEFAULT 0,
  ville TEXT,
  quartier TEXT,
  pays TEXT DEFAULT 'CM',
  devise TEXT DEFAULT 'XAF',
  type_local TEXT,
  categorie TEXT DEFAULT 'location_residentielle' CHECK (categorie IN (
    'location_residentielle','location_commerciale','bureau','colocation',
    'location_saisonniere','vente','luxe','professionnel','industriel'
  )),
  superficie NUMERIC,
  nb_pieces INTEGER,
  photos JSONB DEFAULT '[]',
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending','active','inactive','vendu','loue')),
  premium BOOLEAN DEFAULT false,
  premium_niveau INTEGER DEFAULT 0 CHECK (premium_niveau BETWEEN 0 AND 5),
  premium_expire TIMESTAMPTZ,
  vues INTEGER DEFAULT 0,
  contacts INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  canal_wa BOOLEAN DEFAULT false,
  canal_fb BOOLEAN DEFAULT false,
  canal_ig BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 18. Prestataires ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestataires (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  telephone TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'CM',
  note_moy NUMERIC DEFAULT 0 CHECK (note_moy BETWEEN 0 AND 5),
  verifie BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 19. Dossiers juridiques ─────────────────────────────────
CREATE TABLE IF NOT EXISTS dossiers_juridiques (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  locataire_id BIGINT,
  immeuble_id BIGINT,
  type_dossier TEXT DEFAULT 'loyers_impayes' CHECK (type_dossier IN (
    'loyers_impayes','expulsion','degradations','occupation_illegale',
    'recouvrement','succession','indivision','mediation','contentieux_bail','autre'
  )),
  statut TEXT DEFAULT 'ouvert' CHECK (statut IN ('ouvert','en_cours','suspendu','clos','gagne','perdu')),
  montant_reclame NUMERIC DEFAULT 0,
  montant_recouvre NUMERIC DEFAULT 0,
  date_ouverture DATE DEFAULT CURRENT_DATE,
  date_cloture DATE,
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse','normale','haute','urgente')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 20. Timeline juridique ──────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_juridique (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  dossier_id BIGINT REFERENCES dossiers_juridiques(id) ON DELETE CASCADE,
  locataire_id BIGINT,
  type_action TEXT NOT NULL CHECK (type_action IN (
    'retard_detecte','relance_1','relance_2','relance_3','mise_en_demeure',
    'commandement_payer','plainte','assignation','audience','jugement',
    'execution','paiement_partiel','paiement_total','cloture','note'
  )),
  titre TEXT NOT NULL,
  description TEXT,
  document_data JSONB,
  date_action TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 21. Templates docs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates_docs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID,
  code TEXT NOT NULL,
  titre TEXT NOT NULL,
  pays TEXT DEFAULT 'CM',
  langue TEXT DEFAULT 'fr',
  juridiction TEXT DEFAULT 'ohada',
  categorie TEXT DEFAULT 'recouvrement',
  contenu TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  actif BOOLEAN DEFAULT true,
  systeme BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(code, pays, langue)
);

-- ── 22. Workflow recouvrement ───────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_recouvrement (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom TEXT DEFAULT 'Workflow par défaut',
  actif BOOLEAN DEFAULT true,
  etapes JSONB DEFAULT '[
    {"jours":15,"action":"relance_1","canal":"whatsapp","auto":true},
    {"jours":30,"action":"relance_2","canal":"whatsapp","auto":true},
    {"jours":45,"action":"mise_en_demeure","canal":"document","auto":false},
    {"jours":60,"action":"commandement_payer","canal":"document","auto":false}
  ]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 23. Feature flags ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  flag TEXT NOT NULL,
  actif BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, flag)
);

-- ── 24. Events log ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID,
  user_id TEXT,
  entity TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 25. Scores locataires ───────────────────────────────────
CREATE TABLE IF NOT EXISTS scores_locataires (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  locataire_id BIGINT NOT NULL,
  score INTEGER DEFAULT 100 CHECK (score BETWEEN 0 AND 100),
  nb_retards INTEGER DEFAULT 0,
  nb_impayes INTEGER DEFAULT 0,
  nb_paiements INTEGER DEFAULT 0,
  taux_ponctualite NUMERIC DEFAULT 100,
  derniere_maj TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, locataire_id)
);

-- ── 26. User organisations ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_organisations (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'gestionnaire',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- ── 27. Promo codes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  duree_jours INTEGER DEFAULT 30,
  max_uses INTEGER DEFAULT 1,
  uses INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expire_at TIMESTAMPTZ
);

-- ── Tracker ─────────────────────────────────────────────────
INSERT INTO schema_migrations (version, description) VALUES
  ('V000', 'schema_migrations tracker'),
  ('V001', 'tables CDC base'),
  ('V002', 'marketplace multicanal'),
  ('V003', 'LegalOS'),
  ('V004', 'architecture future-proof'),
  ('V005', 'promo_codes + declarations'),
  ('V006', 'recreate full schema after reset')
ON CONFLICT (version) DO NOTHING;

-- ── RLS : désactiver pour l'API Worker (service role) ───────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_app ENABLE ROW LEVEL SECURITY;
ALTER TABLE immeubles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

-- Policies permissives pour le service role (Worker)
CREATE POLICY "service_role_all" ON tenants FOR ALL USING (true);
CREATE POLICY "service_role_all" ON users_app FOR ALL USING (true);
CREATE POLICY "service_role_all" ON immeubles FOR ALL USING (true);
CREATE POLICY "service_role_all" ON locataires FOR ALL USING (true);
CREATE POLICY "service_role_all" ON paiements FOR ALL USING (true);
