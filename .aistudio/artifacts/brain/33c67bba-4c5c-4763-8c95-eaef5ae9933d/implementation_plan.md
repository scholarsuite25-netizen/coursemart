# Coursemart Platform Expansion — AI Editorial Studio, Full LMS, Digital Commerce, Memberships, Affiliates & Showcase

Upgrade Coursemart into a complete creator commerce and learning suite combining a rich block-based editorial studio with Gemini AI article and image generation, full Udemy-caliber course learning features, complete digital e-commerce checkout and licensing workflows, tiered membership access, a self-serve affiliate referral engine, and a dedicated Showcase directory.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Clarification**
> - **AI Article Writer & Imagery**: Server-side Gemini AI article generation paired with Gemini AI image generation, curated media presets, and manual image uploads for both featured covers and inline article body images.
> - **Membership Access Model**: Tiered plans (*Starter*, *Pro*, *VIP*) that unlock tier-eligible courses, digital products, automatic store discounts, and VIP community perks.
> - **Affiliate Program**: Open self-serve enrollment for any signed-in user with instant referral links (`?ref=CODE`), live click/conversion tracking, and GTB/bank payout requests.
> - **Showcase Cards**: Clean minimal cards displaying the website image, website name, website URL, and a direct **Visit** action button.

> [!IMPORTANT]
> **Paid API Key Requirement for AI Image Generation**
> - Server-side article generation will use `gemini-4-hydrogen` via `@google/genai`, while AI-generated featured and inline article images will use `gemini-3.1-flash-lite-image`.
> - Per `@google/genai` requirements, image generation models require a billing-enabled API key. Before enabling AI image generation in execution, the interactive Paid Model Key prompt (`paid_model_flow`) will be presented, and `@google/genai` will be upgraded from `2.4.0` to the latest SDK release alongside a full-stack Express server entry point.

---

## 1. Overview & Core Concept

- **What It Does**: Extends Coursemart across six integrated pillars:
  1. **Editorial CMS & AI Article Writer**: A rich, block-based article composer in the Admin and Instructor dashboards supporting headings, formatted prose, pull quotes, code blocks, callouts, checklists, product embeds, featured images, and inline body images—plus a one-click AI Article Writer that drafts complete structured articles and generates matching imagery from a title.
  2. **Full-Featured Courses & LMS**: Expands courses with interactive module quizzes, lesson preview trailers, timestamped student notes, course announcements, Q&A discussions, rating breakdown histograms, progress tracking across lectures and quizzes, and verifiable completion certificates.
  3. **Complete Digital Product E-Commerce**: Adds product variants/editions (Personal, Team, Commercial), multi-image preview galleries, interactive sample previews, release changelogs, "Frequently Bought Together" cross-sells, itemized invoices, download/activation limits, and refund request workflows.
  4. **Tiered Membership Engine**: Monthly and annual membership plans (*Starter*, *Pro*, *VIP*) granting direct course enrollment, included digital resource downloads, automatic cart discounts, and subscriber management.
  5. **Affiliate & Referral Hub**: Self-serve partner activation, product-specific referral link generator, automatic attribution via URL parameters, commission ledger, and payout request queue managed by Admin.
  6. **Showcase Directory**: A dedicated top-level menu and page presenting client/community websites as clean visual cards with image, name, URL, and visit button, managed directly from the Admin Console.
- **Target Audience**: Course creators, technical authors, agency teams, aspiring members, and affiliate partners using a single unified storefront and operations console.
- **Key Value**: Eliminates external plugins or third-party tools by unifying content marketing (AI-assisted blogs), monetization (direct sales, memberships, affiliates), product delivery (LMS + licenses), and portfolio proof (Showcase).

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Manual & AI Blog Authoring Flow**:
   - Admin or Instructor opens **Blogs -> New Article** inside the backend studio.
   - *AI Writer path*: Enters an **Article Title**, selects Category (`AI`, `Mentorship`, `Leadership`, `Vibe Coding`, `Apps Deployment`) and Tone, toggles "Generate Featured & Inline Images", and clicks **Generate Full Article**. The server calls Gemini to produce structured blocks, SEO metadata, tags, product matches, a featured cover image, and inline section images—populating the visual block editor for final human refinement.
   - *Manual Editor path*: Builds or edits blocks directly using the formatting toolbar, reorders blocks, uploads custom local images or pastes URLs for the featured cover and inline body blocks, toggles live preview, and publishes or schedules.
2. **Udemy-Grade Course Learning Flow**:
   - Visitor explores course detail page (preview trailer modal, rating histogram, curriculum modules with quiz/resource indicators, and member-access badge) and either purchases, buys as a bundle, or unlocks immediately via an active Membership tier.
   - Inside the Course Player, the learner watches/plays lessons at variable speed, jumps via chapter markers, completes interactive module quizzes with instant feedback, pins timestamped notes, posts in Q&A, and downloads a verifiable Certificate at 100% completion.
3. **Digital Commerce & Checkout Flow**:
   - Shopper selects an edition/format variant on a digital product (eBook, Template, Prompt Pack, Toolkit, Software), inspects the gallery & changelog, adds cross-sell bundles in the cart drawer, receives automatic Membership discounts or coupon reductions, pays via Card or GTB Bank Transfer + WhatsApp confirmation, and downloads an itemized invoice plus assets/license keys in **My Library**.
4. **Membership & Affiliate Loops**:
   - Visitors browse `/membership`, toggle Monthly/Annual billing, compare plan limits in a structured table, and subscribe (updating account perks immediately).
   - Signed-in users open `/affiliates`, activate their partner profile in one click, copy a `?ref=` link for any product, watch referral clicks and attributed commissions accumulate in their ledger, and submit a payout request to their bank account.
5. **Showcase Discovery Flow**:
   - Clicking **Showcase** in the top navigation opens `/showcase`, presenting a clean grid of minimal cards (image, website name, URL, and **Visit** link), curated via the Admin Showcase tab.

### Visual Identity & Theme

- **Aesthetic Direction**: High-authority **Navy Blue & Gold** storefront (`#0a192f` primary navy, `#d4af37` / `#f5c451` warm gold) paired with crisp editorial white (`#ffffff`) and cool neutral structural surfaces (`#f8fafc`), contrasted with the dark charcoal operations sidebar (`#1d2327`) and royal blue actions (`#2271b1`) inside the Admin Console.
- **Typography & Hierarchy**: Retain the established `Plus Jakarta Sans` / `DM Sans` display & body pairing with `JetBrains Mono` (`tabular-nums`) for all prices, analytics, referral earnings, and license keys. Headlines enforce balanced wrapping; metadata stays unboxed with typographic middot (`·`) separators rather than cluttered pill clusters.
- **Spatial & Layout Discipline**:
  - Top bar preserves a clean single-line navigation layout (`Courses`, `Digital Products`, `Software`, `Membership`, `Showcase`, `Blogs`) with `Browse` mega-menu, search, wishlist, cart, and account access—never wrapping on desktop and collapsing cleanly into the mobile drawer on `390px` viewports.
  - E-commerce product cards and Showcase cards enforce uniform aspect ratios (`4:3` / `16:9`), single-level elevation (`border border-slate-200`), and clear focal actions.
  - Backend Article Studio uses a two-column split: main block canvas on the left (`~70%`) and document inspector sidebar (AI Writer drawer, Featured Image, SEO, Category, Status, Related Products) on the right (`~30%`).

---

## 3. Key Product Decisions & Trade-Offs

- **Full-Stack Express Server (`server.ts`) for AI Generation**:
  - *Chosen Approach*: Mount Vite inside an Express server (`tsx server.ts`) exposing `/api/gemini/article` and `/api/gemini/image` endpoints while preserving `localStorage` persistence for instant client state reactivity.
  - *Why*: Keeps the Gemini API key strictly on the server as required by SDK guidelines while avoiding database setup friction for immediate interactive testing.
  - *Alternatives Considered*: Client-side SDK calls (disallowed due to API key exposure) or migrating all storefront records to a remote database (unnecessary for this phase).
- **Structured Block Model + Inline Media for Articles**:
  - *Chosen Approach*: Upgrade article sections to typed editorial blocks (rich paragraph, heading, image block with upload/AI/URL + caption + alignment, quote, code, callout, checklist) stored cleanly on each blog post.
  - *Why*: Enables full drag/button reordering, live visual preview, and seamless rendering of AI-generated or uploaded inline body images without fragile arbitrary HTML injection.
  - *Alternatives Considered*: Raw HTML `contentEditable` blobs (prone to layout breakage and broken relative image sizing).
- **Client-Side Referral Attribution (`?ref=`) + Tiered Membership Store State**:
  - *Chosen Approach*: Capture `?ref=` query parameters on route initialization into session/local storage and evaluate active membership entitlements + discounts dynamically inside the commerce utility layer.
  - *Why*: Ensures pure commerce functions (discount stacking, commission calculation, access resolution) remain deterministic and 100% unit-testable via `node:test`.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Express Server (server.ts :3000)                      │
│  ┌───────────────────────────────┐    ┌───────────────────────────────────┐  │
│  │ Vite Middleware / Static Dist │    │ Gemini AI Proxy (/api/gemini/*)   │  │
│  │  • Serves React SPA           │    │  • POST /api/gemini/article       │  │
│  └───────────────────────────────┘    │    (gemini-4-hydrogen JSON)       │  │
│                                       │  • POST /api/gemini/image         │  │
│                                       │    (gemini-3.1-flash-lite-image)  │  │
│                                       └───────────────────────────────────┘  │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ fetch /api/gemini/*
┌───────────────────────────────────────▼──────────────────────────────────────┐
│                     React Application & StoreContext                         │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Pure Logic & Domain Calculators (Unit Tested via node:test)            │  │
│  │  • Commerce: variants, bundles, member discounts, invoices, tax        │  │
│  │  • LMS: lecture + quiz progress, certificate eligibility & codes       │  │
│  │  • Affiliate: ?ref= attribution, commission math, payout validation    │  │
│  │  • Editorial: block serialization, word count, read time, SEO slugs    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Public & Learner Surfaces │  │ Operations & Authoring Studios          │  │
│  │  • Storefront & Catalogs  │  │  • Admin Console (Tabs: Dashboard,      │  │
│  │  • Product PDP (Variants, │  │    Products, Blogs, Orders, Membership, │  │
│  │    Bundles, Changelogs)   │  │    Affiliates, Showcase, Coupons,       │  │
│  │  • Course Player (Video,  │  │    WhatsApp, Users, Appearance)         │  │
│  │    Quizzes, Notes, Certs) │  │  • Full Article Studio (Block Toolbar + │  │
│  │  • Blogs Reader + Images  │  │    AI Writer + Media Library / Upload)  │  │
│  │  • Membership Plans Page  │  │  • Instructor Studio (Courses & Blogs)  │  │
│  │  • Affiliate Partner Hub  │  └─────────────────────────────────────────┘  │
│  │  • Showcase Directory     │                                               │
│  └───────────────────────────┘                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **BlogPost & Editorial Blocks**: Expands `BlogSection` into rich typed blocks (`paragraph`, `heading`, `image`, `quote`, `code`, `callout`, `checklist`) supporting `imageUrl`, `imageCaption`, `imageAlt`, `imageAlign`, `seoTitle`, `seoDescription`, `scheduledAt`, and `mediaAssets`.
- **Course & LMS Extensions**: Adds `CourseQuiz` (questions, choices, correct index, explanation) on modules, `CourseAnnouncement`, `quizScoresByModule` and `certificateId` inside `CourseProgress`, and timestamped notes (`{ timeLabel, text }`).
- **Digital E-Commerce Extensions**: Adds `ProductVariant` (edition name, format, price delta, license limit), `galleryImages`, `bundleIds`, `downloadLimit` & `downloadCount` on orders/library entitlements, `OrderStatus` timeline + `refundRequested`/`refundReason`, and `taxRate` calculation.
- **Membership Entities**: `MembershipPlan` (`starter`, `pro`, `vip`, monthly/annual pricing, discount percent, unlocked categories/tiers, perks list) and `UserMembership` (`userId`, `planId`, `billingCycle`, `status`, `renewsAt`).
- **Affiliate Entities**: `AffiliateProfile` (`userId`, `code`, `clicks`, `commissionRate`, `payoutMethod`, `bankDetails`), `AffiliateConversion` (`orderId`, `amount`, `commission`, `status`), and `AffiliatePayoutRequest` (`amount`, `status`, `bankInfo`, `requestedAt`).
- **Showcase Entities**: `ShowcaseSite` (`id`, `name`, `url`, `image`, `order`, `active`).

### Interactive Component & State Mapping

- **Article Studio (`BlogEditorModal` / Full Workspace)**:
  - Toolbar actions insert or format blocks; file input converts uploaded images into compressed base64 Data URLs stored in the Media Library; AI Writer calls `/api/gemini/article` (with loading skeleton and inline error boundary) and optionally `/api/gemini/image` to populate blocks and featured cover. Validation prevents saving without title and at least one non-empty content block.
- **Course Player (`CoursePlayerPage`)**:
  - Switching lectures/modules switches video view or interactive Quiz Runner; completing a quiz grades answers immediately, records score in `CourseProgress`, and contributes toward the 100% completion Certificate unlock button.
- **Cart & Checkout (`CartDrawer` + `ProductDetailPage`)**:
  - Selecting a variant or clicking "Add Bundle" recalculates subtotal, applies active `UserMembership` discount alongside valid coupon codes, checks `?ref=` attribution to create a pending `AffiliateConversion` on order completion, and surfaces an Order Invoice modal in **My Library**.
- **Membership, Affiliates & Showcase Routes**:
  - `/membership` renders plan comparison and checkout modal (Card or GTB Transfer); `/affiliates` handles 1-click enrollment, link copying, conversion table, and validated payout withdrawal requests; `/showcase` renders the minimal card grid managed via Admin **Showcase** CRUD.
