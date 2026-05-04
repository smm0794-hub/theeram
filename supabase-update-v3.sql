-- Run this in Supabase SQL Editor

-- Add maps_url and instagram_url to properties table
alter table public.properties
add column if not exists maps_url text default '',
add column if not exists instagram_url text default '';

-- Fix upsert constraint if not already done
alter table public.property_attributes
add constraint if not exists property_attributes_property_id_key unique (property_id);
