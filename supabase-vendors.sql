-- ============================================================
-- THEERAM — Vendor Tables
-- Run in Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---- VENDORS (approved, live listings) ----
create table public.vendors (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  slug             text unique not null,
  category         text not null check (category in (
    'event_management', 'photography_video',
    'catering', 'decoration_florals', 'beauty_styling'
  )),
  tagline          text,
  description      text,
  whatsapp         text,
  phone            text,
  instagram_url    text default '',
  photos           text[] default '{}',
  price_guide      text,
  area_served      text default 'Pala & surrounding areas',
  is_active        boolean default true,
  is_featured      boolean default false,
  created_at       timestamptz default now()
);

-- ---- VENDOR SUBMISSIONS (pending applications) ----
create table public.vendor_submissions (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  category      text not null,
  tagline       text,
  description   text,
  whatsapp      text,
  phone         text,
  email         text,
  instagram_url text,
  price_guide   text,
  area_served   text,
  message       text,
  status        text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz default now()
);

-- ---- ROW LEVEL SECURITY ----
alter table public.vendors enable row level security;
alter table public.vendor_submissions enable row level security;

-- Public can view active vendors
create policy "Public can view active vendors"
  on public.vendors for select
  using (is_active = true);

-- Public can submit vendor applications
create policy "Public can submit vendor applications"
  on public.vendor_submissions for insert
  with check (true);

-- ---- INDEXES ----
create index vendors_category_idx on public.vendors(category);
create index vendors_featured_idx on public.vendors(is_featured desc, created_at desc);
create index vendor_submissions_status_idx on public.vendor_submissions(status);
