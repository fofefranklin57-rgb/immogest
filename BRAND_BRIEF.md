# BRAND BRIEF — ImmoGest v2

## Vision
ImmoGest est la première plateforme de gestion immobilière intelligente conçue pour l'Afrique. Elle permet à tout gestionnaire immobilier, cabinet ou propriétaire de gérer ses biens, locataires, paiements et documents légaux depuis un seul outil — offline-first, mobile-first, multi-langues.

## Mission
Digitaliser la gestion immobilière africaine en rendant accessibles des outils professionnels qui fonctionnent même sans connexion stable, en zone rurale comme en ville.

## Valeurs
- **Simplicité** — chaque action en 3 clics maximum
- **Fiabilité** — fonctionne hors ligne, données jamais perdues
- **Légalité** — documents conformes au droit OHADA
- **Accessibilité** — 12 langues, Mobile Money, SMS

---

## Identité visuelle

### Couleurs
| Rôle | Valeur | Usage |
|---|---|---|
| Accent principal | `#0E6AAF` | Boutons, liens, badges actifs |
| Vert succès | `#0E7A45` | Paiements reçus, statuts OK |
| Rouge danger | `#B93020` | Erreurs, impayés, alertes |
| Violet premium | `#7B2FBE` | Plan Cabinet, premium |
| Fond sombre | `#0A1628` | Écran de connexion |
| Fond app | `var(--bg)` | Fond principal (adaptatif dark/light) |

### Typographie
- Police principale : système (sans-serif natif)
- Taille corps : 13px
- Taille labels : 11-12px uppercase, letter-spacing 0.4px
- Taille titres : 15-17px, font-weight 600-700

### Composants UI
- Bordures : `1px solid var(--border2)` sur inputs, `1px solid var(--border)` sur cartes
- Border-radius : 8px inputs, 10-12px cartes, 99px badges
- Ombres : `var(--shadow)` cartes normales, `var(--shadow-md)` cartes au survol
- Modals : max-width 480-560px, centrés, fond `var(--bg2)`

### Badges plan
| Plan | Couleur |
|---|---|
| Gratuit | `#888` |
| Starter | `#0E6AAF` |
| Pro | `#0E7A45` |
| Cabinet | `#7B2FBE` |

---

## Utilisateurs cibles

### 1. Admin / Fondateur cabinet (type_profil: cabinet)
- Propriétaire du cabinet immobilier
- Gère plusieurs immeubles pour le compte de bailleurs
- A besoin : rapports financiers, honoraires, documents légaux, gestion équipe
- Contexte : bureau, ordinateur ou smartphone Android

### 2. Coordinateur (role: coordinateur)
- Bras droit de l'admin, coordonne les collaborateurs
- Gère les immeubles qui lui sont assignés
- Peut inviter des gestionnaires, agents, comptables
- Ne peut pas inviter d'autres coordinateurs (rôle admin seulement)

### 3. Gestionnaire (role: gestionnaire)
- Gère ses immeubles assignés
- Enregistre locataires, paiements, génère documents
- Ne peut pas inviter de collaborateurs

### 4. Comptable (role: comptable)
- Accès paiements et rapports uniquement
- Pas d'accès modification locataires/immeubles

### 5. Agent (role: agent)
- Accès marketplace + consultation locataires
- Pas de modification ni rapports financiers

### 6. Bailleur / Propriétaire (role: bailleur)
- Propriétaire de l'immeuble confié au cabinet
- Voit SES immeubles, locataires, paiements, rapports
- NE modifie rien — lecture seule
- Code invitation généré automatiquement à la création de l'immeuble

### 7. Locataire (role: locataire)
- Occupe un local enregistré dans la base
- Voit son espace : loyer, paiements, reçus, solde
- Peut déclarer un paiement (à valider par le gestionnaire)
- Code invitation généré automatiquement à la création du locataire

---

## Marchés
| Pays | Devise | Statut |
|---|---|---|
| Cameroun | FCFA (XAF) | Principal |
| Sénégal | FCFA (XOF) | Actif |
| Côte d'Ivoire | FCFA (XOF) | Actif |
| Gabon | FCFA (XAF) | Actif |
| Maroc | MAD | Prévu |
| Tunisie | TND | Prévu |
| France | EUR | Prévu |
| Belgique | EUR | Prévu |

## Langues supportées
fr, en, pt, es, ha, ar, sw, zh, hi, id, yo, ln, am (13 langues)

---

## Positionnement
**Tagline** : *Gestion immobilière intelligente*

ImmoGest n'est pas un simple tableur en ligne. C'est un outil complet avec :
- Gestion locative (immeubles, locataires, paiements)
- Documents légaux (baux, contrats, mises en demeure)
- Marketplace immobilière multi-pays
- Portail locataire & bailleur
- Assistant IA
- Notifications automatiques (WhatsApp, SMS, Push)
- Visite virtuelle 360°
- Signature électronique
