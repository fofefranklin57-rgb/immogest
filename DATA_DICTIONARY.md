# DATA DICTIONARY — ImmoGest v2

## SESSION (localStorage `ig_session_v2`)
```
session.userId       TEXT    ID utilisateur connecté
session.tenantId     UUID    ID du cabinet/tenant
session.role         TEXT    'admin'|'coordinateur'|'gestionnaire'|'comptable'|'agent'|'bailleur'|'locataire'
session.type_profil  TEXT    'proprietaire'|'gestionnaire'|'cabinet'
session.nom          TEXT    Prénom + nom de l'utilisateur
session.telephone    TEXT    Téléphone (JAMAIS session.tel)
session.nomCabinet   TEXT    Nom du cabinet
session.plan         TEXT    'gratuit'|'trial'|'starter'|'pro'|'cabinet'
session.plan_expire  TEXT    Date ISO expiration du plan (null si pas de limite)
session.locale       OBJECT  { pays, devise, timezone }
session.loginAt      NUMBER  Timestamp de connexion
```
**⚠️ N'EXISTENT PAS** : session.ville, session.email, session.tel, session.signataire

---

## TABLE: tenants
| Champ | Type | Description |
|---|---|---|
| id | UUID PK | Identifiant unique du cabinet |
| nom | TEXT | Nom du fondateur |
| telephone | TEXT UNIQUE | Téléphone (identifiant de connexion) |
| password_hash | TEXT | Hash SHA-256 du mot de passe |
| nom_cabinet | TEXT | Nom du cabinet immobilier |
| mode | TEXT | 'entreprise' (défaut) |
| plan | TEXT | 'gratuit'|'trial'|'starter'|'pro'|'cabinet' |
| plan_expire | TIMESTAMPTZ | Date expiration plan |
| pays | TEXT | Code pays ISO (défaut 'CM') |
| features | JSONB | `{legalos, marketplace, ia}` |
| created_at | TIMESTAMPTZ | Date création |

---

## TABLE: immeubles
| Champ | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Identifiant immeuble |
| tenant_id | UUID FK | Référence tenant |
| nom_immeuble | TEXT | Nom principal de l'immeuble (**utiliser nom_immeuble**) |
| nom | TEXT | Alias de nom_immeuble (compatibilité) |
| nom_proprio | TEXT | Nom du propriétaire/bailleur |
| tel_proprio | TEXT | Téléphone du propriétaire |
| ville | TEXT | Ville (**PAS session.ville**) |
| quartier | TEXT | Quartier/arrondissement |
| adresse | TEXT | Adresse complète |
| pays | TEXT | Code pays ISO |
| apparts | INTEGER | Nombre d'appartements |
| studios | INTEGER | Nombre de studios |
| chambres | INTEGER | Nombre de chambres |
| duplex | INTEGER | Nombre de duplex |
| couleur | TEXT | Couleur HEX pour l'affichage carte |
| type_honoraires | TEXT | 'aucun'|'pourcentage'|'forfait' |
| valeur_honoraires | NUMERIC | Valeur honoraires (% ou FCFA fixe) |
| bailleur_id | TEXT | ID user bailleur lié |
| created_at | TIMESTAMPTZ | Date création |

**Règle** : `type_honoraires` et `valeur_honoraires` ne s'affichent PAS si `session.type_profil === 'proprietaire'`

---

## TABLE: locataires
| Champ | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Identifiant locataire |
| tenant_id | UUID FK | Référence tenant |
| immeuble_id | BIGINT FK | Référence immeuble |
| nom | TEXT | Nom complet du locataire |
| telephone | TEXT | Téléphone |
| whatsapp | TEXT | Numéro WhatsApp (peut différer) |
| appt | TEXT | Numéro/nom du local (ex: A2, Studio 3) |
| type_local | TEXT | 'appartement'|'studio'|'chambre'|'duplex'|'bureau'|'commerce' |
| loyer | NUMERIC | Loyer mensuel en FCFA |
| caution | NUMERIC | Caution versée |
| entree | DATE | Date d'entrée (**PAS date_entree**) |
| statut | TEXT | 'actif'|'libre' |
| statut_juridique | TEXT | 'normal'|'avertissement'|'contentieux' |
| arrieres | NUMERIC | Arriérés en FCFA (**dans migration V009**) |
| mois_arrieres | INTEGER | Nombre de mois d'arriérés (**dans migration V009**) |
| observations | TEXT | Notes libres |
| score_locataire | INTEGER | Score /100 (100 = parfait) |
| created_at | TIMESTAMPTZ | Date création |

---

## TABLE: paiements
| Champ | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Identifiant paiement |
| tenant_id | UUID FK | Référence tenant |
| locataire_id | BIGINT FK | Référence locataire |
| montant | NUMERIC | Montant encaissé en FCFA |
| mois | INTEGER | Mois comptable (1-12) — AUTO-calculé depuis date_paiement |
| annee | INTEGER | Année comptable — AUTO-calculé depuis date_paiement |
| date_paiement | DATE | Date réelle du paiement |
| mode_paiement | TEXT | 'espèces'|'virement'|'mobile money'|'chèque' |
| type | TEXT | 'loyer'|'avance'|'caution'|'charge' |
| reference | TEXT | Référence transaction Mobile Money |
| remisAuBailleur | BOOLEAN | True si loyer remis directement au bailleur (**majuscule A et B**) |
| note | TEXT | Note libre |
| created_at | TIMESTAMPTZ | Date enregistrement |

**Règle** : `remisAuBailleur` ne s'affiche PAS si `session.type_profil === 'proprietaire'`

---

## TABLE: archives
| Champ | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Identifiant archive |
| tenant_id | UUID FK | Référence tenant |
| locataire_id | BIGINT | ID locataire (référence souple) |
| nom | TEXT | Nom du locataire archivé |
| telephone | TEXT | Téléphone |
| immeuble_nom | TEXT | Nom immeuble à la date de sortie |
| local_num | TEXT | Numéro local |
| loyer | NUMERIC | Loyer au départ |
| date_entree | DATE | Date d'entrée initiale |
| date_sortie | DATE | Date de départ |
| motif | TEXT | 'depart_volontaire'|'expulsion'|'fin_bail'|'deces' |
| nb_retards | INTEGER | Nombre de retards de paiement |
| nb_impayes | INTEGER | Nombre de mois impayés |
| montant_impaye | NUMERIC | Total impayés en FCFA |
| score | INTEGER | Score final /100 |

---

## TABLE: marketplace_annonces
| Champ | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Identifiant annonce |
| tenant_id | UUID FK | Référence tenant |
| immeuble_id | BIGINT | Référence immeuble source |
| titre | TEXT | Titre de l'annonce |
| description | TEXT | Description du bien |
| loyer | NUMERIC | Prix mensuel ou prix de vente |
| ville | TEXT | Ville |
| quartier | TEXT | Quartier |
| pays | TEXT | Code pays ISO |
| devise | TEXT | Code devise ISO |
| categorie | TEXT | 'location_residentielle'|'location_commerciale'|'bureau'|'colocation'|'location_saisonniere'|'vente'|'luxe'|'professionnel' |
| photos | JSONB | Tableau d'URLs photos (max 5, JPG/PNG/WEBP, 5Mo max) |
| photo_360 | TEXT | URL photo équirectangulaire 360° (JPG/PNG, 20Mo max) |
| statut | TEXT | 'pending'|'active'|'inactive'|'vendu'|'loue' |
| premium | BOOLEAN | Annonce premium |
| premium_niveau | INTEGER | 0-5 |
| vues | INTEGER | Compteur de vues |
| contacts | INTEGER | Compteur de contacts |
| created_at | TIMESTAMPTZ | Date publication |

---

## TABLE: invite_codes
| Champ | Type | Description |
|---|---|---|
| id | UUID PK | Identifiant code |
| tenant_id | UUID FK | Référence tenant |
| code | TEXT UNIQUE | Code à 6 caractères |
| role | TEXT | Rôle attribué à l'inscription |
| locataire_id | BIGINT | Lié à un locataire (si role=locataire) |
| immeuble_id | BIGINT | Lié à un immeuble (si role=bailleur) |
| immeubles | JSONB | Liste immeubles assignés (collaborateurs) |
| used | BOOLEAN | Code utilisé ou non |
| expire_at | TIMESTAMPTZ | Expiration (7j locataire/bailleur, 48h collaborateurs) |

---

## TABLE: declarations
Déclarations de paiement faites par les locataires (à valider par le gestionnaire)
| Champ | Type | Description |
|---|---|---|
| id | UUID PK | Identifiant |
| locataire_id | TEXT | ID du locataire déclarant |
| montant | NUMERIC | Montant déclaré |
| mois_c | INTEGER | Mois concerné |
| annee_c | INTEGER | Année concernée |
| mode | TEXT | Mode de paiement |
| statut | TEXT | 'pending'|'validated'|'rejected' |

---

## TABLE: parametres
Paramètres par tenant
| Champ | Type | Description |
|---|---|---|
| tenant_id | UUID FK | Référence tenant (unique) |
| devise | TEXT | Devise affichage |
| langue | TEXT | Langue interface |
| jour_relance | INTEGER | Jour du mois pour relances auto |
| settings | JSONB | `{mode_publication: 'manuel'|'auto'|'proprio'}` |

---

## PLANS — limites
| Plan | Immeubles | Locataires | Utilisateurs | Prix |
|---|---|---|---|---|
| gratuit | 1 | 10 | 1 | 0 |
| trial | illimité | illimité | illimité | 0 (30j) |
| starter | 10 | 300 | 5 | 10 000 FCFA/mois |
| pro | 50 | illimité | 15 | 15 000 FCFA/mois |
| cabinet | illimité | illimité | illimité | 30 000 FCFA/mois |
