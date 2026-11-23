# Digital Wealth Creators — Enterprise Technical Architecture & Production Operational Setup Guide

> **Official Live Production Platform**: [https://digitalwealthcreators.org.ng](https://digitalwealthcreators.org.ng)  
> **Repository Remote**: `https://github.com/scholarsuite25-netizen/coursemart.git`  
> **Vercel Team Scope**: `digitalwealthcreators-projects` (`team_KO2A4taoxmCSQgmB3vbao42B`)  
> **Vercel Project**: `coursemart` (`prj_9p2IJ6Jk4ldpEeVvdV85eKWD8I8M`)  
> **Target Audience**: Executive Product Owners, Engineering Leads, DevOps Architects, and Platform Operators.

---

## Executive Summary & Table of Contents

Digital Wealth Creators is an enterprise-grade Digital Marketplace, Learning Management System (LMS), and Content Monetization Platform. It is engineered from the ground up to turn organic visitors into enrolled students and paying customers through technical SEO automation, real-time search indexing, multi-channel social syndication, client-side AI video narration, automated YouTube-to-course repurposing, and behavioral monetization funnels.

This document serves as the authoritative, end-to-end technical manual and operational guide for configuring, maintaining, deploying, and scaling the platform in production.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        TABLE OF CONTENTS & CHAPTER OUTLINE                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Executive Architecture Overview & Monetization Topology                             │
│ 2. Complete Environment Variables Inventory (36 Operational Parameters)               │
│ 3. Google Search Console & Google Indexing API Production Guide                        │
│ 4. LinkedIn Developer Portal & OAuth 2.0 Syndication Guide                             │
│ 5. Meta for Developers (Instagram Graph API & Facebook Page Feed) Guide                │
│ 6. YouTube Data API v3 & Video Syndication Guide                                       │
│ 7. AI Voice, Video Generator & YouTube Content Repurposer Guide                        │
│ 8. Quality & Offline Verification Protocol                                             │
│ 9. Git Automation & Vercel Production Deployment Protocol                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# Section 1: Executive Architecture Overview & Monetization Topology

## 1.1 High-Level Architecture Topology

The platform adopts a modern, hybrid decoupled-monolith architecture:
- **Frontend Layer**: Client-Side Single Page Application (SPA) built with **Vite 8.3**, **React 19**, **Tailwind CSS v4**, and **Motion**. Includes an offline-first Progressive Web App (PWA) service worker via Workbox.
- **Backend API Layer**: Express 4.21 application (`server.ts` in local development; `api/index.ts` mounting `createApiApp()` on Vercel Edge Serverless Functions).
- **Data Persistence Layer**: Dual-layer Key-Value persistence utilizing Supabase PostgreSQL (`coursemart_kv_store`) as the primary cloud database, with an automatic, zero-downtime fallback to local file persistence (`.coursemart-runtime.json` locally; `/tmp/.coursemart-runtime.json` on Vercel).
- **Distribution & Syndication Layer**: Outbound dispatch engines communicating with Google Indexing API v3, W3C WebSub Hubs, LinkedIn REST Posts API, Meta Graph API v21.0 (Instagram & Facebook), and signed HMAC-SHA256 Webhooks.
- **Client-Side Media Studio**: In-browser Revoicer-style video generator rendering 1280x720 24fps frames on an HTML5 2D Canvas with Web Audio chime synthesis, Web Speech API narration, and MediaRecorder WebM video export.

```
                           +------------------------------------------+
                           |           Web Browser / Client           |
                           |  (Vite 8.3 + React 19 SPA + Tailwind v4) |
                           +--------------------+---------------------+
                                                |
                                    HTTPS Requests / Dynamic DOM
                                                |
                         +----------------------v----------------------+
                         |            Vercel Edge / CDN                |
                         |  (vercel.json Rewrites & Security Headers)  |
                         +----------+-----------------------+----------+
                                    |                       |
                     Crawler Routes |                       | Client SPA
               /sitemap.xml, /robots.txt,                   | /* -> /index.html
               /feed.xml, /rss.xml, /api/*                  |
                                    v                       v
                         +----------------------+  +-------------------+
                         | Vercel Serverless Fn |  | Static Assets /   |
                         |     api/index.ts     |  | Pre-rendered dist |
                         +----------+-----------+  +-------------------+
                                    |
                         Mounts createApiApp()
                                    |
             +----------------------+----------------------+
             |                                             |
+------------v------------+                   +------------v------------+
|  Dual-Layer KV Store    |                   |  Event-Driven Engines   |
| 1. Supabase PostgreSQL  |                   | 1. SEO & Search Indexing|
|    coursemart_kv_store  |                   |    Google Indexing v3   |
| 2. Local File Fallback  |                   |    WebSub Hubs & Pings  |
|    .coursemart-runtime  |                   | 2. Social Syndication   |
|    (/tmp on Vercel)     |                   |    LinkedIn / Meta Graph|
+-------------------------+                   | 3. AI Video & Repurpose |
                                              +-------------------------+
```

## 1.2 Technology Stack Breakdown

| Subsystem | Core Technologies | Responsibility & Operational SLA |
| :--- | :--- | :--- |
| **Client UI/UX** | React 19, Vite 8.3, Tailwind CSS v4, Motion, Lucide Icons | Sub-second SPA navigation, dynamic DOM injection, checkout modals, responsive mobile UX. |
| **SEO Head Engine** | `<SeoHead>` component, `document.title`, `<meta>`, JSON-LD | Injects Canonical URLs, OpenGraph cards, and Schema.org schemas (`Organization`, `WebSite`, `BreadcrumbList`, `Course`, `BlogPosting`). |
| **Local Dev Server** | Node.js, Express 4.21, Vite Connect Middleware | Unified local developer environment on `http://0.0.0.0:3000` with instant Hot Module Replacement (HMR). |
| **Serverless Runtime** | Vercel Serverless Functions (`api/index.ts`), Fluid Compute | Serverless API router executing dynamic sitemap/robots generation, webhook handlers, and background tasks. |
| **Cloud Persistence** | Supabase PostgreSQL (`coursemart_kv_store`) | ACID-compliant JSONB key-value storage for 26 collections (products, orders, tutorials, social drafts, users). |
| **Local Store Fallback**| Ephemeral JSON File Storage (`.coursemart-runtime.json`) | Ensures 100% platform availability and test passing even if database credentials are unset or cloud network drops. |
| **Search Indexing** | Google Indexing API v3, WebSub, Google/Bing Pings | Instantly alerts search engines whenever new courses, tutorials, or articles are published. |
| **Social Distribution**| LinkedIn REST API, Meta Graph API v21.0, Signed Webhooks | Automated multi-channel syndication with character clamping, 2-step media containers, and HMAC verification. |
| **AI Video Studio** | HTML5 Canvas, Web Audio API, Web Speech API, MediaRecorder | Client-side 1280x720 video guide rendering and WebM video export with zero cloud infrastructure cost. |
| **Content Repurposer**| Deterministic Regex Parser, Structured Curriculum Builder | Converts any public YouTube URL into a complete multi-module course with notes and cross-platform promotional copy. |

## 1.3 Dual-Layer KV Store & Data Persistence Flow

The server maintains state across 26 allowlisted collections declared in `SYNC_KEYS`:
`products`, `users`, `orders`, `licenses`, `coupons`, `reviews`, `progress`, `appearance`, `whatsapp_groups`, `blog_posts`, `blog_bookmarks`, `membership_plans`, `user_memberships`, `affiliates`, `affiliate_conversions`, `affiliate_payouts`, `showcase_sites`, `events`, `event_registrations`, `social_drafts`, `email_campaigns`, `community_channels`, `community_messages`, `forum_threads`, `forum_replies`, `agent_incidents`, `tutorials`.

### Persistence Protocol:
1. **Read Operations**: The server checks Supabase PostgreSQL `coursemart_kv_store` table. If unreachable or unconfigured, it reads from the local file (`RUNTIME_STORE_FILE`).
2. **Write Operations**: The server updates memory, writes to Supabase asynchronously via UPSERT (`ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`), and synchronously syncs to `RUNTIME_STORE_FILE`.
3. **Vercel Read-Only Filesystem Handling**: On Vercel (`process.env.VERCEL === '1'`), the application writes to the `/tmp/.coursemart-runtime.json` directory. This guarantees that cold lambdas without Supabase keys still execute seamlessly.

## 1.4 Event-Driven Distribution Pipelines

The platform connects internal content lifecycle events to external marketing networks:

```
┌─────────────────────────────────┐
│ Creator / Admin Publishes Post  │
└────────────────┬────────────────┘
                 │
                 ├─────────────────────────────────────────────────┐
                 │                                                 │
                 ▼                                                 ▼
┌─────────────────────────────────┐               ┌─────────────────────────────────┐
│     Search Indexing Pipeline    │               │    Social Syndication Pipeline  │
├─────────────────────────────────┤               ├─────────────────────────────────┤
│ • Google Indexing API v3        │               │ • LinkedIn REST Posts API       │
│   (URL_UPDATED / URL_DELETED)   │               │   (3,000 char clamp, article)   │
│ • WebSub Hub Notification       │               │ • Meta Instagram Graph API      │
│   (pubsubhubbub, superfeedr)    │               │   (2-step media container flow) │
│ • Search Engine Crawler Pings   │               │ • Meta Facebook Page Feed API   │
│   (Google & Bing sitemap pings) │               │   (status update & link share)  │
│ • RSS 2.0 Feed Live Update      │               │ • Outbound Signed Webhook       │
│   (/api/feed.xml & /api/rss.xml)│               │   (HMAC-SHA256 X-Social-Sig)    │
└─────────────────────────────────┘               └─────────────────────────────────┘
```

## 1.5 Monetization & High-Conversion Funnel Architecture

To achieve the executive mandate that **every visitor and free registrant converts into a paying customer**, the platform embeds 4 behavioral monetization mechanisms:

### 1. Tripwire Welcome Offer Modal (`src/components/storefront/TripwireWelcomeModal.tsx`)
- **Behavioral Trigger**: Triggers automatically **4 seconds** after a visitor lands on the marketplace or registers.
- **Urgency Mechanism**: Displays an active **15-minute countdown clock** offering an 85% to 90% discount on the flagship digital asset (e.g. **105-Prompt VIP Vault** or Starter Bundle).
- **Price Architecture**: Slashes price from ₦25,000 to **₦2,500**.
- **Frictionless Conversion**: Clicking "Claim Offer" applies coupon code `SAVE85`, bundles the product into the cart, opens the checkout drawer, and directs the student straight to payment. Suppressed for 3 days once dismissed to prevent UX fatigue.

### 2. Exit-Intent Deal Closer (`src/components/storefront/ExitIntentModal.tsx`)
- **Behavioral Triggers**:
  - *Desktop*: Monitors mouse cursor telemetry; fires when cursor crosses into the top 15 pixels of the browser viewport (`e.clientY <= 15`).
  - *Mobile*: Detects rapid upward scrolling indicating user abandonment (`distance > 250px` within `200ms`) or mobile browser back-button press (`popstate` event listener).
- **Offer Dynamic**: Fires an instant emergency coupon modal activating an **85% discount voucher (`SAVE85`)** valid for 10 minutes.
- **Conversion Flow**: Activates the voucher across the active cart session and drives immediate checkout before abandonment. Suppressed for 24 hours once dismissed.

### 3. Dual Payment Gateway Architecture (Paystack + Direct Bank Transfer)
- **Primary Automated Gateway (Paystack Inline)**:
  - Supports Debit/Credit Cards (Mastercard, Visa, Verve), Instant Bank Transfer, USSD dial codes (*737#, *966#, etc.), and QR payments.
  - Server verifies webhook transactions via HMAC-SHA512 (`x-paystack-signature`) against `PAYSTACK_SECRET_KEY` and automatically fulfills digital orders.
- **Direct Bank Transfer Gateway (GTBank Nigeria)**:
  - Account Number: `0029103844`
  - Account Name: `Tintol Business Services`
  - Bank: `Guaranty Trust Bank (GTBank)`
  - Direct Verification: Includes a 1-click WhatsApp order verification link (+2348034710699) pre-filled with order ID and student details, providing zero-friction payment for customers without active cards.

### 4. Automated Weekly Newsletter Digest (`/api/cron/weekly-newsletter`)
- Scheduled via Vercel Cron (`0 8 * * 1` — Mondays at 08:00 UTC).
- Collects newly published products, courses, and tutorials from the preceding 7 days.
- Automatically compiles and dispatches a branded email digest with personalized discount links to re-engage past visitors and drive recurring revenue.

---

# Section 2: Complete Environment Variables Inventory

The platform relies on 39 environment variables across 9 functional domains. The table below catalogs each variable, its runtime behavior, secret classification, and verified fallback behavior:

| Variable Name | Purpose & Description | Format & Example | Classification | Fallback / Offline Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `APP_URL` | Canonical public application URL for sitemaps, OpenGraph, and OAuth redirects. | HTTPS URL: `https://digitalwealthcreators.org.ng` | Public / Config | Inferred from request `x-forwarded-host` or `host`; defaults to `https://digitalwealthcreators.vercel.app`. |
| `PORT` | Local HTTP listening port for Express dev server (`server.ts`). | Positive integer: `3000` | Public / Config | Defaults to `3000`. |
| `NODE_ENV` | Node runtime execution mode (`'development'`, `'production'`, `'test'`). | String: `'development'`, `'production'` | Public / Config | Defaults to `'development'`. |
| `VERCEL` | Environment flag injected automatically by Vercel Lambda infrastructure. | String: `'1'` | Public / System | If `'1'`, sets runtime store to `/tmp/.coursemart-runtime.json`. |
| `VERCEL_ENV` | Vercel deployment stage (`'production'`, `'preview'`, `'development'`). | String: `'production'`, `'preview'` | Public / System | Inferred at runtime; controls strict session authorization. |
| `DISABLE_HMR` | Disables Vite HMR and filesystem watch loops in test/agent environments. | Boolean string: `'true'`, `'false'` | Public / Dev Config | Defaults to unset (HMR active). |
| `SUPABASE_URL` | Supabase project URL for PostgreSQL REST queries. | HTTPS URL: `https://xyz.supabase.co` | Public / Server & Client | Empty string. Server falls back cleanly to local file storage. |
| `SUPABASE_SECRET_KEY` | Supabase Service Role secret key for unrestricted backend CRUD. | Secret key / JWT: `sb_secret_...` | Secret (Server) | Empty string. Operates using local file persistence. |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy alias for Supabase Service Role key. | Secret key / JWT: `eyJhb...` | Secret (Server) | Evaluated if `SUPABASE_SECRET_KEY` is unset. |
| `VITE_SUPABASE_URL` | Supabase URL exposed to Vite client bundle. | HTTPS URL: `https://xyz.supabase.co` | Public (Client) | `undefined`. Client runs in offline local store mode. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable API key for browser client bundle. | Public key / JWT: `sb_publishable_...` | Public (Client) | `undefined`. |
| `VITE_SUPABASE_ANON_KEY` | Legacy alias for Supabase Anonymous key. | Public key / JWT: `eyJhb...` | Public (Client) | Evaluated if publishable key is unset. |
| `ADMIN_EMAIL` | Configured master administrator email address for dashboard access. | Email address: `admin@digitalwealthcreators.org.ng` | Public / Config | Defaults to `'admin@coursemart.io'`. |
| `ADMIN_PASSWORD` | Cryptographic master password for administrator dashboard access. | Strong password string (min 8 chars) | Secret (Server) | In non-production dev, allows preview dev login; in production, login is blocked if unset. |
| `ADMIN_SESSION_SECRET` | HMAC-SHA256 signing secret for admin session cookies. | 32+ char hex string | Secret (Server) | Falls back to Supabase/Paystack key or an ephemeral random startup secret. |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key for client checkout popup modals. | Public key: `pk_live_...` or `pk_test_...` | Public (Client & Server) | `null`. Operates in transparent preview checkout mode if unset. |
| `PAYSTACK_SECRET_KEY` | Paystack secret key for transaction verification and webhooks. | Secret key: `sk_live_...` or `sk_test_...` | Secret (Server) | `null`. Server returns mock success response in non-prod. |
| `EMAILBUMP_API_KEY` | Primary transactional and marketing email provider API key. | API key: `ebk_live_...` | Secret (Server) | Evaluated first in email delivery cascade. |
| `EMAILBUMB_API_KEY` | Typo-tolerant alias for EmailBump API key. | API key: `ebk_live_...` | Secret (Server) | Evaluated if primary variable is unset. |
| `EMAILBUMP_API_URL` | Custom REST endpoint URL for EmailBump API. | HTTPS URL: `https://emailbump.com/api/v1/emails` | Public / Config | Defaults to `https://emailbump.com/api/v1/emails`. |
| `RESEND_API_KEY` | Resend API key for outbound email delivery (3,000 free/mo). | API key: `re_123456789_...` | Secret (Server) | Evaluated second in email delivery cascade. |
| `BREVO_API_KEY` | Brevo (Sendinblue) API key for transactional emails (300 free/day). | API key: `xkeysib-123456...` | Secret (Server) | Evaluated third in email delivery cascade. |
| `EMAIL_FROM` | Default "From" sender name and address on system emails. | Header: `Digital Wealth Creators <onboarding@resend.dev>` | Public / Config | Defaults to `'Digital Wealth Creators <onboarding@resend.dev>'`. |
| `EMAIL_PROVIDER` | Explicit provider priority override (`'emailbump'`, `'resend'`, `'brevo'`). | String: `'emailbump'` | Public / Config | Auto-detects based on available API keys. |
| `CRON_SECRET` | Secret Bearer token required to invoke `/api/cron/*` endpoints. | 32+ char random string | Secret (Server) | In dev/test, `x-admin-test: true` header permits execution. |
| `DOWNLOAD_TOKEN_SECRET` | Secret HMAC-SHA256 key for signing gated download tokens. | 32+ char random string | Secret (Server) | Defaults to `getAdminSessionSecret()`. |
| `LINKEDIN_ACCESS_TOKEN` | OAuth 2.0 Bearer access token for LinkedIn REST Posts API. | Bearer token: `AQV...` | Secret (Server) | Defaults to `'mock_token'` (offline simulation mode). |
| `LINKEDIN_AUTHOR_URN` | LinkedIn Organization or Person URN for post authorship. | URN: `urn:li:organization:105948291` | Public / Config | Defaults to `'urn:li:person:mock'`. |
| `INSTAGRAM_ACCOUNT_ID` | Instagram Professional Account ID linked to Facebook Page. | Numeric ID: `17841400123456789` | Public / Config | Defaults to `'123'`. |
| `INSTAGRAM_ACCESS_TOKEN` | Meta Graph API Long-Lived Page Access Token for Instagram. | Token: `EAA...` | Secret (Server) | Defaults to `'mock_token'` (offline simulation mode). |
| `FACEBOOK_PAGE_ID` | Numeric Facebook Page ID used for feed syndication. | Numeric ID: `100293847562918` | Public / Config | Defaults to `'fb_page_1'`. |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Meta Graph API Page Access Token with `pages_manage_posts`. | Token: `EAA...` | Secret (Server) | Defaults to `'fb_token'` (offline simulation mode). |
| `SOCIAL_DISPATCH_WEBHOOK_URL` | Destination webhook URL for post drafts (Zapier/Make/n8n). Supported alias: `SOCIAL_WEBHOOK_URL`. | HTTPS URL: `https://api.domain.com/webhook/social` | Public / Config | Defaults to `'https://api.site.org/webhook/social'`. |
| `SOCIAL_WEBHOOK_SECRET` | Secret key used to compute `X-Social-Signature` HMAC header. | 32+ char secret string | Secret (Server) | If unset, webhook payload dispatches without signature. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | GCP Service Account email delegated as Search Console Owner. Supported alias: `GOOGLE_INDEXING_CLIENT_EMAIL`. | Email: `dwc-indexing@project.iam.gserviceaccount.com` | Public / Config | Passed in request credentials or simulated offline. |
| `GOOGLE_PRIVATE_KEY` | GCP Service Account RSA Private Key in PEM format. Supported alias: `GOOGLE_INDEXING_PRIVATE_KEY`. | PEM string: `-----BEGIN PRIVATE KEY-----\n...\n-----END...` | Secret (Server) | Passed in request credentials or simulated offline. |
| `GEMINI_API_KEY` | Google Gemini API Studio key for automated AI article drafts and content creation. | Secret key: `AIzaSy...` | Secret (Server) | Optional fallback if using permanent local AI proxy. Offline mock drafts generated in UI if unset. |
| `GEMINI_MODEL` | Gemini AI model identifier for content generation and student assistant pipelines. | Model name: `gemini-2.5-flash` or `gemini-4-hydrogen` | Public / Config | Defaults to `gemini-2.5-flash` (`gemini-4-hydrogen` in server fallback). |
| `GOOGLE_GEMINI_BASE_URL` | Permanent local multi-model AI proxy base URL running on port 8080. | HTTP URL: `http://localhost:8080` | Public / Config | Defaults to `http://localhost:8080`. Inherits multi-model pool and auto-failover. |

---

# Section 3: Google Search Console & Google Indexing API Guide

The Google Indexing API enables Digital Wealth Creators to directly alert Googlebot when URLs are added, updated, or removed, reducing indexing discovery from weeks to minutes.

## 3.1 Architecture & Google Indexing Dispatcher

In `src/utils/indexingDispatcher.ts`, indexing credentials follow the `GoogleIndexingCredentials` contract:

```typescript
export interface GoogleIndexingCredentials {
  clientEmail?: string;
  privateKey?: string;
  accessToken?: string;
  token?: string;
}
```

### Operational Execution Rules:
1. **Explicit Null Credentials**: If `credentials === null`, the dispatcher reports missing credentials and returns `{ ok: false, error: 'Missing indexing credentials' }`.
2. **Omitted / Undefined Credentials**: If credentials are not passed, the dispatcher executes in **offline simulation mode**, returning `{ ok: true, simulated: true, message: 'Simulated Google Indexing API submission (offline mode)' }`. This allows CI pipelines and local testing without live GCP credentials.
3. **Live Bearer Token**: If `accessToken` or `token` is supplied, the dispatcher sends an authenticated HTTPS request directly to Google's v3 endpoint.
4. **Service Account Private Key**: If `clientEmail` and `privateKey` are supplied, the private key is used to sign a JWT assertion requesting OAuth 2.0 access tokens for the scope `https://www.googleapis.com/auth/indexing`.

## 3.2 RSA PEM Private Key Formatting & Newline Sanitation

When downloading service account keys from Google Cloud Console, the key is formatted in JSON:
```json
{
  "type": "service_account",
  "project_id": "dwc-indexing-prod",
  "private_key_id": "9a8b7c6d5e4f3a2b1c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...\n-----END PRIVATE KEY-----\n",
  "client_email": "dwc-indexer@dwc-indexing-prod.iam.gserviceaccount.com"
}
```

### Critical Rules for `.env` and Vercel Environment Variables:
1. **Preserve Newline Characters**: In `.env` files, wrap the private key in double quotes and keep literal `\n` characters:
   ```bash
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...\n-----END PRIVATE KEY-----\n"
   ```
2. **Vercel Dashboard Input**: When pasting into the Vercel Dashboard (`Settings -> Environment Variables`), paste the multi-line string directly or keep `\n`. In code, sanitize with:
   ```typescript
   const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
   ```
3. **Header and Footer**: Never omit `-----BEGIN PRIVATE KEY-----` or `-----END PRIVATE KEY-----`.

## 3.3 Zero-to-One Google Cloud Project & Service Account Setup

Follow this step-by-step setup procedure:

1. **Create or Select a Google Cloud Project**:
   - Navigate to [Google Cloud Console](https://console.cloud.google.com).
   - Click the project dropdown and select **New Project**.
   - Name the project `dwc-search-indexing` and click **Create**.

2. **Enable the Web Search Indexing API**:
   - In the Google Cloud search bar, search for **Web Search Indexing API** (or **Indexing API**).
   - Click **Enable**.

3. **Create a Service Account**:
   - In the left navigation menu, go to **IAM & Admin -> Service Accounts**.
   - Click **Create Service Account** at the top.
   - Enter Service account details:
     - **Service account name**: `dwc-indexing-agent`
     - **Service account ID**: `dwc-indexing-agent` (generates `dwc-indexing-agent@dwc-search-indexing.iam.gserviceaccount.com`).
     - **Description**: `Automated search indexing service account for Digital Wealth Creators`.
   - Click **Create and Continue**.
   - *Role Assignment*: No GCP IAM roles are required here because permission is granted through Google Search Console property delegation. Click **Continue** and then **Done**.

4. **Generate and Download JSON Key**:
   - In the Service Accounts list, click the newly created service account email.
   - Navigate to the **Keys** tab.
   - Click **Add Key -> Create new key**.
   - Select **JSON** and click **Create**.
   - Save the downloaded JSON file securely (never commit this file to Git).

## 3.4 Google Search Console Property Verification & Owner Delegation

The Google Indexing API requires that the service account email is verified as an **Owner** of the property in Google Search Console. A "Full" or "Restricted" permission level will fail with HTTP 403.

### Architectural Rationale: Why Search Console Strictly Requires Owner Status
The Google Indexing API provides privileged, real-time write-access to Google's indexing pipelines, enabling near-instant crawling, re-indexing, or immediate purge (`URL_DELETED`) of domain URLs without the safety buffer of standard crawler discovery schedules. Because erroneous or malicious API submissions could instantly poison search results or unindex critical domain pages, Google enforces strict domain verification architecture:
1. When a notification request reaches `POST https://indexing.googleapis.com/v3/urlNotifications:publish`, Google extracts the service account client email from the signed OAuth 2.0 Bearer JWT token.
2. The Indexing API backend queries Google Search Console's site ownership verification system to verify whether the requesting entity possesses verified administrative ownership of the target URL's domain or prefix.
3. In Search Console's role hierarchy, only **Owner** (or Delegated Owner) accounts possess cryptographic authority over domain index mutations. "Full" or "Restricted" permissions grant read-only reporting and performance analysis access inside the Search Console web interface, but do NOT grant ownership-level authority.
4. If a service account is configured with "Full" or "Restricted" permissions instead of "Owner", the Indexing API rejects the call with:
   `HTTP 403 Forbidden: Permission denied. Failed to verify the URL ownership.`

1. **Open Google Search Console**:
   - Navigate to [Google Search Console](https://search.google.com/search-console).

2. **Add and Verify Your Property**:
   - Choose property type:
     - **Domain property** (recommended, e.g., `digitalwealthcreators.org.ng`): Verifies all subdomains and protocols via a DNS TXT record.
     - **URL prefix property** (e.g., `https://digitalwealthcreators.org.ng`): Verifies via HTML file, HTML tag, or DNS.

3. **Delegate Service Account as Owner**:
   - In Search Console, select your verified property from the top-left dropdown.
   - In the left sidebar, click **Settings** (gear icon near the bottom).
   - Under *General Settings*, click **Users and permissions**.
   - Click the **Add user** button in the top right.
   - In the **Email address** field, paste your exact Service Account Email:
     `dwc-indexing-agent@dwc-search-indexing.iam.gserviceaccount.com`
   - In the **Permission** dropdown, select **Owner**.
   - Click **Add**.

## 3.5 Indexing API v3 Endpoints & Notification Types

### 1. Publish Notification Endpoint
- **URL**: `POST https://indexing.googleapis.com/v3/urlNotifications:publish`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <OAuth2_Access_Token>
  ```
- **Request Body**:
  ```json
  {
    "url": "https://digitalwealthcreators.org.ng/blog/mastering-vibe-coding",
    "type": "URL_UPDATED"
  }
  ```

### 2. Notification Types:
- `URL_UPDATED`: Informs Google that a new URL has been created or existing content has been modified. Instructs Googlebot to crawl and re-index the URL.
- `URL_DELETED`: Informs Google that a URL has been deleted or unpublished, requesting removal from Google's index.

### 3. Response Format:
- **HTTP 200 OK**:
  ```json
  {
    "urlNotificationMetadata": {
      "url": "https://digitalwealthcreators.org.ng/blog/mastering-vibe-coding",
      "latestUpdate": {
        "url": "https://digitalwealthcreators.org.ng/blog/mastering-vibe-coding",
        "type": "URL_UPDATED",
        "notifyTime": "2026-11-23T05:45:00.000Z"
      }
    }
  }
  ```

### 4. Common Error Codes & Troubleshooting:
- **HTTP 400 Bad Request**: Invalid URL format or unsupported protocol. Must be fully qualified `http://` or `https://`.
- **HTTP 401 Unauthorized**: Missing, expired, or malformed OAuth Bearer token.
- **HTTP 403 Forbidden (`Permission denied. Failed to verify the URL ownership`)**: The service account is not added as an **Owner** in Google Search Console for this property.
- **HTTP 429 Too Many Requests**: Default quota of 200 requests/day exceeded. System gracefully catches this and logs the status.

## 3.6 WebSub (PubSubHubbub) Hub Notifications

WebSub provides real-time distributed publish-subscribe notifications for RSS readers, aggregators, and search bots whenever the content feed changes.

In `src/utils/indexingDispatcher.ts`, `pingWebSubHubs()` notifies standard public hubs:
1. `https://pubsubhubbub.appspot.com/` (Google WebSub hub)
2. `https://pubsubhubbub.superfeedr.com/` (Superfeedr hub)

### WebSub HTTP Dispatch Specification:
- **Method**: `POST`
- **Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Body**:
  ```http
  hub.mode=publish&hub.url=https%3A%2F%2Fdigitalwealthcreators.org.ng%2Fapi%2Ffeed.xml
  ```
- **Success Criteria**: HTTP 200 OK or HTTP 204 No Content indicates accepted hub ping.

## 3.7 Automated Search Engine Crawler Pings

Search engine crawler pings notify Google and Bing crawler schedulers that `sitemap.xml` has updated content:

In `src/utils/indexingDispatcher.ts`, `pingSearchEngines()` triggers:
1. **Google Ping**:
   `GET https://www.google.com/ping?sitemap=https%3A%2F%2Fdigitalwealthcreators.org.ng%2Fsitemap.xml`
2. **Bing Ping**:
   `GET https://www.bing.com/ping?sitemap=https%3A%2F%2Fdigitalwealthcreators.org.ng%2Fsitemap.xml`

## 3.8 Backend Coordination Endpoint & Automated Event Hook

### 1. Manual Indexing Dispatch Endpoint (`POST /api/indexing/submit`)
- **Authorization**: Admin session cookie (`coursemart_admin_session`) or test header (`x-admin-test: true`).
- **Rate Limit**: 30 requests/minute per IP address.
- **Payload Schema**:
  ```json
  {
    "urls": [
      "https://digitalwealthcreators.org.ng/blog/mastering-vibe-coding",
      "https://digitalwealthcreators.org.ng/product/ai-engineering-mastery"
    ],
    "feedUrl": "https://digitalwealthcreators.org.ng/api/feed.xml",
    "sitemapUrl": "https://digitalwealthcreators.org.ng/sitemap.xml",
    "type": "URL_UPDATED"
  }
  ```
- **Response**: Aggregated summary with timestamps and individual ping results.

### 2. Automated Event Hook on Blog Publication
In `src/server/createApp.ts` (lines 2665-2675), during scheduled blog publication (`/api/cron/publish-blogs`):
```typescript
if (publishedCount > 0) {
  await writeStoreKeyValue('blog_posts', updatedPosts);

  const baseUrl = resolveBaseUrl(req);
  const publishedUrls = (publishedPosts || []).map((p) => `${baseUrl}/blog/${p.slug || p.id}`);
  
  dispatchSearchIndexing({
    urls: publishedUrls,
    feedUrl: `${baseUrl}/api/feed.xml`,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    type: 'URL_UPDATED',
  }).catch((err) => {
    console.error('[SEO Indexing Dispatcher]', err);
  });
}
```
This triggers complete multi-tier indexing immediately upon publication with zero manual intervention.

---

# Section 4: LinkedIn Developer Portal & OAuth 2.0 Guide

The platform provides native, zero-cost outbound syndication to LinkedIn via the **LinkedIn REST Posts API** (`POST https://api.linkedin.com/rest/posts`), supporting plain-text status updates, hash-tagged commentary, and rich article link previews.

## 4.1 Architectural Overview & Call Chain

```
┌─────────────────────────────────┐
│ Blog / Course Publication Event │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  src/server/createApp.ts        │
│  POST /api/social/publish       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  src/utils/socialSyndication.ts │
│  publishToLinkedIn()            │
└────────────────┬────────────────┘
                 │
                 ▼ (HTTPS POST)
┌─────────────────────────────────────────────────────────────┐
│ LinkedIn REST Posts API (https://api.linkedin.com/rest/posts)│
│ Headers:                                                    │
│   • Authorization: Bearer <LINKEDIN_ACCESS_TOKEN>           │
│   • LinkedIn-Version: 202401                                │
│   • X-Restli-Protocol-Version: 2.0.0                        │
│   • Content-Type: application/json                          │
└─────────────────────────────────────────────────────────────┘
```

## 4.2 Step-by-Step Production Credential Walkthrough

### Step 1: Create a LinkedIn Company Page
1. Log in to your personal LinkedIn account.
2. Click the **For Business** icon in the top right menu and select **Create a Company Page**.
3. Select **Company**, enter the organization name (**Digital Wealth Creators**), vanity URL (`digital-wealth-creators`), website (`https://digitalwealthcreators.org.ng`), and industry (**E-Learning Providers** / **Software Development**).
4. Upload your company logo (300x300 PNG) and tagline, confirm legal authorization, and click **Create Page**.
5. Once created, note your numeric Company Page ID from the URL (`https://www.linkedin.com/company/<PAGE_ID>/admin/dashboard/`).

### Step 2: Register an Application in the LinkedIn Developer Portal
1. Navigate to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/).
2. Click **Create App**.
3. In the application registration form:
   - **App Name**: `Digital Wealth Creators Auto-Publisher`
   - **LinkedIn Page**: Search for and select your newly created Company Page.
   - **Privacy Policy URL**: `https://digitalwealthcreators.org.ng/privacy`
   - **App Logo**: Upload a square 300x300 PNG icon.
   - Check the legal terms and click **Create App**.

### Step 3: Associate and Verify Company Page Ownership
1. In your app dashboard under the **Settings** tab, locate **Company Page Association**.
2. Click **Verify**.
3. Generate the verification URL and open it in a browser where you are logged in as the Company Page Admin.
4. Click **Approve Verification**. The app status updates to **Verified**.

### Step 4: Request Product Access & OAuth 2.0 Permissions
1. In the app dashboard, navigate to the **Products** tab.
2. Request access to:
   - **Share on LinkedIn**: Grants the `w_member_social` permission for personal member profile updates.
   - **Community Management API** (or **Member Directory API**): Grants `w_organization_social` and `r_organization_social` for posting on behalf of your Company Page.
3. Under the **Auth** tab, verify that the following OAuth 2.0 scopes are enabled:
   - `w_organization_social` (Publish company updates)
   - `r_organization_social` (Read company shares)
   - `w_member_social` (Publish personal updates)

## 4.3 OAuth 2.0 Token Generation

### Option A: 3-Legged OAuth 2.0 Authorization Flow (Production)
1. Add your redirect URI under **Auth > OAuth 2.0 settings > Redirect URLs**:
   ```
   https://digitalwealthcreators.org.ng/api/auth/linkedin/callback
   ```
2. Direct your administrator to the authorization URL:
   ```http
   GET https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&state={RANDOM_STATE}&scope=w_organization_social%20r_organization_social
   ```
3. Upon approval, capture the `code` parameter from the redirect.
4. Exchange the code for an Access Token via HTTP POST:
   ```bash
   curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "code={AUTHORIZATION_CODE}" \
     -d "redirect_uri={REDIRECT_URI}" \
     -d "client_id={CLIENT_ID}" \
     -d "client_secret={CLIENT_SECRET}"
   ```
5. Extract the returned `access_token` (valid for 60 days).

### Option B: Developer Portal Token Generator (Fast Setup / Development)
1. In the Developer Portal, go to **Tools > Token Generator**.
2. Select your application.
3. Check the `w_organization_social` and `w_member_social` scopes.
4. Click **Request Access Token**, authorize through your account, and copy the generated Bearer token.

## 4.4 Author URN Resolution & Content Commentary Rules

The `author` field in the LinkedIn Posts API requires an authoritative Universal Resource Name (URN):
- **Company Page URN**: `urn:li:organization:<NUMERIC_PAGE_ID>` (e.g. `urn:li:organization:105948291`). This ensures posts are published with your company logo and brand name.
- **Personal Member Profile URN**: `urn:li:person:<MEMBER_ID>` (e.g. `urn:li:person:cephas`). Obtained by querying `GET https://api.linkedin.com/v2/userinfo` with your Bearer token.

> **Character Limit Enforcement**: LinkedIn strictly rejects posts where `commentary` exceeds 3,000 characters. The internal `publishToLinkedIn` function automatically truncates commentary to 3,000 characters using `text.slice(0, 3000)` to guarantee HTTP 201 delivery.

## 4.5 REST Posts API Payload & Header Specification

### Required Headers
| Header | Value | Purpose |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <LINKEDIN_ACCESS_TOKEN>` | OAuth 2.0 Bearer credential |
| `Content-Type` | `application/json` | JSON payload serialization |
| `LinkedIn-Version` | `202401` | Pins LinkedIn Versioned REST API behavior |
| `X-Restli-Protocol-Version` | `2.0.0` | Rest.li protocol v2 serialization |

### Payload Schemas

#### 1. Plain Commentary Share
```json
{
  "author": "urn:li:organization:105948291",
  "commentary": "Exciting update from Digital Wealth Creators! Master full-stack autonomous AI workflows.\n\n#AI #Engineering #Tech",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  }
}
```

#### 2. Rich Article Link Share
```json
{
  "author": "urn:li:organization:105948291",
  "commentary": "Check out our latest masterclass on autonomous AI agent engineering!",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "content": {
    "article": {
      "source": "https://digitalwealthcreators.org.ng/blog/mastering-ai-workflows",
      "title": "Mastering Autonomous AI Workflows",
      "description": "Complete hands-on engineering guide to deterministic agentic systems."
    }
  }
}
```

## 4.6 Testing & Immediate Dispatch via Platform API

Test your LinkedIn credentials immediately using the in-app publishing endpoint `POST /api/social/publish`.

### Supported Administrative Authentication Mechanisms (`isAgentAuthorized`)
The server protects `/api/social/publish` through `isAgentAuthorized` (`src/server/createApp.ts`). Requests must supply one of the following 3 valid authentication mechanisms:
1. **Admin Token Header (`x-admin-token`)** *(Recommended for cURL, CLI automation, and external scripts)*:
   ```http
   x-admin-token: <COURSEMART_ADMIN_TOKEN>
   ```
2. **Admin Session Cookie** *(Used automatically by browser dashboard sessions)*:
   ```http
   Cookie: coursemart_admin_session=<ADMIN_SESSION_TOKEN>; coursemart_admin_role=admin
   ```
3. **Cron Secret Bearer Token** *(Used by automated cron jobs and server-to-server webhooks)*:
   ```http
   Authorization: Bearer <CRON_SECRET>
   ```

> ⚠️ **Authentication Warning**: Passing a generic `-H "Authorization: Bearer <ADMIN_TOKEN>"` returns `HTTP 401 Unauthorized`. The server specifically inspects `x-admin-token`, session cookies, or the exact `CRON_SECRET`. In non-production testing, `-H "x-admin-test: true"` is also accepted.

### Executable Test Command
```bash
curl -X POST https://digitalwealthcreators.org.ng/api/social/publish \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <COURSEMART_ADMIN_TOKEN>" \
  -d '{
    "platform": "linkedin",
    "content": "Digital Wealth Creators production syndication test. 🚀",
    "targetUrl": "https://digitalwealthcreators.org.ng/courses",
    "title": "Autonomous Engineering Academy"
  }'
```

---

# Section 5: Meta for Developers (Instagram Graph API & Facebook Page) Guide

The platform integrates directly with **Meta Graph API v21.0** to publish updates to Facebook Business Pages (`POST /{page_id}/feed`) and images to Instagram Professional accounts via the **2-Step Media Container Flow** (`POST /{ig_user_id}/media` -> `POST /{ig_user_id}/media_publish`).

## 5.1 Architecture & Syndication Workflow

```
┌─────────────────────────────────┐
│ Blog / Course Publication Event │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  src/server/createApp.ts        │
│  POST /api/social/publish       │
└────────┬────────────────┬───────┘
         │                │
         ▼ (Facebook)     ▼ (Instagram)
┌──────────────────┐ ┌──────────────────────────────────────────────┐
│publishToFacebook()│ │publishToInstagram()                          │
└────────┬─────────┘ └──────────────────────┬───────────────────────┘
         │                                  │
         │ (POST /{page_id}/feed)           │ Step 1: POST /{ig_id}/media (create container)
         ▼                                  ▼
┌──────────────────┐                ┌───────────────────────────────┐
│ Facebook Page    │                │ Media Container ID: 179...    │
│ Live Post        │                └───────────────┬───────────────┘
└──────────────────┘                                │ Step 2: POST /{ig_id}/media_publish
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │ Instagram Live Feed Post      │
                                    └───────────────────────────────┘
```

## 5.2 Step-by-Step Meta Production Setup

### Step 1: Link Instagram Professional Account to Facebook Business Page
1. Ensure your Instagram account is switched to a **Professional Account** (Creator or Business). Personal accounts **do not support Graph API publishing**.
2. Open your Facebook Business Page on [Facebook](https://www.facebook.com/).
3. Navigate to **Settings > Linked Accounts > Instagram**.
4. Click **Connect Account**, log in to Instagram, and grant full permissions.

### Step 2: Create a Meta Business App
1. Go to [Meta for Developers](https://developers.facebook.com/) and log in with your Facebook account.
2. Click **My Apps > Create App**.
3. Select **Other** as the use case, then choose **Business** as the app type.
4. Enter:
   - **App Name**: `Digital Wealth Creators Syndicator`
   - **App Contact Email**: Your administrative email.
   - **Business Portfolio**: Select your Meta Business Portfolio.
5. Click **Create App**.

### Step 3: Add Use Cases & Permissions
1. In the App Dashboard under **Add Products / Use Cases**, add:
   - **Facebook Login for Business**
   - **Instagram Graph API**
2. In the **App Review > Permissions and Features** panel, verify and request:
   - `pages_show_list` — List user-administered pages
   - `pages_read_engagement` — Retrieve page analytics and IDs
   - `pages_manage_posts` — Publish status updates and links to the Page feed
   - `instagram_basic` — Read connected Instagram Business account IDs
   - `instagram_content_publish` — Create media containers and publish Instagram posts

### Step 4: Generate User Token & Resolve IDs via Graph API Explorer
1. Navigate to the [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. In the **Meta App** dropdown, select `Digital Wealth Creators Syndicator`.
3. In **User or Page**, select **User Token**.
4. Under **Permissions**, add: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`.
5. Click **Generate Access Token** and complete the permission modal.
6. In the query bar, execute:
   ```http
   GET /v21.0/me/accounts?fields=id,name,access_token,instagram_business_account
   ```
7. The response provides your operational IDs:
   ```json
   {
     "data": [
       {
         "id": "100293847562918",
         "name": "Digital Wealth Creators",
         "access_token": "EAABw...",
         "instagram_business_account": {
           "id": "17841400123456789"
         }
       }
     ]
   }
   ```
   - `FACEBOOK_PAGE_ID`: `100293847562918`
   - `INSTAGRAM_ACCOUNT_ID`: `17841400123456789`

## 5.3 Token Acquisition: Exchanging for Permanent Page Access Tokens

Tokens generated in Graph API Explorer expire after 1–2 hours. Production requires a **Permanent Page Access Token**:

> ⚠️ **Critical Production Caveat — Error Code 190**: Never configure short-lived user tokens in production environment variables (`FACEBOOK_PAGE_ACCESS_TOKEN` / `INSTAGRAM_ACCESS_TOKEN`). Once expired (within 60–120 minutes), all automated publishing hooks and background syndication jobs will crash with `OAuthException` error code 190 (`Error validating access token: Session has expired`). Production requires a permanent Page Access Token obtained through the 2-step exchange below.

1. **Step 1: Obtain 60-Day Long-Lived User Token**:
   Make a GET request replacing `{APP_ID}`, `{APP_SECRET}`, and `{SHORT_LIVED_TOKEN}`. Keep the URL query string on a single clean line to ensure no leading whitespace corrupts parameter names:
   ```bash
   curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}"
   ```
   Response returns `access_token` and `expires_in: 5184000` (60 days).

2. **Step 2: Obtain Never-Expiring Page Access Token**:
   Query the `/me/accounts` endpoint using the **60-day Long-Lived User Token**:
   ```bash
   curl -X GET "https://graph.facebook.com/v21.0/me/accounts?access_token={LONG_LIVED_USER_TOKEN}"
   ```
   The `access_token` returned in the response for your Page will **never expire** (unless page admin credentials are changed or the app is uninstalled).
3. Use this token for both:
   - `FACEBOOK_PAGE_ACCESS_TOKEN`
   - `INSTAGRAM_ACCESS_TOKEN`

## 5.4 Instagram 2-Step Media Container Flow

Instagram does not support raw direct binary uploads in a single request. Publishing requires a 2-step container lifecycle:

### Step 1: Create Media Container
```http
POST https://graph.facebook.com/v21.0/{INSTAGRAM_ACCOUNT_ID}/media
Content-Type: application/json

{
  "image_url": "https://digitalwealthcreators.org.ng/assets/course-cover.png",
  "caption": "New masterclass: AI Workflow Automation! Link in bio. #AI #DigitalWealthCreators",
  "access_token": "{INSTAGRAM_ACCESS_TOKEN}"
}
```
- **Response**: `{ "id": "17923485720194820" }` (Creation Container ID).

### Step 2: Publish Media Container
```http
POST https://graph.facebook.com/v21.0/{INSTAGRAM_ACCOUNT_ID}/media_publish
Content-Type: application/json

{
  "creation_id": "17923485720194820",
  "access_token": "{INSTAGRAM_ACCESS_TOKEN}"
}
```
- **Response**: `{ "id": "18034829105928374" }` (Published Instagram Post ID).

### Media Constraints & Edge Ingestion Architecture
- **Protocol**: Media URL **must** use public `https://` (`publishToInstagram` enforces `/^https:\/\//i.test(imageUrl)`).
- **Format**: JPEG or PNG.
- **Aspect Ratio**: 4:5 to 1.91:1.
- **Maximum File Size**: 8MB.
- **Rate Limit**: 100 API-published posts per 24 hours per Instagram account.

#### Why Instagram Media Containers Strictly Require Public HTTPS URLs (Edge Ingestion Architecture)
When `POST /{ig_user_id}/media` is invoked, Meta does not accept multipart binary payloads or local file attachments. Instead, you supply an `image_url`:
1. **Asynchronous Edge Ingestion**: Meta's distributed edge ingestion workers process container creation asynchronously. Upon receiving the API call, Meta's edge servers dispatch an outbound HTTP `GET` request directly to your public image host to download the image binary.
2. **Public Reachability**: If the URL points to `localhost`, an internal network IP (e.g., `10.x.x.x` or `192.168.x.x`), or requires authentication/cookies that Meta's edge crawlers cannot supply, Meta cannot fetch the binary, triggering an immediate container creation failure (`OAuthException: Failed to fetch image from URL`).
3. **Transport Security (HTTPS)**: Meta strictly enforces public TLS/HTTPS encryption to guarantee data integrity and authenticity during server-to-server asset transfer, preventing intermediate proxy tampering of published brand assets.
4. **Content-Type Validation**: The hosting server must return an HTTP `200 OK` status with an explicit `Content-Type: image/jpeg` or `image/png` header within Meta's ingestion timeout.
- **Format**: JPEG or PNG.
- **Aspect Ratio**: 4:5 to 1.91:1.
- **Maximum File Size**: 8MB.
- **Rate Limit**: 100 API-published posts per 24 hours per Instagram account.

## 5.5 Facebook Page Feed Syndication

Publishes directly to the Page timeline:
```http
POST https://graph.facebook.com/v21.0/{FACEBOOK_PAGE_ID}/feed
Content-Type: application/json

{
  "message": "Transform your career with our hands-on engineering programs. Read our latest article!",
  "link": "https://digitalwealthcreators.org.ng/blog/mastering-ai",
  "access_token": "{FACEBOOK_PAGE_ACCESS_TOKEN}"
}
```
- **Response**: `{ "id": "100293847562918_8472910482019" }` (Page Post ID).

## 5.6 Environment Variables & Immediate Verification

Configure in `.env.local` and Vercel Project Settings:
```env
FACEBOOK_PAGE_ID=100293847562918
FACEBOOK_PAGE_ACCESS_TOKEN=EAABw...
INSTAGRAM_ACCOUNT_ID=17841400123456789
INSTAGRAM_ACCESS_TOKEN=EAABw...
```

### Supported Administrative Authentication Mechanisms (`isAgentAuthorized`)
As with LinkedIn publishing, `POST /api/social/publish` enforces administrative authorization via `isAgentAuthorized` (`src/server/createApp.ts`). The endpoint accepts:
1. **Admin Token Header (`x-admin-token`)** *(Recommended for cURL and automated API tests)*:
   `-H "x-admin-token: <COURSEMART_ADMIN_TOKEN>"`
2. **Admin Session Cookie** *(Browser console sessions)*:
   `-H "Cookie: coursemart_admin_session=<ADMIN_SESSION_TOKEN>; coursemart_admin_role=admin"`
3. **Cron Secret Bearer Token** *(Automated cron and webhook triggers)*:
   `-H "Authorization: Bearer <CRON_SECRET>"`

> ⚠️ **Authentication Warning**: Passing `-H "Authorization: Bearer <ADMIN_TOKEN>"` fails with `401 Unauthorized` because the server specifically checks `x-admin-token`, session cookies, or the exact `CRON_SECRET`.

Trigger an immediate live test via `POST /api/social/publish`:
```bash
# Test Facebook Page Feed
curl -X POST https://digitalwealthcreators.org.ng/api/social/publish \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <COURSEMART_ADMIN_TOKEN>" \
  -d '{
    "platform": "facebook",
    "content": "Digital Wealth Creators automated syndication active on Facebook!",
    "targetUrl": "https://digitalwealthcreators.org.ng"
  }'

# Test Instagram Feed Post
curl -X POST https://digitalwealthcreators.org.ng/api/social/publish \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <COURSEMART_ADMIN_TOKEN>" \
  -d '{
    "platform": "instagram",
    "content": "Master AI with Digital Wealth Creators. Link in bio! 🇳🇬",
    "imageUrl": "https://digitalwealthcreators.org.ng/assets/og-image.png"
  }'
```

---

# Section 6: YouTube Data API v3 & Video Syndication Guide

Digital Wealth Creators provides an automated video syndication metadata engine (`formatYouTubeVideoMetadata`) and a YouTube-to-Course repurposing engine (`repurposeYouTubeToCourse`), formatting video titles, educational category tags, description copy, and structured chapter timestamps for maximum search visibility and student engagement.

## 6.1 Architectural Schema & Data Structures

```
┌────────────────────────────────────────────────────────┐
│ YouTubeSyndicationInput                                │
│   • title: string                                      │
│   • description: string                                │
│   • tags?: string[]                                    │
│   • categoryId?: string (default: '27' [Education])    │
│   • privacyStatus?: 'public' | 'unlisted' | 'private'  │
│   • chapters?: YouTubeChapterMarker[]                  │
│       └─ { timestamp: '00:00', title: 'Intro' }        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
          src/utils/socialSyndication.ts
          formatYouTubeVideoMetadata()
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ YouTubeVideoMetadata                                   │
│   • title: string                                      │
│   • description: fullDescription with \n\nTimestamps:  │
│   • tags: string[]                                     │
│   • categoryId: string ('27')                          │
│   • privacyStatus: 'public'                            │
│   • formattedChapters: "00:00 - Intro\n05:30 - ..."    │
└────────────────────────────────────────────────────────┘
```

## 6.2 Step-by-Step Google Cloud Credentials Setup

### Step 1: Create a Google Cloud Platform Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your existing organization or click **New Project** (e.g. `DWC-Video-Syndication`).
3. Under **APIs & Services > Library**, search for **YouTube Data API v3** and click **Enable**.

### Step 2: Configure OAuth 2.0 Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** and click **Create**.
3. Enter App information:
   - **App name**: `Digital Wealth Creators Video Engine`
   - **User support email**: Your support email.
   - **Developer contact information**: Your technical contact.
4. In the **Scopes** step, add the following required permissions:
   - `https://www.googleapis.com/auth/youtube.upload` — Upload YouTube videos and manage metadata
   - `https://www.googleapis.com/auth/youtube.force-ssl` — View, edit, and permanently delete YouTube videos, ratings, comments, and captions
5. Add test users (your YouTube channel email) under **Test users** while the app is in testing mode.

### Step 3: Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
2. Select **Web application** (or **Desktop app** for CLI tools).
3. Set **Authorized redirect URIs**:
   ```
   https://digitalwealthcreators.org.ng/api/auth/youtube/callback
   http://localhost:3000/oauth2callback
   ```
4. Click **Create** and download the client secret JSON or copy:
   - `Client ID`
   - `Client Secret`

## 6.3 YouTube Video Upload Metadata Specification

For automated video uploads, the YouTube Data API v3 uses a multipart resumable upload endpoint:
- **Endpoint**: `POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
- **Headers**:
  ```http
  Authorization: Bearer <GOOGLE_OAUTH_ACCESS_TOKEN>
  Content-Type: application/json; charset=UTF-8
  X-Upload-Content-Type: video/webm
  ```

### JSON Resource Structure
```json
{
  "snippet": {
    "title": "Mastering Autonomous AI Workflows | Digital Wealth Creators",
    "description": "Complete hands-on engineering walkthrough on building agentic workflows.\n\nOfficial Course & Resources: https://digitalwealthcreators.org.ng/product/ai-workflows\n\nTimestamps:\n00:00 - Introduction & Setup\n05:30 - Architecture Patterns\n15:45 - Live Demonstration\n28:00 - Deployment & Verification",
    "tags": [
      "digital wealth",
      "ai engineering",
      "autonomous agents",
      "typescript",
      "nextjs"
    ],
    "categoryId": "27",
    "defaultLanguage": "en",
    "defaultAudioLanguage": "en"
  },
  "status": {
    "privacyStatus": "public",
    "selfDeclaredMadeForKids": false,
    "license": "youtube"
  }
}
```

## 6.4 YouTube Chapter Timestamps Strict Criteria

YouTube automatically converts text timestamps into clickable interactive video chapters if and only if these 4 rules are met:
1. **The first timestamp MUST begin at `00:00`** (e.g. `00:00 - Introduction`).
2. **Minimum of 3 timestamps** listed in ascending chronological order.
3. **Minimum chapter length**: Each chapter must be at least 10 seconds long.
4. **Format**: `MM:SS - Chapter Title` or `HH:MM:SS - Chapter Title` on separate lines.

`formatYouTubeVideoMetadata` guarantees these standards by joining chapter markers with `\n` and prefixing with `Timestamps:`.

## 6.5 YouTube Video SEO Discovery & Algorithmic Optimization Strategies

1. **Title Keyword Placement**: Front-load high-intent keywords in the first 45 characters (e.g. `Mastering Autonomous AI Workflows — Complete Guide`).
2. **Description Hook (First 120 Characters)**: The first 2 lines appear above the "Show more" fold in Google and YouTube search results. Place your value proposition and primary course URL link here.
3. **Category ID**: Category `27` (**Education**) unlocks educational badges, lesson structuring, and algorithmic delivery to learner audiences.
4. **Tags Hierarchy**: Include 8–15 tags mixing:
   - Broad tags: `education`, `ai`, `programming`
   - Niche tags: `autonomous ai`, `digital wealth creators`, `vibe coding`
   - Exact course title: `mastering autonomous ai workflows`
5. **Made For Kids Declaration**: Set `"selfDeclaredMadeForKids": false`. Setting this to true disables comments, chapter scrubbers, end screens, and subscription notifications.

---

# Section 7: AI Voice, Video Generator & YouTube Repurposer Guide

## 7.1 Revoicer-Style AI Voice & Video Studio Pipeline

The Digital Wealth Creators platform includes an in-browser media production pipeline that transforms step-by-step document tutorials into 1280x720 24fps narrated video guides. The system operates 100% client-side with zero external cloud rendering costs or third-party video generation subscriptions.

### System Architecture Diagram
```
┌────────────────────────────────────────────────────────────────────────┐
│               In-App Tutorial & Video Narrator Engine                  │
├──────────────────────────┬─────────────────────────────────────────────┤
│   Canvas Video Renderer  │        Web Audio / Speech Narration         │
├──────────────────────────┼─────────────────────────────────────────────┤
│ • 1280x720 2D Canvas     │ • Web Audio API AudioContext & GainNode     │
│ • Dark Navy Gradient     │ • 587.33 Hz Harmonic Chimes & 110Hz Ambient │
│ • Diagonal Watermarking  │ • Web Speech API Natural Voice Synthesis    │
│ • 32-Bar Gold Visualizer │ • MediaStreamAudioDestinationNode Stream    │
│ • Syntax-Highlighted IDE │ • Synchronized Step Timeline & Seekbar      │
└────────────┬─────────────┴──────────────────────┬──────────────────────┘
             │                                    │
             ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│         MediaRecorder Combined Stream (24fps WebM Export)              │
│       canvas.captureStream(24) + synthDestination.stream -> WebM       │
└────────────────────────────────────────────────────────────────────────┘
```

### Video Engine Specifications (`src/utils/tutorialVideoEngine.ts`)
- **Resolution & Frame Rate**: 1280x720 pixels (16:9 standard HD) rendered at 24 frames per second (`getVideoNarratorConfig()`).
- **Visual Styling**:
  - Background: 3-stop linear gradient (`#0a0f1d` -> `#0f172a` -> `#020617`) with radial gold accent glow (`rgba(212, 175, 55, 0.12)`) in the top-right corner.
  - Header: Gold brand pill (`#d4af37`) stating `DIGITAL WEALTH CREATORS • AI VIDEO GUIDE` alongside a rounded `STEP {N}` badge.
  - Watermark: Animated diagonal forensic watermark at -22° with 0.08 opacity and continuous drift offset (`driftOffset = progress * 100`) preventing content piracy.
  - Dual Scene Layouts:
    - **Split Code Layout**: Activates when `scene.codeSnippet` is present. Left side renders narration text (19px `-apple-system`) and cyan callout badge (`#38bdf8`); right side renders a syntax-highlighted IDE window (width 596px, height 440px) with macOS window controls (`#ef4444`, `#f59e0b`, `#10b981`), line numbers, and token colors.
    - **Focus Layout**: Activates when `scene.codeSnippet` is absent. Renders 22px centered text (950px max width) with dark navy callout container and gold border (`#d4af37`).
  - Dynamic Waveform Visualizer: 32 vertical bars in gold (`#d4af37`), width 6px, gap 4px, positioned at `(64, height - 45)`. Modulates bar height (4px to 36px) via sinusoidal harmonic functions coupled to `activeAudioLevel` (0..1) and seekbar progress.
  - Seekbar: 4px progress track with gold gradient (`#d4af37` -> `#f59e0b`).

### Audio Narration Engine (`src/utils/audioNarrator.ts`)
- **AudioContext & Gain**: Initializes Web Audio context with master `GainNode` and `MediaStreamAudioDestinationNode`.
- **Harmonic Chimes**: `playChime(587.33, 400)` creates a pleasant slide-transition chime with exponential frequency ramp to `frequency * 1.5` over 80ms, linear attack to target gain over 40ms, and exponential decay.
- **Ambient Focus Track**: `startAmbientTrack()` runs a warm 110Hz A2 fundamental triangle tone for architectural focus.
- **Voice Synthesis**: Uses the browser's `window.speechSynthesis` with `SpeechSynthesisUtterance`. Voice selection scans for high-quality natural voices (`Natural`, `Google`, `Samantha`, `Daniel`, `David`, or `en`). Configures rate (0.75x to 2.0x), volume, and pitch.
- **Combined Media Export (`exportTutorialVideo`)**:
  ```typescript
  const canvasStream = canvas.captureStream(24);
  const audioDestination = lectureAudio.getAudioStreamDestination();
  const combinedStream = audioDestination
    ? new MediaStream([...canvasStream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()])
    : canvasStream;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';

  const recorder = new MediaRecorder(combinedStream, { mimeType });
  // Collects chunks ondataavailable and produces downloadable WebM Blob
  ```

## 7.2 In-App Tutorial Multi-Format Exporter

In `src/utils/tutorialCreator.ts`, tutorials created in the Tutorial Editor can be exported into 4 industry-standard distribution formats with pure deterministic functions:
1. **Markdown (`formatTutorialAsMarkdown`)**: Includes YAML frontmatter (`id`, `title`, `author`, `tags`, `updatedAt`), formatted step headings, syntax-fenced code blocks, callouts, and interactive checklist checkboxes.
2. **HTML (`formatTutorialAsHtml`)**: Full standalone HTML5 document with inline CSS, clean typography, responsive layout, print media styles (`@media print`), and self-contained syntax formatting.
3. **JSON (`formatTutorialAsJson`)**: Raw structured JSON schema for programmatic LMS migrations and headless consumption.
4. **Print-to-PDF**: Invokes browser print styling with high-contrast monochrome typography, page-break preservation, and hidden UI controls.

## 7.3 YouTube URL-to-Course & Content Repurposing Engine

The YouTube Repurposing Engine converts any standard YouTube video, Shorts link, or embed URL into an end-to-end commercial course package, complete with curriculum modules, markdown lecture notes, and multi-channel promotional copy.

### Repurposing Workflow
1. **URL Validation & Video ID Extraction (`src/utils/youtubeRepurposer.ts`)**:
   - Matches standard watch (`watch?v=`), embed (`embed/`), shorts (`shorts/`), and shortlinks (`youtu.be/`) via regex:
     `/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i`
2. **Curriculum & Lesson Generation**:
   - `repurposeYouTubeToCourse(input: YouTubeRepurposingInput)`:
     - Creates privacy-enhanced embed URL: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`.
     - Builds multi-module curriculum (Module 1: Foundations, Module 2: Practical Deployment) with preview flags and durations.
     - Produces structured markdown lesson notes with summaries, key concepts, and practice recommendations.
3. **Cross-Platform Marketing Copy Generation**:
   - `generateYouTubeCourseSocialSnippets(course)`:
     - Facebook: High-conversion promotional announcement.
     - LinkedIn: Professional curriculum launch copy with author attribution.
     - X (Twitter): Punchy release update with URL.
     - Instagram: Visual caption with relevant community hashtags.
     - WhatsApp Group: Formatted bold announcement with 1-click product link.
     - YouTube: Video metadata description with SEO tags and chapter timestamps (`00:00 - Introduction`, `15:00 - Architecture`, `30:00 - Implementation`).
4. **Server API Endpoint**:
   - `POST /api/repurpose/youtube` with rate-limiting (30 requests/minute per IP).

## 7.4 Local AI Proxy Architecture (`http://localhost:8080`)

The application is engineered to interface with the local permanent AI Proxy running at `http://localhost:8080` (configured via Windows environment variable `GOOGLE_GEMINI_BASE_URL`).

### AI Proxy Topology & Free Pooled Models
```
┌────────────────────────────────────────────────────────────────────────┐
│            Local AI Proxy Service (http://localhost:8080)              │
│       Registered in Windows Task Scheduler & Startup (%APPDATA%)       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Groq Fast Tier:                                                     │
│    • qwen/qwen3.8-27b, openai/gpt-oss-120b, openai/gpt-oss-20b        │
│ 2. OpenRouter Free Tier:                                               │
│    • cohere/north-mini-code:free, liquid/lfm-3-1.7b:free,              │
│      inclusionai/ling-3.2-flash:free, baidu/ernie-5.5-flash:free,      │
│      nvidia/nemotron-3.5-lightning:free, google/gemma-4-31b-it:free    │
│ 3. Gemini AI Studio Tier:                                              │
│    • gemini-3.8-flash, gemini-3.5-flash, gemini-flash-latest           │
└────────────────────────────────────────────────────────────────────────┘
```

### Operational Guardrails & Shields
1. **Zero-Rate-Limit Auto-Failover**: If a model hits HTTP 429 (rate limit) or HTTP 503 (server spike), the proxy automatically retries on the next model in the pool without dropping requests or throwing errors to the client application.
2. **SHA-256 Semantic Caching**: Duplicate prompts and outline generation queries are hashed with SHA-256. Identical calls return instantaneously from the local cache with zero external network egress and zero live token burn.
3. **Hard Output Token Clamping**: A ceiling of 4096 tokens per completion is enforced to prevent runaway generation loops.
4. **Test Suite Isolation**: All unit, integration, and E2E test suites use offline deterministic mocks and local stubs. Tests never invoke live AI model endpoints.

---

# Section 8: Quality & Offline Verification Protocol

The platform implements strict verification guardrails ensuring zero broken builds, zero live token leakage, and complete offline determinism across all environments.

## 8.1 Offline Deterministic Mocking Architecture

All unit and E2E test suites run in sandboxed or offline CI/CD pipelines without requiring live external API credentials or active internet connectivity.

### Testing Harness (`src/server/e2eTestSuite.test.ts`)
- **Native Test Runner**: Uses Node.js native test runner (`node:test`, `node:assert/strict`) executed via `tsx`.
- **In-Process Ephemeral Server**: The Express API is instantiated via `createApiApp()` and bound to an ephemeral port (`server = app.listen(0, '127.0.0.1')`). The base URL is dynamically determined from `(server.address() as AddressInfo).port` and torn down cleanly in `after()`.
- **Global Fetch Interception**:
  ```typescript
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Loopback test calls pass directly to the in-process server
    if (urlStr.startsWith('http://127.0.0.1') || urlStr.startsWith('http://localhost')) {
      return originalFetch(input, init);
    }

    // Deterministic offline stubs for external APIs
    if (urlStr.includes('pubsubhubbub') || urlStr.includes('superfeedr')) {
      return new Response(null, { status: 204 });
    }
    if (urlStr.includes('google.com/ping') || urlStr.includes('bing.com/ping')) {
      return new Response('OK', { status: 200 });
    }
    if (urlStr.includes('indexing.googleapis.com')) {
      return new Response(JSON.stringify({ urlNotificationMetadata: { latestUpdate: { notifyTime: new Date().toISOString() } } }), { status: 200 });
    }
    if (urlStr.includes('api.linkedin.com')) {
      return new Response(JSON.stringify({ id: 'urn:li:share:mock_share_id' }), { status: 201, headers: { 'x-restli-id': 'urn:li:share:mock_share_id' } });
    }
    if (urlStr.includes('graph.facebook.com')) {
      return new Response(JSON.stringify({ id: 'mock_meta_post_id' }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  ```

## 8.2 4-Tier Test Suite Structure

| Tier | Category | Focus Areas |
| :--- | :--- | :--- |
| **Tier 1** | **Feature Coverage** | Core unit tests for SEO sitemap/robots generation, structured JSON-LD schemas, Google indexing pings, LinkedIn REST posts, Instagram 2-step media flow, Facebook Page syndication, YouTube repurposing, and tutorial video rendering. |
| **Tier 2** | **Boundary & Corner Cases** | Empty strings, special XML characters, malformed URLs, missing Bearer tokens, HTTP 429 rate limit responses, and payload size thresholds. |
| **Tier 3** | **Cross-Feature Combinations** | Multi-channel workflows: publishing an article triggers sitemap update + Google Indexing API ping + WebSub notification + LinkedIn/Instagram/Facebook syndication + signed HMAC webhook dispatch. |
| **Tier 4** | **Real-World Scenarios** | Complete end-to-end user journeys: student catalog navigation, tutorial creation and export (Markdown/HTML/JSON), YouTube video repurposing to course curriculum, and checkout session simulation. |

## 8.3 Quality Verification Commands

Before any commit or deployment, the following 3-step verification sequence must be executed:

```bash
# 1. TypeScript Typecheck & Lint (0 errors allowed)
npm run lint

# 2. Automated Offline Unit & E2E Tests (100% pass required)
npm test

# 3. Production Vite Bundle Compilation
npm run build
```

---

# Section 9: Git Automation & Vercel Production Deployment Protocol

The repository is configured for autonomous git synchronization and continuous Vercel deployment with zero manual typing required.

## 9.1 Universal Git Automation Protocol

Whenever features, bugfixes, or configuration updates are implemented:
1. **Local Verification**: Verify `npm run lint`, `npm test`, and `npm run build` pass with zero errors.
2. **Stage Changes**:
   ```bash
   git add .
   ```
3. **Semantic Commit**:
   ```bash
   git commit -m "feat(milestone): comprehensive description of verified update"
   ```
4. **Push to GitHub**:
   ```bash
   git push origin main
   ```
   *Repository Remote*: `https://github.com/scholarsuite25-netizen/coursemart.git`

## 9.2 Vercel Project & Team Linking

The repository is linked to Vercel Team `digitalwealthcreators-projects` (`team_KO2A4taoxmCSQgmB3vbao42B`) under project ID `prj_9p2IJ6Jk4ldpEeVvdV85eKWD8I8M` (`coursemart`).

### Linking Commands
```bash
# Link project to Vercel team scope
npx vercel link --yes --scope digitalwealthcreators-projects
```

### `.vercel/project.json` Configuration
```json
{
  "projectId": "prj_9p2IJ6Jk4ldpEeVvdV85eKWD8I8M",
  "orgId": "team_KO2A4taoxmCSQgmB3vbao42B",
  "projectName": "coursemart",
  "settings": {
    "framework": "vite",
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "nodeVersion": "26.x"
  }
}
```

## 9.3 Environment Variable Synchronization

To ensure production and preview environments match local runtime configuration:

```bash
# Pull latest production environment variables into .env.local
npx vercel env pull .env.local

# Supply key operational secrets to Vercel Production & Preview
npx vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production preview
# Note: Alternate alias GOOGLE_INDEXING_CLIENT_EMAIL is also supported
npx vercel env add GOOGLE_PRIVATE_KEY production preview
# Note: Alternate alias GOOGLE_INDEXING_PRIVATE_KEY is also supported
npx vercel env add LINKEDIN_ACCESS_TOKEN production preview
npx vercel env add LINKEDIN_AUTHOR_URN production preview
npx vercel env add FACEBOOK_PAGE_ID production preview
npx vercel env add FACEBOOK_PAGE_ACCESS_TOKEN production preview
npx vercel env add INSTAGRAM_ACCOUNT_ID production preview
npx vercel env add INSTAGRAM_ACCESS_TOKEN production preview
npx vercel env add SOCIAL_DISPATCH_WEBHOOK_URL production preview
# Note: Alternate alias SOCIAL_WEBHOOK_URL is supported for backward compatibility
npx vercel env add SOCIAL_WEBHOOK_SECRET production preview
npx vercel env add GEMINI_API_KEY production preview
npx vercel env add GEMINI_MODEL production preview
npx vercel env add GOOGLE_GEMINI_BASE_URL production preview
npx vercel env add SUPABASE_URL production preview
npx vercel env add SUPABASE_SECRET_KEY production preview
npx vercel env add PAYSTACK_SECRET_KEY production preview
```

## 9.4 Production Deployment & Verification Protocol

### Immediate Production Deployment
```bash
npx vercel --prod --yes
```

### Live Domain Verification Checklist (`https://digitalwealthcreators.org.ng`)
Following deployment, verify the live platform endpoints:

| Endpoint | Expected Status | Validation Criteria |
| :--- | :--- | :--- |
| `GET https://digitalwealthcreators.org.ng` | `200 OK` | HTML title contains `Digital Wealth Creators`; SPA root mounts cleanly. |
| `GET https://digitalwealthcreators.org.ng/sitemap.xml` | `200 OK` | `Content-Type: application/xml`; contains valid `<urlset>` with courses, blogs, and tutorials. |
| `GET https://digitalwealthcreators.org.ng/robots.txt` | `200 OK` | `Content-Type: text/plain`; references `Sitemap: https://digitalwealthcreators.org.ng/sitemap.xml`. |
| `GET https://digitalwealthcreators.org.ng/feed.xml` | `200 OK` | `Content-Type: application/xml`; contains valid RSS 2.0 `<rss><channel>` items. |
| `GET https://digitalwealthcreators.org.ng/api/store` | `200 OK` | Returns JSON payload with synchronized store state (`coursemart_kv_store`). |
| `POST https://digitalwealthcreators.org.ng/api/social/publish` | `200 OK` / `400` | Responds with JSON structure; rejects missing draft with descriptive message. |
| `POST https://digitalwealthcreators.org.ng/api/repurpose/youtube` | `200 OK` / `400` | Rejects missing URL; returns structured curriculum package when valid URL supplied. |
