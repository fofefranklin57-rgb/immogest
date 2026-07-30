-- ══════════════════════════════════════════════════════════════
-- MIGRATION V022 — Template Contrat de bail (LegalOS)
-- Date       : 2026-07-30
-- Auteur     : ImmoGest Claude Code
-- Description: Ajoute le template systeme "contrat_bail" a
--              templates_docs (moteur deja en place depuis V003),
--              utilise par le bouton "Generer le contrat" sur la
--              fiche locataire.
-- ══════════════════════════════════════════════════════════════

-- ── UP ───────────────────────────────────────────────────────

INSERT INTO templates_docs (code, titre, pays, langue, juridiction, categorie, contenu, variables, systeme) VALUES
(
  'contrat_bail', 'Contrat de bail d''habitation', 'CM', 'fr', 'ohada', 'contrat',
  E'CONTRAT DE BAIL D''HABITATION\n\nEntre les soussignés :\n\n{{nom_cabinet}}, agissant en qualité de gestionnaire du bien ci-après désigné pour le compte du propriétaire {{nom_proprio}},\nci-après dénommé "LE BAILLEUR",\n\nET\n\n{{nom_locataire}}, ci-après dénommé(e) "LE LOCATAIRE",\n\nIL A ÉTÉ CONVENU CE QUI SUIT :\n\nARTICLE 1 — OBJET\nLe bailleur donne en location au locataire, qui accepte, le local désigné ci-après :\nImmeuble : {{nom_immeuble}}\nLocal n° : {{appt}}\nAdresse : {{adresse_immeuble}}, {{ville}}\n\nARTICLE 2 — DURÉE\nLe présent bail prend effet à compter du {{date_entree}} pour une durée indéterminée, renouvelable par tacite reconduction, sauf dénonciation par l''une des parties dans les conditions légales en vigueur.\n\nARTICLE 3 — LOYER\nLe loyer mensuel est fixé à {{loyer}} FCFA, payable d''avance au plus tard le 5 de chaque mois.\n\nARTICLE 4 — CAUTION\nLe locataire verse au bailleur, à titre de garantie, une caution de {{caution}} FCFA, remboursable en fin de bail sous déduction des sommes éventuellement dues.\n\nARTICLE 5 — OBLIGATIONS DU LOCATAIRE\nLe locataire s''engage à :\n- Payer le loyer aux échéances convenues ;\n- User paisiblement des lieux loués ;\n- Ne procéder à aucune transformation sans accord écrit du bailleur ;\n- Assurer l''entretien courant du local.\n\nARTICLE 6 — RÉSILIATION\nEn cas de non-paiement du loyer ou de manquement grave aux obligations du présent contrat, le bailleur pourra poursuivre la résiliation du bail dans les conditions prévues par la loi.\n\nFait à {{ville}}, le {{date}}, en deux exemplaires originaux.\n\nLE BAILLEUR                                    LE LOCATAIRE\n{{nom_gestionnaire}}                           {{nom_locataire}}\n{{nom_cabinet}}',
  '[{"key":"nom_cabinet","label":"Cabinet"},{"key":"nom_proprio","label":"Nom du propriétaire"},{"key":"nom_locataire","label":"Nom du locataire"},{"key":"nom_immeuble","label":"Immeuble"},{"key":"appt","label":"N° du local"},{"key":"adresse_immeuble","label":"Adresse"},{"key":"ville","label":"Ville"},{"key":"date_entree","label":"Date d''entrée"},{"key":"loyer","label":"Loyer mensuel (FCFA)"},{"key":"caution","label":"Caution (FCFA)"},{"key":"date","label":"Date d''édition"},{"key":"nom_gestionnaire","label":"Gestionnaire"}]',
  true
)
ON CONFLICT DO NOTHING;

INSERT INTO schema_migrations (version, description)
VALUES ('V022', 'Ajoute le template systeme contrat_bail a templates_docs')
ON CONFLICT (version) DO NOTHING;

-- ── DOWN ─────────────────────────────────────────────────────
-- DELETE FROM templates_docs WHERE code = 'contrat_bail' AND systeme = true;
