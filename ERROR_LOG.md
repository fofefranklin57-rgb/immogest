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
