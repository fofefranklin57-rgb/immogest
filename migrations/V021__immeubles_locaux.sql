-- ═══════════════════════════════════════════════════════════════
-- V021 — Numérotation personnalisée des locaux
-- ═══════════════════════════════════════════════════════════════
-- Permet à l'admin/bailleur de définir SA propre numérotation (« 1A, 1B, 2A »…)
-- au lieu du schéma imposé « A1, S1, C1 ». Stockée sur l'immeuble sous forme
-- de liste : [{ "label": "1A", "type": "appartement", "etage": 1 }, ...].
-- Vide par défaut => repli sur l'ancien comportement (aucune régression).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS locaux JSONB DEFAULT '[]'::jsonb;

INSERT INTO schema_migrations (version, description) VALUES
  ('V021', 'immeubles.locaux — numerotation personnalisee des locaux')
ON CONFLICT (version) DO NOTHING;
