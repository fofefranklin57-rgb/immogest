# Migrations ImmoGest v2

## Règle absolue
Toutes les modifications de base de données passent par ce dossier.
Ne jamais modifier directement une table en production.

## Convention de nommage
```
V{NNN}__{description_courte}.sql
```

## Structure de chaque fichier
```sql
-- En-tête : version, date, auteur, description

-- ── UP ───────── (changements à appliquer)
CREATE TABLE ...
ALTER TABLE ...

INSERT INTO schema_migrations (version, description) VALUES (...)
ON CONFLICT (version) DO NOTHING;

-- ── DOWN ──────── (rollback)
-- DROP TABLE ...
```

## Ordre d'application
```
V000 → Tracker de migrations
V001 → Tables CDC base (owner_config, owner_logs, locale_profiles, corbeille...)
V002 → Marketplace multi-pays + prestataires
V003 → LegalOS (dossiers_juridiques, timeline_juridique, templates_docs)
V004 → Architecture future-proof (feature_flags, events_log, scores)
```

## Comment appliquer
1. Aller sur https://supabase.com/dashboard/project/uggxfmwpttfsfcirmeqx/sql/new
2. Copier-coller le contenu du fichier migration
3. Cliquer **Run**
4. Vérifier que la ligne apparaît dans `SELECT * FROM schema_migrations`

## Vérifier l'état
```sql
SELECT * FROM schema_migrations ORDER BY version;
```
