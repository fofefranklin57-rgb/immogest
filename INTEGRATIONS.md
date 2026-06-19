# INTEGRATIONS — ImmoGest v2

## 1. Supabase (Base de données + Storage)
- **URL** : `https://uggxfmwpttfsfcirmeqx.supabase.co`
- **Anon key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ3hmbXdwdHRmc2ZjaXJtZXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTA4MjIsImV4cCI6MjA5NDYyNjgyMn0.l8iYlJHOt6evNlBQ3zRskZasn_J2BjAUs1l2vKOZNvY`
- **Storage bucket** : `marketplace` (doit être Public)
- **Accès DB** : via Cloudflare Worker `/db` (jamais directement depuis le client sauf Storage)
- **Statut** : ✅ Actif — 27 tables V2

## 2. Cloudflare Worker
- **Nom** : `immogest1`
- **URL** : `https://immogest1.fofefranklin57.workers.dev`
- **Fichier** : `workers/notif-cron.js`
- **Config** : `wrangler.toml`
- **Endpoints principaux** :
  - `POST /register` — inscription tenant
  - `POST /login-tenant` — connexion admin
  - `POST /login-user` — connexion collaborateur
  - `POST /join` — rejoindre avec code invitation
  - `POST /generate-invite` — générer code invitation (params: tenantId, role, locataire_id?, immeuble_id?)
  - `POST /db` — toutes les opérations CRUD
  - `POST /annonce-auto` — publication automatique annonce
  - `POST /apply-promo` — appliquer code promo
  - `POST /leads-gestionnaire` — leads marketplace
- **Crons** :
  - `0 7 * * *` — relances quotidiennes (8h Cameroun)
  - `0 7 1 * *` — rappel loyer mensuel (1er du mois)
- **Statut** : ✅ Actif

## 3. Cloudflare Pages
- **Repo** : `https://github.com/fofefranklin57-rgb/immogest`
- **Branche déployée** : `main`
- **URL prod** : `https://immogest-34w.pages.dev`
- **Deploy** : automatique sur push GitHub
- **Statut** : ✅ Actif

## 4. GitHub
- **Repo** : `fofefranklin57-rgb/immogest`
- **Token** : stocké dans l'URL remote git (ne jamais le committer en clair)
- **Branche principale** : `main`
- **Statut** : ✅ Actif

## 5. OneSignal (Push notifications)
- **App ID** : `8a3857ab-64cc-4a62-9916-ce46b4768dac`
- **REST Key** : dans wrangler.toml vars
- **SDK Worker** : `OneSignalSDKWorker.js` (racine)
- **Usage** : notifications push relances loyer, confirmations paiement
- **Statut** : ✅ Configuré

## 6. CamPay (Mobile Money Cameroun)
- **Env** : `demo` (pas encore en production)
- **API Key** : `FAK_cbc4bca6ea0ddf6e23d57ab438b93a4a`
- **User** : `fofefranklin57@gmail.com`
- **Base URL** : `https://live.fapshi.com`
- **Statut** : ⚠️ En test (mode demo)

## 7. NotchPay (Paiement alternatif)
- **Clé publique** : dans wrangler secrets (`NOTCHPAY_PK`)
- **Usage** : paiement abonnements ImmoGest
- **Statut** : ⚠️ Configuré, non testé en prod

## 8. Anthropic Claude (Assistant IA)
- **Modèle** : claude-sonnet-4-6 (ou dernier disponible)
- **Clé** : dans wrangler secrets (`ANTHROPIC_API_KEY`)
- **Usage** : assistant IA intégré dans l'app
- **Statut** : ✅ Actif

## 9. Pannellum (Visite virtuelle 360°)
- **CDN** : `https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/`
- **Usage** : affichage photo équirectangulaire dans fiches annonces
- **Type photo accepté** : JPG/PNG, format équirectangulaire, max 20 Mo
- **Statut** : ✅ Intégré

## 10. Adsterra (Publicité)
- **Type** : bannière fixe en bas (50px max)
- **ID slot** : `ig-fixed-ad`
- **Restriction** : max-height 96px forcé via CSS
- **Statut** : ✅ Actif

## 11. Fapshi (Paiement)
- **API Key** : `FAK_cbc4bca6ea0ddf6e23d57ab438b93a4a`
- **Statut** : ⚠️ En test

## Variables d'environnement Worker (wrangler.toml)
```toml
ONESIGNAL_APP_ID   = "8a3857ab-64cc-4a62-9916-ce46b4768dac"
SUPABASE_URL       = "https://uggxfmwpttfsfcirmeqx.supabase.co"
SUPABASE_KEY       = "eyJ..." (anon key)
CAMPAY_ENV         = "demo"
```

## Secrets Worker (à injecter via `wrangler secret put`)
```
SUPABASE_SERVICE_KEY  — clé service_role Supabase
CAMPAY_TOKEN          — token CamPay permanent
CAMPAY_WEBHOOK_KEY    — webhook CamPay
NOTCHPAY_PK           — clé publique NotchPay
ANTHROPIC_API_KEY     — clé Claude
ONESIGNAL_REST_KEY    — REST key OneSignal
```
