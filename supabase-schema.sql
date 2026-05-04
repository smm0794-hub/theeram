-- ============================================================
-- THEERAM — Supabase SQL Schema
-- Run this in Supabase Studio → SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ---- PROPERTIES ----
create table public.properties (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  slug              text unique not null,
  tagline           text,
  description       text,
  property_type     text default 'villa_with_pool',
  owner_whatsapp    text,
  owner_name        text,
  price_guide       text,
  photos            text[] default '{}',
  is_active         boolean default false,
  map_pin_x         float default 195,
  map_pin_y         float default 265,
  created_at        timestamptz default now()
);

-- ---- PROPERTY ATTRIBUTES ----
create table public.property_attributes (
  property_id             uuid primary key references public.properties(id) on delete cascade,
  room_count              integer default 0,
  bathroom_count          integer default 0,
  max_guests_overnight    integer default 0,
  max_guests_day_event    integer default 0,
  has_pool                boolean default false,
  has_ac_hall             boolean default false,
  ac_hall_capacity        integer default 0,
  has_non_ac_hall         boolean default false,
  non_ac_hall_capacity    integer default 0,
  has_open_lawn           boolean default false,
  open_lawn_sqft          integer default 0,
  has_kitchen             boolean default false,
  has_parking             boolean default false,
  parking_count           integer default 0,
  has_generator           boolean default false,
  alcohol_allowed         boolean default false,
  outside_catering        boolean default false
);

-- ---- PROPERTY EVENT TYPES ----
create table public.property_event_types (
  id            uuid primary key default uuid_generate_v4(),
  property_id   uuid references public.properties(id) on delete cascade,
  event_type    text check (event_type in (
    'staycation', 'family_gathering', 'wedding',
    'corporate', 'birthday', 'retreat'
  ))
);

-- ---- INQUIRIES ----
create table public.inquiries (
  id            uuid primary key default uuid_generate_v4(),
  property_id   uuid references public.properties(id) on delete set null,
  event_type    text,
  created_at    timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.properties enable row level security;
alter table public.property_attributes enable row level security;
alter table public.property_event_types enable row level security;
alter table public.inquiries enable row level security;

-- Public can only see active properties
create policy "Public can view active properties"
  on public.properties for select
  using (is_active = true);

-- Public can view attributes of active properties only
create policy "Public can view attributes of active properties"
  on public.property_attributes for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.is_active = true
    )
  );

-- Public can view event types of active properties only
create policy "Public can view event types of active properties"
  on public.property_event_types for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.is_active = true
    )
  );

-- Public can insert inquiries (anonymous)
create policy "Public can insert inquiries"
  on public.inquiries for insert
  with check (true);

-- Service role bypasses RLS for curator writes (no policy needed,
-- service_role key has full access by default in Supabase)

-- ============================================================
-- SAMPLE DATA — delete before going live
-- ============================================================

insert into public.properties (
  name, slug, tagline, description, property_type,
  owner_whatsapp, owner_name, price_guide,
  is_active, map_pin_x, map_pin_y
) values (
  'Meenachil Garden Villa',
  'meenachil-garden-villa',
  'A serene riverside villa among rubber trees — perfect for family gatherings and quiet celebrations',
  'Meenachil Garden Villa sits on 1.5 acres along the Meenachil River, surrounded by tall rubber trees and seasonal wildflowers. The main nalukettu-style house opens to a central courtyard seating 80 guests. A separate modern hall accommodates 120 with full AC and AV. The open lawn runs to the river''s edge — ideal for evening events. Private, spacious, and genuinely beautiful.',
  'villa_with_pool',
  '919447000000',
  'Thomas Varghese',
  '₹15,000–₹25,000 per day (full property)',
  true,
  204,
  287
);

-- Get the ID of the property we just inserted
do $$
declare
  prop_id uuid;
begin
  select id into prop_id from public.properties where slug = 'meenachil-garden-villa';

  insert into public.property_attributes (
    property_id, room_count, bathroom_count,
    max_guests_overnight, max_guests_day_event,
    has_pool, has_ac_hall, ac_hall_capacity,
    has_non_ac_hall, non_ac_hall_capacity,
    has_open_lawn, open_lawn_sqft,
    has_kitchen, has_parking, parking_count,
    has_generator, alcohol_allowed, outside_catering
  ) values (
    prop_id, 6, 7, 24, 200,
    true, true, 120,
    true, 80,
    true, 8000,
    true, true, 30,
    true, true, true
  );

  insert into public.property_event_types (property_id, event_type)
  values
    (prop_id, 'staycation'),
    (prop_id, 'family_gathering'),
    (prop_id, 'wedding'),
    (prop_id, 'corporate'),
    (prop_id, 'birthday');
end $$;
