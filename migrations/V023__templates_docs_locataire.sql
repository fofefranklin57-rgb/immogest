-- ══════════════════════════════════════════════════════════════
-- MIGRATION V023 — Templates documents locataire (LegalOS)
-- Date       : 2026-07-30
-- Auteur     : ImmoGest Claude Code
-- Description: Ajoute 3 templates systeme a templates_docs :
--              quittance_loyer, resiliation_bail, avenant_bail.
--              Meme moteur que contrat_bail (V022).
-- ══════════════════════════════════════════════════════════════

-- ── UP ───────────────────────────────────────────────────────

INSERT INTO templates_docs (code, titre, pays, langue, juridiction, categorie, contenu, variables, systeme) VALUES
(
  'quittance_loyer', 'Quittance de loyer', 'CM', 'fr', 'ohada', 'contrat',
  E'QUITTANCE DE LOYER\n\n{{ville}}, le {{date}}\n\nJe soussigné(e), {{nom_gestionnaire}}, représentant {{nom_cabinet}}, gestionnaire du bien pour le compte de {{nom_proprio}},\n\nReconnais avoir reçu de :\nMonsieur/Madame {{nom_locataire}}\nOccupant le local n° {{appt}} — {{nom_immeuble}}, {{adresse_immeuble}}\n\nLa somme de {{montant}} FCFA, représentant le loyer du mois de {{mois}} {{annee}}.\n\nCette quittance annule tout titre de créance antérieur relatif à la période concernée.\n\nFait à {{ville}}, le {{date}}\n\n{{nom_gestionnaire}}\n{{nom_cabinet}}',
  '[{"key":"ville"},{"key":"date"},{"key":"nom_gestionnaire"},{"key":"nom_cabinet"},{"key":"nom_proprio"},{"key":"nom_locataire"},{"key":"appt"},{"key":"nom_immeuble"},{"key":"adresse_immeuble"},{"key":"montant"},{"key":"mois"},{"key":"annee"}]',
  true
),
(
  'resiliation_bail', 'Résiliation de bail', 'CM', 'fr', 'ohada', 'contrat',
  E'RÉSILIATION DE BAIL\n\n{{ville}}, le {{date}}\n\nEntre {{nom_cabinet}}, gestionnaire du bien pour le compte de {{nom_proprio}}, ci-après "LE BAILLEUR",\n\nEt Monsieur/Madame {{nom_locataire}}, occupant le local n° {{appt}} — {{nom_immeuble}}, {{adresse_immeuble}}, ci-après "LE LOCATAIRE",\n\nIL A ÉTÉ CONVENU CE QUI SUIT :\n\nLe contrat de bail liant les parties, portant sur le local désigné ci-dessus, entré en vigueur le {{date_entree}}, est résilié d''un commun accord à compter du {{date_resiliation}}.\n\nLe locataire s''engage à restituer les lieux libres de toute occupation à cette date, en bon état d''usage, et à régler tout solde de loyer ou de charges restant dû.\n\nLa caution versée sera restituée après état des lieux de sortie, déduction faite des sommes éventuellement dues.\n\nFait à {{ville}}, le {{date}}, en deux exemplaires.\n\nLE BAILLEUR                                    LE LOCATAIRE\n{{nom_gestionnaire}}                           {{nom_locataire}}\n{{nom_cabinet}}',
  '[{"key":"ville"},{"key":"date"},{"key":"nom_cabinet"},{"key":"nom_proprio"},{"key":"nom_locataire"},{"key":"appt"},{"key":"nom_immeuble"},{"key":"adresse_immeuble"},{"key":"date_entree"},{"key":"date_resiliation"},{"key":"nom_gestionnaire"}]',
  true
),
(
  'avenant_bail', 'Avenant au contrat de bail', 'CM', 'fr', 'ohada', 'contrat',
  E'AVENANT AU CONTRAT DE BAIL\n\n{{ville}}, le {{date}}\n\nEntre {{nom_cabinet}}, gestionnaire du bien pour le compte de {{nom_proprio}}, ci-après "LE BAILLEUR",\n\nEt Monsieur/Madame {{nom_locataire}}, occupant le local n° {{appt}} — {{nom_immeuble}}, {{adresse_immeuble}}, ci-après "LE LOCATAIRE",\n\nIL A ÉTÉ CONVENU L''AVENANT SUIVANT AU CONTRAT DE BAIL EN DATE DU {{date_entree}} :\n\nNouveau loyer mensuel : {{loyer}} FCFA, applicable à compter du {{date}}.\n\nToutes les autres clauses et conditions du contrat de bail initial demeurent inchangées et continuent de produire leurs effets.\n\nFait à {{ville}}, le {{date}}, en deux exemplaires.\n\nLE BAILLEUR                                    LE LOCATAIRE\n{{nom_gestionnaire}}                           {{nom_locataire}}\n{{nom_cabinet}}',
  '[{"key":"ville"},{"key":"date"},{"key":"nom_cabinet"},{"key":"nom_proprio"},{"key":"nom_locataire"},{"key":"appt"},{"key":"nom_immeuble"},{"key":"adresse_immeuble"},{"key":"date_entree"},{"key":"loyer"},{"key":"nom_gestionnaire"}]',
  true
)
ON CONFLICT DO NOTHING;

INSERT INTO schema_migrations (version, description)
VALUES ('V023', 'Ajoute templates systeme quittance_loyer, resiliation_bail, avenant_bail')
ON CONFLICT (version) DO NOTHING;

-- ── DOWN ─────────────────────────────────────────────────────
-- DELETE FROM templates_docs WHERE code IN ('quittance_loyer','resiliation_bail','avenant_bail') AND systeme = true;
