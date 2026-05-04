-- Add sort_order and is_featured to properties for manual reordering and editor's pick
alter table public.properties
add column if not exists sort_order integer default 0,
add column if not exists is_featured boolean default false;

-- Update existing properties to have sort_order based on created_at
update public.properties
set sort_order = extract(epoch from created_at)::integer
where sort_order = 0;
