# FEATURE BACKLOG — ImmoGest v2

Légende : ✅ Terminé | 🔄 En cours | 📋 Planifié | ❌ Annulé

---

## PHASE 1 — Core locatif ✅
- ✅ Authentification (inscription, connexion, session)
- ✅ Gestion immeubles (CRUD + formulaire)
- ✅ Gestion locataires (CRUD + libération)
- ✅ Enregistrement paiements
- ✅ Dashboard métriques (loyers encaissés, impayés, taux occupation)
- ✅ Fiche de suivi locataire (impression)
- ✅ Reçu de paiement (impression)
- ✅ Rapport mensuel (impression)
- ✅ Rapport annuel (impression)
- ✅ Relances automatiques (cron Worker)
- ✅ Plans tarifaires (gratuit/trial/starter/pro/cabinet)
- ✅ Corbeille (suppression douce 30j)

## PHASE 2 — Légal + Marketplace + Offline ✅
- ✅ LegalOS — documents juridiques (bail, mise en demeure, etc.)
- ✅ Marketplace multi-pays (annonces, filtres, catégories)
- ✅ Offline-first (Service Worker cache-first)
- ✅ Signature électronique
- ✅ Portail locataire (Mon espace)
- ✅ Portail bailleur
- ✅ Leads marketplace
- ✅ Publication automatique annonce à libération locale
- ✅ Code promo

## PHASE 3 — i18n + UX + Performances ✅ (juin 2026)
- ✅ 12 langues (fr/en/pt/es/ha/ar/sw/zh/hi/id/yo/ln/am)
- ✅ Scripts defer (performance démarrage)
- ✅ Rapport annuel V1 complet
- ✅ Fiche de suivi V1 améliorée
- ✅ Aperçu avant impression (fiche, reçu, rapport mensuel)
- ✅ Audit champs DB (correction session.tel, session.ville, loc.entree)
- ✅ Badges auth screen (Droit OHADA, Hors-ligne, Documents juridiques)

## PHASE 4 — Invitations + Photos + 360° 🔄 (en cours juin 2026)
- ✅ Upload photos marketplace (max 5, 5Mo, JPG/PNG/WEBP)
- ✅ Visite virtuelle 360° (Pannellum, photo équirectangulaire)
- ✅ Invitation automatique locataire à la création (code + WhatsApp)
- ✅ Invitation automatique bailleur à la création immeuble (code + WhatsApp)
- ✅ Rôle coordinateur ajouté
- ✅ Rôle bailleur ajouté
- ✅ Descriptions droits dans formulaire invitation collaborateurs
- ✅ Mois/année paiement auto-calculés depuis date
- 📋 Worker: support locataire_id + immeuble_id dans /generate-invite
- 📋 Worker: support rôles coordinateur + bailleur dans /join
- ✅ Migration V009: champs arrieres + mois_arrieres dans locataires
- ✅ Migration V010: champ photo_360 dans marketplace_annonces + email dans users_app

## PHASE 5 — Documents & Impression 📋
- 📋 Fiche de suivi V2 — révision complète selon spec (à définir dans APP_SPEC.md)
- 📋 Rapport annuel V2 — révision selon spec
- 📋 Rapport mensuel V2 — révision selon spec
- 📋 Reçu de paiement V2 — révision selon spec
- 📋 État des lieux (entrée + sortie)
- 📋 Aperçu avant impression — rapport annuel

## PHASE 6 — Paiements & Mobile Money 📋
- ✅ Fapshi (Mobile Money Cameroun) — retenu comme plateforme principale
- ❌ CamPay — abandonné (Fapshi suffit)
- ❌ NotchPay — abandonné (Fapshi suffit)
- 📋 Fapshi — passer en mode production (vérifier clés prod)
- 📋 Plateforme internationale (Stripe / Paddle / Lemonsqueezy) — à choisir
- 📋 Paiement abonnement in-app
- 📋 Reçu de paiement Mobile Money automatique

## PHASE 7 — Marketplace avancée 📋
- 📋 Enchères immobilières
- 📋 Annonces premium (boost, mise en avant)
- 📋 Partage réseaux sociaux (FB, IG, WhatsApp)
- 📋 SEO marketplace (pages statiques indexables)
- 📋 Notifications leads en temps réel

## PHASE 8 — App mobile 📋
- 📋 APK Android (Capacitor)
- 📋 Publication Play Store
- 📋 Notifications push complètes
- 📋 Mode hors-ligne complet avec sync

## PHASE 9 — IA & Automatisation 📋
- 📋 Assistant IA contextuel (analyse locataire, suggestion loyer)
- 📋 Détection automatique impayés
- 📋 Génération automatique relances WhatsApp
- 📋 Score locataire automatisé

## PHASE 10 — Multi-pays & Scale 📋
- 📋 Maroc, Tunisie, France, Belgique
- 📋 Conversion devises temps réel
- 📋 Contrats adaptés par pays (droit local)
- 📋 Tableau de bord propriétaire multi-pays
