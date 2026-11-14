-- ============================================================
-- THEERAM — Analytics & Lead Intelligence Upgrade (v4)
-- Run in Supabase Studio → SQL Editor
-- ============================================================

-- 1. Enrich `inquiries` with the guest details already collected in EnquiryModal
--    plus action channel & over-capacity spillover signal.
--    All columns are nullable/defaulted so legacy inserts continue to work.
alter table public.inquiries
  add column if not exists event_date date,
  add column if not exists is_flexible_date boolean default false,
  add column if not exists guest_count integer,
  add column if not exists is_over_capacity boolean default false,
  add column if not exists channel text default 'whatsapp', -- 'whatsapp' | 'whatsapp_skip' | 'phone' | 'share_family' | 'share_link' | 'maps' | 'instagram'
  add column if not exists session_id text;

create index if not exists inquiries_event_date_idx on public.inquiries(event_date) where event_date is not null;
create index if not exists inquiries_property_created_idx on public.inquiries(property_id, created_at desc);
create index if not exists inquiries_session_idx on public.inquiries(session_id) where session_id is not null;

-- 2. Enrich `vendor_views` with duration & geo location (matching `property_views`)
alter table public.vendor_views
  add column if not exists duration_seconds integer,
  add column if not exists session_id text,
  add column if not exists visitor_country text,
  add column if not exists visitor_country_code text,
  add column if not exists visitor_region text;

-- 3. Enrich `vendor_inquiries` with channel & view_id
alter table public.vendor_inquiries
  add column if not exists view_id uuid references public.vendor_views(id) on delete set null,
  add column if not exists channel text default 'whatsapp', -- 'whatsapp' | 'phone' | 'instagram' | 'share'
  add column if not exists event_date date,
  add column if not exists guest_count integer;
