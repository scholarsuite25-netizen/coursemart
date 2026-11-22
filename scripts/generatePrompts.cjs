const fs = require('fs');
const path = require('path');

const categories = [
  'Copywriting & Marketing',
  'AI Engineering & Vibe Coding',
  'Executive Leadership & Strategy',
  'Product Management & Architecture',
  'Social Media Automation & Growth',
];

const models = [
  'Claude 3.5 Sonnet / GPT-4o',
  'Gemini 1.5 Pro',
  'DeepSeek-R1 / Qwen 2.5-Coder',
  'OpenAI o3-mini',
  'Claude 3.7 Sonnet',
];

// Helper to slugify
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// 21 detailed prompts per category = 105 total prompts
const catalogDefs = [
  // ==================== 1. Copywriting & Marketing (21 items) ====================
  {
    title: 'High-Converting Landing Page Hero & PAS Copywriter',
    category: 'Copywriting & Marketing',
    tags: ['Landing Page', 'Copywriting', 'Conversion', 'PAS Formula'],
    description: 'Generates punchy Problem-Agitate-Solution copy, conversion headlines, and magnetic CTAs.',
    template: 'Act as a direct-response copywriter. Craft high-converting landing page copy for {{product_name}} targeting {{target_audience}}. The core problem is {{primary_pain_point}}. Agitate the cost of inaction with {{agitation_detail}}, then present our key benefit: {{key_benefit}}. Conclude with CTA {{cta_label}} in a {{tone}} tone.',
    vars: [
      { name: 'product_name', label: 'Product Name', defaultValue: 'AI SaaS Accelerator Masterclass' },
      { name: 'target_audience', label: 'Target Audience', defaultValue: 'Senior Full-Stack Engineers' },
      { name: 'primary_pain_point', label: 'Pain Point', defaultValue: 'Spending 40+ hours writing boilerplate' },
      { name: 'agitation_detail', label: 'Agitation', defaultValue: 'falling behind competitors who ship with agents' },
      { name: 'key_benefit', label: 'Key Benefit', defaultValue: 'shipping production AI workflows in days' },
      { name: 'cta_label', label: 'CTA Label', defaultValue: 'Claim Access Now ->' },
      { name: 'tone', label: 'Tone', defaultValue: 'authoritative, urgent' },
    ],
    tier: 'paid',
  },
  {
    title: 'B2B Cold Outreach & Pattern Interrupt Sequence',
    category: 'Copywriting & Marketing',
    tags: ['Sales', 'B2B', 'Cold Outreach', 'Email'],
    description: '3-part personalized email outreach sequence designed for executive decision-makers.',
    template: 'Write a 3-part cold email sequence to {{prospect_role}} at {{company_type}}. Pitch {{value_proposition}} using industry hook {{industry_trend}}. Highlight case study {{case_study_metric}} with a {{tone}} tone.',
    vars: [
      { name: 'prospect_role', label: 'Prospect Role', defaultValue: 'VP of Engineering or CTO' },
      { name: 'company_type', label: 'Target Company', defaultValue: 'Fintech and E-commerce startups' },
      { name: 'value_proposition', label: 'Value Prop', defaultValue: 'cutting AI token spend by 45%' },
      { name: 'industry_trend', label: 'Industry Hook', defaultValue: 'cloud compute cost spikes' },
      { name: 'case_study_metric', label: 'Case Study', defaultValue: 'Saving ₦4.2M/mo in API costs' },
      { name: 'tone', label: 'Tone', defaultValue: 'concise and peer-to-peer' },
    ],
    tier: 'free',
  },
  {
    title: 'SaaS Product Hunt & Social Launch Kit',
    category: 'Copywriting & Marketing',
    tags: ['Launch', 'Product Hunt', 'Growth', 'Social'],
    description: 'Complete launch copy suite including maker comment, teaser tweet thread, and launch perk.',
    template: 'Draft a Product Hunt launch package for {{product_name}}, a {{product_tagline}}. Include maker comment on {{problem_story}}, 5-tweet thread on {{before_after_contrast}}, and community launch perk {{launch_perk}}.',
    vars: [
      { name: 'product_name', label: 'Product Name', defaultValue: 'GridForge Pro' },
      { name: 'product_tagline', label: 'Tagline', defaultValue: 'Tailwind CSS v4 & React 19 UI kit' },
      { name: 'problem_story', label: 'Problem Story', defaultValue: 'wasting weeks building boilerplate drawers' },
      { name: 'before_after_contrast', label: 'Contrast', defaultValue: '40 hours of styling down to 30 mins' },
      { name: 'launch_perk', label: 'Launch Perk', defaultValue: '50% discount for first 100 makers' },
    ],
    tier: 'paid',
  },
  {
    title: 'High-Ticket VSL (Video Sales Letter) Scriptwriter',
    category: 'Copywriting & Marketing',
    tags: ['VSL', 'Video', 'High-Ticket', 'Sales'],
    description: '12-minute Video Sales Letter script for flagship courses and premium mentorship programs.',
    template: 'Write a high-converting VSL script for {{program_name}} priced at {{price_point}}. Target audience: {{target_market}}. Hook with {{curiosity_hook}}, expose industry myth {{industry_myth}}, present the unique mechanism {{mechanism_name}}, and close with guarantee {{guarantee_terms}}.',
    vars: [
      { name: 'program_name', label: 'Program Name', defaultValue: 'Executive AI Mastermind' },
      { name: 'price_point', label: 'Price Point', defaultValue: '₦250,000' },
      { name: 'target_market', label: 'Target Market', defaultValue: 'Software Agency Owners & Consultants' },
      { name: 'curiosity_hook', label: 'Curiosity Hook', defaultValue: 'How 1 engineer generates 10x output with autonomous swarms' },
      { name: 'industry_myth', label: 'Industry Myth', defaultValue: 'AI will replace engineers rather than 10x-ing strategic leaders' },
      { name: 'mechanism_name', label: 'Unique Mechanism', defaultValue: 'The 4-Pillar Autonomous Agent Blueprint' },
      { name: 'guarantee_terms', label: 'Guarantee', defaultValue: '100% money back if you do not launch within 30 days' },
    ],
    tier: 'paid',
  },
  {
    title: 'Cart Abandonment 3-Step WhatsApp Recovery',
    category: 'Copywriting & Marketing',
    tags: ['WhatsApp', 'Cart Abandonment', 'E-commerce', 'Recovery'],
    description: 'Urgent direct WhatsApp messages that recover lost checkouts with empathy and incentives.',
    template: 'Write a 3-step WhatsApp recovery sequence for a student who abandoned checkout of {{course_name}}. Step 1 (30 mins): Friendly check-in. Step 2 (4 hours): Address hesitation regarding {{common_objection}}. Step 3 (24 hours): Offer voucher code {{discount_code}} with expiry.',
    vars: [
      { name: 'course_name', label: 'Course Name', defaultValue: 'Digital Product Mastery 2026' },
      { name: 'common_objection', label: 'Common Objection', defaultValue: 'Not having enough time or coding background' },
      { name: 'discount_code', label: 'Discount Code', defaultValue: 'RECOVER15 (15% OFF)' },
    ],
    tier: 'free',
  },
  {
    title: 'Webinar Registration & Show-Up Acceleration Sequence',
    category: 'Copywriting & Marketing',
    tags: ['Webinar', 'Email', 'Events', 'Conversion'],
    description: 'Boost webinar registration rates and drive 60%+ live attendance with reminder hooks.',
    template: 'Create a 5-email sequence for a live masterclass titled {{event_title}} hosted by {{host_name}}. Highlight takeaways: {{key_takeaways}}. Build anticipation with bonus handout {{bonus_gift}} for live attendees.',
    vars: [
      { name: 'event_title', label: 'Event Title', defaultValue: 'AI Agent Architecture & Monetization' },
      { name: 'host_name', label: 'Host Name', defaultValue: 'S. B. OMOTOSO' },
      { name: 'key_takeaways', label: 'Key Takeaways', defaultValue: 'Building multi-agent workflows, zero-token caching, and billing models' },
      { name: 'bonus_gift', label: 'Bonus Gift', defaultValue: 'Full Production Agent Blueprint PDF' },
    ],
    tier: 'paid',
  },
  {
    title: 'Tripwire Flash-Sale Sales Page Copy',
    category: 'Copywriting & Marketing',
    tags: ['Tripwire', 'Funnel', 'Flash Sale', 'CRO'],
    description: 'Irresistible low-ticket OTO (One Time Offer) copy converting new leads into buyers.',
    template: 'Write an irresistible tripwire sales letter for {{offer_title}} offered at {{low_price}} (regularly {{normal_price}}). Time window: {{countdown_minutes}} minutes. Highlight immediate instant gratification: {{instant_value}}.',
    vars: [
      { name: 'offer_title', label: 'Offer Title', defaultValue: '100+ Executive AI Prompt Vault & Cheat Sheet' },
      { name: 'low_price', label: 'Special Price', defaultValue: '₦2,500' },
      { name: 'normal_price', label: 'Regular Price', defaultValue: '₦25,000' },
      { name: 'countdown_minutes', label: 'Countdown', defaultValue: '15' },
      { name: 'instant_value', label: 'Instant Value', defaultValue: 'Download immediately and paste into ChatGPT/Claude for instant ROI' },
    ],
    tier: 'paid',
  },
  {
    title: 'Course Curriculum & Module Sales Breakdown',
    category: 'Copywriting & Marketing',
    tags: ['Course', 'Curriculum', 'Sales Page', 'LMS'],
    description: 'Transforms dry course lessons into compelling outcome-driven module summaries.',
    template: 'Take the course topics for {{course_title}} covering {{topic_list}}. Write 6 module descriptions. Each module must highlight: 1. Core Milestone. 2. Hands-on Project Built. 3. Tangible Skill Unlocked.',
    vars: [
      { name: 'course_title', label: 'Course Title', defaultValue: 'Full-Stack Vibe Coding with React & FastAPI' },
      { name: 'topic_list', label: 'Topic List', defaultValue: 'Vite, TypeScript, Tailwind, REST APIs, Vercel deployments, Stripe/Paystack' },
    ],
    tier: 'free',
  },
  {
    title: 'Customer Testimonial & Case Study Generator',
    category: 'Copywriting & Marketing',
    tags: ['Social Proof', 'Testimonial', 'Case Study'],
    description: 'Structures customer feedback into high-trust case study cards with measurable ROI metrics.',
    template: 'Structure a compelling case study spotlight for {{student_name}}, a {{student_role}}, who used {{dwc_product}} to achieve {{achievement_metric}}. Include the initial struggle, the breakthrough moment, and their direct quote.',
    vars: [
      { name: 'student_name', label: 'Student Name', defaultValue: 'David K.' },
      { name: 'student_role', label: 'Role', defaultValue: 'Freelance Tech Consultant' },
      { name: 'dwc_product', label: 'Product Used', defaultValue: 'Executive Facilitator Toolkit' },
      { name: 'achievement_metric', label: 'Metric', defaultValue: 'Signed 3 corporate retainer clients worth ₦1.8M in 45 days' },
    ],
    tier: 'paid',
  },
  {
    title: 'Affiliate Recruitment & Commission Swipe File',
    category: 'Copywriting & Marketing',
    tags: ['Affiliate', 'Partnerships', 'Swipe File', 'Growth'],
    description: 'Recruit brand ambassadors and influencers with ready-to-post email and social promo swipe copy.',
    template: 'Write an affiliate recruitment package for {{brand_name}}. Highlight {{commission_rate}} commission, 30-day cookie window, and top-converting offer {{flagship_offer}}. Include 3 promotional email swipes and 2 WhatsApp group blurbs.',
    vars: [
      { name: 'brand_name', label: 'Brand Name', defaultValue: 'Digital Wealth Creators' },
      { name: 'commission_rate', label: 'Commission Rate', defaultValue: '20% lifetime recurring' },
      { name: 'flagship_offer', label: 'Flagship Offer', defaultValue: 'VIP Annual All-Access Membership Pass' },
    ],
    tier: 'paid',
  },
  {
    title: 'Google & Meta High-CTR Ad Copy Matrix',
    category: 'Copywriting & Marketing',
    tags: ['PPC', 'Ads', 'Facebook Ads', 'Google Ads'],
    description: 'Generates 5 ad variants across 3 emotional angles: Fear Of Missing Out, Aspiration, and Logic.',
    template: 'Generate a 5-ad matrix for Meta (Facebook/Instagram) and Google Ads promoting {{offer_name}}. Target persona: {{audience_persona}}. For each ad provide: Headline (<40 chars), Primary Text (<125 words), Creative Hook, and CTA.',
    vars: [
      { name: 'offer_name', label: 'Offer Name', defaultValue: 'AI SaaS Accelerator 2026' },
      { name: 'audience_persona', label: 'Persona', defaultValue: 'Aspiring startup founders & non-coder executives' },
    ],
    tier: 'paid',
  },
  {
    title: 'Black Friday / Cyber Week Urgency Broadcast',
    category: 'Copywriting & Marketing',
    tags: ['Flash Sale', 'Urgency', 'Holiday', 'Promotions'],
    description: 'Multi-part limited-time promotional blitz with strict countdown anchors and price slashes.',
    template: 'Craft a 4-email countdown blitz for {{sale_name}} offering {{discount_amount}} across all digital products on {{store_url}}. Sequence: 48h warning, Live announcement, 12h countdown, Final 1 hour closing door alert.',
    vars: [
      { name: 'sale_name', label: 'Sale Name', defaultValue: 'DWC Executive Cyber Week' },
      { name: 'discount_amount', label: 'Discount', defaultValue: '50% OFF VIP Pass + 3 Free Toolkits' },
      { name: 'store_url', label: 'Store URL', defaultValue: 'https://digitalwealthcreators.org.ng' },
    ],
    tier: 'paid',
  },
  {
    title: 'Weekly Editorial Newsletter Opening & Lead Story',
    category: 'Copywriting & Marketing',
    tags: ['Newsletter', 'Editorial', 'Retention', 'Content'],
    description: 'Creates engaging personal essay openings that seamlessly tie into the weekly tech briefing.',
    template: 'Write an engaging opening story for the {{newsletter_name}} newsletter. Topic of the week: {{weekly_topic}}. Hook the reader with a personal reflection by {{author_name}}, draw a sharp lesson for tech leaders, and segue to our new guide: {{guide_link}}.',
    vars: [
      { name: 'newsletter_name', label: 'Newsletter Name', defaultValue: 'Digital Wealth Creators Intelligence Briefing' },
      { name: 'weekly_topic', label: 'Weekly Topic', defaultValue: 'How Autonomous Agents are Reshaping Small Teams' },
      { name: 'author_name', label: 'Author Name', defaultValue: 'S. B. OMOTOSO' },
      { name: 'guide_link', label: 'Featured Guide', defaultValue: '/blog/autonomous-agents-small-business' },
    ],
    tier: 'free',
  },
  {
    title: 'eBook Cover & Blurb Copywriter',
    category: 'Copywriting & Marketing',
    tags: ['eBook', 'Publishing', 'Blurb', 'Digital Product'],
    description: 'Back-cover blurb, subtitle formulation, and author bio for selling digital handbooks.',
    template: 'Write the complete book jacket copy for an executive handbook titled {{book_title}}. Target reader: {{target_reader}}. Include 3 provocative bullet points highlighting what they learn, author credentials for {{author_title}}, and social proof claim.',
    vars: [
      { name: 'book_title', label: 'Book Title', defaultValue: 'The Sovereign Creator: Building Scalable Digital Empires with AI' },
      { name: 'target_reader', label: 'Target Reader', defaultValue: 'Consultants, educators, and indie builders' },
      { name: 'author_title', label: 'Author Title', defaultValue: 'Executive Facilitator & Technology Strategist' },
    ],
    tier: 'paid',
  },
  {
    title: 'Sponsorship & Brand Partnership Pitch Deck Script',
    category: 'Copywriting & Marketing',
    tags: ['Sponsorship', 'B2B', 'Pitch Deck', 'Monetization'],
    description: 'Pitch corporate sponsors to fund webinars, newsletters, and masterclass cohorts.',
    template: 'Write a persuasive sponsorship pitch letter to {{brand_name}} proposing a premier partnership for {{platform_event}}. Present our audience stats: {{audience_stats}}, sponsor benefits: {{sponsor_benefits}}, and investment tier: {{sponsorship_tier}}.',
    vars: [
      { name: 'brand_name', label: 'Brand Name', defaultValue: 'Cloud Infrastructure Provider' },
      { name: 'platform_event', label: 'Platform / Event', defaultValue: 'DWC Annual AI & FinTech Summit' },
      { name: 'audience_stats', label: 'Audience Stats', defaultValue: '12,500 active Nigerian & African tech professionals and decision-makers' },
      { name: 'sponsor_benefits', label: 'Benefits', defaultValue: 'Keynote speaking slot, dedicated newsletter feature, and lead generation' },
      { name: 'sponsorship_tier', label: 'Tier', defaultValue: 'Platinum Partner (₦1,500,000)' },
    ],
    tier: 'paid',
  },
  {
    title: 'VIP Community Onboarding Welcome Guide',
    category: 'Copywriting & Marketing',
    tags: ['Community', 'Onboarding', 'Retention', 'VIP'],
    description: 'Welcome document that guides new paid members on how to maximize their perks and ROI.',
    template: 'Write the official welcome orientation post for new VIP members joining {{community_name}}. Detail the 4 key perks: {{key_perks}}. Instruct them on how to introduce themselves using the {{intro_format}} format.',
    vars: [
      { name: 'community_name', label: 'Community Name', defaultValue: 'DWC Sovereign Creator VIP Circle' },
      { name: 'key_perks', label: 'Key Perks', defaultValue: '50% course discount, Prompt Vault access, monthly live Q&A, private WhatsApp group' },
      { name: 'intro_format', label: 'Intro Format', defaultValue: 'Name + Current Project + 90-Day Revenue Goal' },
    ],
    tier: 'free',
  },
  {
    title: 'Software License Pricing Tier Description Optimizer',
    category: 'Copywriting & Marketing',
    tags: ['SaaS', 'Pricing', 'Feature Matrix', 'Conversion'],
    description: 'Turns feature lists into benefit-driven comparison tiers (Starter, Pro, Enterprise).',
    template: 'Write high-converting descriptions for 3 pricing tiers of {{software_product}}. Tier 1: {{tier1_name}} (₦{{tier1_price}}). Tier 2: {{tier2_name}} (₦{{tier2_price}} - Marked Best Value). Tier 3: {{tier3_name}} (₦{{tier3_price}}). Include clear "Who this is for" guidance for each.',
    vars: [
      { name: 'software_product', label: 'Product Name', defaultValue: 'OmniChannel Social Scheduler Pro' },
      { name: 'tier1_name', label: 'Tier 1 Name', defaultValue: 'Starter (1 Seat)' },
      { name: 'tier1_price', label: 'Tier 1 Price', defaultValue: '15,000' },
      { name: 'tier2_name', label: 'Tier 2 Name', defaultValue: 'Professional (5 Seats + AI Engine)' },
      { name: 'tier2_price', label: 'Tier 2 Price', defaultValue: '35,000' },
      { name: 'tier3_name', label: 'Tier 3 Name', defaultValue: 'Agency Unlimited' },
      { name: 'tier3_price', label: 'Tier 3 Price', defaultValue: '95,000' },
    ],
    tier: 'paid',
  },
  {
    title: 'Product Re-engagement & Win-Back Email Sequence',
    category: 'Copywriting & Marketing',
    tags: ['Retention', 'Win-Back', 'Lifecycle Email'],
    description: 'Re-activate inactive subscribers who haven’t logged in or purchased in 60+ days.',
    template: 'Write a 2-part win-back email sequence for inactive members on {{brand_name}}. Acknowledge they have been away, present our top 3 newest platform upgrades: {{new_features}}, and offer a special re-activation incentive: {{incentive}}.',
    vars: [
      { name: 'brand_name', label: 'Brand Name', defaultValue: 'Digital Wealth Creators' },
      { name: 'new_features', label: 'New Upgrades', defaultValue: 'Verified certificate issuance, 100+ Prompt Vault, and Executive Promoter bookings' },
      { name: 'incentive', label: 'Incentive', defaultValue: '₦5,000 store credit with voucher WELCOMEBACK' },
    ],
    tier: 'paid',
  },
  {
    title: 'Podcast & Keynote Interview Prep Brief',
    category: 'Copywriting & Marketing',
    tags: ['Media', 'PR', 'Podcast', 'Keynote'],
    description: 'Media sheet and question guide for guest appearances on major industry podcasts and shows.',
    template: 'Create a media one-sheet and speaking topic brief for {{speaker_name}}, {{speaker_title}}. Outline 3 provocative talking points regarding {{main_topic}}, 5 suggested interview questions for the host, and social links.',
    vars: [
      { name: 'speaker_name', label: 'Speaker Name', defaultValue: 'S. B. OMOTOSO' },
      { name: 'speaker_title', label: 'Speaker Title', defaultValue: 'Executive Facilitator & AI Marketplace Founder' },
      { name: 'main_topic', label: 'Main Topic', defaultValue: 'Monetizing Intellectual Property & Building Autonomous Digital Wealth in Emerging Markets' },
    ],
    tier: 'free',
  },
  {
    title: 'Executive Consulting Proposal & Scope of Work',
    category: 'Copywriting & Marketing',
    tags: ['Consulting', 'B2B', 'Proposal', 'High-Ticket'],
    description: 'Formal corporate engagement proposal for keynote facilitation and advisory services.',
    template: 'Draft an institutional consultancy proposal from {{facilitator_name}} to {{client_org}}. Scope: {{engagement_scope}}. Deliverables: {{deliverables}}. Timeline: {{timeline}}. Investment: {{fee_structure}} with GTB bank wire settlement details.',
    vars: [
      { name: 'facilitator_name', label: 'Facilitator', defaultValue: 'Tintol Business Services / S. B. OMOTOSO' },
      { name: 'client_org', label: 'Client Organization', defaultValue: 'Financial Institutions Training Centre' },
      { name: 'engagement_scope', label: 'Scope', defaultValue: 'Executive Boardroom Strategy on Generative AI & Digital Transformation' },
      { name: 'deliverables', label: 'Deliverables', defaultValue: 'Full-day workshop, executive strategic roadmap, and 90-day advisory check-ins' },
      { name: 'timeline', label: 'Timeline', defaultValue: '4 Weeks' },
      { name: 'fee_structure', label: 'Fee', defaultValue: '₦1,850,000 + Logistics' },
    ],
    tier: 'paid',
  },
  {
    title: 'Student Certificate of Completion Social Share Kit',
    category: 'Copywriting & Marketing',
    tags: ['Social Proof', 'Viral', 'Certificates', 'LinkedIn'],
    description: 'Copy templates provided to students upon graduation to share their certificate on LinkedIn.',
    template: 'Write a proud, professional LinkedIn post template for a graduate who just earned their verified certificate in {{course_name}} on Digital Wealth Creators. Tag the instructor {{instructor_name}}, mention verified code {{cert_code_example}}, and share 3 takeaways.',
    vars: [
      { name: 'course_name', label: 'Course Name', defaultValue: 'AI SaaS Accelerator Masterclass' },
      { name: 'instructor_name', label: 'Instructor', defaultValue: 'S. B. OMOTOSO' },
      { name: 'cert_code_example', label: 'Cert Code', defaultValue: 'CM-CERT-2026-X89K' },
    ],
    tier: 'free',
  },

  // ==================== 2. AI Engineering & Vibe Coding (21 items) ====================
  {
    title: 'Full-Stack TypeScript & React 19 Feature Scaffold',
    category: 'AI Engineering & Vibe Coding',
    tags: ['React 19', 'TypeScript', 'Tailwind', 'Frontend'],
    description: 'Generates complete component, types, custom hooks, and mock unit tests in strict TypeScript.',
    template: 'Act as a principal frontend architect. Generate a complete React 19 component for {{feature_name}} using TypeScript and Tailwind CSS. State management: {{state_pattern}}. Include accessible ARIA roles, clean interface definitions, and 3 Vitest/Jest unit tests.',
    vars: [
      { name: 'feature_name', label: 'Feature Name', defaultValue: 'Interactive Course Lecture Video Player' },
      { name: 'state_pattern', label: 'State Pattern', defaultValue: 'Custom hook with local storage persistence' },
    ],
    tier: 'paid',
  },
  {
    title: 'FastAPI & Python Async Agentic Microservice',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Python', 'FastAPI', 'AI Agent', 'Backend'],
    description: 'Production-ready async REST microservice with Pydantic validation, structured logging, and caching.',
    template: 'Build a production-grade FastAPI microservice for {{service_purpose}}. Endpoints required: {{endpoints}}. Implement Pydantic v2 schemas, async HTTP calls, in-memory semantic caching, and error handling for 429 rate limits.',
    vars: [
      { name: 'service_purpose', label: 'Service Purpose', defaultValue: 'Autonomous SEO metadata and social post generator' },
      { name: 'endpoints', label: 'Endpoints', defaultValue: 'POST /generate/article, POST /generate/social, GET /health' },
    ],
    tier: 'paid',
  },
  {
    title: 'Zero-Cost Semantic Cache Layer with SHA-256',
    category: 'AI Engineering & Vibe Coding',
    tags: ['AI Optimization', 'Semantic Caching', 'Token Reduction', 'Architecture'],
    description: 'Deterministic caching layer that saves 90% of LLM token spend on duplicate prompts.',
    template: 'Implement an in-memory or Redis-backed deterministic semantic cache in {{language}} for LLM prompts. Hash normalized prompts using SHA-256. If cache hit, return cached completion with {{ttl_hours}} hour TTL. Include eviction policy.',
    vars: [
      { name: 'language', label: 'Language', defaultValue: 'TypeScript / Node.js' },
      { name: 'ttl_hours', label: 'TTL Hours', defaultValue: '24' },
    ],
    tier: 'free',
  },
  {
    title: 'Next.js App Router Server Actions & Route Handlers',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Next.js', 'Server Actions', 'Full-Stack', 'Vercel'],
    description: 'Secure server actions with Zod schema validation, optimistic UI updates, and revalidation.',
    template: 'Create a Next.js 15 App Router Server Action for {{action_purpose}}. Use Zod to validate input payload. Perform authorization check for role {{required_role}}, execute DB operation, revalidate path {{revalidate_path}}, and return typed ActionResponse.',
    vars: [
      { name: 'action_purpose', label: 'Action Purpose', defaultValue: 'Enrolling a student into a paid course' },
      { name: 'required_role', label: 'Required Role', defaultValue: 'student or admin' },
      { name: 'revalidate_path', label: 'Revalidate Path', defaultValue: '/library' },
    ],
    tier: 'paid',
  },
  {
    title: 'Postgres & Prisma / Drizzle Schema Architect',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Database', 'PostgreSQL', 'Drizzle', 'Prisma'],
    description: 'Normalizes complex domain models with foreign keys, indexes, and soft-delete conventions.',
    template: 'Design a clean relational database schema using {{orm_choice}} for a {{platform_type}}. Entities required: {{entity_list}}. Include proper indexes on query filters, timestamps, UUID primary keys, and cascade rules.',
    vars: [
      { name: 'orm_choice', label: 'ORM / Query Builder', defaultValue: 'Drizzle ORM with PostgreSQL' },
      { name: 'platform_type', label: 'Platform Type', defaultValue: 'Digital Marketplace & Course LMS' },
      { name: 'entity_list', label: 'Entities', defaultValue: 'users, orders, order_items, products, progress, certificates' },
    ],
    tier: 'paid',
  },
  {
    title: 'HMAC-SHA256 Token Delivery & Dynamic Watermark System',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Security', 'DRM', 'Anti-Piracy', 'Tokenization'],
    description: 'Time-limited signed download tokens and viewer email overlay to deter pirated screen recording.',
    template: 'Write a secure digital asset protection utility in {{language}}. 1. Function `generateDownloadToken(assetId, userId, ttlSeconds)` creating HMAC-SHA256 signature. 2. Function `verifyDownloadToken(token)` validating expiry and signature. 3. Dynamic viewer watermark overlay showing student name, email, and IP.',
    vars: [
      { name: 'language', label: 'Language', defaultValue: 'TypeScript (Node & Browser)' },
    ],
    tier: 'paid',
  },
  {
    title: 'Paystack & Flutterwave Webhook Verifier & Reconciler',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Payment', 'Fintech', 'Paystack', 'Webhooks'],
    description: 'Idempotent webhook handler verifying signature headers, transaction reference, and kobo amounts.',
    template: 'Build an idempotent payment webhook handler for {{gateway_name}} in {{runtime_env}}. Verify header signature {{signature_header}} with secret key. Extract transaction reference, verify expected amount in kobo, check if order is already fulfilled, update status to completed, and unlock access.',
    vars: [
      { name: 'gateway_name', label: 'Gateway', defaultValue: 'Paystack' },
      { name: 'runtime_env', label: 'Runtime Environment', defaultValue: 'Node.js / Express or Vercel Function' },
      { name: 'signature_header', label: 'Signature Header', defaultValue: 'x-paystack-signature' },
    ],
    tier: 'paid',
  },
  {
    title: 'OpenAI / Gemini Structured Output Function Caller',
    category: 'AI Engineering & Vibe Coding',
    tags: ['LLM', 'Structured Output', 'Zod', 'Function Calling'],
    description: 'Guarantees 100% type-safe JSON returns matching a strict Zod schema with zero hallucinations.',
    template: 'Implement structured JSON extraction using {{llm_provider}} and Zod schema. Target domain: {{domain_schema}}. Define the schema, pass response_format or tool definition, handle parse errors with retry, and return verified TypeScript object.',
    vars: [
      { name: 'llm_provider', label: 'LLM Provider', defaultValue: 'Google Gemini 1.5 Pro (Structured Outputs)' },
      { name: 'domain_schema', label: 'Domain Schema', defaultValue: 'CourseCurriculum with modules, lectures, estimatedMinutes, and quizQuestions' },
    ],
    tier: 'free',
  },
  {
    title: 'Multi-Agent Swarm Coordinator & Shared Board Architecture',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Multi-Agent', 'Autonomous Agents', 'Swarm', 'Architecture'],
    description: 'Orchestrates 3+ autonomous worker agents with role delegation, lock management, and aggregated outputs.',
    template: 'Architect a multi-agent workflow in {{language}} where a Coordinator agent decomposes a high-level task into 3 specialized sub-tasks: 1. Researcher. 2. Author. 3. Verifier/Linter. Manage message passing via a shared event queue and synthesize a final verified artifact.',
    vars: [
      { name: 'language', label: 'Language', defaultValue: 'Python / asyncio or TypeScript' },
    ],
    tier: 'paid',
  },
  {
    title: 'Edge-TTS Voiceover Generator & Subtitle Aligner',
    category: 'AI Engineering & Vibe Coding',
    tags: ['TTS', 'Audio', 'Subtitles', 'Open Source'],
    description: 'Zero-cost Python / Node script tapping Microsoft neural voices to generate MP3s and .srt files.',
    template: 'Write a script using `edge-tts` to convert lesson markdown into an MP3 voiceover. Voice: {{voice_name}}. Output synchronized `.srt` subtitle file with word-boundary timestamps. Include CLI command and programmatic Node/Python function.',
    vars: [
      { name: 'voice_name', label: 'Voice Name', defaultValue: 'en-US-AriaNeural or en-GB-SoniaNeural' },
    ],
    tier: 'paid',
  },
  {
    title: 'WebAssembly FFmpeg Video Canvas Slide Stitcher',
    category: 'AI Engineering & Vibe Coding',
    tags: ['FFmpeg', 'WebAssembly', 'Video', 'Browser'],
    description: 'Stitches SVG/PNG presentation slides and an audio track into an MP4 video directly in the browser.',
    template: 'Write a client-side JavaScript utility using `@ffmpeg/ffmpeg` v0.12+. Load slide images and an MP3 voiceover from URLs, render them into an MP4 video at {{resolution}} resolution at {{fps}} FPS, and return an object URL Blob.',
    vars: [
      { name: 'resolution', label: 'Resolution', defaultValue: '1920x1080 (1080p)' },
      { name: 'fps', label: 'FPS', defaultValue: '30' },
    ],
    tier: 'paid',
  },
  {
    title: 'WebSub & IndexNow Search Engine Auto-Pinger',
    category: 'AI Engineering & Vibe Coding',
    tags: ['SEO', 'IndexNow', 'Googlebot', 'Automation'],
    description: 'Automates instant pinging of Bing, Yandex, and Google upon new article/product publishing.',
    template: 'Implement an automated indexing dispatcher in {{language}}. When a new URL is published: 1. Send POST to `https://api.indexnow.org/indexnow` with host, key, and urlList. 2. Ping Google Sitemaps ping endpoint. 3. Dispatch WebSub hub notification. Log status codes.',
    vars: [
      { name: 'language', label: 'Language', defaultValue: 'TypeScript (Node.js)' },
    ],
    tier: 'paid',
  },
  {
    title: 'LinkedIn REST API OAuth 2.0 & UGC Post Dispatcher',
    category: 'AI Engineering & Vibe Coding',
    tags: ['LinkedIn API', 'Social Automation', 'OAuth', 'Integration'],
    description: 'Generates secure 3-legged OAuth 2.0 flow and posts commentary + rich links to `/rest/posts`.',
    template: 'Write a complete LinkedIn sharing module in {{language}}. Include token exchange with refresh mechanism, header formatting (`Linkedin-Version: 202610`, `X-Restli-Protocol-Version: 2.0.0`), and `POST https://api.linkedin.com/rest/posts` payload for text and URL shares.',
    vars: [
      { name: 'language', label: 'Language', defaultValue: 'TypeScript' },
    ],
    tier: 'paid',
  },
  {
    title: 'Instagram Graph API Container & Carousel Uploader',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Instagram API', 'Meta Graph', 'Social', 'Reels'],
    description: 'Uploads images/reels to media container and dispatches `media_publish` within Meta limits.',
    template: 'Write a Meta Instagram Graph API publisher in {{language}}. Steps: 1. Create media container `POST /{ig_user_id}/media` with `image_url` and `caption`. 2. Poll container status until ready. 3. Call `POST /{ig_user_id}/media_publish`. Handle 100 post daily moving limit.',
    vars: [
      { name: 'language', label: 'Language', defaultValue: 'TypeScript' },
    ],
    tier: 'paid',
  },
  {
    title: 'Real-Time WebRTC Screen & Mic Video Recorder',
    category: 'AI Engineering & Vibe Coding',
    tags: ['WebRTC', 'MediaRecorder', 'Screen Recording', 'Browser API'],
    description: 'In-browser Loom alternative capturing desktop screen, webcam bubble, and mic audio to WebM/MP4.',
    template: 'Build a standalone React hook `useScreenRecorder` using `navigator.mediaDevices.getDisplayMedia` and `getUserMedia`. Combine audio tracks into single MediaStream, record chunks with `MediaRecorder` at high bitrate, provide Pause/Resume/Stop controls, and export Blob.',
    vars: [],
    tier: 'free',
  },
  {
    title: 'Automated Test Suite Architect (Vitest & Jest)',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Testing', 'Vitest', 'TDD', 'Quality Assurance'],
    description: 'Generates comprehensive unit, integration, and edge-case test suites with 100% coverage.',
    template: 'Generate a robust Vitest test suite for the module {{module_code}}. Write unit tests covering: 1. Happy path. 2. Edge cases (null, empty, negative, special characters). 3. Error states and throws. Use deterministic offline mocks with zero external network calls.',
    vars: [
      { name: 'module_code', label: 'Target Module', defaultValue: 'E-commerce Cart & 50% Member Discount Calculator' },
    ],
    tier: 'paid',
  },
  {
    title: 'Vite PWA & Workbox Offline Service Worker Suite',
    category: 'AI Engineering & Vibe Coding',
    tags: ['PWA', 'Workbox', 'Offline', 'Mobile'],
    description: 'Configures precaching, background sync, dynamic watermarked asset caching, and manifest.',
    template: 'Configure a Vite Progressive Web App (PWA) with `@vite-pwa/vite-plugin`. Set up manifest for {{app_name}} with icons, theme color, and offline fallback page. Cache static fonts and assets with CacheFirst, and API routes with NetworkFirst.',
    vars: [
      { name: 'app_name', label: 'App Name', defaultValue: 'Digital Wealth Creators LMS' },
    ],
    tier: 'free',
  },
  {
    title: 'Tailwind CSS v4 Dark-Mode Modern Component System',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Tailwind CSS', 'Dark Mode', 'Design System', 'UI'],
    description: 'Accessible, polished dark/light mode UI components with luxury gold and deep navy theme.',
    template: 'Build a reusable design system card and button set using Tailwind CSS v4. Palette: Deep Navy (`#0a192f`, `#112240`), Radiant Gold (`#d4af37`, `#f5c451`), Emerald (`#10b981`). Include subtle glassmorphism, responsive states, and focus rings.',
    vars: [],
    tier: 'free',
  },
  {
    title: 'GraphQL / REST API Rate Limiter & Token Bucket',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Security', 'Rate Limiting', 'Token Bucket', 'Middleware'],
    description: 'In-memory sliding window rate limiter middleware protecting public routes from DDoS and brute-force.',
    template: 'Create a lightweight sliding-window rate limiting middleware in {{language}} for Express/Vercel functions. Allow max {{max_requests}} requests per {{window_seconds}} seconds per IP. Return HTTP 429 with `Retry-After` header when limit exceeded.',
    vars: [
      { name: 'language', label: 'Language', defaultValue: 'TypeScript' },
      { name: 'max_requests', label: 'Max Requests', defaultValue: '30' },
      { name: 'window_seconds', label: 'Window Seconds', defaultValue: '60' },
    ],
    tier: 'paid',
  },
  {
    title: 'CSV & JSON Bulk Data Importer with Zod Validation',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Importer', 'CSV', 'Zod', 'Data Processing'],
    description: 'Robust streaming parser that ingests messy CSV/Excel records, cleans fields, and reports validation errors.',
    template: 'Write a client-side CSV and JSON bulk product importer in TypeScript. Parse file using PapaParse or native streams, validate every row against Zod schema {{zod_schema}}, collect row-by-row error diagnostics, and output clean typed array.',
    vars: [
      { name: 'zod_schema', label: 'Zod Schema', defaultValue: 'ProductImportSchema (title, slug, price, category, deliverableUrl)' },
    ],
    tier: 'paid',
  },
  {
    title: 'Automated Incident Audit & Log Anomaly Detector',
    category: 'AI Engineering & Vibe Coding',
    tags: ['Security', 'Anomaly Detection', 'Auditing', 'Logging'],
    description: 'Audits access logs for suspicious burst downloads, multi-IP credential sharing, and brute force.',
    template: 'Write an automated security scanning utility that analyzes access and download logs. Detect: 1. Multiple IP addresses accessing the same user token within 10 minutes. 2. Burst downloads exceeding 20 files/hour. 3. Failed payment attempts. Generate structured incident report.',
    vars: [],
    tier: 'paid',
  },

  // ==================== 3. Executive Leadership & Strategy (21 items) ====================
  {
    title: 'Institutional Keynote Address on Emerging Tech & AI',
    category: 'Executive Leadership & Strategy',
    tags: ['Keynote', 'Speech', 'Executive', 'Leadership'],
    description: '30-minute keynote address script for bank executives, university convocations, and summits.',
    template: 'Write a powerful 30-minute keynote address for {{speaker_name}} delivering the opening address at {{event_name}}. Audience: {{audience_demographic}}. Central thesis: {{central_thesis}}. Weave in African economic realities, practical case studies, and a visionary call to action.',
    vars: [
      { name: 'speaker_name', label: 'Speaker Name', defaultValue: 'S. B. OMOTOSO' },
      { name: 'event_name', label: 'Event Name', defaultValue: 'Pan-African Digital Banking & FinTech Summit' },
      { name: 'audience_demographic', label: 'Audience', defaultValue: 'C-Suite Executives, Managing Directors, and Regulators' },
      { name: 'central_thesis', label: 'Central Thesis', defaultValue: 'AI is not a replacement for human leadership; it is the ultimate leverage for institutional transformation' },
    ],
    tier: 'paid',
  },
  {
    title: 'Boardroom Strategic Memo on AI Governance & Risk',
    category: 'Executive Leadership & Strategy',
    tags: ['Governance', 'Boardroom', 'Risk Management', 'Compliance'],
    description: 'Executive memorandum outlining policy guardrails, data sovereignty, and compliance for corporate boards.',
    template: 'Draft an executive briefing memorandum from the Chief Strategy Advisor to the Board of Directors of {{organization_name}}. Topic: Adoption of Generative AI and Autonomous Agents. Outline 3 strategic opportunities, 4 operational risks (data privacy, copyright, compliance), and a 5-step phased rollout roadmap.',
    vars: [
      { name: 'organization_name', label: 'Organization Name', defaultValue: 'Apex Commercial Bank Group' },
    ],
    tier: 'paid',
  },
  {
    title: '90-Day Digital Transformation Master Blueprint',
    category: 'Executive Leadership & Strategy',
    tags: ['Strategy', 'Transformation', 'Roadmap', 'Consulting'],
    description: 'Comprehensive 3-phase strategic roadmap for modernizing traditional institutional workflows.',
    template: 'Develop a 90-day digital transformation execution framework for {{industry_sector}}. Phase 1 (Days 1-30): Audit & Discovery. Phase 2 (Days 31-60): High-Impact Pilot Deployment. Phase 3 (Days 61-90): Institutional Scale & KPI Measurement.',
    vars: [
      { name: 'industry_sector', label: 'Industry Sector', defaultValue: 'Professional Services & Educational Institutions' },
    ],
    tier: 'paid',
  },
  {
    title: 'High-Level Organizational OKRs & KPI Cascade',
    category: 'Executive Leadership & Strategy',
    tags: ['OKRs', 'KPIs', 'Management', 'Operations'],
    description: 'Translates annual revenue goals into quarter-by-quarter departmental Objectives & Key Results.',
    template: 'Formulate Q1-Q4 OKRs for an educational technology and digital marketplace company targeting {{annual_revenue_target}} in annual revenue. Define 3 company-wide Objectives, each with 3 quantifiable Key Results covering Product, Marketing, and Operations.',
    vars: [
      { name: 'annual_revenue_target', label: 'Revenue Target', defaultValue: '₦150,000,000' },
    ],
    tier: 'paid',
  },
  {
    title: 'Executive Facilitator Masterclass Curriculum Design',
    category: 'Executive Leadership & Strategy',
    tags: ['Facilitation', 'Masterclass', 'Training', 'Pedagogy'],
    description: 'Designs an interactive 2-day executive leadership retreat with breakout exercises and debriefs.',
    template: 'Design an intensive 2-day executive retreat agenda on {{retreat_theme}} for {{attendee_profile}}. Break down each day into 90-minute modules with icebreakers, case studies, interactive group simulations, and measurable action commitments.',
    vars: [
      { name: 'retreat_theme', label: 'Theme', defaultValue: 'Strategic Foresight & AI-Powered Decision Making' },
      { name: 'attendee_profile', label: 'Attendees', defaultValue: 'Senior Directors and General Managers' },
    ],
    tier: 'free',
  },
  {
    title: 'Crisis Management & Public Relations Response Playbook',
    category: 'Executive Leadership & Strategy',
    tags: ['PR', 'Crisis Management', 'Communications'],
    description: 'Structured response templates and internal holding statements for unforeseen corporate incidents.',
    template: 'Write a crisis communications response plan for a tech/education platform facing {{crisis_scenario}}. Provide: 1. Immediate internal staff holding statement. 2. Public customer notice. 3. Social media FAQ. Tone: transparent, accountable, and reassuring.',
    vars: [
      { name: 'crisis_scenario', label: 'Scenario', defaultValue: 'Temporary payment reconciliation delay and cloud server downtime' },
    ],
    tier: 'paid',
  },
  {
    title: 'Executive Succession & Talent Mentorship Framework',
    category: 'Executive Leadership & Strategy',
    tags: ['Mentorship', 'HR', 'Succession', 'Leadership Development'],
    description: 'Establishes a 12-month mentorship track to groom senior managers into autonomous leaders.',
    template: 'Create a 12-month executive mentorship program charter for {{org_name}}. Define mentor-mentee pairing criteria, monthly discussion milestones, leadership competency benchmarks, and graduation evaluation metrics.',
    vars: [
      { name: 'org_name', label: 'Organization', defaultValue: 'Digital Wealth Creators Institute' },
    ],
    tier: 'free',
  },
  {
    title: 'Institutional Grant & Endowment Application Dossier',
    category: 'Executive Leadership & Strategy',
    tags: ['Grants', 'Funding', 'Non-Profit', 'Education'],
    description: 'Detailed grant proposal tailored for international development banks and educational foundations.',
    template: 'Draft a grant application executive summary for {{project_name}} seeking {{grant_amount}} from {{funding_body}}. Highlight the developmental impact: {{impact_metrics}}, sustainability model, and alignment with UN Sustainable Development Goals.',
    vars: [
      { name: 'project_name', label: 'Project Name', defaultValue: 'African Youth AI & Vibe Coding Literacy Initiative' },
      { name: 'grant_amount', label: 'Grant Amount', defaultValue: '$75,000' },
      { name: 'funding_body', label: 'Funding Body', defaultValue: 'Pan-African Tech Foundation' },
      { name: 'impact_metrics', label: 'Impact Metrics', defaultValue: 'Training 5,000 undergraduates across 10 universities in practical software monetization' },
    ],
    tier: 'paid',
  },
  {
    title: 'Corporate Partnership Memorandum of Understanding (MOU)',
    category: 'Executive Leadership & Strategy',
    tags: ['Legal', 'MOU', 'Partnerships', 'Contracts'],
    description: 'Standard institutional MOU defining mutual obligations, revenue sharing, and IP ownership.',
    template: 'Draft a formal Memorandum of Understanding between Party A: {{party_a}} and Party B: {{party_b}}. Purpose: {{collaboration_purpose}}. Outline Party A responsibilities, Party B responsibilities, revenue share split: {{rev_split}}, term duration, and termination clause.',
    vars: [
      { name: 'party_a', label: 'Party A', defaultValue: 'Digital Wealth Creators Ltd' },
      { name: 'party_b', label: 'Party B', defaultValue: 'National Institute of Management' },
      { name: 'collaboration_purpose', label: 'Purpose', defaultValue: 'Joint certification and co-delivery of Executive AI Governance courses' },
      { name: 'rev_split', label: 'Revenue Split', defaultValue: '60% DWC / 40% Partner after direct costs' },
    ],
    tier: 'paid',
  },
  {
    title: 'High-Performance Culture & Core Values Manifest',
    category: 'Executive Leadership & Strategy',
    tags: ['Culture', 'Core Values', 'Human Capital'],
    description: 'Crafts an inspiring internal operating philosophy that eliminates bureaucracy and fuels excellence.',
    template: 'Write an inspiring company culture manifesto for {{company_name}}. Core principles: Excellence, Radical Ownership, Speed of Execution, and Integrity. Articulate how team members make decisions, handle disagreements, and serve customers.',
    vars: [
      { name: 'company_name', label: 'Company Name', defaultValue: 'Digital Wealth Creators' },
    ],
    tier: 'free',
  },
  {
    title: 'Executive Time-Audit & Delegation Operating System',
    category: 'Executive Leadership & Strategy',
    tags: ['Productivity', 'Delegation', 'Executive Routine'],
    description: 'Eliminates low-value admin busywork to refocus CEO hours on strategy, revenue, and vision.',
    template: 'Develop a personal executive time-management and delegation matrix for a founder/CEO. Categorize daily activities into 4 quadrants: $10/hr tasks (automate/delegate), $100/hr tasks, $1,000/hr tasks, and $10,000/hr visionary tasks. Provide weekly calendar template.',
    vars: [],
    tier: 'free',
  },
  {
    title: 'Mergers, Acquisitions & Asset Valuation Primer',
    category: 'Executive Leadership & Strategy',
    tags: ['M&A', 'Finance', 'Valuation', 'Exit Strategy'],
    description: 'Prepares founders and equity holders for institutional valuations, multiples, and due diligence.',
    template: 'Create a strategic exit and valuation advisory brief for an online education and digital product marketplace generating {{annual_ebitda}} in annual EBITDA. Explain standard valuation multiples, key value drivers, and the 10-point due diligence checklist.',
    vars: [
      { name: 'annual_ebitda', label: 'Annual EBITDA', defaultValue: '₦45,000,000' },
    ],
    tier: 'paid',
  },
  {
    title: 'Thought Leadership Ghostwriting Matrix for CEOs',
    category: 'Executive Leadership & Strategy',
    tags: ['Ghostwriting', 'LinkedIn', 'Personal Brand', 'Executive'],
    description: 'Converts raw voice notes and founder opinions into polished, high-engagement LinkedIn articles.',
    template: 'Act as an executive ghostwriter for {{leader_name}}, a prominent {{industry_role}}. Take the core opinion: "{{core_opinion}}". Structure it into an influential 800-word LinkedIn article with a captivating hook, 3 real-world examples, and an empowering conclusion.',
    vars: [
      { name: 'leader_name', label: 'Leader Name', defaultValue: 'S. B. OMOTOSO' },
      { name: 'industry_role', label: 'Industry Role', defaultValue: 'Executive Facilitator & Technology Pioneer' },
      { name: 'core_opinion', label: 'Core Opinion', defaultValue: 'Traditional education teaches obsolete skills; sovereign builders must master rapid AI execution and direct market monetization' },
    ],
    tier: 'paid',
  },
  {
    title: 'Corporate Innovation Lab & Hackathon Playbook',
    category: 'Executive Leadership & Strategy',
    tags: ['Innovation', 'Hackathon', 'R&D', 'Agile'],
    description: 'Blueprint for running 48-hour internal hackathons that produce working revenue-generating prototypes.',
    template: 'Write a complete operational playbook for hosting a 48-hour internal corporate hackathon on {{hackathon_theme}}. Detail team formation rules, mentoring checkpoints, judging rubric (Technical Feasibility, Market Impact, Execution), and prize structure.',
    vars: [
      { name: 'hackathon_theme', label: 'Theme', defaultValue: 'AI-Powered Workflow Automation for African Enterprises' },
    ],
    tier: 'paid',
  },
  {
    title: 'Advisory Board Charter & Compensation Structure',
    category: 'Executive Leadership & Strategy',
    tags: ['Advisors', 'Board of Advisors', 'Governance', 'Equity'],
    description: 'Recruit seasoned industry titans to an advisory council with clear equity/cash vesting rules.',
    template: 'Draft an Advisory Board Charter and Engagement Agreement for {{startup_name}}. Outline advisor responsibilities (quarterly advisory sessions, investor introductions), confidentiality terms, and compensation structure: {{comp_details}}.',
    vars: [
      { name: 'startup_name', label: 'Company Name', defaultValue: 'Digital Wealth Creators' },
      { name: 'comp_details', label: 'Compensation', defaultValue: '0.5% equity vesting over 2 years + annual honorarium' },
    ],
    tier: 'paid',
  },
  {
    title: 'Institutional Accreditation & Quality Assurance Framework',
    category: 'Executive Leadership & Strategy',
    tags: ['Accreditation', 'Quality Assurance', 'Education Standards'],
    description: 'Ensures online courses and certificates meet national and global vocational standards.',
    template: 'Design an internal Quality Assurance & Course Accreditation Framework for our LMS platform. Establish measurable criteria for instructor qualifications, video production quality, curriculum depth, peer review, and passing scores for certificates.',
    vars: [],
    tier: 'free',
  },
  {
    title: 'Strategic Pricing Power & Price Increase Playbook',
    category: 'Executive Leadership & Strategy',
    tags: ['Pricing', 'Revenue Optimization', 'Strategy'],
    description: 'Execute a 30% price increase on existing courses and memberships without triggering churn.',
    template: 'Draft a price increase rollout plan for {{product_line}} raising rates from {{old_price}} to {{new_price}}. Write the grandfathering announcement email giving existing members 7 days to lock in the old rate, framing the increase around value additions: {{value_additions}}.',
    vars: [
      { name: 'product_line', label: 'Product Line', defaultValue: 'DWC VIP All-Access Membership Pass' },
      { name: 'old_price', label: 'Old Price', defaultValue: '₦10,000/mo' },
      { name: 'new_price', label: 'New Price', defaultValue: '₦15,000/mo' },
      { name: 'value_additions', label: 'Value Additions', defaultValue: '100+ Prompt Vault, Weekly Live Masterclasses, and Automated Tutorial Creator' },
    ],
    tier: 'paid',
  },
  {
    title: 'Investor Quarterly Shareholder Update Letter',
    category: 'Executive Leadership & Strategy',
    tags: ['Investor Relations', 'Shareholders', 'Reporting'],
    description: 'Crisp quarterly update detailing MRR growth, user acquisition, CAC, LTV, and strategic priorities.',
    template: 'Write a quarterly shareholder update for {{company_name}} for Q{{quarter_number}}. Highlight: Highlights (MRR reached {{mrr_metric}}), Lowlights & Challenges, Product Milestones, Financials (Revenue, Burn Rate, Runway), and Asks for the Board.',
    vars: [
      { name: 'company_name', label: 'Company Name', defaultValue: 'Digital Wealth Creators Ltd' },
      { name: 'quarter_number', label: 'Quarter', defaultValue: '3' },
      { name: 'mrr_metric', label: 'MRR Metric', defaultValue: '₦8.5M/mo (+42% QoQ)' },
    ],
    tier: 'paid',
  },
  {
    title: 'Strategic Vendor Negotiation & Procurement Script',
    category: 'Executive Leadership & Strategy',
    tags: ['Negotiation', 'Procurement', 'Cost Optimization'],
    description: 'Cut cloud hosting, software licenses, and API provider costs by 30% using anchor leverage.',
    template: 'Write a strategic vendor re-negotiation email to our cloud infrastructure provider requesting volume enterprise discounting for {{service_name}}. Reference our growing traffic: {{traffic_volume}}, competitor pricing alternatives, and multi-year commitment leverage.',
    vars: [
      { name: 'service_name', label: 'Service', defaultValue: 'Managed Database & Media CDN' },
      { name: 'traffic_volume', label: 'Traffic Volume', defaultValue: '50,000 monthly active learners' },
    ],
    tier: 'free',
  },
  {
    title: 'Organizational Restructuring & Change Management Memo',
    category: 'Executive Leadership & Strategy',
    tags: ['Change Management', 'HR', 'Internal Comms'],
    description: 'Guides staff through organizational restructuring, new reporting lines, and platform pivots.',
    template: 'Draft an internal leadership town-hall speech and change management memo announcing our transition to {{strategic_pivot}}. Address employee anxieties, explain the strategic imperative, outline support systems, and reinforce our vision.',
    vars: [
      { name: 'strategic_pivot', label: 'Strategic Pivot', defaultValue: 'AI-First Marketplace & Sovereign Creator Academy' },
    ],
    tier: 'paid',
  },
  {
    title: 'Annual Strategic Planning Offsite Agenda & Facilitator Guide',
    category: 'Executive Leadership & Strategy',
    tags: ['Offsite', 'Strategy', 'Annual Planning', 'Workshops'],
    description: 'Structured 3-day strategic retreat agenda aligning founders and executives for the fiscal year.',
    template: 'Design a complete 3-day annual strategic offsite agenda for the executive team of {{company_name}}. Day 1: Year in Review & Brutal Truths. Day 2: 3-Year Vision, BHAG, and Competitive Moats. Day 3: Departmental OKRs, Resource Allocation, and Execution Commitments.',
    vars: [
      { name: 'company_name', label: 'Company Name', defaultValue: 'Digital Wealth Creators' },
    ],
    tier: 'paid',
  },

  // ==================== 4. Product Management & Architecture (21 items) ====================
  {
    title: 'Comprehensive Product Requirement Document (PRD)',
    category: 'Product Management & Architecture',
    tags: ['PRD', 'Product Management', 'Specs', 'Agile'],
    description: 'Full product specification with user personas, user stories, functional specs, and KPIs.',
    template: 'Write an exhaustive Product Requirement Document (PRD) for {{feature_name}}. Include: 1. Executive Summary & Problem Statement. 2. User Personas & Jobs To Be Done (JTBD). 3. Functional Requirements with Priority (P0, P1, P2). 4. Non-Functional Requirements (Latency, Security, Mobile). 5. Success Metrics / KPIs.',
    vars: [
      { name: 'feature_name', label: 'Feature Name', defaultValue: 'Interactive AI Document & Video Tutorial Studio' },
    ],
    tier: 'paid',
  },
  {
    title: 'System Architecture Decision Record (ADR)',
    category: 'Product Management & Architecture',
    tags: ['Architecture', 'ADR', 'System Design', 'Engineering'],
    description: 'Formal architectural record documenting trade-offs, context, decisions, and consequences.',
    template: 'Write an Architecture Decision Record (ADR) for {{decision_title}}. Status: Accepted. Context: {{context_background}}. Decision: {{chosen_solution}} vs Alternatives considered ({{alternatives_considered}}). Consequences: Positive and negative operational trade-offs.',
    vars: [
      { name: 'decision_title', label: 'Decision Title', defaultValue: 'Adoption of Client-Side WebAssembly FFmpeg vs Cloud GPU Rendering' },
      { name: 'context_background', label: 'Context', defaultValue: 'Need to provide zero-cost video generation for tutorials without incurring $500+/mo server GPU costs' },
      { name: 'chosen_solution', label: 'Chosen Solution', defaultValue: '@ffmpeg/ffmpeg (WASM) in browser' },
      { name: 'alternatives_considered', label: 'Alternatives Considered', defaultValue: 'AWS MediaConvert, Cloud Run GPU containers, Remotion Lambda' },
    ],
    tier: 'paid',
  },
  {
    title: 'User Story & Acceptance Criteria (Gherkin / BDD) Generator',
    category: 'Product Management & Architecture',
    tags: ['User Stories', 'Gherkin', 'BDD', 'Jira'],
    description: 'Breaks complex epics into sprint-ready user stories with Given-When-Then criteria.',
    template: 'Decompose the epic {{epic_title}} into 5 granular user stories. For each story, write the user story format ("As a [user], I want to [action] so that [benefit]") followed by 3 Gherkin BDD test scenarios (Given... When... Then...).',
    vars: [
      { name: 'epic_title', label: 'Epic Title', defaultValue: '1-Click Direct Bank Transfer Settlement via GTB & WhatsApp Proof' },
    ],
    tier: 'free',
  },
  {
    title: 'Competitive Feature Gap & Moat Analysis Matrix',
    category: 'Product Management & Architecture',
    tags: ['Competition', 'Strategy', 'Moat Analysis', 'Product'],
    description: 'Compares your platform against Udemy, Teachable, and Gumroad to identify unique wedges.',
    template: 'Perform a comprehensive competitive feature matrix comparing {{my_platform}} against major competitors: {{competitors}}. Analyze: Pricing & Payouts, Local African Settlement, Course DRM Protection, AI Generation Tools, and VIP Community. Highlight our 3 key unfair advantages.',
    vars: [
      { name: 'my_platform', label: 'Our Platform', defaultValue: 'Digital Wealth Creators' },
      { name: 'competitors', label: 'Competitors', defaultValue: 'Udemy, Teachable, Selar, Gumroad' },
    ],
    tier: 'paid',
  },
  {
    title: 'REST & OpenAPI / Swagger Specification Builder',
    category: 'Product Management & Architecture',
    tags: ['API', 'OpenAPI', 'Swagger', 'REST'],
    description: 'Generates valid OpenAPI 3.1 YAML specifications with request bodies, auth headers, and response schemas.',
    template: 'Create a complete OpenAPI 3.1 specification in YAML for {{api_scope}}. Include path definitions, query parameters, JSON request payloads with schema types, Bearer token authorization, and 200/400/401/429 responses.',
    vars: [
      { name: 'api_scope', label: 'API Scope', defaultValue: 'DWC Course & Digital Product Public Affiliate API' },
    ],
    tier: 'paid',
  },
  {
    title: 'Product Launch Checklist & Go-To-Market (GTM) Matrix',
    category: 'Product Management & Architecture',
    tags: ['GTM', 'Launch', 'Checklist', 'Operations'],
    description: '7-phase pre-launch, launch-day, and post-launch checklist ensuring zero broken links or missed bugs.',
    template: 'Generate a comprehensive GTM Launch Checklist for launching {{product_release}}. Group by: 1. Code & Security Readiness. 2. Payment & Checkout Verification. 3. Legal & Terms. 4. Marketing & Social Assets. 5. Customer Support & WhatsApp Desk.',
    vars: [
      { name: 'product_release', label: 'Release', defaultValue: 'Digital Wealth Creators 2.0 Major Upgrade' },
    ],
    tier: 'free',
  },
  {
    title: 'Customer Feedback Sentiment Analysis & Feature Prioritization',
    category: 'Product Management & Architecture',
    tags: ['Feedback', 'RICE Score', 'Prioritization', 'Product'],
    description: 'Analyzes user complaints and feature requests, scoring them with the RICE framework.',
    template: 'Analyze the following customer feedback items: {{feedback_snippets}}. Group into common pain point themes, formulate 4 potential product features, and score them using the RICE framework (Reach, Impact, Confidence, Effort) to determine roadmap rank.',
    vars: [
      { name: 'feedback_snippets', label: 'Feedback Snippets', defaultValue: '"I want to download PDFs on my phone without watermarks", "Can I pay in Naira directly with GTB transfer?", "Need more prompts for marketing", "Video player buffer is slow on mobile data"' },
    ],
    tier: 'paid',
  },
  {
    title: 'Microservices vs Monolith Architecture Evaluation',
    category: 'Product Management & Architecture',
    tags: ['Architecture', 'System Design', 'Scalability'],
    description: 'Evaluates when to split a monolithic Next.js/Vite app into specialized worker microservices.',
    template: 'Evaluate the architectural trade-offs between maintaining a Modular Monolith vs distributed Microservices for {{app_scale}}. Detail impacts on developer velocity, deployment complexity, latency, infrastructure cost, and database consistency.',
    vars: [
      { name: 'app_scale', label: 'Application Scale', defaultValue: 'Digital Marketplace handling 100k learners, 500 courses, and streaming video' },
    ],
    tier: 'paid',
  },
  {
    title: 'Database Indexing & Query Performance Optimization Audit',
    category: 'Product Management & Architecture',
    tags: ['Database', 'SQL', 'Performance', 'Indexing'],
    description: 'Identifies slow N+1 queries, missing composite indexes, and optimizes SQL queries for high traffic.',
    template: 'Conduct a database query optimization audit for the slow endpoint: {{slow_query_endpoint}}. Explain potential causes (table scans, unindexed foreign keys, redundant joins). Propose specific composite indexes and refactored SQL query with `EXPLAIN ANALYZE` considerations.',
    vars: [
      { name: 'slow_query_endpoint', label: 'Slow Endpoint', defaultValue: 'GET /api/catalog?category=all&sort=bestseller (takes 1.8s with 10k orders)' },
    ],
    tier: 'paid',
  },
  {
    title: 'Mobile-First UX/UI User Journey Wireframe Spec',
    category: 'Product Management & Architecture',
    tags: ['UX', 'UI', 'Wireframes', 'Mobile'],
    description: 'Step-by-step screen layout specification optimized for Nigerian mobile learners on low-bandwidth 4G.',
    template: 'Design a mobile-first user journey wireframe specification for {{user_flow}}. Specify screen by screen: Hero section, tap targets (minimum 48px), sticky bottom checkout CTA, loading skeleton states, and offline cached indicator.',
    vars: [
      { name: 'user_flow', label: 'User Flow', defaultValue: 'Enrolling in a course, paying via GTB transfer, and watching Lecture 1' },
    ],
    tier: 'free',
  },
  {
    title: 'SaaS Churn Reduction & Retention Strategy Blueprint',
    category: 'Product Management & Architecture',
    tags: ['Churn', 'Retention', 'SaaS', 'Engagement'],
    description: 'Tactical mechanisms to increase monthly membership stickiness from 65% to 92%+.',
    template: 'Develop a 5-pillar churn reduction framework for our paid membership pass. Address: 1. Day 1 Activation. 2. Weekly habit formation. 3. Gamification (streaks, certificate badges). 4. In-app community involvement. 5. Offboarding friction & pause options.',
    vars: [],
    tier: 'paid',
  },
  {
    title: 'Disaster Recovery & Business Continuity Plan (BCP)',
    category: 'Product Management & Architecture',
    tags: ['DevOps', 'Security', 'Disaster Recovery', 'Backups'],
    description: 'RTO and RPO benchmarks with automated database backup replication and failover routines.',
    template: 'Draft a Business Continuity and Disaster Recovery Plan for {{platform_name}}. Define Recovery Time Objective (RTO < 1 hour) and Recovery Point Objective (RPO < 15 minutes). Document automated backup schedule, DNS failover protocol, and incident roles.',
    vars: [
      { name: 'platform_name', label: 'Platform Name', defaultValue: 'Digital Wealth Creators Platform & Database' },
    ],
    tier: 'paid',
  },
  {
    title: 'Gamification & Learning Badge Progression System',
    category: 'Product Management & Architecture',
    tags: ['Gamification', 'LMS', 'Badges', 'Motivation'],
    description: 'Increases course completion rates by 3x through XP points, milestone badges, and leaderboards.',
    template: 'Design a gamification reward progression for our LMS students. Outline 5 unlockable achievement badges (e.g. "First Lesson Done", "Fast Learner", "Quiz Champion", "Certified Creator"). Define XP points awarded per activity and student leaderboard mechanics.',
    vars: [],
    tier: 'free',
  },
  {
    title: 'API Versioning & Deprecation Policy Specification',
    category: 'Product Management & Architecture',
    tags: ['API Governance', 'Versioning', 'Engineering'],
    description: 'Clean breaking-change migration strategy using semantic versioning and sunset headers.',
    template: 'Draft an API Versioning and Deprecation Policy for our public developer and affiliate endpoints. Define rules for URI versioning (`/api/v1` vs `/api/v2`), sunset header timeline (`Sunset: Wed, 11 Nov 2026`), and migration developer guides.',
    vars: [],
    tier: 'paid',
  },
  {
    title: 'Multi-Tenant Data Isolation & RBAC Security Model',
    category: 'Product Management & Architecture',
    tags: ['Security', 'RBAC', 'Multi-Tenancy', 'Authorization'],
    description: 'Prevents horizontal privilege escalation across students, instructors, facilitators, and admins.',
    template: 'Design an enterprise Role-Based Access Control (RBAC) matrix for {{system_name}}. Roles: Visitor, Free Member, Paid Member, Instructor, Promoter/Facilitator, Super Admin. Detail permissions for CRUD operations across Products, Orders, Prompts, and Financial Reports.',
    vars: [
      { name: 'system_name', label: 'System Name', defaultValue: 'Digital Wealth Creators Sovereign LMS' },
    ],
    tier: 'paid',
  },
  {
    title: 'Content Delivery Network (CDN) & Asset Caching Strategy',
    category: 'Product Management & Architecture',
    tags: ['CDN', 'Performance', 'Caching', 'Edge'],
    description: 'Optimizes video chunks, PDF downloads, and static images for instant load times across West Africa.',
    template: 'Formulate an edge caching strategy for Vercel and Cloudflare CDN. Specify cache headers (`Cache-Control`, `stale-while-revalidate`) for: 1. Static HTML/JS bundles. 2. Immutable image assets. 3. Video lecture previews. 4. Dynamic user cart and checkout.',
    vars: [],
    tier: 'paid',
  },
  {
    title: 'Developer Documentation & Quick-Start SDK Guide',
    category: 'Product Management & Architecture',
    tags: ['Docs', 'SDK', 'Developer Experience', 'API'],
    description: 'Clear, engaging documentation that gets external developers up and running in under 5 minutes.',
    template: 'Write a comprehensive Quickstart Developer Guide for the {{api_name}}. Include authentication instructions, 3 curl copy-paste examples, TypeScript code snippet, and troubleshooting guide for common error codes.',
    vars: [
      { name: 'api_name', label: 'API Name', defaultValue: 'DWC Certificate Verification & Course Progress API' },
    ],
    tier: 'free',
  },
  {
    title: 'Product Sunset & Feature Deprecation Communications',
    category: 'Product Management & Architecture',
    tags: ['Product Life Cycle', 'Deprecation', 'Customer Care'],
    description: 'Gracefully retires legacy tools or outdated course editions while maintaining customer goodwill.',
    template: 'Write a customer-friendly deprecation announcement for retiring {{legacy_feature}}. Provide 30-day notice, explain why we are upgrading to {{modern_alternative}}, and offer an automated 1-click migration path.',
    vars: [
      { name: 'legacy_feature', label: 'Legacy Feature', defaultValue: 'Manual Download Links in Email' },
      { name: 'modern_alternative', label: 'Modern Alternative', defaultValue: 'Direct DRM-Watermarked Student Library Dashboard' },
    ],
    tier: 'paid',
  },
  {
    title: 'Technical Debt Inventory & Refactoring Prioritization',
    category: 'Product Management & Architecture',
    tags: ['Tech Debt', 'Refactoring', 'Code Quality'],
    description: 'Systematizes code smells, legacy dependencies, and slow components into an actionable sprint backlog.',
    template: 'Create a Technical Debt Audit framework for our codebase. Categorize debt into: Architecture Debt, Test Coverage Gaps, Outdated Dependencies, and CSS Bloat. Establish a rule allocating 20% of every development sprint to paying down debt.',
    vars: [],
    tier: 'paid',
  },
  {
    title: 'A/B Test Experimentation Hypothesis & Success Metric Card',
    category: 'Product Management & Architecture',
    tags: ['Experimentation', 'A/B Testing', 'Growth', 'CRO'],
    description: 'Scientific hypothesis framework for testing checkout buttons, pricing cards, and hero copy.',
    template: 'Design an A/B testing experiment card for {{experiment_idea}}. Formulate the Hypothesis: "If we [change], then [metric] will increase by [target] because [reason]". Define sample size, duration, primary metric, guardrail metric, and rollback criteria.',
    vars: [
      { name: 'experiment_idea', label: 'Experiment Idea', defaultValue: 'Displaying GTB Bank Account directly on checkout modal vs requiring Paystack click' },
    ],
    tier: 'free',
  },
  {
    title: 'SLA (Service Level Agreement) & Uptime Warranty Charter',
    category: 'Product Management & Architecture',
    tags: ['SLA', 'Uptime', 'Compliance', 'Enterprise'],
    description: 'Formal 99.9% uptime commitment, maintenance windows, and penalty rebate schedules for B2B buyers.',
    template: 'Draft an enterprise Service Level Agreement (SLA) charter for {{service_title}}. Guarantee 99.9% monthly availability, define scheduled maintenance notice periods (minimum 48 hours), and outline service credit tiers for downtime.',
    vars: [
      { name: 'service_title', label: 'Service Title', defaultValue: 'DWC Corporate LMS & Executive Training Portal' },
    ],
    tier: 'paid',
  },

  // ==================== 5. Social Media Automation & Growth (21 items) ====================
  {
    title: 'Viral LinkedIn Carousel Slide-by-Slide Architect',
    category: 'Social Media Automation & Growth',
    tags: ['LinkedIn', 'Carousel', 'Viral Content', 'Personal Brand'],
    description: '8-slide high-retention PDF carousel breaking down complex tech concepts for maximum reposts.',
    template: 'Write an 8-slide viral LinkedIn carousel on {{carousel_topic}}. Slide 1: High-curiosity hook. Slides 2-6: Step-by-step breakdown with zero fluff. Slide 7: Summary checklist. Slide 8: Strong CTA directing readers to our platform: {{cta_url}}.',
    vars: [
      { name: 'carousel_topic', label: 'Topic', defaultValue: 'How to Build and Monetize a Full AI Application in 48 Hours with Zero Coding' },
      { name: 'cta_url', label: 'CTA URL', defaultValue: 'https://digitalwealthcreators.org.ng/courses' },
    ],
    tier: 'free',
  },
  {
    title: 'Instagram Reels & TikTok 60-Second Hook Scriptwriter',
    category: 'Social Media Automation & Growth',
    tags: ['Instagram Reels', 'TikTok', 'Short-form Video', 'Growth'],
    description: 'High-energy short-form video script with 3-second visual pattern interrupt and audio cues.',
    template: 'Write a high-retention 60-second video script for Instagram Reels / TikTok on {{video_topic}}. Format: [0-3s] Hook with on-screen text and physical action. [4-15s] The Agitation. [16-45s] The 3-step solution. [46-60s] Clear CTA to comment {{keyword}} for the link.',
    vars: [
      { name: 'video_topic', label: 'Topic', defaultValue: 'Stop paying developers $5,000 for simple landing pages—here is how AI builds it for free' },
      { name: 'keyword', label: 'Comment Keyword', defaultValue: 'ACCELERATOR' },
    ],
    tier: 'paid',
  },
  {
    title: 'X / Twitter High-Engagement 7-Tweet Authority Thread',
    category: 'Social Media Automation & Growth',
    tags: ['Twitter', 'X', 'Threads', 'Audience Growth'],
    description: 'Compelling educational thread designed to attract thousands of bookmarks and profile clicks.',
    template: 'Write a 7-tweet educational thread on {{thread_topic}}. Tweet 1: Provocative hook with compelling stats. Tweets 2-5: Practical frameworks and screenshots breakdown. Tweet 6: The #1 mistake to avoid. Tweet 7: Recap and link to our flagship course: {{course_link}}.',
    vars: [
      { name: 'thread_topic', label: 'Thread Topic', defaultValue: 'The 5 AI tools that allow 1 solo creator to out-produce a 10-person agency' },
      { name: 'course_link', label: 'Course Link', defaultValue: 'https://digitalwealthcreators.org.ng/digital-products' },
    ],
    tier: 'free',
  },
  {
    title: 'WhatsApp Community Daily Value & Engagement Broadcast',
    category: 'Social Media Automation & Growth',
    tags: ['WhatsApp Groups', 'Community', 'Broadcast', 'Daily Routine'],
    description: 'Keeps active WhatsApp learning groups engaged with morning insights and discussion prompts.',
    template: 'Write a daily value broadcast for our official WhatsApp student group. Today’s theme: {{daily_theme}}. Include an inspiring thought, a practical 2-minute actionable tip, and a discussion question that encourages members to reply.',
    vars: [
      { name: 'daily_theme', label: 'Theme', defaultValue: 'Overcoming Imposter Syndrome when selling your first digital product' },
    ],
    tier: 'free',
  },
  {
    title: 'YouTube Long-Form Video Outline & Retention Blueprint',
    category: 'Social Media Automation & Growth',
    tags: ['YouTube', 'Video', 'Retention', 'Long-Form'],
    description: '15-minute tutorial script structure with retention anchors every 90 seconds to maximize watch time.',
    template: 'Create a 15-minute YouTube video structure for {{video_title}}. Include: 1. 0-30s Hook (visual preview of final result). 2. Story setup. 3. Three core tutorial chapters. 4. Visual B-roll and screen recording cues. 5. End-screen CTA for {{lead_magnet}}.',
    vars: [
      { name: 'video_title', label: 'Video Title', defaultValue: 'How I Built a Profitable Digital Product Marketplace in 7 Days' },
      { name: 'lead_magnet', label: 'Lead Magnet', defaultValue: 'Download the Free 100+ Prompt Vault at digitalwealthcreators.org.ng/vault' },
    ],
    tier: 'paid',
  },
  {
    title: 'Automated Social Media Weekly Content Calendar Matrix',
    category: 'Social Media Automation & Growth',
    tags: ['Content Calendar', 'Social Media', 'Scheduling', 'Strategy'],
    description: 'Generates 7 days of synchronized posts across LinkedIn, X, Instagram, and WhatsApp.',
    template: 'Create a 7-day multi-platform social media calendar around the central theme: {{weekly_theme}}. For each day (Mon-Sun), specify the Content Pillar (Educate, Inspire, Entertain, Sell), Platform, Core Hook, and Image/Slide concept.',
    vars: [
      { name: 'weekly_theme', label: 'Weekly Theme', defaultValue: 'Autonomous AI Agents and Direct Monetization for Executives' },
    ],
    tier: 'paid',
  },
  {
    title: 'Cold Outreach DM Script for Instagram & LinkedIn Influencers',
    category: 'Social Media Automation & Growth',
    tags: ['Influencers', 'Partnerships', 'DMs', 'Outreach'],
    description: 'High-response direct message pitching micro-influencers to partner on course launches.',
    template: 'Write a non-spammy, relationship-first DM to reach out to {{influencer_niche}} creators on {{platform}}. Compliment specific recent work, propose a win-win partnership promoting {{offer_name}}, and offer a {{commission_split}} rev share.',
    vars: [
      { name: 'influencer_niche', label: 'Influencer Niche', defaultValue: 'Tech Educators & Career Coaches in Nigeria & UK' },
      { name: 'platform', label: 'Platform', defaultValue: 'LinkedIn or Instagram' },
      { name: 'offer_name', label: 'Offer', defaultValue: 'AI Vibe Coding Masterclass Cohort' },
      { name: 'commission_split', label: 'Commission', defaultValue: '30% affiliate commission' },
    ],
    tier: 'paid',
  },
  {
    title: 'Viral Quiz & Poll Generator for Audience Engagement',
    category: 'Social Media Automation & Growth',
    tags: ['Polls', 'Interactive', 'LinkedIn Polls', 'Twitter Polls'],
    description: 'Generates high-curiosity interactive polls that drive thousands of votes and algorithmic reach.',
    template: 'Write 3 provocative, debate-sparking polls for LinkedIn and X on {{industry_debate}}. For each poll: Provide the question, 4 compelling voting options, and the follow-up commentary we will post in the comments to steer discussion to {{our_solution}}.',
    vars: [
      { name: 'industry_debate', label: 'Debate Topic', defaultValue: 'Will AI replace software developers or only non-technical managers?' },
      { name: 'our_solution', label: 'Our Solution', defaultValue: 'Our AI SaaS Accelerator masterclass teaching strategic AI prompt engineering' },
    ],
    tier: 'free',
  },
  {
    title: 'Podcast Guest Pitch Email & Soundbite Sheet',
    category: 'Social Media Automation & Growth',
    tags: ['Podcast', 'PR', 'Guest Pitch', 'Authority'],
    description: 'Pitches top technology and business podcast hosts to interview your founder.',
    template: 'Draft a pitch email to the host of {{podcast_name}}. Pitch {{speaker_name}} as a guest. Present 3 controversial soundbites on {{topic_soundbites}} and explain why their audience of {{podcast_audience}} will be glued to the episode.',
    vars: [
      { name: 'podcast_name', label: 'Podcast Name', defaultValue: 'The African Tech Leaders Show' },
      { name: 'speaker_name', label: 'Speaker Name', defaultValue: 'S. B. OMOTOSO' },
      { name: 'topic_soundbites', label: 'Soundbites', defaultValue: '"Why 90% of AI courses are useless" and "How to build a sovereign digital income stream in 30 days"' },
      { name: 'podcast_audience', label: 'Audience', defaultValue: 'Entrepreneurs and ambitious corporate professionals' },
    ],
    tier: 'paid',
  },
  {
    title: 'Case Study & Client Transformation Social Spotlight',
    category: 'Social Media Automation & Growth',
    tags: ['Social Proof', 'Case Study', 'Storytelling'],
    description: 'Transforms student milestones into narrative story posts that sell without feeling salesy.',
    template: 'Write a narrative LinkedIn and Facebook post celebrating our student {{student_name}}. Highlight their starting point: {{starting_point}}, the specific DWC course they took: {{course_taken}}, and their tangible breakthrough: {{breakthrough_result}}. End with enrollment link.',
    vars: [
      { name: 'student_name', label: 'Student Name', defaultValue: 'Emmanuel T.' },
      { name: 'starting_point', label: 'Starting Point', defaultValue: 'Stuck in an underpaid IT support job with zero coding knowledge' },
      { name: 'course_taken', label: 'Course Taken', defaultValue: 'Full-Stack Vibe Coding Bootcamp' },
      { name: 'breakthrough_result', label: 'Result', defaultValue: 'Built and launched an AI invoice generator now making ₦350k/mo' },
    ],
    tier: 'free',
  },
  {
    title: 'Automated Content Repurposing Multi-Format Matrix',
    category: 'Social Media Automation & Growth',
    tags: ['Repurposing', 'Content Strategy', 'Efficiency'],
    description: 'Takes 1 long-form blog post and repurposes it into 10 multi-platform social assets.',
    template: 'Take the core thesis from our blog post: "{{blog_post_thesis}}". Repurpose it into: 1. A 3-bullet X thread. 2. A LinkedIn narrative post. 3. An Instagram Reel visual concept. 4. A WhatsApp daily tip. 5. An email newsletter summary.',
    vars: [
      { name: 'blog_post_thesis', label: 'Blog Thesis', defaultValue: 'Building with AI agents requires strong architectural judgment, not raw code typing speed' },
    ],
    tier: 'paid',
  },
  {
    title: 'Social Proof Screenshot & Review Hype Post',
    category: 'Social Media Automation & Growth',
    tags: ['Hype', 'Social Proof', 'Testimonials'],
    description: 'Frames positive WhatsApp feedback and five-star reviews into high-converting social posts.',
    template: 'Write an enthusiastic social media post showcasing 3 real customer WhatsApp feedback messages praising {{product_title}}. Emphasize the authentic community sentiment, thank the students, and provide the direct purchase link: {{product_url}}.',
    vars: [
      { name: 'product_title', label: 'Product Title', defaultValue: 'The Sovereign Creator Notion & PRD Toolkit' },
      { name: 'product_url', label: 'Product URL', defaultValue: 'https://digitalwealthcreators.org.ng/digital-products/templates' },
    ],
    tier: 'free',
  },
  {
    title: 'Controversial Industry Stance & Contrarian Take Post',
    category: 'Social Media Automation & Growth',
    tags: ['Contrarian', 'Viral', 'Thought Leadership'],
    description: 'Polarizing, intelligent opinions that stand out in crowded feeds and drive massive comment threads.',
    template: 'Write a contrarian thought-leadership post for LinkedIn challenging the popular myth: "{{popular_myth}}". Argue the opposite truth: "{{unpopular_truth}}". Support with 3 grounded industry observations and invite readers to debate respectfully in comments.',
    vars: [
      { name: 'popular_myth', label: 'Popular Myth', defaultValue: 'You need a $100k computer science degree to build profitable software companies in 2026' },
      { name: 'unpopular_truth', label: 'Unpopular Truth', defaultValue: 'Vibe coding and domain expertise outcompete traditional computer science theory in speed to revenue' },
    ],
    tier: 'paid',
  },
  {
    title: 'Free Resource / Lead Magnet Give-Away Viral Post',
    category: 'Social Media Automation & Growth',
    tags: ['Lead Magnet', 'Giveaway', 'Viral Loop', 'List Building'],
    description: 'The classic "Comment [KEYWORD] and I will DM you the free cheat sheet" viral reach multiplier.',
    template: 'Write a viral give-away post for LinkedIn and X offering {{free_resource}}. Describe the 40+ hours it took to create it, summarize the 3 most valuable components inside, and set the simple condition: "Like, Retweet/Repost, and comment {{trigger_word}} to get instant access".',
    vars: [
      { name: 'free_resource', label: 'Free Resource', defaultValue: 'The 2026 Executive AI Prompt Vault & Automation Cheatsheet' },
      { name: 'trigger_word', label: 'Trigger Word', defaultValue: 'VAULT' },
    ],
    tier: 'free',
  },
  {
    title: 'Live Event Behind-the-Scenes & Speaker Highlights',
    category: 'Social Media Automation & Growth',
    tags: ['Behind the Scenes', 'Events', 'Masterclass'],
    description: 'Captures the raw energy of live Zoom/hall masterclasses to drive registration for the next cohort.',
    template: 'Write an exciting behind-the-scenes recap post following our live cohort session on {{session_topic}}. Highlight the attendee energy ({{attendee_count}} leaders live), quote a memorable insight dropped by {{speaker_name}}, and announce registration opening for Cohort 2.',
    vars: [
      { name: 'session_topic', label: 'Session Topic', defaultValue: 'Building Enterprise Microservices with Autonomous Agents' },
      { name: 'attendee_count', label: 'Attendee Count', defaultValue: '240' },
      { name: 'speaker_name', label: 'Speaker', defaultValue: 'S. B. OMOTOSO' },
    ],
    tier: 'free',
  },
  {
    title: 'New Feature / Major Platform Release Social Announcement',
    category: 'Social Media Automation & Growth',
    tags: ['Product Update', 'Release', 'Announcement', 'SaaS'],
    description: 'Announces new website capabilities (e.g. Instant Certificate Verification, Prompt Vault).',
    template: 'Craft an exciting product update announcement for {{platform_name}} launching our brand new feature: {{new_feature_name}}. Detail the problem it solves for students: {{problem_solved}}, how to access it immediately, and invite community feedback.',
    vars: [
      { name: 'platform_name', label: 'Platform', defaultValue: 'Digital Wealth Creators' },
      { name: 'new_feature_name', label: 'Feature', defaultValue: '1-Click Instant Certificate Verification & Member Prompt Vault' },
      { name: 'problem_solved', label: 'Problem Solved', defaultValue: 'Students can now prove course authenticity with a public link and copy 100+ executive AI prompts' },
    ],
    tier: 'free',
  },
  {
    title: 'Weekly Q&A Crowd-Sourcing Post',
    category: 'Social Media Automation & Growth',
    tags: ['Q&A', 'Community', 'Engagement'],
    description: 'Crowd-sources student questions on Wednesday for the Friday live breakdown.',
    template: 'Write an open Q&A invitation post on social media. Topic of the week: {{qa_topic}}. Invite followers to drop their toughest burning questions in the comments, promising that {{expert_name}} will answer the top 5 in this Friday’s live masterclass.',
    vars: [
      { name: 'qa_topic', label: 'Q&A Topic', defaultValue: 'Monetizing digital courses and pricing in Nigerian Naira vs USD' },
      { name: 'expert_name', label: 'Expert Name', defaultValue: 'S. B. OMOTOSO' },
    ],
    tier: 'free',
  },
  {
    title: 'Milestone Celebration & Gratitude Post (Social Proof)',
    category: 'Social Media Automation & Growth',
    tags: ['Milestone', 'Celebration', 'Gratitude', 'Brand'],
    description: 'Celebrates hitting community milestones (e.g. 10,000 students, 500 completed certificates).',
    template: 'Write a humble and inspiring milestone celebration post for {{brand_name}} achieving {{milestone_achievement}}. Reflect on the early days of starting with zero students, thank the community, and reaffirm our mission to build digital wealth creators across Africa.',
    vars: [
      { name: 'brand_name', label: 'Brand Name', defaultValue: 'Digital Wealth Creators' },
      { name: 'milestone_achievement', label: 'Milestone', defaultValue: 'Crossing 5,000 active learners and 1,000 verified certificates issued' },
    ],
    tier: 'free',
  },
  {
    title: 'Interactive Skill Assessment & Quiz Social Post',
    category: 'Social Media Automation & Growth',
    tags: ['Quiz', 'Assessment', 'Lead Gen'],
    description: 'Diagnostic question post that assesses reader knowledge and directs them to the beginner course.',
    template: 'Write an interactive technical assessment post: "Rate your AI Engineering readiness from 1 to 5". Provide 5 self-evaluation criteria. If they score < 3, direct them to our Foundation Course. If they score 4-5, direct them to our Advanced Masterclass.',
    vars: [],
    tier: 'paid',
  },
  {
    title: 'Founder Monday Motivation & Vision Alignment',
    category: 'Social Media Automation & Growth',
    tags: ['Motivation', 'Founder', 'Inspiration', 'Monday'],
    description: 'Ignites energy on Monday morning with philosophical depth on ownership, freedom, and craft.',
    template: 'Write a Monday morning founder essay from {{founder_name}}. Theme: The discipline of building digital assets that compound while you sleep. Draw a contrast between trading hours for wages vs owning digital products. End with an empowering challenge for the week.',
    vars: [
      { name: 'founder_name', label: 'Founder Name', defaultValue: 'S. B. OMOTOSO' },
    ],
    tier: 'free',
  },
  {
    title: 'Affiliate Leaderboard & Monthly Prize Announcement',
    category: 'Social Media Automation & Growth',
    tags: ['Affiliates', 'Leaderboard', 'Contest', 'Gamification'],
    description: 'Sparks competitive promotion among affiliates with monthly prize pool updates.',
    template: 'Write an exciting affiliate contest announcement for the month of {{contest_month}}. Announce top cash prizes for the top 3 affiliates: 1st Place: {{first_prize}}, 2nd Place: {{second_prize}}, 3rd Place: {{third_prize}}, plus the standard 20% recurring commission on all sales.',
    vars: [
      { name: 'contest_month', label: 'Month', defaultValue: 'December 2026' },
      { name: 'first_prize', label: '1st Prize', defaultValue: '₦250,000 Cash Bonus' },
      { name: 'second_prize', label: '2nd Prize', defaultValue: '₦100,000 Cash Bonus' },
      { name: 'third_prize', label: '3rd Prize', defaultValue: '₦50,000 Cash Bonus' },
    ],
    tier: 'paid',
  },
];

// Generate typescript code
let tsCode = `import type { PromptVaultItem } from '../types/marketplace';\n\n`;
tsCode += `export const SEED_PROMPT_VAULT_ITEMS: PromptVaultItem[] = [\n`;

let idCounter = 1;
for (const item of catalogDefs) {
  const id = `vault-${idCounter}`;
  const slug = slugify(item.title);
  const copyCount = 500 + Math.floor(Math.sin(idCounter) * 400 + 400);
  const isFeatured = idCounter % 7 === 1;

  tsCode += `  {\n`;
  tsCode += `    id: '${id}',\n`;
  tsCode += `    slug: '${slug}',\n`;
  tsCode += `    title: ${JSON.stringify(item.title)},\n`;
  tsCode += `    description: ${JSON.stringify(item.description)},\n`;
  tsCode += `    category: ${JSON.stringify(item.category)},\n`;
  tsCode += `    tags: ${JSON.stringify(item.tags)},\n`;
  tsCode += `    template: ${JSON.stringify(item.template)},\n`;
  tsCode += `    variables: [\n`;
  for (const v of item.vars) {
    tsCode += `      {\n`;
    tsCode += `        name: '${v.name}',\n`;
    tsCode += `        label: '${v.label}',\n`;
    tsCode += `        defaultValue: ${JSON.stringify(v.defaultValue)},\n`;
    tsCode += `        placeholder: ${JSON.stringify(v.placeholder || ('e.g. ' + v.defaultValue))},\n`;
    tsCode += `      },\n`;
  }
  tsCode += `    ],\n`;
  tsCode += `    recommendedModel: '${models[idCounter % models.length]}',\n`;
  tsCode += `    membershipTierRequired: '${item.tier}',\n`;
  tsCode += `    isFeatured: ${isFeatured},\n`;
  tsCode += `    copyCount: ${copyCount},\n`;
  tsCode += `    createdAt: '2026-11-01T00:00:00Z',\n`;
  tsCode += `  },\n`;

  idCounter++;
}

tsCode += `];\n`;

fs.writeFileSync(path.join(__dirname, '../src/data/promptVaultCatalog.ts'), tsCode, 'utf8');
console.log(`Generated ${catalogDefs.length} items successfully into src/data/promptVaultCatalog.ts`);
