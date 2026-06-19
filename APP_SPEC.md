# APP SPEC — ImmoGest v2

## Architecture générale
- SPA Vanilla JS — pas de framework
- Fichier principal : `index.html` → charge tous les modules JS avec `defer`
- Navigation : sidebar gauche, contenu dans `#page-content`
- Modals : via `window.IG.utils.showModal(html, {width})`
- Toast : via `window.IG.utils.showToast(message, 'green'|'red'|'orange')`

---

## F1 — Écran de connexion / inscription

### Étapes
1. **Home** — logo + boutons "Se connecter" / "Créer un compte" / "Rejoindre un espace"
2. **Login** — téléphone + mot de passe
3. **Register** — nom + cabinet (optionnel) + téléphone + mot de passe
4. **Join** — code d'invitation + nom + mot de passe

### Badges branding (panneau gauche)
✅ Droit OHADA | 📶 Hors-ligne | 💳 Mobile Money | 📋 Documents juridiques | ✍️ Signature électronique | 🤖 Assistant IA

### Fichier : `js/app.js` → `_renderLogin()` lignes ~1518-1657

---

## F2 — Formulaire immeuble

### Champs
- `nom_immeuble` (requis) — Nom de l'immeuble
- `nom_proprio` — Propriétaire
- `tel_proprio` — Téléphone propriétaire
- `ville` | `quartier` (grid 2 colonnes)
- `apparts` | `studios` | `chambres` | `duplex` (grid 4 colonnes)
- `couleur` — color picker
- `type_honoraires` | `valeur_honoraires` — **masqué si proprietaire**

### Comportement création
- Si `nom_proprio` ET `tel_proprio` renseignés → génère code invitation bailleur automatiquement
- Modal post-save avec bouton WhatsApp pour envoyer le code au proprio

### Fichier : `js/immeubles.js` → `afficherFormulaire()`

---

## F3 — Formulaire locataire

### Champs
- `nom` (requis) — Nom complet
- `telephone` | `whatsapp` (grid 2)
- `immeuble_id` (select)
- `appt` | `type_local` (grid 2)
- `loyer` | `caution` (grid 2)
- `entree` (date) — **PAS date_entree**
- `arrieres` | `mois_arrieres` (grid 2)
- `observations` (textarea)

### Mode édition
- Affiche bouton "Libérer" (bordure rouge) en bas à gauche

### Comportement création
- Après sauvegarde → génère code invitation locataire automatiquement
- Modal avec : code + immeuble + local + loyer + bouton WhatsApp

### Fichier : `js/locataires.js` → `afficherFormulaire()`

---

## F4 — Formulaire paiement

### Champs
- `montant` | `date_paiement` (grid 2)
- `mois` | `annee` (grid 2) — **auto-calculés depuis date_paiement**
- `mode_paiement` (select : espèces / virement / mobile money / chèque)
- `type` (select : loyer / avance / caution / charge)
- `note` (texte libre)
- `remisAuBailleur` (checkbox) — **masqué si proprietaire**

### Fichier : `js/paiements.js` → `afficherFormulaire()`

---

## F5 — Formulaire annonce marketplace

### Champs
- `titre` (requis)
- `categorie` | `loyer` (grid 2)
- `ville` | `quartier` (grid 2)
- `description` (textarea)
- **Photos** : max 5, JPG/PNG/WEBP, 5 Mo max, prévisualisation + bouton ×
- **Photo 360°** : 1 fichier JPG/PNG, max 20 Mo, zone distincte (bordure violette)

### Comportement
- Bouton "Publier" : insert annonce → upload photos → update annonce avec URLs
- Validation client : taille + format avant upload

### Affichage annonce (voirAnnonce)
- Galerie photos horizontale scrollable
- Viewer Pannellum si `photo_360` présent (hauteur 240px)
- Prix en gros + bouton WhatsApp contact

### Fichier : `js/marketplace.js` → `afficherFormulaire()` + `voirAnnonce()`

---

## F6 — Paramètres

### Sections
1. **Mon compte** — nom, téléphone, cabinet, plan (badge coloré), date expiration
2. **Équipe & Invitations** (admin + coordinateur seulement)
   - Liste membres avec rôle + icône + bouton désactiver/réactiver
   - Bouton "+ Inviter" → formulaire invitation collaborateurs
3. **Code promotionnel** — input + bouton Appliquer
4. **Langue** — select 13 langues
5. **Publication Marketplace** — mode manuel / auto / validation proprio
6. **Bouton Se déconnecter** (rouge, bas de page)

### Formulaire invitation collaborateurs
- Select rôle : Coordinateur 🎯 / Gestionnaire 🏘️ / Comptable 📊 / Agent 🤝
- Description des droits sous le select (dynamique selon rôle)
- Bouton "Générer le code" → affiche code + bouton copier

### Fichier : `js/app.js` → `_renderParametres()` + `_genererInvitation()`

---

## D1 — Fiche de suivi locataire

### Déclencheur
Bouton "Voir fiche" dans la liste des locataires ou dans la fiche paiement

### Structure du document (ordre exact)
1. **En-tête cabinet**
   - Nom du cabinet (session.nomCabinet)
   - Téléphone cabinet (session.telephone)
   - Ville (imm.ville)
2. **Titre** : "FICHE DE SUIVI LOCATAIRE"
3. **Informations locataire**
   - Nom complet
   - Immeuble (nom_immeuble)
   - Local / Appartement (appt)
   - Date d'entrée (entree)
   - Loyer mensuel
   - Caution versée
4. **Score locataire** : XX/100
5. **Tableau des paiements** (12 derniers mois)
   - Colonnes : Mois | Année | Montant | Date | Mode | Statut
6. **Arriérés** : total en FCFA + nombre de mois
7. **Pied de page** : date impression + signature gestionnaire

### Fichier : `js/paiements.js` → `renderFiche()`

---

## D2 — Reçu de paiement

### Structure
1. En-tête cabinet (nomCabinet, telephone, ville)
2. "REÇU DE PAIEMENT" — N° référence
3. Locataire : nom, immeuble, local
4. Détail paiement : date, montant, mode, type (loyer/avance/caution)
5. Mention "Remis au bailleur" si remisAuBailleur = true (et type_profil ≠ proprietaire)
6. Signature + cachet

### Fichier : `js/paiements.js` → `renderRecu()`

---

## D3 — Rapport mensuel

### Structure
1. En-tête : cabinet, période (Mois AAAA)
2. Récapitulatif :
   - Total encaissé
   - Nombre de paiements
   - Nombre d'impayés
   - Taux de recouvrement
3. Tableau par immeuble :
   - Nom immeuble
   - Locataires actifs
   - Loyers encaissés
   - Impayés
4. Détail par locataire (tous les paiements du mois)
5. Si type_profil ≠ proprietaire : section Honoraires cabinet
6. Pied de page + signature

### Fichier : `js/rapports.js` → `renderRapportMensuel()`

---

## D4 — Rapport annuel

### Structure
1. En-tête : cabinet, année
2. Résumé annuel :
   - Total encaissé (12 mois)
   - Taux occupation moyen
   - Nombre de locataires entrés/sortis
3. Tableau mensuel (12 lignes) :
   - Mois | Encaissé | Impayés | Nb locataires | Taux
4. Top locataires (meilleurs payeurs)
5. Locataires problématiques (retards / impayés)
6. Si type_profil ≠ proprietaire : Honoraires annuels cabinet
7. Pied de page + signature

### Fichier : `js/rapports.js` → `renderRapportAnnuel()`

---

## D5 — Documents juridiques (LegalOS)

### Types disponibles
- Contrat de bail (OHADA)
- Mise en demeure
- Accord de résiliation
- État des lieux entrée
- État des lieux sortie
- Attestation de domicile
- Quittance de loyer

### Fichier : `js/juridique.js`

---

## D6 — Relances automatiques

### Déclencheur
Cron quotidien 8h (Cloudflare Worker)

### Logique
- J+5 après date d'échéance → relance douce WhatsApp
- J+15 → relance ferme
- J+30 → mise en demeure automatique

### Fichier : `js/relances.js` + `workers/notif-cron.js`

---

## Navigation sidebar

### Tous rôles (sauf locataire)
- Dashboard | Immeubles | Locataires | Paiements | Rapports | Relances | Signatures | Paramètres

### Admin + Coordinateur en plus
- Déclarations | Leads | Statistiques

### Locataire uniquement
- Mon espace (portail)

### Éléments topbar
- Chip utilisateur (nom + rôle) → clique → Paramètres
- Badge plan → clique → Upgrade si gratuit, Paramètres sinon
- Bouton menu mobile
