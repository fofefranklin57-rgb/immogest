# ERROR LOG — ImmoGest v2

Format : `[DATE] FICHIER — Erreur → Solution`

---

## Erreurs de champs DB / Session

### [2026-06-19] paiements.js, rapports.js — `session.tel` n'existe pas
- **Erreur** : `session.tel` utilisé dans renderFiche() et rapport mensuel
- **Cause** : SESSION stocke `telephone` pas `tel`
- **Solution** : remplacer par `session.telephone`
- **Fichiers corrigés** : `js/paiements.js`, `js/rapports.js`

### [2026-06-19] paiements.js, rapports.js — `session.ville` n'existe pas
- **Erreur** : `session.ville` utilisé pour remplir la ville du cabinet
- **Cause** : SESSION n'a pas de champ ville — la ville vient de l'immeuble
- **Solution** : utiliser `imm.ville` avec fallback `''`
- **Fichiers corrigés** : `js/paiements.js` (cabVille), `js/rapports.js` (ville)

### [2026-06-19] locataires.js — `loc.date_entree` n'existe pas
- **Erreur** : champ `date_entree` utilisé dans certains documents
- **Cause** : la DB stocke `entree` (pas `date_entree`)
- **Solution** : toujours utiliser `loc.entree`

### [2026-06-19] paiements.js — `remisAuBailleur` casse incorrecte
- **Erreur** : champ parfois écrit `remisbailleur` ou `remis_au_bailleur`
- **Cause** : nom de colonne DB avec majuscules : `"remisAuBailleur"`
- **Solution** : toujours écrire `remisAuBailleur` (camelCase, A et B majuscules)

---

## Erreurs d'architecture

### [2026-06-19] index.html — Scripts bloquants sans `defer`
- **Erreur** : spinner de chargement n'apparaissait pas avant que tous les JS soient chargés
- **Cause** : 19 scripts `<script src="...">` sans `defer` bloquaient le parsing HTML
- **Solution** : ajout de `defer` sur tous les scripts
- **Impact** : temps jusqu'au premier affichage réduit significativement

### [2026-06-19] _onboarding.js / _onboarding2.js — Dead code
- **Erreur** : ces fichiers existent mais ne sont PAS inclus dans index.html
- **Cause** : l'authentification réelle est entièrement dans `app.js` → `_renderLogin()`
- **Solution** : ne jamais modifier ces fichiers, ils sont inactifs
- **Note** : l'écran auth est dans `app.js` lignes ~1518-1657

### [2026-06-19] sw.js — Fichiers manquants dans ASSETS_CACHE
- **Erreur** : `signature.js` et `onesignal.js` non cachés offline
- **Solution** : ajoutés à la liste ASSETS_CACHE dans `sw.js`

---

## Erreurs d'affichage / UI

### [2026-06-19] app.js — Badge "Documents juridiques" manquant à l'écran d'accueil
- **Erreur** : badge absent dans le panneau branding de l'écran de connexion
- **Solution** : ajout de `📋 Documents juridiques` dans la liste des badges
- **Note** : les badges sont dans `_renderLogin()` dans `app.js`

### [2026-06-19] app.js — Badge "Hors-ligne" affiché "📊 Hors-ligne"
- **Erreur** : mauvaise icône (📊 = statistiques, pas hors-ligne)
- **Solution** : corrigé en `📶 Hors-ligne`

---

## Erreurs corrigées — Session 20 juin 2026

### [2026-06-20] auth.js — `session.type_profil` jamais assigné au login
- **Erreur** : honoraires cabinet et `remisAuBailleur` visibles pour tous les profils
- **Cause** : `type_profil` absent de la construction de SESSION dans `login()` et `join()`
- **Solution** : ajouté `type_profil: data.tenant.type_profil || 'gestionnaire'`
- **Fichier** : `js/auth.js`

### [2026-06-20] auth.js — Rôles `coordinateur` et `bailleur` absents de ROLES
- **Erreur** : `hasRole('coordinateur')` retournait niveau 1 par défaut
- **Solution** : ajoutés avec niveaux 5 et 2 dans la map ROLES
- **Fichier** : `js/auth.js`

### [2026-06-20] paiements.js — `session.email` et `session.signataire` utilisés
- **Erreur** : ces champs n'existent pas dans SESSION → variables toujours vides
- **Solution** : supprimés, garder uniquement `params.email` et `params.signataire`
- **Fichier** : `js/paiements.js`

### [2026-06-20] rapports.js — `p.date` au lieu de `p.date_paiement`
- **Erreur** : rapports annuels filtraient mal les paiements par période
- **Cause** : champ DB est `date_paiement`, pas `date`
- **Solution** : remplacé sur 5 occurrences (lignes 431, 537, 953, 1041, 1202)
- **Fichier** : `js/rapports.js`
- **Règle** : le champ date en DB s'appelle toujours `date_paiement`

### [2026-06-20] legal.js — Mois futurs comptés dans analyseIA et calculerScore
- **Erreur** : analyse IA surestimait le risque, score trop bas pour nouveaux locataires
- **Cause** : filtre `l.statut !== 'Payé'` incluait les mois "À venir" (futur: true)
- **Solution** : ajout de `!l.futur &&` dans les deux filtres
- **Fichier** : `js/legal.js`

### [2026-06-20] ads.js — Précédence opérateur cassée dans renderUsageWidget
- **Erreur** : couleur CSS du widget sidebar malformée (`#c4b5fd;margin-bottom...`)
- **Cause** : `urgColor.replace('#','').length === 6 ? urgColor : '#c4b5fd' + ';...'` — le `;` se concaténait à `'#c4b5fd'` avant le ternaire
- **Solution** : parenthèses `(urgColor.replace('#','').length === 6 ? urgColor : '#c4b5fd')`
- **Fichier** : `js/ads.js`

### [2026-06-20] plans.js — Double déclaration `_dureeSelectionnee`
- **Erreur** : variable déclarée deux fois, valeur finale toujours 12 accidentellement
- **Solution** : suppression de la première déclaration (ligne ~361)
- **Fichier** : `js/plans.js`

### [2026-06-20] portail-locataire.js — processPayment sauvegardait dans `DATA` v1
- **Erreur** : paiements déclarés via le portail locataire jamais enregistrés en DB
- **Cause** : `DATA.paiements.push(...)` — `DATA` est une variable v1 inexistante en v2
- **Solution** : remplacement par `window.IG.supabase.insert('paiements', newPay)`
- **Fichier** : `js/portail-locataire.js`
- **Règle** : ne jamais utiliser `DATA`, `saveData()`, `DATA.nextPayId` — variables v1 mortes

### [2026-06-20] portail-locataire.js — `event` global implicite dans showTab
- **Erreur** : `event.target.classList.add('active')` — `event` implicite, échoue en strict mode
- **Solution** : `function showTab(tab, ev)` + passer `(this, event)` dans les onclick
- **Fichier** : `js/portail-locataire.js`

### [2026-06-20] portail-locataire.js — `loc.iid` au lieu de `loc.immeuble_id`
- **Erreur** : immeuble_id jamais transmis dans les demandes de maintenance
- **Cause** : champ v1 était `iid`, v2 utilise `immeuble_id`
- **Solution** : `loc.immeuble_id || loc.iid`
- **Fichier** : `js/portail-locataire.js`

### [2026-06-20] app.js — `WORKER_URL` au lieu de `workerUrl` dans sendAIMessage
- **Erreur** : IA toujours appelée sur l'URL hardcodée, jamais sur config dynamique
- **Cause** : `window.IG.config.WORKER_URL` (majuscules) au lieu de `window.IG.config.workerUrl`
- **Solution** : `window.IG.config.workerUrl || window.IG.config.WORKER_URL`
- **Fichier** : `js/app.js`

### [2026-06-20] locataires.js + relances.js — Mois auto-générés comme impayés sans paiements
- **Erreur** : tout locataire sans paiements enregistrés affichait tous les mois depuis l'entrée comme impayés
- **Cause** : `calculerFiche` génère les mois depuis `entree` → sans versements = tout impayé
- **Solution** : si `pays.length === 0`, utiliser `mois_arrieres` et `arrieres` explicites au lieu du calcul FIFO
- **Fichiers** : `js/locataires.js`, `js/relances.js`, `js/dashboard.js`
- **Règle** : le calcul FIFO ne s'active que quand au moins un paiement est enregistré

### [2026-06-20] locataires.js — Filtre `!l.futur` manquant dans `_alerteLabel`
- **Erreur** : badge "Cas critique" basé sur les mois futurs inclus
- **Solution** : ajout de `!l.futur &&` dans le filtre de `_alerteLabel`
- **Fichier** : `js/locataires.js`

### [2026-06-20] paiements.js — RESTE DÛ affiché même sans versement
- **Erreur** : colonne "Reste dû" de la fiche montrait 50 000 F pour tous les mois impayés, même sans aucun versement
- **Comportement voulu** : vide si aucun versement, montant rouge si paiement partiel, "—" si payé
- **Solution** : condition `lg.reste > 0 && lg.cumul > 0` (cumul = versements reçus)
- **Fichier** : `js/paiements.js`

### [2026-06-20] paiements.js — Champs Mois/Année manuels dans le formulaire de paiement
- **Erreur** : l'utilisateur devait saisir manuellement le mois et l'année couverts, source de confusion
- **Cause** : mois/annee stockés séparément mais redondants avec date_paiement — le FIFO utilise date_paiement
- **Solution** : suppression des champs du formulaire, mois/annee auto-calculés depuis date_paiement au submit
- **Logique** : un paiement enregistré couvre automatiquement le mois le plus ancien impayé (algorithme FIFO)
- **Fichier** : `js/paiements.js`

### [2026-06-20] relances.js + locataires.js — FIFO depuis l'entrée gonfle les mois après 1er paiement
- **Erreur** : enregistrer 1 paiement faisait passer RFFA de 0 à 33 mois dus (discontinuité)
- **Cause** : FIFO partait de `loc.entree` (Sep 2023) → générait 34 mois → 1 payé = 33
- **Solution** : FIFO part depuis la date du PREMIER paiement enregistré. Base = `mois_arrieres`. Formule : `max(0, mois_arrieres - payes_depuis_premier_pay) + impayes_nouveaux`
- **Fichiers** : `js/relances.js`, `js/locataires.js`, `js/dashboard.js`
- **Règle** : pour la liste/relances, ne jamais générer l'historique depuis `entree` quand des paiements existent — partir du premier paiement

### [2026-06-20] paiements.js — Sélecteur année supprimé par erreur
- **Erreur** : sélecteur d'année retiré de la fiche — l'utilisateur ne pouvait plus voir les fiches des années précédentes
- **Solution** : sélecteur restauré, fiche s'ouvre sur l'année en cours par défaut
- **Fichier** : `js/paiements.js`

### [2026-06-20] paiements.js calculerFiche — Paiement FIFO part de entree, pas de la période due
- **Erreur** : locataire entré en Sep 2023 avec mois_arrieres=9 → 1er paiement allait couvrir Sep 2023 au lieu de Oct 2025
- **Cause** : FIFO génère tous les mois depuis `loc.entree` sans tenir compte des mois antérieurs non dus
- **Solution** : crédit implicite = `max(0, totalPasse - mois_arrieres) * loyer` ajouté à cumulAvance avant le FIFO
- **Formule** : totalPasse = nb mois écoulés depuis entree ; creditMois = totalPasse - mois_arrieres → FIFO démarre au bon mois
- **Fichier** : `js/paiements.js`
- **Règle** : `mois_arrieres` doit toujours être pris en compte dans calculerFiche pour calibrer le point de départ FIFO

### [2026-06-20] paiements.js — Fiche filtrée par année uniquement
- **Erreur** : la fiche de suivi ne montrait que les mois de l'année sélectionnée (2026 par défaut)
- **Cause** : `lignes = toutesLignes.filter(lg.annee === annee)` ligne 157
- **Solution** : `lignes = toutesLignes` — afficher tous les mois depuis l'entrée. Sélecteur d'année supprimé.
- **Fichier** : `js/paiements.js`

---

## Erreurs à surveiller (non encore rencontrées mais risquées)

### Champ `nom_immeuble` vs `nom`
- La table `immeubles` a DEUX champs : `nom_immeuble` (principal) et `nom` (alias)
- Toujours utiliser `imm.nom_immeuble || imm.nom` pour garantir la compatibilité

### `locataire_id` type
- En DB : `BIGINT`
- En JS : peut arriver comme string depuis FormData → toujours `parseInt(fd.get('locataire_id'))`

### Paiements `mois` et `annee`
- Doivent être auto-calculés depuis `date_paiement` (implémenté juin 2026)
- Si modifiés manuellement : vérifier cohérence avec `date_paiement`

### Upload photos Supabase Storage
- Bucket `marketplace` doit être **Public** dans le dashboard Supabase
- Sans ça, les URLs générées ne sont pas accessibles publiquement

---
## 2026-06-26 — Login bloqué + Erreur base de données

### Symptômes
- "Aucun compte trouvé pour ce numéro" à la connexion (même avec le bon numéro)
- "Erreur base de données" à la création d'un immeuble

### Causes
1. Worker Cloudflare déployé était une vieille version → route `/login` absente
2. PhoneField envoie `+237676528917` mais DB stocke `676528917` (sans indicatif) → aucun match
3. Logique fallback incorrecte : tenant trouvé + mauvais mdp → fallback users_app au lieu de "Mot de passe incorrect"
4. Colonnes `type_honoraires`/`valeur_honoraires` manquantes dans la table `immeubles`

### Corrections
- Worker redéployé avec route `/login` active
- Fonction `_telFilter()` dans worker : génère toutes les variantes de numéro (1-3 chiffres d'indicatif) via filtre `or=()` Supabase
- Logique login : si tenant trouvé → vérifier mdp immédiatement (pas de fallback)
- Migration V014 : `ALTER TABLE immeubles ADD COLUMN IF NOT EXISTS type_honoraires/valeur_honoraires`

---
## 2026-07-11 — Audit Supabase : « Erreur base de données » en masse

### Symptômes
- Nombreuses alertes « Erreur base de données » côté app + logs PostgREST Supabase pleins d'erreurs 42P01/42703.

### Causes (diagnostic prouvé via /migrate + information_schema)
1. **Tables V1 supprimées encore appelées** : `signatures` et `annonces` n'existent plus en DB (nettoyage V1→V2 du 15 juin), mais le frontend les interroge encore → PostgREST `42P01 relation "…" does not exist` → Worker renvoie 500 « Erreur base de données ».
   - `js/signature.js` : insert + select sur `signatures` (fonctionnalité de signature électronique réelle, table jamais recréée dans V006).
   - `js/marketplace.js` : fallback mort `getAnnonces()` vers `annonces` (remplacé par `marketplace_annonces`).
2. **Tri `created_at` forcé sur tables sans cette colonne** (bug latent) : le handler `/db` du Worker ajoutait `&order=created_at.asc` à toutes les tables sauf `declarations`/`corbeille`. Or `locale_profiles`, `feature_flags`, `scores_locataires` n'ont pas de `created_at` (`42703`). Non déclenché aujourd'hui (frontend ne les select pas) mais cassait tout select futur (ex. LegalOS scoring).

### Corrections
- **Migration V015** : recréation de la table `signatures` (schéma identique à `supabase_marketplace_signatures.sql`, avec `created_at`). Appliquée en prod via `/migrate`.
- **Worker `workers/notif-cron.js`** :
  - `annonces` retirée de `ALLOWED_TABLES`.
  - Tri robuste par table via map `ORDER_COL` (`locale_profiles`→`tenant_id`, `feature_flags`/`scores_locataires`→`id`, sinon `created_at`). Plus jamais de `created_at` sur une table qui ne l'a pas.
  - Redéployé (version `6b7161bb`).
- **`js/marketplace.js`** : `getAnnonces()` lit uniquement `marketplace_annonces`, fallback `annonces` supprimé.

### Règle
- Ne jamais référencer une table hors du schéma V006+migrations. Avant d'ajouter une table à `ALLOWED_TABLES`, vérifier qu'elle existe ET si elle a `created_at` (sinon l'ajouter à `ORDER_COL`).

---
## 2026-07-11 — Audit complet : incohérences colonnes ↔ schéma

### Méthode
Introspection du schéma réel (31 tables) via `/migrate` + `information_schema`, puis
croisement de chaque `insert`/`upsert`/`update` du frontend vivant avec les colonnes réelles.

### Bugs trouvés et corrigés
1. **`js/app.js` — insert `paiements` avec colonne `immeuble_id` inexistante**
   - À la validation d'une déclaration de paiement (`_validerDeclaration`), l'insert
     passait `immeuble_id` : la table `paiements` n'a PAS cette colonne → PostgREST
     `PGRST204` → « Erreur base de données » à chaque validation.
   - **Fix** : `immeuble_id` retiré + ajout de `date_paiement` (nécessaire au FIFO).

2. **`messages_internes` — dérive schéma↔code sur 6 colonnes**
   - Le code (app.js, owner.js, Worker `/db`) lit/écrit `de_user_id`, `pour_user_id`,
     `de_nom`, `pour_nom`, `date_envoi`, `lu_par` ; la table n'avait que
     `expediteur_id`/`destinataire_id`/`lu`/`created_at`. → `42703` sur CHAQUE select
     messagerie des rôles non-admin + échec des envois.
   - **Fix** : Migration V016 (table vide → ajout additif des 6 colonnes). Zéro refonte de code.

### Constaté mais NON corrigé (code mort — non chargé par index.html)
- `js/monetisation.js`, `js/portail-locataire.js` : appellent un client Supabase `_sb`
  jamais défini (ReferenceError). Non chargés par `index.html` → inoffensifs.
- `js/_onboarding.js` (erreur de syntaxe ligne 133), `_onboarding2.js`, `ai-service.js`,
  `cinetpay.js`, `pay-config.js`, `push-module.js` : code mort.

### Recommandation (dette, pas un bug bloquant) — ✅ RÉSOLUE le 2026-07-11
- `parametres` est sauvegardé via `insert` répété (4 endroits dans app.js) → crée des
  lignes dupliquées par tenant. Devrait être un `upsert` par `tenant_id`.
- **Résolu** : (1) les 4 blocs `insert('parametres')` sont désormais tolérants au conflit
  (sur échec → relire + update, jamais de doublon) ; (2) migration V019 pose
  `UNIQUE(tenant_id)` sur `parametres` (garantie au niveau base). Voir entrée dédiée plus bas.

---
## 2026-07-11 — Archivage immeuble en erreur + immeubles en double

### Symptômes (signalés en prod avec capture)
- Clic sur 📦 Archiver un immeuble → « Erreur base de données ».
- 2 immeubles identiques créés : le bouton Sauvegarder est resté ~1 min sans réaction,
  2e clic → 2 immeubles.

### Causes
1. **Colonnes `archive` / `date_archive` absentes de `immeubles`**
   - `js/immeubles.js confirmerArchivage()` fait `sauvegarder({...imm, archive:true, date_archive:...})`
     et `charger()`/vue Archives (`js/app.js`) filtrent sur `i.archive`. Ces colonnes
     n'existaient pas → l'upsert d'archivage → PostgREST 42703/PGRST204 → « Erreur base de données ».
2. **Pas de verrou anti double-submit sur le formulaire immeuble**
   - `js/immeubles.js afficherFormulaire()` génère un `id` neuf (`uid()`) à CHAQUE submit d'un
     nouvel immeuble et ne désactivait pas le bouton pendant l'`await` → un 2e clic (pendant
     une sauvegarde lente) crée un 2e immeuble.

### Corrections
- **Migration V017** : `ALTER TABLE immeubles ADD archive BOOLEAN DEFAULT false, date_archive TIMESTAMPTZ`.
  Appliquée en prod → l'archivage fonctionne.
- **`js/immeubles.js`** : verrou `_saving` + bouton désactivé (« Enregistrement… ») pendant
  la sauvegarde, relâché dans `finally`. Empêche les doublons.

### Règle
- Tout `addEventListener('submit', …)` qui écrit en DB doit désactiver son bouton pendant
  l'`await` (verrou anti double-submit). À répliquer sur les formulaires locataire/paiement.

---
## 2026-07-11 — Ajout : suppression définitive d'un immeuble

### Besoin
La carte immeuble n'offrait que 📦 Archiver (soft-delete). Impossible de supprimer
réellement un doublon.

### Implémentation
- **`js/immeubles.js supprimerDefinitif(id)`** : confirmation rouge forte + garde
  « locataires actifs » (bloque si l'immeuble en a) → `db().remove('immeubles', id)`.
- Bouton 🗑️ ajouté sur la carte, à côté de 📦.
- Sûr côté DB : la seule FK vers `immeubles` est `locataires.immeuble_id` en
  `ON DELETE SET NULL` → le DELETE ne peut pas être bloqué par une contrainte.

### Note
- Le Worker `/db` renvoie `{success:true}` pour tout DELETE sans vérifier `res.ok`
  (ligne 783 notif-cron.js). OK pour `immeubles` (SET NULL), mais à surveiller pour
  d'autres tables avec FK restrictives : un échec DELETE serait masqué.

---
## 2026-07-11 — Résidus après suppression d'immeuble (locaux orphelins)

### Symptôme
Après suppression définitive d'un immeuble, des « résidus » restaient dans l'app.

### Cause
Créer un immeuble génère **1 ligne `locataires` par local** (statut 'libre', via
`_creerLocauxManquants`). La FK `locataires.immeuble_id → immeubles` est en
`ON DELETE SET NULL` → à la suppression de l'immeuble, ces locaux ne sont PAS
supprimés : leur `immeuble_id` passe à NULL et ils flottent, orphelins, dans l'app.
(Ex. constaté : 1 immeuble de 34 locaux supprimé → 34 locataires orphelins.)

### Corrections
- **`js/immeubles.js supprimerDefinitif()`** : suppression en cascade côté app —
  supprime d'abord les locaux vides (`statut='libre'`) de l'immeuble + les
  `marketplace_annonces` liées, PUIS l'immeuble ; recharge locataires + refresh.
  (On ne supprime que les locaux 'libre' : la garde bloque déjà si des locataires
  actifs existent.)
- **Nettoyage prod ponctuel** : `DELETE FROM locataires WHERE immeuble_id IS NULL
  AND statut='libre'` → 34 orphelins purgés.

### Règle
- Toute suppression d'une entité « parent » doit nettoyer ses enfants générés
  automatiquement (locaux, annonces). Ne pas se reposer sur `ON DELETE SET NULL`
  pour les lignes qui n'ont pas de sens sans leur parent.

---
## 2026-07-11 — Blindage intégrité référentielle (FK manquantes)

### Contexte
Audit référentiel : 0 orphelin actuel, mais 6 relations n'avaient AUCUNE contrainte
FK → rien au niveau base n'empêchait de recréer des orphelins.

### Migration V018 — FK ajoutées
- `declarations.locataire_id` → locataires **CASCADE** (colonne convertie TEXT→bigint, table vide)
- `dossiers_juridiques.locataire_id` → locataires **CASCADE**
- `dossiers_juridiques.immeuble_id` → immeubles **SET NULL** (garde l'historique juridique)
- `scores_locataires.locataire_id` → locataires **CASCADE**
- `timeline_juridique.locataire_id` → locataires **CASCADE**
- `marketplace_annonces.immeuble_id` → immeubles **CASCADE**

### Conséquences
- Supprimer un locataire efface désormais ses declarations/dossiers/scores/timeline/paiements (au niveau DB).
- Supprimer un immeuble efface ses annonces (DB) — le nettoyage app des annonces devient redondant mais reste inoffensif.
- `locataires.immeuble_id → immeubles` reste volontairement en **SET NULL** (ne jamais
  auto-supprimer des locataires réels) : le nettoyage des locaux 'libre' se fait côté app
  (`supprimerDefinitif`), avec garde bloquante si locataire actif.

---
## 2026-07-16 — « Erreur: Session invalide » bloquant l'ajout d'immeuble

### Cause
Le worker déployé (`workers/notif-cron.js`, cf. `wrangler.toml` main) valide `/db` via un
**token de session signé** dont la durée de vie était de **24h** (`exp: Date.now() + 24*3600*1000`).
Passé 24h, `_verifyToken` renvoie `null` → `/db` renvoie **401 « Session invalide »**.
Côté front, `js/supabase.js` ne posait qu'un flag 15s (`_markAuthFailed`) sans déconnecter :
l'utilisateur restait bloqué sur un toast d'erreur en cul-de-sac (impossible de travailler).
Franklin faisant des sessions nocturnes, son token était simplement périmé.

### Corrections
- **`workers/notif-cron.js`** : TTL du token porté à **30 jours** (fin des déconnexions quotidiennes).
- **`js/supabase.js`** : sur 401 « Session invalide » / « Token invalide ou expiré », appel de
  `_forceReauth()` → toast *« Session expirée, veuillez vous reconnecter »* + `auth.logout()`
  (retour propre à l'écran de connexion). Un SELECT sur table offline sert d'abord le cache local.

### Déblocage immédiat
Se déconnecter puis se reconnecter régénère un token frais (valable 30j après déploiement worker).

### Suite (même jour) — pourquoi le blocage persistait malgré la reconnexion
Audit worker : sain (health OK, `/login` renvoie bien un `sessionToken`, `SESSION_SECRET` configuré,
admin = FULL_ACCESS sur `immeubles`). « Session invalide » ne peut donc venir QUE du token.
**Deux pièges côté client** :
1. **`js/auth.js` `_loadSession()`** ne validait que `s.tenantId`, jamais l'expiration du token.
   Au rechargement, l'app restaurait la session **avec un token mort** → dashboard → rebloqué.
   Rafraîchir ne servait à rien, il fallait se déconnecter *explicitement*.
   → Fix : `_tokenExpired()` décode l'`exp` du JWT ; si périmé **et** en ligne, la session est
   purgée → écran de connexion. Hors ligne, la session est conservée (lecture du cache).
2. **`sw.js`** cache-first : l'ancien `js/supabase.js` restait servi depuis le cache, donc le
   correctif n'atteignait jamais l'appareil. → Fix : `CACHE_NAME` v37 → **v38** (réinstall + purge).

⚠️ Penser à bumper `CACHE_NAME` dans `sw.js` à CHAQUE correctif JS, sinon il ne parvient pas aux users.

---
## 2026-07-16 — CAUSE RACINE : /login ne trouvait aucun compte (n° avec espace)

### Cause
`_telFilter` (workers/notif-cron.js) retire les séparateurs de la **saisie**, puis compare à la
valeur **brute** stockée en base. Le tenant CRAA est stocké `"+237 690409929"` **avec une espace** :
aucune variante générée (toutes sans séparateur) ne pouvait matcher.
→ `/login` répondait « Aucun compte trouvé pour ce numéro » → **reconnexion impossible**.
C'est ce qui rendait le blocage « Session invalide » inéchappable : token expiré + reconnexion
cassée. Les 3 correctifs de session précédents étaient nécessaires mais **ne pouvaient pas
débloquer** l'app. `/login-tenant` (comparaison exacte) fonctionnait, lui — d'où le contraste
qui a permis de trouver.

### Corrections
- `_telFilter` : ajoute `telephone.ilike.*<9 derniers chiffres>*` (**additif** → aucune régression).
- `_telSame` + `_pickByTel` : tranchent le candidat. **Indispensable** : le `ilike` ramène des faux
  positifs (`+1 555690409929` finit par les mêmes 9 chiffres que `+237 690409929` → mauvais compte
  retenu, détecté par les tests). Égalité stricte d'abord, puis suffixe national ≥ 9 chiffres,
  puis le n° stocké le plus court.
- Appliqué à `/login`, `/login-portal` et la résolution du locataire.
- 13 tests unitaires + vérifié en prod sur 3 formats de saisie.

### Leçon
Le code était juste, la **donnée** était sale. Un `eq.` sur une colonne texte non normalisée est
un piège : toujours prévoir la tolérance au formatage OU normaliser à l'écriture.

---
## 2026-07-16 — Sécurité /db : id non encodé + fuite d'erreurs SQL

- `delete`/`update` concaténaient l'`id` client sans `encodeURIComponent` (les `select` le
  faisaient déjà via `SAFE_KEY`) → injection dans la query PostgREST (portée : son propre tenant).
  → Corrigé : `encodeURIComponent` + `id` obligatoire.
- Les erreurs SQL brutes étaient renvoyées au client (`detail: result`) → fuite de schéma.
  → Corrigé : journalisées côté worker, message générique au client.

---
## 2026-07-11 — Dette parametres résolue (anti-doublon réglages)

### Cause
`parametres` = table singleton par tenant, mais aucune contrainte ne l'imposait.
La logique `select → si row update, sinon insert` (4 endroits dans app.js) créait un
doublon si deux sections étaient enregistrées en concurrence AVANT que la 1ère ligne existe.

### Corrections
- **`js/app.js`** : les 4 blocs `insert('parametres')` attrapent l'échec (conflit) →
  relisent la ligne existante et font un `update` à la place (aucun doublon, aucune erreur UI).
- **Migration V019** : `ALTER TABLE parametres ADD CONSTRAINT uq_parametres_tenant UNIQUE (tenant_id)`.
  Garantie définitive au niveau base (0 doublon existant → posable sans échec).

---
## 2026-07-29 — Série de correctifs : locaux, fiche de suivi, paiements, CORS, i18n

### `js/immeubles.js` — Locaux fantômes (ancien schéma A1/S1/C1/D1)
- **Erreur** : la numérotation personnalisée d'un immeuble (ex: 1A, 1B, 2A) laissait des
  locaux vides de l'ancien schéma auto (S16-S21, C1…) affichés indéfiniment dans la liste.
- **Cause 1** : `_creerLocauxManquants` régénérait l'ancien schéma dès qu'aucune numérotation
  personnalisée n'était formellement enregistrée dans `imm.locaux`.
- **Cause 2** : `_candidatsNettoyage` (fonction de nettoyage ajoutée) exigeait elle aussi
  `imm.locaux` défini formellement — ne détectait rien si la renumérotation avait été saisie
  à la main sans passer par l'éditeur "Configurer".
- **Solution** : `_creerLocauxManquants` utilise `imm.locaux` si défini, sinon fallback ancien
  schéma. `_candidatsNettoyage` détecte aussi *de facto* : si un format `\d+[A-Za-z]+` (1A, 2B…)
  est déjà utilisé sur des locaux occupés, l'ancien format `[ASCD]\d+` devient candidat à la
  suppression, formalisé ou non. `nettoyerLocauxFantomes()` exposée en console pour purge manuelle.

### `js/locataires.js` — Tri des locaux en désordre
- **Erreur** : les locaux (1A, 1B, 1C…) ne restaient PAS triés dans l'ordre logique si saisis
  dans le désordre — le tri codé en dur supposait l'ancien format lettre-puis-chiffre (A1, S2, C3)
  avec une priorité de type (Duplex→Appart→Studio→Chambre), et sur une égalité de numéro
  (ex: "1A" vs "1B") l'ordre d'affichage dépendait de l'ordre d'insertion, pas du suffixe.
- **Solution** : remplacé par `_triAppt()`, un tri naturel générique (segmentation
  numérique/alphabétique) qui fonctionne peu importe la convention (1A/1B/2A… ou A1/S2/C3…)
  et peu importe l'ordre de saisie.

### `js/paiements.js` — Fiche de suivi tronquée à l'année courante
- **Erreur** : un locataire ayant payé plusieurs mois d'avance dépassant l'année civile
  (ex: entré en 2026, payé jusqu'en 2027) voyait sa fiche et son sélecteur d'année plafonnés
  à décembre de l'année en cours — les mois payés au-delà disparaissaient silencieusement.
- **Cause** : `calculerFiche()` et le sélecteur d'année dans `renderFiche()` étaient bornés à
  `new Date().getFullYear()`, jamais à la dernière année réellement couverte par un versement.
- **Solution** : `renderFiche` calcule `anneeMaxVersements` (max des `annee` des versements,
  plancher année courante) et l'utilise pour borner `calculerFiche` et générer le sélecteur.

### `js/paiements.js` — Paiements d'avance invisibles sur les mois futurs
- **Erreur** : un paiement couvrant des mois futurs (ex: payé en juillet pour août→avril)
  n'apparaissait nulle part dans la fiche — les mois futurs affichaient "À venir" vide, et le
  total "mois payés / FCFA" ignorait totalement l'argent déjà reçu.
- **Cause** : la consommation FIFO de `calculerFiche()` ne s'applique qu'aux mois non-futurs ;
  les versements déjà taggés `mois`/`annee` pour un mois futur n'étaient jamais affichés.
- **Solution** : nouvelle branche `avancePreview` — pour un mois futur, recherche les versements
  déjà tagués pour ce mois précis (sans consommer leur `_restant`, la vraie consommation FIFO se
  fera normalement à échéance) et affiche `statut: 'Payé (avance)'`.

### `js/locataires.js`, `js/relances.js`, `js/paiements.js` — Badge "Cas critique" figé
- **Erreur** : un locataire payé jusqu'en 2027 restait affiché "🔴 Cas critique" en
  contradiction avec son score de fiabilité "Bon" et son statut "À jour".
- **Cause** : `_alerteLabel`, `calculerRetard` et `montantDu` ne créditaient le compteur
  `mois_arrieres`/`arrieres` qu'avec les mois "Payé" non-futurs — les mois futurs déjà payés
  d'avance (nouveau statut "Payé (avance)") n'étaient jamais comptés.
- **Solution** : ces trois fonctions comptent désormais aussi "Payé (avance)" (mois non "hors
  bail", peu importe futur ou non) pour créditer le compteur d'arriérés.

### `js/paiements.js` — Répartition multi-mois calée sur la date du jour au lieu du 1er mois dû
- **Erreur** : le formulaire "Nombre de mois à régler" étalait toujours les mois à partir de la
  date du paiement (souvent aujourd'hui), pas à partir du premier mois réellement impayé —
  un locataire en retard depuis janvier qui payait 5 mois en juillet se voyait étiqueter
  juillet→novembre au lieu de janvier→mai.
- **Solution** : `_moisDepartPaiement(loc)` dérive le vrai premier mois dû via `calculerFiche()`
  (premier mois non "hors bail" et non "Payé"/"Payé (avance)"), utilisé pour l'aperçu de
  répartition ET l'enregistrement réel — plus seulement la date de paiement.

### `js/app.js` — Suppression de paiement en course avec le rafraîchissement
- **Erreur** : après suppression d'un paiement (bouton × dans la liste Paiements), des restes
  de ce paiement pouvaient réapparaître dans des calculs suivants (ex: mois de départ erroné
  d'un nouveau paiement multi-mois).
- **Cause** : le bouton appelait `window.IG.paiements.annuler(id)` (fonction async) **sans
  l'attendre** avant de fermer la modale et de rafraîchir l'affichage — le rafraîchissement
  pouvait s'exécuter avant que la suppression soit effective côté serveur.
- **Solution** : le clic attend désormais la résolution de `annuler()` (`.then(...)`) avant de
  fermer la modale et de rafraîchir.
- **Note** : cette race n'efface pas rétroactivement des paiements déjà restés coincés en base
  par une suppression antérieure ratée — il faut les repérer et les supprimer manuellement une
  fois le correctif déployé (page Paiements, filtrer par mois concerné).

### `workers/notif-cron.js` — CORS bloquait le nouveau domaine personnalisé
- **Erreur** : après ajout du domaine `immogest.afrisaas.com`, le login échouait avec
  `blocked by CORS policy` (`Access-Control-Allow-Origin` ne renvoyait que l'ancien domaine
  `immogest-34w.pages.dev`).
- **Cause** : `ALLOWED_ORIGINS` dans le Worker n'incluait pas le nouveau domaine.
- **Solution** : ajout de `https://immogest.afrisaas.com` à `ALLOWED_ORIGINS`, Worker redéployé
  (`wrangler deploy`).

### `js/i18n.js` — Langues pt/es/ha/ar incomplètes
- **Erreur** : portugais, espagnol, haoussa et arabe n'avaient que 205 clés contre 266 pour
  l'anglais (sections mot de passe, rapport DOCX, thème jour/nuit, paramètres cabinet absentes).
- **Solution** : 61 clés manquantes traduites et ajoutées aux 4 langues → 276 clés partout,
  parité complète avec l'anglais.

### `js/immeubles.js`, `js/locataires.js`, `js/rapports.js`, `js/relances.js`, `js/messages-wa.js`, `js/dashboard.js` — Textes français en dur
- **Erreur** : ~150-180 chaînes françaises codées en dur (labels, boutons, messages toast,
  validations) ne passaient pas par `t()` — invisibles au changement de langue.
- **Solution** : chaînes UI enrobées avec `t()` dans ces 6 fichiers. Les corps des messages
  WhatsApp sortants (templates envoyés aux locataires/bailleurs) laissés tels quels, hors
  périmètre de cette passe.

---

## 2026-08-11 — CAUSE RACINE : tous les .docx générés étaient corrompus

### `docx.bundle.js` — signatures ZIP amputées dans la bibliothèque

- **Erreur** : Word refusait d'ouvrir tout fichier généré par l'appli —
  « The file is corrupt and cannot be opened » (rapport mensuel, rapport annuel,
  contrats… tout ce qui passe par `docx.Packer`).
- **Symptôme trompeur** : on a d'abord soupçonné le code d'export du rapport mensuel
  (grille de tableau irrégulière, commit `be870cf`). Ce correctif était juste et
  nécessaire, mais il ne pouvait pas résoudre ce bug-ci : le problème était en
  dessous, dans la bibliothèque.
- **Cause** : le fichier `docx.bundle.js` versionné dans le repo avait perdu ses
  octets de contrôle bruts `0x01`–`0x06` (fichier binaire passé un jour dans un
  filtre texte). Les constantes de signature ZIP de JSZip s'en trouvaient amputées :
  `LOCAL_FILE_HEADER = "PK"` au lieu de `"PK\x03\x04"`, `CENTRAL_FILE_HEADER = "PK"`
  au lieu de `"PK\x01\x02"`, `CENTRAL_DIRECTORY_END = "PK"` au lieu de `"PK\x05\x06"`,
  etc. Un `.docx` est un ZIP : sans en-têtes valides, **aucun** fichier produit
  n'était ouvrable, quel que soit son contenu.
- **Solution** : restauration des 5 constantes de signature dans `docx.bundle.js`.
  Vérifié dans le navigateur : le blob produit commence bien par `50 4B 03 04` et se
  termine par `50 4B 05 06`, et l'archive se décompresse en paquet OOXML complet
  (`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`…).
- **Effet de bord obligatoire** : `docx.bundle.js` est en cache-first dans le Service
  Worker. `CACHE_NAME` bumpé `v40` → `v41`, sinon les utilisateurs existants gardent
  la bibliothèque cassée.
- **À retenir** : ne jamais faire transiter un asset binaire (bundle, police, image)
  par un outil qui normalise le texte. En cas de « fichier corrompu » sur un format
  ZIP (.docx, .xlsx, .pptx, .epub), vérifier les 4 premiers octets **avant**
  de suspecter le code métier qui remplit le document.

---

## 2026-08-11 — Rapport mensuel et fiche de suivi se contredisaient

### `js/rapports.js` — « reste à payer » calculé sur la fenêtre du rapport

- **Erreur** : pour un même locataire, la fiche de suivi affichait « À JOUR — 0 FCFA »
  pendant que le rapport mensuel annonçait « Doit août — 230 000 FCFA ».
  Cas témoin : ESSOLA NGUIDJOL (local 2A, Teukeu Makepe), qui avait réglé août ET
  septembre d'avance par un versement unique du 10/07/2026.
- **Cause** : le rapport calculait `reste = loyer - somme des versements tombant
  entre dateDebut et dateFin`. Un règlement effectué AVANT l'ouverture de la fenêtre
  — donc toute avance — était invisible, et le locataire déclaré débiteur.
  La ligne se contredisait d'ailleurs elle-même : la colonne OBSERVATIONS utilise
  `relances.calculerRetard()` sur l'historique complet et affichait bien 0 mois dû,
  pendant que la colonne RESTE À PAYER réclamait un mois entier.
- **Solution** : le reste est désormais tiré de `paiements.calculerFiche()`, la même
  allocation chronologique FIFO que la fiche de suivi — source unique de vérité.
  Nouvelle fonction `_resteMoisFiche(loc, versements, dateFin)` qui retourne le
  `reste` de la ligne du mois de clôture. Repli sur l'ancien calcul si la fiche
  n'est pas calculable (pas de date d'entrée).
- **Corrigé au passage** : un locataire dont le bail commence après la période
  (`horsBail`) se voyait facturer un mois entier de loyer.
- **Vérifié** : débiteur total, paiement dans la fenêtre, mois partiel, hors bail
  et locataire sans date d'entrée — valeurs conformes à la fiche dans les 5 cas.
- **À retenir** : « qui doit quoi » ne se recalcule jamais localement. Tout écran
  qui affiche un solde doit passer par `paiements.calculerFiche()` /
  `paiements.montantDu()` / `relances.calculerRetard()`, sinon deux écrans de
  l'appli finissent par se contredire devant le client.

---

## 2026-08-11 — Rapport mensuel : refonte visuelle sur le modèle Word CRAA

### `js/rapports.js` — mise en page alignée sur le rapport Oyom Abang

- **Demande** : le rapport de l'appli devait reprendre la présentation du modèle
  Word utilisé par le cabinet (`Rapport_Oyom_Abang_du 30.06.2026 Au 31.07.2026.docx`).
- **Écarts corrigés** :
  - bandeaux de section : filet bleu à gauche → bandeau bleu pleine largeur,
    texte blanc majuscule ;
  - tableaux : grille fine sur toutes les cellules, alternance `#EEF6FC`/blanc,
    largeurs de colonnes fixes, alignements par colonne (local centré,
    montants à droite, libellés à gauche) ;
  - code du local en bleu gras — repère visuel de lecture du tableau ;
  - ligne TOTAL : bandeau sombre → fond `#D6E9F6`, texte bleu, libellé « TOTAL » ;
  - récapitulatif financier : bloc séparé à droite → lignes de pied INTÉGRÉES au
    tableau des encaissements, sous-totaux alignés sous la colonne des montants ;
  - pied de page reprenant l'adresse du cabinet et le nom du bailleur.
- **Code couleur** : bleu `#0E6AAF` = repère, vert `#1A6B45` = encaissé / à jour,
  rouge `#C0392B` = dû. Le lecteur balaie les colonnes, il ne lit pas le texte.

### `js/rapports.js` — les mois dus étaient comptés à AUJOURD'HUI

- **Erreur** : sur un rapport édité le 11 août mais portant sur juillet, un
  locataire à jour au 31/07 affichait « 1 mois dû(s) — à relancer » en face d'un
  reste à payer vide. Le document se contredisait à l'intérieur d'une même ligne.
- **Cause** : `relances.calculerRetard()` compte les impayés à la date du jour,
  alors que tout le reste du rapport parle de la période close.
- **Solution** : `_moisDusAuFiche(loc, versements, dateFin)` compte les mois non
  soldés jusqu'au mois de clôture inclus. Repli sur `calculerRetard()` si la
  fiche n'est pas calculable.
- **À retenir** : même famille que le bug du reste à payer — un rapport daté doit
  répondre à « où en était-on à la clôture ? », jamais à « où en est-on ce matin ? ».

---

## 2026-08-11 — Rapport mensuel : « Reste à payer » → « Montant dû »

### `js/rapports.js` — la colonne ne montrait qu'un mois de loyer

- **Demande** : la colonne devait afficher la dette RÉELLE du locataire, pas le
  solde du seul mois de clôture.
- **Avant** : un locataire devant 7 mois affichait « 80 000 FCFA » — le loyer d'un
  mois — alors que la colonne Observations annonçait « 7 mois dû(s) — à expulser ».
  Le total de bas de tableau sous-estimait donc massivement l'encours de l'immeuble.
- **Solution** : colonne renommée « Montant dû ». `_resteMoisFiche()` et
  `_moisDusAuFiche()` fusionnées en `_situationAuFiche()`, qui retourne
  `{ moisDus, montantDu }` — le montant étant le cumul de tous les mois non
  soldés depuis l'entrée, arrêtés au mois de clôture. Les arriérés saisis à la
  main sur la fiche locataire (`loc.arrieres`) sont intégrés selon la même règle
  que `paiements.montantDu()`.
- **Vérifié** : 1 mois → 80 000, 2 mois → 160 000, 7 mois → 560 000, payé
  d'avance → 0, et le TOTAL correspond bien à la somme de la colonne.
- **i18n** : clé « Montant dû » ajoutée aux 5 langues.

---

## 2026-08-11 — Rapport mensuel : « à jour jusqu'en… » pour les avances

### `js/rapports.js` — la colonne Observations ne distinguait pas les avances

- **Demande** : un locataire ayant payé d'avance doit afficher jusqu'à quel mois
  il est couvert ; celui qui a réglé le seul mois en cours, simplement « À jour ».
- **Avant** : les deux cas se ressemblaient, et la cellule affichait souvent la
  note du versement (« Loyer juillet ») à la place d'un verdict.
- **Solution** : `_situationAuFiche()` retourne en plus `couvertJusqu`, obtenu en
  avançant mois par mois après la clôture tant qu'ils sont intégralement réglés.
  Le verdict passe en tête de cellule, les notes viennent après.
  L'année n'est affichée que si elle diffère de celle de la clôture.
- **Deux pièges traités** :
  - la fiche force `reste` à 0 sur les mois futurs — il faut lire `cumul`, seul
    indicateur du paiement réel d'un mois à venir ;
  - le balayage s'arrête au premier mois non soldé : une avance couvrant août
    puis octobre affiche « jusqu'en août », jamais « jusqu'en octobre ».
  - la fiche est calculée sur une année de plus que la clôture, sinon une avance
    versée en fin d'année serait invisible.
- **Vérifié** : pile à jour → « À jour » ; avance 3 mois → « À jour jusqu'en
  octobre » ; avance débordant sur 2027 → « À jour jusqu'en février 2027 » ;
  avance avec trou → s'arrête au trou ; débiteur → inchangé.

---

## 2026-08-11 — Onglet Encaissements refondu par locataire + verrou comptable

### `js/app.js` — la liste plate rendait la vérification impossible

- **Symptôme signalé** : « je constate des erreurs sur l'état d'un locataire sur sa
  fiche et sur son rapport », le plus souvent dues à une mauvaise comptabilisation
  des loyers, sans moyen simple de les retrouver ni de les corriger.
- **Cause d'usage** : l'onglet listait les paiements à plat, filtrés par mois/année.
  Un versement couvrant plusieurs mois est stocké en une ligne PAR MOIS : il
  apparaissait donc éclaté sur plusieurs mois différents, invisible depuis le mois
  où il avait réellement été encaissé. Impossible de voir d'un coup ce qu'un
  locataire a versé.
- **Solution** : une fiche dépliable par locataire. En-tête = local, nom, immeuble,
  nombre de versements, total encaissé, montant dû. Dépliée = un récapitulatif de
  TOUS ses versements (date, montant, type, mois couverts, mode) avec suppression.
  Filtres : immeuble, recherche, « uniquement ceux qui doivent ». Les débiteurs
  remontent en tête de liste.
- **`grouperVersements()`** recompose les lignes DB éclatées en versements réels ;
  **`annulerLot()`** supprime le groupe entier — supprimer ligne par ligne laissait
  un demi-paiement en base et faussait durablement la fiche.

### `js/paiements.js`, `js/relances.js` — un locataire sans AUCUN versement passait « à jour »

- **Erreur** : `montantDu()` et `calculerRetard()` renvoyaient les seuls arriérés
  saisis à la main (souvent 0) dès qu'il n'y avait aucun paiement enregistré —
  `if (!paiements.length) return base;`. Un locataire entré en janvier et n'ayant
  jamais payé était donc affiché « À jour / 0 FCFA », alors que sa fiche de suivi
  montrait bien 8 mois impayés. C'est une cause directe des incohérences
  fiche ↔ rapport signalées.
- **Solution** : le raccourci ne s'applique plus que si la date d'entrée est
  également absente (là, la fiche est réellement incalculable). Sinon on laisse la
  fiche compter les mois échus.
- **Vérifié** : 8 mois sans versement → 8 mois dus / 1 040 000 FCFA ; locataire à
  jour → 0 ; locataire libre → 0 ; sans date d'entrée → arriérés manuels.

### `workers/notif-cron.js` — le verrou UI était contournable

- **Erreur** : masquer le bouton de suppression ne protège rien — le rôle `agent`
  avait `paiements` dans `WRITE_ALLOWED` et pouvait donc supprimer ou modifier un
  versement via l'API, et `coordinateur` passait par `FULL_ACCESS_ROLES`.
- **Solution** : `delete` et `update` sur la table `paiements` sont refusés (403)
  à tout rôle autre que `admin` et `comptable`, avant tout autre contrôle.
- **⚠️ À déployer** : ce contrôle n'est actif qu'après `wrangler deploy` du Worker.
- **À retenir** : une restriction qui n'existe que dans le HTML n'est pas une
  restriction. Toute règle d'accès doit être doublée côté serveur.

---

## 2026-08-11 — CAUSE RACINE des contradictions : deux définitions de la dette

### Toute l'app — `loc.arrieres` figé vs `montantDu()` calculé

- **Symptôme signalé** : la fiche d'enregistrement de FONTEM Vanessa (local 1D)
  affichait 3 680 000 FCFA d'arriérés, la liste des locataires 1 640 000 pour la
  même personne. « Et ça se répète un peu partout. »
- **Cause** : `locataires.arrieres` et `locataires.mois_arrieres` sont un **solde
  d'OUVERTURE**, saisi une fois à la reprise du dossier. Ils ne bougent jamais
  ensuite. Or la moitié de l'app les affichait comme s'il s'agissait de la dette
  courante, l'autre moitié affichait `paiements.montantDu()`, qui est vivant.
  Les deux ne pouvaient que diverger dès le premier loyer encaissé.
- **Pire** : trois écrans de rapport recalculaient la dette avec une formule
  maison — `loyer × nb_mois + arrieres − versements` — qui additionne le solde
  d'ouverture ET tous les mois de la période, alors que les versements
  postérieurs ont déjà soldé une partie de ce même arriéré. Sur Vanessa, cette
  formule donnait **9 690 000 FCFA** contre 1 640 000 réels : un facteur 6.
- **Solution** : `paiements.montantDu()` devient la source unique. Corrigés :
  - `js/rapports.js` — résumé annuel, tableau par locataire, portefeuille,
    total arriérés (helpers `_duReel()` / `_moisDusReel()`) ;
  - `js/locataires.js` — `_resteCalc()` ne renvoie plus le champ figé quand le
    locataire n'a aucun versement ;
  - `js/juridique.js` — le score de fiabilité notait « aucun arriéré » sur le
    champ figé.
- **Formulaire clarifié** : les deux champs sont regroupés dans un encadré
  « Situation au moment de la reprise du dossier — ces deux champs ne changent
  pas quand un loyer est encaissé », renommés « Arriérés à la reprise », avec la
  **dette réelle du jour affichée juste en dessous**. Plus aucune ambiguïté entre
  ce qu'on saisit et ce que l'app calcule.
- **Vérifié** : Vanessa → 1 640 000 partout (formulaire, liste, rapports) ;
  locataire sans aucun versement → 800 000 au lieu de « — ».
- **À retenir** : ne jamais stocker en base une valeur qui se périme, puis
  l'afficher à côté de son équivalent calculé. `arrieres` est un point de départ
  historique, pas un solde.

---

## 2026-08-11 — La fiche de suivi attestait des paiements qu'elle ne pouvait pas prouver

### `js/paiements.js` — statut « Antérieur au suivi »

- **Erreur** : pour un locataire ayant des arriérés à la reprise du dossier, la
  fiche affichait « Payé » sur tous les mois antérieurs, **sans aucun versement
  en face**. Sur FONTEM Vanessa (entrée 10/2023, 16 mois d'arriérés), 19 lignes
  affirmaient « Payé » avec la colonne versements vide.
- **Pourquoi c'est grave** : la fiche de suivi est signée par le cabinet et remise
  au bailleur. Elle attestait un règlement qu'aucune écriture ne justifie —
  indéfendable en cas de litige sur cette période.
- **Cause** : `mois_arrieres` génère un crédit implicite (`creditMois × loyer`)
  qui solde les mois les plus anciens pour que le FIFO démarre au bon endroit.
  Ce crédit est un artifice de calcul, il était rendu comme un vrai paiement.
- **Solution** : ces mois portent le drapeau `anterieur` et le statut
  « Antérieur au suivi », avec la mention « Réglé avant la reprise du dossier ».
  Ni attestés payés, ni réclamés.
- **Aucun chiffre ne bouge** : un drapeau `solde` a été ajouté sur chaque ligne
  (payé, payé d'avance OU antérieur) et tous les compteurs de l'app le lisent
  désormais au lieu de comparer des libellés de statut — `paiements.montantDu`,
  `relances.calculerRetard`, `locataires`, `legal`, `portail`.
  Vérifié sur Vanessa : montantDu 1 640 000 et 8 mois de retard avant ET après.
- **Score de fiabilité** : les mois antérieurs sortent du calcul (numérateur ET
  dénominateur) — on n'a aucune donnée sur eux, les compter « payés » gonflait
  artificiellement la note.
- **Effet de bord utile** : un locataire dont `mois_arrieres` est renseigné ALORS
  QUE son historique de versements couvre déjà ces mois affiche beaucoup de lignes
  « Antérieur au suivi ». C'est le signe que le champ arriérés est surévalué —
  l'incohérence était déjà là, elle était simplement invisible.
- **À retenir** : un artifice de calcul ne doit jamais ressortir tel quel dans un
  document signé. Si l'app ne peut pas prouver une affirmation, elle ne la fait pas.

---

## 2026-08-11 — CAUSE RACINE : la dette d'un locataire ne montait jamais

### `js/paiements.js` + migration V024 — arriérés ancrés à une date fixe

- **Erreur** : la dette d'un locataire ayant des arriérés de reprise était
  **gelée**. Elle n'augmentait pas avec le temps, quel que soit le nombre de mois
  non payés qui s'écoulaient.
- **Preuve** : deux locataires identiques (loyer 100 000, `mois_arrieres` = 6),
  aucun versement, l'un entré en 2022 et l'autre en 2024 — donc 24 mois d'impayés
  d'écart. Tous deux devaient exactement **600 000**.
- **Cause** : le crédit implicite valait `mois_écoulés_jusqu'à_AUJOURD'HUI −
  mois_arrieres`. Chaque mois qui passait ajoutait un mois au crédit en même
  temps qu'un mois de loyer dû : la fenêtre des impayés glissait indéfiniment et
  gardait exactement `mois_arrieres` mois. Le compteur tournait à vide.
- **Portée** : tout locataire avec `mois_arrieres > 0`. Les mauvais payeurs — les
  seuls qui comptent pour du recouvrement — étaient précisément ceux dont la
  dette était sous-évaluée, et l'écart se creusait chaque mois.
- **Solution** : nouveau modèle comptable ancré à une date.
  - `suivi_depuis` (DATE) : premier mois réellement suivi dans ImmoGest ;
  - `solde_reporte` (NUMERIC) : à-nouveau, ce qui restait dû à cette date.
  Les mois antérieurs sortent du suivi une fois pour toutes (statut « Antérieur
  au suivi »), et la dette s'accumule normalement à partir de `suivi_depuis`.
- **Migration sans perte** : V024 fige la frontière exactement là où le calcul
  glissant la plaçait le jour de la migration
  (`suivi_depuis = début du mois courant − (mois_arrieres − 1) mois`, jamais
  avant l'entrée), et met `solde_reporte` à 0 — l'ancien modèle exprimait la
  dette de reprise en mois entiers.
  Vérifié sur 4 profils : montants et mois de retard **identiques** avant/après.
  Après migration, 30 mois d'impayés donnent bien 3 000 000 au lieu de 600 000.
- **Compatibilité** : tant que `suivi_depuis` est absent, l'ancien calcul
  s'applique — l'app fonctionne avant comme après l'exécution du SQL.
- **`arrieres` / `mois_arrieres`** : conservés en base comme archive de la saisie
  d'origine, plus lus par aucun calcul et retirés du formulaire.
- **À retenir** : une dette est un fait daté. La calculer par rapport à
  « aujourd'hui » la rend mouvante — ici, immobile.

---

## 2026-08-11 — Saisie des arriérés : on saisit des MOIS, pas une date

### `js/locataires.js` — ergonomie de la reprise d'un locataire ancien

- **Retour utilisateur** : « un locataire chez nous depuis 10 ans, je ne vais pas
  enregistrer tous ses versements. Je réglais ça en saisissant le nombre de mois
  qu'il devait. »
- **Le modèle V024 répondait déjà au fond du problème** — les mois avant
  `suivi_depuis` sortent du calcul, aucun historique n'est à ressaisir — mais le
  formulaire demandait une DATE, ce qui obligeait à un calcul mental
  (16 mois en arrière depuis aujourd'hui = mai 2025).
- **Solution** : le champ de saisie redevient « Mois dus aujourd'hui ». L'app en
  déduit `suivi_depuis` et affiche le mois obtenu en clair (« Comptabilisé depuis
  mai 2025 »). Le champ date reste accessible en petit à côté pour corriger au
  besoin, et les deux se synchronisent dans les deux sens.
- **Convention** : 0 mois dû = à jour, mois en cours compris → le suivi démarre
  le mois SUIVANT. 1 mois dû = le mois en cours est impayé. Sans cette règle,
  saisir 0 facturait quand même le mois courant.
- **Différence avec l'ancien `mois_arrieres`** : la saisie est identique, mais
  elle est convertie UNE FOIS en date fixe. Avant, le nombre restait vivant et la
  fenêtre glissait, gelant la dette à jamais (voir la fiche V024 ci-dessus).
- **Vérifié** sur un locataire entré en 2016, sans aucun versement enregistré :
  0 → 0 FCFA · 1 → 150 000 · 3 → 450 000 · 16 → 2 400 000.

---

## 2026-08-11 — Le total affiché sous les champs ne suivait pas la saisie

### `js/locataires.js` — « Dette réelle aujourd'hui » figée et trompeuse

- **Erreur** : la ligne « Dette réelle aujourd'hui », placée juste sous les champs
  de reprise, affichait la dette du locataire TEL QU'ENREGISTRÉ et ne bougeait pas
  quand on modifiait les champs au-dessus. Sur FONTEM Vanessa : champs à
  7 mois + 2 550 000 de solde reporté, total affiché 1 640 000 — trois nombres
  sans rapport les uns avec les autres, dans le même encadré.
- **Conséquence** : impossible de voir qu'on est en train de saisir 4 160 000, et
  donc impossible de repérer le double comptage.
- **Piège de fond** : `mois dus` et `solde reporté` s'ADDITIONNENT. Saisir le
  montant total des arriérés dans « solde reporté » tout en gardant des mois dus
  compte la dette deux fois. Rien ne le signalait.
- **Solution** :
  - le total se recalcule à chaque frappe (mois, solde reporté, loyer) ;
  - il détaille son calcul quand les deux champs sont remplis
    (« 3 × 230 000 + 45 000 reporté ») ;
  - un avertissement apparaît dès que le solde reporté dépasse un mois de loyer —
    ce n'est alors plus un reliquat, c'est presque toujours le total des arriérés
    saisi au mauvais endroit ;
  - la dette enregistrée reste affichée, mais en second et clairement nommée
    « Dette actuelle enregistrée (versements déduits) ».
- **À retenir** : un total posé sous un formulaire est lu comme le résultat de ce
  formulaire. S'il vient d'ailleurs, il ment — soit il suit la saisie, soit il
  dit d'où il vient.

---

## 2026-08-11 — CAUSE RACINE : les vieux versements soldaient les mois récents

### `js/paiements.js` — versements antérieurs au début du suivi

- **Erreur** : un locataire déclaré à **16 mois dus, sans aucun versement depuis**,
  s'affichait **à jour, 0 FCFA**. Cas FONTEM Vanessa.
- **Cause** : la répartition FIFO consommait TOUS les versements du locataire,
  y compris ceux encaissés bien avant `suivi_depuis`. Les mois antérieurs étant
  déjà couverts par le crédit d'ouverture, ces vieux versements ne trouvaient
  rien à régler et retombaient sur les mois suivis. Vérifié : un versement du
  **05/10/2023** apparaissait comme soldant **mai 2025**.
- **Pourquoi c'était invisible** : le montant obtenu (1 640 000 sur la fiche de
  Vanessa) ressemblait à un chiffre plausible. C'était en réalité 3 680 000 moins
  2 040 000 de versements des années précédentes, déjà consommés hors ImmoGest.
- **Solution** : les versements dont la `date_paiement` précède `suivi_depuis`
  sortent de la répartition. Ils appartiennent à la période close — celle que le
  cabinet ne suit pas et n'atteste pas. Ils restent visibles dans l'onglet
  Encaissements, mais ne réduisent plus la dette suivie.
- **Vérifié** : 16 mois dus sans versement récent → 3 680 000 et 16 mois ;
  après 2 versements postérieurs à `suivi_depuis` → 3 220 000 et 14 mois ;
  locataire sans `suivi_depuis` → inchangé ; locataire suivi depuis son entrée
  et à jour → 0.
- **À retenir** : poser une frontière de suivi ne suffit pas, il faut l'appliquer
  des DEUX côtés — aux mois **et** à l'argent. Ne filtrer que les mois laissait
  l'argent d'avant traverser la frontière et fausser tout ce qui suit.

---

## 2026-08-12 — Audit général du moteur de calcul

### `js/paiements.js` — collision dans le cache de la fiche

- **Erreur** : la clé du cache de `calculerFiche()` ne retenait que le NOMBRE de
  versements. Deux jeux différents de même longueur pour le même locataire se
  confondaient : une caution seule renvoyait la fiche calculée juste avant pour
  une avance seule, un versement partiel renvoyait celle d'un mois soldé.
- **Découvert par** : l'audit — trois tests échouaient en renvoyant 0 au lieu du
  montant dû. Le premier diagnostic (« la caution solde un loyer ») était faux :
  la cause était le cache, pas la répartition.
- **Risque en production** : corriger le montant d'un versement sans changer leur
  nombre, ou appeler `montantDu()` avec deux sous-ensembles de même taille
  (période filtrée vs historique complet, ce que font les rapports), renvoyait un
  résultat périmé.
- **Solution** : empreinte du contenu (nombre + somme des montants + hachage des
  id/dates/types) au lieu de la seule longueur.

### `js/legal.js` — score de fiabilité gonflé

- Les mois antérieurs à la reprise du dossier comptaient comme « payés » dans le
  score. Ils sortent désormais du numérateur ET du dénominateur, comme dans la
  fiche de suivi.

### Résultats de l'audit

- **Moteur** : 14/14 après correction — locataire neuf, tout payé, mois partiel,
  avance sur 12 mois, reprise avec et sans vieux versements, solde reporté,
  caution, locataire libéré, loyer à 0, collision de cache, ordre de saisie
  indifférent, entrée en cours de mois, montant en chaîne de caractères.
- **Cohérence inter-écrans** vérifiée sur 4 locataires : liste, fiche de suivi,
  onglet encaissements, rapport mensuel, rapport annuel et dashboard annoncent
  tous les mêmes montants (total dû 1 300 000).
- **Non-régression** : `js/_onboarding.js` a une erreur de syntaxe préexistante,
  mais n'est chargé nulle part — code mort, signalé pour suppression séparée.

---

## 2026-08-12 — Le .docx du rapport ne ressemblait plus au rapport

### `js/rapports.js` — l'export Word ne recopiait que le texte

- **Erreur** : le rapport téléchargé n'avait plus rien à voir avec celui affiché.
  Vérifié sur le fichier de Franklin (`rapport-immogest-1786622842792.docx`) :
  **zéro** attribut de couleur, **zéro** fond, **zéro** gras, **zéro** bordure
  dans `word/document.xml`. Ni en-tête cabinet, ni bandeaux de section.
- **Cause** : `exporterRapportMensuelDocx()` ne récupérait que
  `td.textContent` des tableaux et reconstruisait des cellules nues. Toute la
  mise en forme de l'écran était jetée, et les blocs hors tableau (en-tête,
  titre, bandeaux, signatures, pied) n'étaient pas exportés du tout.
- **Solution** : l'exporteur relit les **styles inline** du HTML généré et les
  transpose en propriétés Word — couleur de texte, fond de cellule, gras,
  italique, taille, alignement, largeurs de colonnes issues du `<colgroup>`,
  bordures fines. Il parcourt les blocs de premier niveau dans l'ordre du
  document, si bien que le Word reprend l'enchaînement exact de l'écran.
- **Pourquoi relire les styles plutôt que redéfinir la charte ici** : la mise en
  forme n'existe qu'à un seul endroit. Toute évolution de l'écran suit
  automatiquement dans le Word, sans risque de divergence.
- **Piège traité** : un bloc imbriqué (titre + sous-titre, lignes de l'en-tête)
  doit ouvrir sa propre ligne, sinon Word colle les textes
  (« …TEUKEU MAKEPEMakepe · du 31/07/2026 »). Les balises de bloc déclenchent
  donc un saut de ligne, comme `<br>`.
- **Vérifié** sur le fichier produit : couleurs `0E6AAF`, `1A6B45`, `C0392B`,
  `333333`, `666666` présentes ; fonds `0E6AAF`, `D6E9F6`, `EEF6FC`, `F5F5F5` ;
  39 passages en gras ; 4 tableaux avec bordures ; enchaînement en-tête → titre
  → bandeau → tableau → bandeau → tableau + récapitulatif → signatures → pied.
