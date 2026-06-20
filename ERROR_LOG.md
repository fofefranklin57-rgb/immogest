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
