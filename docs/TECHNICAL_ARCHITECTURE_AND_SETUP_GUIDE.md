# Digital Wealth Creators — Technical Architecture & Operational Setup Guide

> **Official Live Production Platform**: [https://digitalwealthcreators.org.ng](https://digitalwealthcreators.org.ng)  
> **Repository**: `https://github.com/scholarsuite25-netizen/coursemart.git`  
> **Deployment**: Vercel Fluid Compute Edge Serverless Function (`api/index.ts`) + Vite 8.3 React 19 Client SPA.

---

## 1. System Architecture Overview

Digital Wealth Creators is an autonomous digital marketplace, learning management system (LMS), and monetization accelerator designed to turn every visitor and free registrant into a paying customer through behavioral triggers, AI-powered content workflows, and automated social syndication.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Digital Wealth Creators Platform                       │
├────────────────────────────────┬────────────────────────────────────────┤
│           Client SPA           │          Vercel Serverless             │
├────────────────────────────────┼────────────────────────────────────────┤
│ • React 19 + Vite 8.3 + PWA    │ • Dynamic /sitemap.xml & /robots.txt   │
│ • Schema.org JSON-LD (SeoHead) │ • Google Indexing API v3 Dispatcher    │
│ • 105-Prompt VIP Vault         │ • WebSub & Search Engine Ping Hubs     │
│ • Tripwire Welcome OTO (₦2,500)│ • Social Multi-Channel Syndication API │
│ • Exit-Intent Deal Closer      │ • YouTube-to-Course Conversion Engine  │
│ • Revoicer Canvas Video Studio │ • Weekly Newsletter Digest Cron        │
│ • Dual Paystack + GTBank Hub   │ • Supabase KV Dual Persistence         │
└────────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. Zero-Cost Operational API Stack

All external automation in Digital Wealth Creators is built to run on permanent zero-cost API tiers:

| Provider / Protocol | Function | Cost & Limit | Environment Variables |
| :--- | :--- | :--- | :--- |
| **IndexNow** (Bing / Yandex) | Instant URL indexing on content publication | Free (10,000 URLs/day) | `INDEXNOW_KEY` |
| **Google Indexing API v3** | Instant URL crawl alert to Googlebot | Free (200 URLs/day) | `GOOGLE_INDEXING_CLIENT_EMAIL`, `GOOGLE_INDEXING_PRIVATE_KEY` |
| **LinkedIn REST Posts API** | Automated article & post shares | Free (100–150 posts/day) | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN` |
| **Meta Graph API (Facebook)** | Auto-post to Facebook Page feed | Free (Unlimited Page feeds) | `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` |
| **Meta Graph API (Instagram)** | 2-step media container image posts | Free (100 posts / 24 hrs) | `INSTAGRAM_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN` |
| **YouTube Data API v3** | Video metadata, chapters, timestamps | Free (10,000 units/day) | YouTube Client OAuth / Bearer |
| **Microsoft Edge-TTS** | Neural voice narration (Nigerian & US) | 100% Free / Open Source | No API key required |
| **Paystack Inline** | Card, USSD & Bank Instant Checkout | 1.5% transaction fee only | `PAYSTACK_SECRET_KEY`, `VITE_PAYSTACK_PUBLIC_KEY` |

---

## 3. Step-by-Step Production Credential Setup

### A. Google Search Console & Google Indexing API
1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project: `DWC-SEO-Platform`.
2. Enable the **Web Search Indexing API**.
3. Navigate to **IAM & Admin > Service Accounts** and create a service account (e.g. `dwc-indexer@dwc-seo-platform.iam.gserviceaccount.com`).
4. Generate a JSON private key and copy:
   - `client_email` → Set in Vercel as `GOOGLE_INDEXING_CLIENT_EMAIL`.
   - `private_key` → Set in Vercel as `GOOGLE_INDEXING_PRIVATE_KEY`.
5. Open [Google Search Console](https://search.google.com/search-console) for `digitalwealthcreators.org.ng`:
   - Go to **Settings > Users and permissions**.
   - Add the service account email as an **Owner**.

### B. IndexNow (Bing & Yandex Instant Indexing)
1. Generate a random 32-character hexadecimal key (e.g., `4e7c1f8a9b2d3e4f5a6b7c8d9e0f1a2b`).
2. Add to Vercel as `INDEXNOW_KEY`.
3. Create a static file `public/4e7c1f8a9b2d3e4f5a6b7c8d9e0f1a2b.txt` matching your key.

### C. LinkedIn Developer App
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/) and click **Create App**.
2. Associate the app with your LinkedIn Company Page (`Digital Wealth Creators`).
3. In the **Products** tab, add **Share on LinkedIn** and **Sign In with LinkedIn**.
4. Generate an OAuth 2.0 access token with `w_member_social` or `w_organization_social` scope.
5. Set environment variables:
   - `LINKEDIN_ACCESS_TOKEN`: The bearer token.
   - `LINKEDIN_AUTHOR_URN`: `urn:li:organization:<YOUR_PAGE_ID>` or `urn:li:person:<YOUR_ID>`.

### D. Meta Graph API (Facebook Page & Instagram Business)
1. Visit [Meta for Developers](https://developers.facebook.com/) and create a Business App.
2. Add **Facebook Login for Business** and **Instagram Graph API**.
3. In **Graph API Explorer**, generate a **Page Access Token** with permissions:
   - `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`.
4. Convert it to a Never-Expiring Long-Lived Page Access Token using:
   ```
   GET https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}
   ```
5. Set environment variables in Vercel:
   - `FACEBOOK_PAGE_ID`: Your Facebook Page ID.
   - `FACEBOOK_PAGE_ACCESS_TOKEN`: The long-lived page token.
   - `INSTAGRAM_ACCOUNT_ID`: Connected Instagram Business account ID.
   - `INSTAGRAM_ACCESS_TOKEN`: Same long-lived page token.

---

## 4. Monetization & High-Conversion Funnel Triggers

To fulfill the primary goal that **"all visitors who sign up must end up becoming paying customers at all cost"**, four automated psychological deal-closing mechanisms are deployed:

1. **Tripwire Welcome Offer Modal (`src/components/storefront/TripwireWelcomeModal.tsx`)**:
   - Triggers 4 seconds after a visitor lands or registers.
   - 15-minute countdown clock showing a 90% discount on the **105-Prompt VIP Vault**.
   - Price drops from ₦25,000 to **₦2,500** with 1-click cart addition and instant Paystack / GTBank checkout.

2. **Exit-Intent Deal Closer (`src/components/storefront/ExitIntentModal.tsx`)**:
   - Fires on desktop when the cursor moves towards the top window close bar.
   - Fires on mobile upon rapid upward scroll (>250px up in <200ms) or back-button press.
   - Activates an instant **85% discount coupon (`SAVE85`)** valid for 10 minutes.

3. **Dual Payment Gateway Architecture**:
   - **Paystack**: Instant card, bank transfer, USSD, Apple Pay.
   - **GTBank Manual Transfer**: Direct account `0029103844` (Tintol Business Services) with automated WhatsApp verification link (+2348034710699).

4. **Weekly Monday Newsletter Digest (`/api/cron/weekly-newsletter`)**:
   - Fires automatically every Monday at 08:00 UTC via Vercel Cron.
   - Collects all newly published courses, tutorials, and articles from the last 7 days and delivers a branded digest to all opted-in subscribers.

---

## 5. Content Creation & YouTube Repurposing Engine

1. **YouTube URL to Course Repurposer**:
   - Available in the Instructor Studio (`/instructor`) and Admin Dashboard (`/admin`).
   - Paste any YouTube link (`watch?v=`, `youtu.be/`, or `/shorts/`).
   - The engine automatically parses the video ID, segments the content into a 3-Module, 6-Lecture curriculum with preview lectures, and produces customized marketing copy for Facebook, LinkedIn, and YouTube SEO timestamps.
2. **Revoicer-Style AI Video & Tutorial Studio**:
   - Create step-by-step interactive tutorials with rich code snippets, checklists, and callout notes.
   - Export with one click to formatted **Markdown (`.md`)**, styled **HTML**, **JSON**, or print-optimized **PDF**.
   - Generate automated 1280x720 24fps narrated video walkthroughs rendered directly in the browser using HTML5 Canvas and Web Audio MediaRecorder with zero external API fees.

---

## 6. Verification & Deployment Protocol

Whenever changes are made:
```bash
# 1. Run unit & E2E tests (500 tests)
npm test

# 2. Compile production bundle
npm run build

# 3. Synchronize with GitHub
git add .
git commit -m "feat(milestone): deploy updates"
git push origin main

# 4. Deploy to Vercel Production
npx vercel --prod --yes
```
