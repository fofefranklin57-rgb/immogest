-- V014: Ajout colonnes honoraires sur la table immeubles
ALTER TABLE immeubles
  ADD COLUMN IF NOT EXISTS type_honoraires TEXT DEFAULT 'aucun',
  ADD COLUMN IF NOT EXISTS valeur_honoraires NUMERIC DEFAULT 0;
