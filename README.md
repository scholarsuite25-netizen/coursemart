# Coursemart — Digital Marketplace & LMS

A full-stack digital marketplace and learning platform: storefront, courses, DRM-free
digital products, software licenses, memberships, affiliates, events, blog, community
tools, and an instructor/admin studio — plus Paystack checkout (NGN), transactional
email, and Gemini-assisted editorial workflows.

## Stack

- **Frontend:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 (SPA, client-side routing)
- **Backend:** Express (TypeScript, run directly via `tsx`)
- **State sync:** Supabase Postgres key-value store (`coursemart_kv_store`) with a
  local file-store fallback for zero-config local dev
- **Auth:** HttpOnly HMAC session cookies — admin (`coursemart_admin_session`) and
  regular users (`coursemart_user_session`), both verified server-side
- **Payments:** Paystack (initialize → verify → webhook, with expected-amount enforcement)
- **AI:** Google Gemini for article/social-draft generation (optional)

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install        # install dependencies
npm run dev        # start dev server on http://localhost:3000
```

Other scripts:

| Script            | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Dev server (Express + Vite middleware), :3000  |
| `npm run build`   | Production build to `dist/`                    |
| `npm start`       | Run the server (same as dev)                   |
| `npm run preview` | Preview the production build                   |
| `npm run lint`    | Type-check (`tsc --noEmit`)                    |
| `npm test`        | Unit tests (node:test via tsx)                 |
| `npm run clean`   | Remove `dist/` and build artifacts (cross-platform) |

Copy `.env.example` to `.env` and fill in what you need — everything is optional for
local dev (the app degrades gracefully; Supabase falls back to the local runtime store,
payments/email/AI report as unconfigured).

### Environment variables

| Key                          | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `GEMINI_API_KEY`             | Gemini AI article/social-draft generation           |
| `GEMINI_MODEL`               | Optional Gemini model override                      |
| `APP_URL`                    | Public app URL (canonical links, webhooks)          |
| `PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` | Paystack NGN checkout (live mode)       |
| `EMAILBUMP_API_KEY` / `RESEND_API_KEY` / `BREVO_API_KEY` + `EMAIL_FROM` + `EMAIL_PROVIDER` | Transactional email |
| `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (+ `VITE_*` publishable pair) | Persistent KV state sync       |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | Admin console credentials & session signing |

**Production checklist**

1. Run `supabase/schema.sql` in the Supabase SQL Editor (only `coursemart_kv_store`
   is required — see the STATUS note in that file).
2. Set `ADMIN_EMAIL`, a strong `ADMIN_PASSWORD`, and a 32+ char `ADMIN_SESSION_SECRET`.
3. Set `PAYSTACK_SECRET_KEY` and register the webhook URL
   (`https://<domain>/api/paystack/webhook`) in the Paystack dashboard.
4. Never commit `.env` or credentials. If a secrets file has ever been committed,
   rotate those keys/passwords — deleting the file does not un-leak them.

## Architecture notes

- **KV sync (`/api/store`)** — the client hydrates all shared collections from
  `GET /api/store` at boot and pushes changed collections to `PUT /api/store/:key`.
  Merge/write policies live in `src/utils/storeSync.ts` and are enforced server-side
  from the session cookie: admins get replace semantics for catalog keys, instructors
  may upsert only their own products, signed-in users upsert only their own records,
  and anonymous visitors get append-only writes with contact PII stripped from reads.
- **Passwords** — stored as PBKDF2-SHA256 (`pbkdf2$<iterations>$<salt>$<hash>`) via
  `src/utils/passwordHash.ts`; legacy plaintext records still verify and are migrated
  on hydration/login.
- **Payments** — the expected amount (kobo) is recorded per reference at
  `/api/paystack/initialize` and enforced at `/api/paystack/verify` and the webhook,
  so a settled transaction for the wrong amount is never marked verified.
- **Code splitting** — routes load as separate chunks (`React.lazy` in `src/App.tsx`);
  the build fails if credential `.txt` files end up in `public/` or `dist/assets/`.

## Platform Capabilities & Promoter Showcase

- **Floating WhatsApp Instant Help Widget**: Context-aware floating support linked to `+2348034710699` across mobile and desktop.
- **Executive Completion Certificate & QR Verification**: Auto-triggered certificate modal with live QR verification pointing to `/verify-certificate?id=...`.
- **In-Player Student Notes**: Timestamped note-taking with clickable video seeking and 1-click formatted document / PDF export.
- **1-Click Dark / Theater Mode**: Global theme switcher with `localStorage` persistence across catalog, header, and LMS video player.
- **PWA "Add to Home Screen" Prompt**: Floating installation banner with deferred prompt capture for offline-ready mobile & desktop experience.
- **S. B. OMOTOSO Executive Promoter Profile**: Dedicated `/promoter` profile (with `/facilitator` and `/speaker` routes), live availability calendar, and 11-field facilitator invitation booking system with structured WhatsApp notification dispatch.
- **Vercel Hobby Tier Exploration**: Complete $0 optimization guide in `docs/VERCEL_HOBBY_EXPLORATION.md` covering Web Analytics, Speed Insights, Edge Config, Blob Storage, Fluid Compute, WAF, and Cron schedules.

## Tests

```bash
npm test
```

Covers merge/read policies, password hashing, user session tokens, Paystack
expected-amount verification, and the existing commerce/events/whatsapp utilities.
