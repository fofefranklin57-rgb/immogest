<div align="center">

<img src="icon-192.png" alt="ImmoGest Logo" width="80" height="80" />

# ImmoGest

**Multi-tenant property management SaaS for francophone Africa**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-immogest--34w.pages.dev-0E6AAF?style=for-the-badge)](https://immogest-34w.pages.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

</div>

---

## Overview

ImmoGest is a full-stack SaaS platform that helps property management firms in Cameroon and francophone Africa digitize their operations — replacing notebooks and Excel with a structured, multi-tenant system accessible from any device.

Built and deployed solo from concept to production, ImmoGest covers the entire lifecycle of property management: lease creation, rent tracking, payment recording, arrears calculation, and professional document generation (receipts, lease agreements, payment notices).

**Live at:** [immogest-34w.pages.dev](https://immogest-34w.pages.dev)

---

## Screenshots

<div align="center">
<img src="screen1.png" width="200" alt="Login" />
<img src="screen2.png" width="200" alt="Dashboard" />
<img src="screen3.png" width="200" alt="Tenants list" />
<img src="screen4.png" width="200" alt="Tenant profile" />
</div>

<div align="center">
<img src="screen5.png" width="200" alt="Payment recording" />
<img src="screen6.png" width="200" alt="Lease document" />
<img src="screen7.png" width="200" alt="Buildings" />
<img src="screen8.png" width="200" alt="Reports" />
</div>

---

## Features

### Tenant & Lease Management
- Create and manage tenants with full profiles (contact, entry date, monthly rent, lease type)
- Track lease status: active, notice given, departed
- Automatic arrears calculation (months and amount)
- Tenant invitation system with one-tap onboarding

### Payment Tracking
- Record monthly rent payments per tenant
- Track payment status: paid, partial, unpaid
- Multi-month payment recording with automatic reconciliation
- Payments remitted to owner vs. held by agency (honoraires)

### Document Generation
- **Quittance de loyer** (official rent receipt) — PDF-ready
- **Bail de location** (lease agreement) — customizable per agency
- **Avis d'échéance** (payment notice)
- **Rapport annuel** (annual summary report)
- All documents localized in French, branded per cabinet

### Building & Portfolio Management
- Manage multiple buildings with full address and metadata
- Apartment/unit tracking per building
- Portfolio overview across all properties

### Access Control (6 roles)
| Role | Description |
|------|-------------|
| `admin` | Full access — all buildings, all tenants, all settings |
| `coordinateur` | Multi-building management |
| `gestionnaire` | Single building management |
| `comptable` | Read-only financial access |
| `agent` | Payment entry only |
| `bailleur` | Read-only access to own properties |

### Multi-tenant Architecture
- Complete data isolation between cabinets (agencies)
- Row Level Security (RLS) enforced at database level
- Each agency manages its own team, buildings, and tenants independently

### Progressive Web App (PWA)
- Installable on Android and iOS — no App Store required
- Offline-first: works without internet connection
- Service Worker with cache-first strategy for assets, network-first for API calls

### Marketplace
- Property listings visible to the public
- Photo upload with Supabase Storage
- Searchable by city, price, and type

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | Flutter 3.x (Dart) |
| **Web App** | Vanilla JavaScript SPA |
| **Backend** | Cloudflare Workers (edge serverless) |
| **Database** | PostgreSQL via Supabase |
| **Auth** | JWT — custom implementation |
| **Storage** | Supabase Storage (bucket: `marketplace`) |
| **Deployment** | Cloudflare Pages (auto CI/CD via GitHub) |
| **Offline** | Service Worker (cache-first assets, network-first API) |
| **Documents** | HTML → PDF (client-side generation) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                          │
│   Flutter App (iOS/Android)   │   Vanilla JS PWA (Web)   │
└─────────────────┬────────────────────────────┬───────────┘
                  │ HTTPS REST API              │
┌─────────────────▼────────────────────────────▼───────────┐
│              CLOUDFLARE WORKERS (Edge)                    │
│   JWT Auth · RBAC · Business Logic · Rate Limiting        │
└─────────────────────────────┬─────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────┐
│                  SUPABASE (PostgreSQL)                    │
│   Row Level Security · 27 tables · Migrations V001-V014  │
└─────────────────────────────────────────────────────────┘
```

---

## Database

27 tables covering:
- `users`, `cabinets`, `collaborateurs`
- `immeubles`, `appartements`
- `locataires`, `baux`, `paiements`
- `documents`, `marketplace_annonces`
- `notifications`, `parametres`

Schema versioned through numbered SQL migration files (`V001__*.sql` → `V014__*.sql`).

---

## Local Development

### Prerequisites
- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A Supabase project
- Flutter SDK (for mobile app)

### Backend (Cloudflare Worker)

```bash
# Clone the repository
git clone https://github.com/fofefranklin57-rgb/immogest.git
cd immogest

# Install dependencies
npm install

# Configure secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put JWT_SECRET

# Run locally
wrangler dev

# Deploy
wrangler deploy
```

### Web App

Open `index.html` directly in a browser, or serve it:

```bash
npx serve .
```

Update `API_BASE` in `app.js` to point to your Worker URL.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) |
| `JWT_SECRET` | Secret used to sign/verify JWT tokens |

---

## Deployment

The web app deploys automatically to Cloudflare Pages on every push to `main`.

```bash
git push origin main
# → Cloudflare Pages builds and deploys automatically
```

Worker backend is deployed separately:

```bash
wrangler deploy
```

---

## Project Status

- ✅ Tenant management (CRUD + invitations)
- ✅ Payment recording and arrears tracking
- ✅ Document generation (receipt, lease, notice, annual report)
- ✅ 6-role access control
- ✅ Offline-first PWA
- ✅ Property marketplace
- ✅ Multi-language support (6 languages)
- ✅ Cabinet settings & team management
- 🔄 Mobile app (Flutter) — in active development
- 🔄 In-app payment integration (Fapshi)
- 📋 Native push notifications
- 📋 Automated rent reminders by SMS/WhatsApp

---

## License

MIT © 2024 Franklin Fofe Nodem — see [LICENSE](LICENSE)

---

<div align="center">
Built with ☕ in Yaoundé, Cameroon · <a href="https://immogest-34w.pages.dev">Live Demo</a>
</div>
