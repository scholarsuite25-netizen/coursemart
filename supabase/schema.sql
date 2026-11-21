-- Coursemart Digital Marketplace, LMS, Events & Broadcast Schema for Supabase (PostgreSQL)
-- Paste and run this script once in Supabase Dashboard -> SQL Editor.
--
-- STATUS: The application currently persists ALL shared state through the
-- key-value table `coursemart_kv_store` (section 1) only — that is the only
-- table the server reads/writes, and it is what you MUST run before deploy.
-- Sections 2-8 (users, products, orders, events, registrations, social drafts,
-- email campaigns) are a reference/forward-looking relational schema: they are
-- NOT queried by application code yet and are safe to skip.

create extension if not exists "pgcrypto";

-- 1. Key-value state synchronization store for rapid full-marketplace persistence
create table if not exists public.coursemart_kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2. User accounts with explicit newsletter consent tracking
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'customer' check (role in ('customer', 'instructor', 'admin')),
  title text,
  avatar text,
  newsletter_opt_in boolean not null default false,
  newsletter_opted_in_at timestamptz,
  joined_at timestamptz not null default now()
);

-- 3. Marketplace products (courses, digital eBooks/templates/toolkits, software)
create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  title text not null,
  type text not null check (type in ('course', 'ebook', 'software')),
  digital_sub_type text,
  category text not null,
  price numeric(10, 2) not null default 0,
  status text not null default 'published',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 4. Orders & Option C Payment Verification Safety (Paystack auto-verify vs manual GTB transfer)
create table if not exists public.orders (
  id text primary key,
  user_id text not null,
  customer_name text not null,
  customer_email text not null,
  total numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('completed', 'pending', 'refunded')),
  payment_method text not null default 'paystack',
  payment_reference text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. Event Management Platform (Online Courses, Seminars, Workshops)
create table if not exists public.events (
  id text primary key,
  slug text not null unique,
  title text not null,
  subtitle text not null,
  format text not null check (format in ('online-course', 'seminar', 'workshop')),
  category text not null,
  delivery_mode text not null,
  location_or_link text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'WAT (UTC+1)',
  speaker_name text not null,
  price numeric(10, 2) not null default 0,
  capacity integer not null default 100,
  status text not null default 'published' check (status in ('published', 'draft', 'completed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 6. Event Registrations & Pre-Event Materials Dispatch Tracking
create table if not exists public.event_registrations (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  organization text,
  role_title text not null,
  experience_level text not null,
  attendance_mode text not null,
  learning_goals text,
  newsletter_opt_in boolean not null default false,
  confirmation_code text not null,
  payment_status text not null default 'free',
  payment_reference text,
  pre_event_materials_sent_at timestamptz,
  acknowledgement_email_status text not null default 'in_app_ready',
  registered_at timestamptz not null default now(),
  unique (event_id, email)
);

-- 7. Social Distribution Queue (Draft -> 1-Click Approve & Schedule)
create table if not exists public.social_post_drafts (
  id text primary key,
  source_type text not null check (source_type in ('blog', 'product', 'event')),
  source_id text not null,
  source_title text not null,
  platform text not null check (platform in ('linkedin', 'x', 'whatsapp_group')),
  content text not null,
  hashtags jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'posted')),
  scheduled_for timestamptz,
  generated_by text not null default 'template',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Email Broadcast Campaigns (EmailBump / Resend / Brevo)
create table if not exists public.email_broadcast_campaigns (
  id text primary key,
  subject text not null,
  preheader text,
  body_html text not null,
  audience text not null,
  event_id_filter text,
  recipient_count integer not null default 0,
  provider text not null default 'draft_only',
  status text not null default 'draft',
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- Enable Row Level Security cleanly (server API routes use SUPABASE_SECRET_KEY; prices stored in NGN)
alter table public.coursemart_kv_store enable row level security;
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.social_post_drafts enable row level security;
alter table public.email_broadcast_campaigns enable row level security;

-- Public read access for published storefront products and events
create policy if not exists "Public read published products"
  on public.products for select
  using (status = 'published');

create policy if not exists "Public read published events"
  on public.events for select
  using (status = 'published');
