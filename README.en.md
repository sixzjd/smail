<table align="center">
  <tr>
    <td style="padding-right: 12px; vertical-align: middle;"><img src="web/public/smail-icon.png" width="64" height="64" alt="smail logo"></td>
    <td style="vertical-align: middle;"><span style="font-size: 2.5em; font-weight: bold;">smail</span></td>
  </tr>
</table>

<p align="center">
  <strong>A temporary email service built on the Cloudflare stack</strong><br/>
  <sub>Fully migrated from Node.js/Express to Cloudflare Workers — global edge deployment, zero feature loss</sub>
</p>

<p align="center">
  <a href="README.md">中文</a> · <a href="README.en.md">English</a>
</p>

<p align="center">
  <strong>Project Overview:</strong>
  <ul style="list-style:none; padding:0; margin:0; display:inline-block;">
    <li>🧭 <a href="https://mail.sixzjd.sbs" target="_blank">smail (Use Online)</a></li>
  </ul>
</p>

<p align="center">
  <a href="https://mail.sixzjd.sbs" target="_blank" style="display: inline-flex; align-items: center; gap: 10px; background-color: #d9543e; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
    <span>Try It Now</span>
  </a>
</p>

<p align="center">
  <sub>No deployment needed — experience the full features directly</sub>
</p>

<p align="center">
  <a href="https://mail.sixzjd.sbs/doc"><img src="https://img.shields.io/badge/Docs-View%20Online-3b82f6" alt="Documentation" /></a>
  <img src="https://img.shields.io/badge/Frontend-Vue%203%20%2B%20Vite%207-42b883" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Hono%20on%20Workers-f38020" alt="Backend" />
  <img src="https://img.shields.io/badge/ORM-Drizzle-ffc518" alt="ORM" />
  <img src="https://img.shields.io/badge/Database-Cloudflare%20D1-f6821f" alt="Database" />
  <img src="https://img.shields.io/badge/Storage-R2%20%7C%20S3%20Compatible-f6821f" alt="Storage" />
  <img src="https://img.shields.io/badge/PWA-Supported-5A0FC8" alt="PWA" />
</p>

---

## Table of Contents

- [Introduction](#introduction)
- [Architecture Migration](#architecture-migration)
- [Technical Architecture](#technical-architecture)
- [Feature List](#feature-list)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Deployment Guide](#deployment-guide)
- [Configuration Reference](#configuration-reference)
- [Design System](#design-system)

## Introduction

smail is a temporary email service that **runs entirely on Cloudflare Edge**, providing full email sending, receiving, management, and analytics capabilities.

The project was originally built with **Node.js + Express**, using local SQLite file system storage. To achieve global edge deployment, low latency, and zero operations overhead, the entire project was fully migrated to the **Cloudflare Workers** architecture — the backend was rewritten from Express to Hono, the database migrated from better-sqlite3 to Cloudflare D1, file storage to R2, and session cache to KV. All **19 feature modules were fully preserved** with zero feature loss.

**Key Features:**
- 🌍 **Global Edge Runtime** — Workers/D1/KV/R2 all deployed on Cloudflare edge nodes, serving requests from the nearest location
- 📬 **Complete Email Capabilities** — Receiving (Workers Email Handler), sending (Cloudflare Email / Resend), forwarding, attachments, favorites
- 🏗️ **Unified Frontend & Backend Deployment** — Frontend hosted by Workers Assets, backend handled by Workers Runtime, single `wrangler deploy`
- 🔐 **Fine-grained Permissions** — JWT + RBAC role-based permission system with domain-level control
- 📊 **Data Analytics** — Send/receive statistics, trend charts (ECharts), scheduled cache refresh
- 🤖 **AI Integration** — Optional Cloudflare AI captcha extraction
- 🌙 **Editorial Design** — Warm paper-texture design system with full dark mode
- 📱 **PWA Support** — Installable as desktop/mobile application

## Architecture Migration

```
  ┌─────────────────────────────────┐         ┌─────────────────────────────────────┐
  │     Before: Node.js              │         │     After: Cloudflare                │
  │                                  │         │                                      │
  │  Vue 3 ──► Nginx static         │         │  Vue 3 (Vite build)                   │
  │                                  │         │    └──► Workers Assets edge hosting    │
  │  Express                         │         │                                      │
  │    └──► Local routes/middleware  │    ──►  │  Hono                                │
  │                                  │         │    └──► Workers Runtime API handling   │
  │  better-sqlite3 (file)           │         │                                      │
  │    └──► Local SQLite             │    ──►  │  Cloudflare D1 (Drizzle ORM)          │
  │                                  │         │                                      │
  │  Local filesystem (att/cache)    │         │  Cloudflare R2 (attachments)          │
  │                                  │    ──►  │  Cloudflare KV (sessions/cache)       │
  │                                  │         │                                      │
  │  Nodemailer (SMTP sending)      │         │  CF Email Handler / Resend API        │
  │                                  │    ──►  │  (Edge sending, no SMTP server)       │
  │  Single server deployment        │         │                                      │
  │                                  │    ──►  │  300+ global edge nodes scheduling    │
  └─────────────────────────────────┘         └─────────────────────────────────────┘
```

**Migration Benefits:**
- No server management, zero operations cost
- Global edge deployment, nearest request serving
- D1/KV/R2 pay-as-you-go billing, low-cost operation
- Auto-scaling, no concurrency concerns

## Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                         │
│                                                               │
│  ┌──────────────────────┐    ┌─────────────────────────────┐ │
│  │   Workers Assets      │    │   Hono (API Runtime)        │ │
│  │                       │    │                              │ │
│  │   Vue 3 SPA           │    │   ┌──────────┐ ┌─────────┐ │ │
│  │   (Vite 7 build)      │    │   │ API Routes│ │Security │ │ │
│  │                       │    │   │ (18 mods) │ │Middleware│ │ │
│  │   Frontend static     │    │   └────┬─────┘ └─────────┘ │ │
│  │   assets hosted       │    │        │                    │ │
│  │   at edge (SPA)       │    │   ┌────▼───────────────┐   │ │
│  └──────────────────────┘    │   │   Service Layer      │   │ │
│                               │   │  email / account     │   │ │
│                               │   │  user / role / perm  │   │ │
│                               │   │  analysis / ai       │   │ │
│                               │   │  setting / telegram  │   │ │
│                               │   │  r2 / s3 / resend    │   │ │
│                               │   └────┬───────────────┘   │ │
│                               │        │                    │ │
│                               │   ┌────▼───────────────┐   │ │
│                               │   │   Data Layer        │   │ │
│                               │   │  Drizzle ORM → D1   │   │ │
│                               │   │  KV (sessions/cache)│   │ │
│                               │   │  R2 (att/bg images) │   │ │
│                               │   └──────────────────┘   │ │
│                               └─────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Email Handler          │  Cron Triggers                 │ │
│  │  Receiving (PostalMime) │  */30 min → Refresh analytics  │ │
│  │  Blacklist filtering    │  Daily 16:00 → Clean verify    │ │
│  │  AI captcha extraction  │           → Reset daily count  │ │
│  │  Email forwarding       │           → Complete pending   │ │
│  │  TG notification push   │           → Clean unbound OAuth│ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Core Dependencies

| Layer | Technology | Version | Description |
|-------|-----------|---------|-------------|
| **Frontend** | Vue 3 | 3.5+ | Composition API |
| **Build Tool** | Vite 7 | 7.1+ | ES2022 build target |
| **State Management** | Pinia | 3.0+ | With persistence plugin |
| **Router** | Vue Router | 4.5+ | History mode + NProgress |
| **Charts** | ECharts | 5.6+ | Data analytics visualization |
| **HTTP** | Axios | 1.15+ | API requests |
| **PWA** | vite-plugin-pwa | 1.0+ | Service Worker |
| **i18n** | vue-i18n | 11.1+ | Chinese/English bilingual |
| **Local DB** | Dexie | 4.0+ | IndexedDB client cache |
| **Backend** | Hono | 4.6+ | Lightweight edge web framework |
| **ORM** | Drizzle | 0.38+ | D1-compatible type-safe ORM |
| **Email Parsing** | PostalMime | 2.4+ | Inbound MIME parsing |
| **HTML Parsing** | linkedom | 0.18+ | Email content image CID replacement |
| **Sending Service** | Resend | 6.4+ | External email sending |
| **S3 Compatible** | @aws-sdk/client-s3 | 3.88+ | Optional S3 storage backend |
| **Date Handling** | dayjs | 1.11+ | Lightweight date library |
| **AI** | Cloudflare AI | — | Captcha extraction, etc. |

## Feature List

### 📬 Email Core

| Feature | Description |
|---------|-------------|
| **Receiving** | Real-time receiving via Cloudflare Email Handler, PostalMime MIME parsing, supports HTML/plain text/CC/BCC |
| **Sending** | Dual-channel: Cloudflare Email (priority) or Resend API, supports replies and email threads |
| **Internal Sending** | Direct database writes between same-domain mailboxes, no external sending service needed |
| **Forwarding** | Auto-forward received emails to specified addresses (multiple supported, comma-separated) |
| **Attachments** | Inbound attachments auto-stored to R2, outbound supports regular attachments + inline images (CID replacement) |
| **Favorites** | Mark emails as favorites, dedicated favorites list page |
| **Drafts** | Auto-save compose drafts |
| **Batch Operations** | Bulk delete emails, conditional bulk cleanup |
| **Blacklist** | Filter spam by subject/content/sender address (including domain-level) |
| **Unread Status** | Email read/unread status management |
| **Email Search** | Search by sender name, email address, subject |

### 👤 Account & User System

| Feature | Description |
|---------|-------------|
| **Multi-account** | Each user can create multiple email addresses, independently managed |
| **User Registration/Login** | JWT authentication, KV session storage, multi-device login |
| **RBAC** | Role management + fine-grained permission control (20+ permission items) |
| **Domain Permissions** | Per-role control of available domain scope |
| **Sending Limits** | Per-role sending limits (total/daily), internal sending limits |
| **Receiving Control** | Per-role sender blocking, domain usage control |
| **OAuth** | Third-party OAuth login integration |
| **Registration Keys** | Invite code registration control (open/closed/optional modes) |
| **Verification** | Registration/email addition verification records (triggered by count) |
| **User Management** | Admin can view/disable/restore/delete users, reset sending counts |

### 📊 Data Analytics

| Feature | Description |
|---------|-------------|
| **ECharts Dashboard** | Send/receive statistics charts, trend analysis |
| **Cache Mechanism** | Auto-refresh analytics cache every 30 minutes |
| **Daily Statistics** | KV daily sending count, auto-expiry cleanup |
| **Global Email Management** | Admin view of all emails (received/sent/deleted/no recipient) |

### ⚙️ System Settings

| Feature | Description |
|---------|-------------|
| **Global Toggles** | Independent toggles for registration/receiving/sending/adding email/multi-email |
| **Site Configuration** | Title, background image (R2 storage), login page domain display control |
| **Sending Service** | Resend Token per-domain configuration, optional Cloudflare Email |
| **Storage Configuration** | R2 / S3 compatible storage switching, custom R2 domain |
| **Telegram Notifications** | Bot Token + Chat ID configuration, real-time push for new emails |
| **AI Features** | Auto captcha extraction, configurable filter rules |
| **Turnstile** | Cloudflare Turnstile human verification integration |
| **Notification System** | Login page announcements (title/content/type/duration/position/width/offset) |
| **Login Page Customization** | Background transparency, darkening coefficient adjustable |
| **Email Prefix Filter** | Minimum email prefix length restriction |

### 🎨 Frontend Features

| Feature | Description |
|---------|-------------|
| **Editorial Design System** | 25+ custom UI components, warm paper texture |
| **Dark Mode** | Complete Light/Dark theme, CSS variable driven |
| **PWA** | Installable as desktop/mobile application |
| **Mobile Responsive** | Responsive layout, touch target optimization, adaptive sidebar |
| **IndexedDB Cache** | Dexie local database, reduces duplicate requests |
| **Image Compression** | Compressor.js auto-compression before upload |
| **Route Guards** | NProgress progress bar, token authentication guards |
| **Documentation Page** | `/doc` route provides project documentation (no login required) |

### ⏰ Cron Triggers

| Schedule | Task |
|----------|------|
| `*/30 * * * *` | Refresh ECharts analytics cache |
| `0 16 * * *` (Daily UTC) | Clean expired verification records |
| | Reset user daily sending counts |
| | Complete all SAVING status receiving (error recovery) |
| | Clean unbound OAuth users |
| | Refresh ECharts analytics cache |

## Project Structure

```
smail/
├── web/                            # ── Frontend (Vue 3 + Vite 7) ──
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Editorial Design System (25 base components)
│   │   │   │   ├── s-button.vue    #   Button (primary/secondary/outline/danger/ghost)
│   │   │   │   ├── s-input.vue     #   Input (with label/error/group)
│   │   │   │   ├── s-modal.vue     #   Modal (sm/md/lg/xl)
│   │   │   │   ├── s-table.vue     #   Data table (sort/select/paginate)
│   │   │   │   ├── s-select.vue    #   Select (with tag multi-select)
│   │   │   │   ├── s-switch.vue    #   Switch
│   │   │   │   ├── s-tabs.vue      #   Tabs
│   │   │   │   ├── s-pagination.vue#   Pagination
│   │   │   │   ├── toast.js        #   Toast notifications
│   │   │   │   ├── confirm.js      #   Confirm dialog
│   │   │   │   └── ...             #   avatar/badge/checkbox/radio/skeleton/tag/tooltip/tree...
│   │   │   ├── email-scroll/       # Email scroll loading component
│   │   │   ├── hamburger/          # Hamburger menu
│   │   │   ├── loading/            # Loading state
│   │   │   ├── send-percent/       # Sending progress
│   │   │   ├── shadow-html/        # Email content Shadow DOM rendering
│   │   │   └── tiny-editor/        # Rich text editor
│   │   ├── views/                  # Page views (16 modules)
│   │   │   ├── email/              #   Inbox (default home)
│   │   │   ├── content/            #   Email detail/reading
│   │   │   ├── setting/            #   Personal settings
│   │   │   ├── star/               #   Favorite emails
│   │   │   ├── login/              #   Login/Register
│   │   │   ├── doc/                #   Project documentation page
│   │   │   ├── all-email/          #   [Admin] Global email management
│   │   │   ├── analysis/           #   [Admin] Analytics dashboard
│   │   │   ├── user/               #   [Admin] User management
│   │   │   ├── role/               #   [Admin] Role & permission management
│   │   │   ├── sys-setting/        #   [Admin] System settings
│   │   │   ├── reg-key/            #   [Admin] Registration key management
│   │   │   ├── send/               #   Send view
│   │   │   ├── draft/              #   Drafts
│   │   │   ├── test/               #   Test page
│   │   │   └── 404/                #   404 page
│   │   ├── layout/                 # Layout components
│   │   │   ├── index.vue           #   Main layout (sidebar + topbar + content)
│   │   │   ├── aside/              #   Sidebar (account list/navigation)
│   │   │   ├── header/             #   Top navigation bar
│   │   │   ├── write/              #   Compose overlay
│   │   │   ├── account/            #   Account selector
│   │   │   └── main/               #   Main content area
│   │   ├── store/                  # Pinia state management (9 stores)
│   │   │   ├── account.js          #   Account state
│   │   │   ├── email.js            #   Email list state
│   │   │   ├── user.js             #   User info
│   │   │   ├── setting.js          #   System settings
│   │   │   ├── ui.js               #   UI state (sidebar/theme)
│   │   │   ├── draft.js            #   Drafts
│   │   │   ├── send.js             #   Sending state
│   │   │   ├── role.js             #   Roles
│   │   │   └── writer.js           #   Compose window state
│   │   ├── request/                # API request wrappers (12 modules)
│   │   ├── i18n/                   # Internationalization (zh/en)
│   │   ├── styles/
│   │   │   └── editorial.css       # Editorial Design System (CSS variables + component styles)
│   │   ├── router/                 # Vue Router (route guards + NProgress)
│   │   ├── db/                     # Dexie IndexedDB local database
│   │   ├── echarts/                # ECharts chart configuration
│   │   ├── enums/                  # Frontend enum constants
│   │   ├── icons/                  # Icons (Iconify)
│   │   ├── perm/                   # Frontend permission control
│   │   └── utils/                  # Utility functions
│   ├── public/                     # Static assets
│   │   ├── smail-icon.svg          #   Red background white envelope Logo
│   │   ├── favicon.png             #   Site icon
│   │   ├── mail-pwa.png            #   PWA icon
│   │   ├── wechat-pay.png          #   WeChat payment QR code
│   │   └── alipay.png              #   Alipay payment QR code
│   └── vite.config.js              # Vite config (PWA + aliases + build)
│
├── server/                         # ── Backend (Hono on Workers) ──
│   ├── src/
│   │   ├── index.js                # Workers entry (fetch/email/scheduled)
│   │   ├── routes.js               # Route registration (18 API modules)
│   │   ├── hono.js                 # Hono instance (CORS + global error handling)
│   │   ├── api/                    # API route layer (18 modules)
│   │   │   ├── email-api.js        #   Email send/receive/delete/favorite/search
│   │   │   ├── account-api.js      #   Mailbox account CRUD
│   │   │   ├── user-api.js         #   User management
│   │   │   ├── login-api.js        #   Login/Register
│   │   │   ├── setting-api.js      #   System settings
│   │   │   ├── role-api.js         #   Role permissions
│   │   │   ├── all-email-api.js    #   Global email management
│   │   │   ├── analysis-api.js     #   Data analytics
│   │   │   ├── star-api.js         #   Favorites
│   │   │   ├── resend-api.js       #   Resend sending callback
│   │   │   ├── r2-api.js           #   R2 file upload
│   │   │   ├── my-api.js           #   Personal center
│   │   │   ├── reg-key-api.js      #   Registration keys
│   │   │   ├── oauth-api.js        #   OAuth login
│   │   │   ├── public-api.js       #   Public API (Token auth)
│   │   │   ├── init-api.js         #   Initialization
│   │   │   └── telegram-api.js     #   Telegram Webhook
│   │   ├── service/                # Business logic layer (20 services)
│   │   │   ├── email-service.js    #   Email core logic (send/receive/search/batch)
│   │   │   ├── account-service.js  #   Account management
│   │   │   ├── user-service.js     #   User management
│   │   │   ├── login-service.js    #   Authentication logic
│   │   │   ├── setting-service.js  #   Settings management (KV cache)
│   │   │   ├── role-service.js     #   Role permissions
│   │   │   ├── perm-service.js     #   Permission verification
│   │   │   ├── analysis-service.js #   Analytics statistics
│   │   │   ├── star-service.js     #   Favorites
│   │   │   ├── att-service.js      #   Attachment management
│   │   │   ├── r2-service.js       #   R2 storage operations
│   │   │   ├── s3-service.js       #   S3 compatible storage
│   │   │   ├── kv-obj-service.js   #   KV object storage
│   │   │   ├── ai-service.js       #   AI captcha extraction
│   │   │   ├── telegram-service.js #   TG message push
│   │   │   ├── resend-service.js   #   Resend sending
│   │   │   ├── oauth-service.js    #   OAuth logic
│   │   │   ├── reg-key-service.js  #   Registration keys
│   │   │   ├── turnstile-service.js#   Turnstile verification
│   │   │   └── verify-record-service.js # Verification records
│   │   ├── entity/                 # Drizzle ORM entity definitions
│   │   │   ├── orm.js              #   ORM initialization (D1 adaptation)
│   │   │   ├── email.js            #   Email table
│   │   │   ├── account.js          #   Account table
│   │   │   ├── user.js             #   User table
│   │   │   ├── att.js              #   Attachment table
│   │   │   ├── star.js             #   Favorites table
│   │   │   ├── setting.js          #   Settings table
│   │   │   ├── role.js / perm.js   #   Role/Permission tables
│   │   │   ├── oauth.js            #   OAuth table
│   │   │   ├── reg-key.js          #   Registration key table
│   │   │   └── verify-record.js    #   Verification record table
│   │   ├── dao/                    # Data access layer
│   │   ├── middleware/             # Middleware
│   │   ├── security/               # Security layer
│   │   │   ├── security.js         #   JWT auth + permission middleware
│   │   │   └── user-context.js     #   User context
│   │   ├── modules/
│   │   │   └── email/email.js      # Email Handler (receiving entry)
│   │   ├── template/               # Email templates (HTML/plain text/MIME)
│   │   ├── i18n/                   # Backend i18n (i18next)
│   │   ├── const/                  # Constants
│   │   ├── model/                  # Data models (unified response format)
│   │   ├── error/                  # Business exceptions (BizError)
│   │   └── utils/                  # Utilities (encryption/JWT/file/date/domain/email)
│   └── package.json
│
├── data/                           # ── Local development data ──
│   ├── db/smail.db                 # D1 SQLite database (local)
│   ├── cache/kv-store.json         # KV local simulation
│   └── storage/                    # R2 local simulation
│
├── wrangler.toml                   # Cloudflare deployment config
├── .env.example                    # Environment variable template
└── package.json                    # Root package.json
```

> 💡 **Recommended for beginners**: Visit the [Documentation Site](https://mail.sixzjd.sbs/doc) for complete docs, or jump directly to the [Quick Deploy Tutorial](https://mail.sixzjd.sbs/doc#deploy) to set up a smail service from scratch.

## Local Development

### Prerequisites

- **Node.js** >= 18
- **npm**

### 1. Clone the Project

```bash
git clone <repo-url> smail
cd smail
```

### 2. Install Dependencies

```bash
# Frontend dependencies
cd web && npm install && cd ..

# Backend dependencies
cd server && npm install && cd ..
```

### 3. Configure Environment Variables

Copy `.env.example` and modify as needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Development server port | `8787` |
| `DOMAIN` | Mail domain (for receiving) | `localhost` |
| `ADMIN` | Admin email address | `admin@localhost` |
| `JWT_SECRET` | JWT signing key (**must change in production**) | `smail-secret-change-me-in-production` |
| `SMTP_HOST` | SMTP server (optional) | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |

### 4. Start Development Server

```bash
# Run from project root
npx wrangler dev
```

In local development mode:
- **D1** → `data/db/smail.db` (local SQLite)
- **KV** → `data/cache/kv-store.json` (JSON file simulation)
- **R2** → `data/storage/` (filesystem simulation)
- Frontend proxied via Workers Assets with hot reload support

### 5. First-time Initialization

After visiting `http://localhost:8787`, the system will guide you through database initialization (creating table structure, default settings, admin account).

## Deployment Guide

> 📖 For more detailed deployment steps, refer to the [Documentation Site](https://mail.sixzjd.sbs/doc), or check the [Quick Deploy Tutorial](https://mail.sixzjd.sbs/doc#deploy).
>
> <a href="https://mail.sixzjd.sbs/doc#deploy"><img src="https://img.shields.io/badge/Quick%20Deploy%20Tutorial-Click%20to%20View-22c55e" alt="Quick Deploy Tutorial" /></a>

### Prerequisites

1. Have a Cloudflare account with [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed
2. Custom domain bound to Cloudflare
3. Created D1 database, KV namespace, R2 bucket

### 1. Configure wrangler.toml

```toml
name = "smail"
main = "server/src/index.js"
compatibility_date = "2025-06-04"

# Custom domain routing
[[routes]]
pattern = "mail.your-domain.com"
zone_name = "your-domain.com"
custom_domain = true

# D1 database
[[d1_databases]]
binding = "db"
database_name = "cloud-mail"
database_id = "<your-d1-database-id>"

# KV namespace
[[kv_namespaces]]
binding = "kv"
id = "<your-kv-namespace-id>"

# R2 bucket
[[r2_buckets]]
binding = "r2"
bucket_name = "<your-r2-bucket-name>"

# [Optional] Cloudflare Email sending
# [[send_email]]
# name = "email"

# AI binding
[ai]
binding = "ai"

# Frontend static assets
[assets]
binding = "assets"
directory = "./web/dist"
not_found_handling = "single-page-application"
run_worker_first = true

# Environment variables
[vars]
domain = ["your-domain.com"]           # Mail domain list
admin = "admin@your-domain.com"        # Admin email
jwt_secret = "<your-strong-secret>"    # JWT secret (must change)
```

### 2. Build Frontend

```bash
cd web && npx vite build --mode release && cd ..
```

Build output goes to `web/dist/`, edge-hosted by Workers Assets.

### 3. Deploy to Cloudflare

```bash
npx wrangler deploy
```

### 4. Initialize Database

After deployment, visit your domain and the system will guide you through initialization.

### 5. Configure Email Sending/Receiving (Optional)

**Receiving**: In Cloudflare Dashboard → Email → Email Routing, point your domain's MX records to Workers and configure the Email Worker trigger.

**Sending**:
- **Option A**: Enable Cloudflare Email (uncomment `[[send_email]]` in wrangler.toml)
- **Option B**: Configure Resend API Token (configure per-domain in system settings)

## Configuration Reference

### System Settings

| Setting | Description | Values |
|---------|-------------|--------|
| `register` | Registration toggle | Open / Closed |
| `regKey` | Registration key mode | Open / Closed / Optional |
| `receive` | Receiving toggle | Open / Closed |
| `send` | Sending toggle | Open / Closed |
| `addEmail` | Add email toggle | Open / Closed |
| `manyEmail` | Multi-email toggle | Open / Closed |
| `registerVerify` | Registration verification | Open / Closed / By count |
| `addEmailVerify` | Add email verification | Open / Closed / By count |
| `forwardStatus` | Email forwarding | Open / Closed |
| `tgBotStatus` | Telegram notifications | Open / Closed |
| `ruleType` | Receiving rules | All / Specific rules |
| `noRecipient` | No recipient handling | Open / Closed |
| `kvStorage` | KV storage mode | Open / Closed |
| `aiCode` | AI captcha extraction | Open / Closed |

### Permission Keys

| Permission Key | Scope |
|----------------|-------|
| `email:send` | Send emails |
| `email:delete` | Delete emails |
| `account:add/query/delete` | Mailbox account management |
| `user:query/add/delete/reset-send/set-pwd/set-status/set-type` | User management |
| `role:add/set/query/delete` | Role management |
| `all-email:query/delete` | Global email management |
| `setting:query/set` | System settings |
| `analysis:query` | Data analytics |
| `reg-key:add/query/delete` | Registration key management |
| `my:delete` | Personal center |

## Design System

The project uses an **Editorial design system**, inspired by the warm texture of paper publications:

| Element | Description |
|---------|-------------|
| **Primary Color** | `#d9543e` Coral red (Dark mode `#e06850`) |
| **Heading Font** | Plus Jakarta Sans — rounded modern sans-serif |
| **Body Font** | DM Sans — clear readable sans-serif |
| **Background** | `#fbf6ee` Warm paper texture (Light) / `#231e1a` Dark brown (Dark) |
| **Border Radius** | 8px base / 6px small / 12px large / 16px extra large |
| **Shadows** | Warm-toned translucent shadows, creating paper layering |
| **Animations** | 200ms ease base transitions, fade-in/scale/slide keyframes |
| **Components** | 25+ base components: button, input, modal, table, select, switch, tabs, pagination, toast, confirm, dropdown, tree... |

## License

MIT
