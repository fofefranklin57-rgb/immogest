-- ═══════════════════════════════════════════════════════════════
--  ImmoGest — Migration : colonnes composition immeubles
--  Supabase → SQL Editor → New query → Exécuter
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE immeubles
  ADD COLUMN IF NOT EXISTS apparts      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS studios      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chambres     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplex       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nom_immeuble TEXT,
  ADD COLUMN IF NOT EXISTS nom_proprio  TEXT,
  ADD COLUMN IF NOT EXISTS tel_proprio  TEXT,
  ADD COLUMN IF NOT EXISTS commission   JSONB;
