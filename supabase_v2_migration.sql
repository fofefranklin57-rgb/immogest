-- ══════════════════════════════════════════════════════════════
-- IMMOGEST v2 — Migration tables manquantes
-- À exécuter dans Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

-- ── 1. owner_config ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_config (
  id BIGSERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL DEFAULT '8237a8d86b7038877840cd600b135f4edc8966be05cf3ba12727535f2670c058',
  settings JSONB DEFAULT '{}'
);
-- Insérer config par défaut si vide
INSERT INTO owner_config (password_hash)
SELECT '8237a8d86b7038877840cd600b135f4edc8966be05cf3ba12727535f2670c058'
WHERE NOT EXISTS (SELECT 1 FROM owner_config);

-- ── 2. owner_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID,
  user_id TEXT,
  level TEXT DEFAULT 'info',
  event TEXT NOT NULL,
  message TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. promo_codes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  plan_cible TEXT NOT NULL,
  duree_jours INTEGER DEFAULT 30,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. locale_profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locale_profiles (
  tenant_id UUID PRIMARY KEY,
  pays TEXT DEFAULT 'CM',
  devise TEXT DEFAULT 'XAF',
  timezone TEXT DEFAULT 'Africa/Douala',
  profil_juridique TEXT DEFAULT 'ohada',
  langue TEXT DEFAULT 'fr',
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE locale_profiles ENABLE ROW LEVEL SECURITY;

-- Créer locale_profiles pour les tenants existants
INSERT INTO locale_profiles (tenant_id)
SELECT id FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM locale_profiles)
ON CONFLICT (tenant_id) DO NOTHING;

-- ── 5. corbeille ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corbeille (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  locataire_id BIGINT,
  locataire_data JSONB NOT NULL DEFAULT '{}',
  paiements_data JSONB DEFAULT '[]',
  date_suppression TIMESTAMPTZ DEFAULT now(),
  expire_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);
ALTER TABLE corbeille ENABLE ROW LEVEL SECURITY;

-- ── 6. marketplace_annonces ───────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_annonces (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  immeuble_id BIGINT,
  titre TEXT NOT NULL,
  description TEXT,
  loyer NUMERIC,
  ville TEXT,
  quartier TEXT,
  type_local TEXT,
  photos JSONB DEFAULT '[]',
  statut TEXT DEFAULT 'pending',
  premium BOOLEAN DEFAULT false,
  premium_expire TIMESTAMPTZ,
  notchpay_ref TEXT,
  vues INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE marketplace_annonces ENABLE ROW LEVEL SECURITY;

-- ── 7. Colonnes manquantes dans tables existantes ─────────────

-- tenants : ajouter plan si manquant
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'gratuit';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_expire TIMESTAMPTZ;

-- locataires : ajouter colonnes v2
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS jour_paiement INTEGER DEFAULT 1;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS statut_juridique TEXT DEFAULT 'normal';

-- immeubles : ajouter colonnes v2
ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS bailleur_id TEXT;
ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS pay_config JSONB;

-- paiements : ajouter colonnes v2
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS remisAuBailleur BOOLEAN DEFAULT false;

-- archives : normaliser colonnes v2
ALTER TABLE archives ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS immeuble_id BIGINT;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS nb_retards INTEGER DEFAULT 0;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS nb_impayes INTEGER DEFAULT 0;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS montant_impaye NUMERIC DEFAULT 0;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 100;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS note TEXT;

-- ── Vérification finale ───────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
