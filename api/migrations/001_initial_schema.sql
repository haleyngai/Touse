-- ============================================================
-- Touse — Supabase schema migration
-- Run: supabase db reset  OR  paste into Supabase SQL editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── users ───────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key default uuid_generate_v4(),
  clerk_id    text unique not null,
  email       text not null,
  full_name   text,
  avatar_url  text,
  lat         double precision,
  lng         double precision,
  zip         text,
  city        text,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;
create policy "Users can read/write own row"
  on public.users for all
  using (clerk_id = auth.uid()::text);

-- ── rooms ───────────────────────────────────────────────────
create table if not exists public.rooms (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null,               -- Clerk user_id
  photo_url   text not null,
  analysis    jsonb,
  created_at  timestamptz not null default now()
);

alter table public.rooms enable row level security;
create policy "Users own their rooms"
  on public.rooms for all
  using (user_id = auth.uid()::text);

-- ── room_designs ─────────────────────────────────────────────
create table if not exists public.room_designs (
  id                    uuid primary key default uuid_generate_v4(),
  room_id               uuid not null references public.rooms(id) on delete cascade,
  user_id               text not null,
  aesthetic_name        text not null,
  aesthetic_description text,
  items                 jsonb not null default '[]'::jsonb,
  total_estimated_cost  numeric(10, 2) default 0,
  budget_valid          boolean default true,
  created_at            timestamptz not null default now()
);

alter table public.room_designs enable row level security;
create policy "Users own their designs"
  on public.room_designs for all
  using (user_id = auth.uid()::text);

create index if not exists room_designs_room_id_idx on public.room_designs(room_id);

-- ── listings ─────────────────────────────────────────────────
create table if not exists public.listings (
  id                  uuid primary key default uuid_generate_v4(),
  provider            text not null check (provider in ('ebay', 'fixture')),
  title               text not null,
  description         text,
  price               numeric(10, 2) not null,
  image_url           text not null,
  listing_url         text not null,
  seller_name         text,
  seller_phone        text,
  distance_miles      double precision,
  condition           text,
  posted_at           text,
  furniture_item_id   text,
  design_id           uuid references public.room_designs(id) on delete set null,
  score               double precision,
  created_at          timestamptz not null default now()
);

-- Listings are globally readable (no user ownership — they are external data)
alter table public.listings enable row level security;
create policy "Listings are readable by all authenticated users"
  on public.listings for select
  using (auth.role() = 'authenticated');
create policy "Service role can insert/update listings"
  on public.listings for all
  using (auth.role() = 'service_role');

-- ── messages ─────────────────────────────────────────────────
create table if not exists public.messages (
  id            uuid primary key default uuid_generate_v4(),
  user_id       text not null,
  listing_id    uuid references public.listings(id) on delete set null,
  content       text not null,
  direction     text not null check (direction in ('outbound', 'inbound')) default 'outbound',
  status        text not null check (status in ('pending_manual','sent','delivered','replied','failed')) default 'pending_manual',
  twilio_sid    text,
  seller_phone  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.messages enable row level security;
create policy "Users own their messages"
  on public.messages for all
  using (user_id = auth.uid()::text);

create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_seller_phone_idx on public.messages(seller_phone);

-- ── purchases ────────────────────────────────────────────────
create table if not exists public.purchases (
  id            uuid primary key default uuid_generate_v4(),
  user_id       text not null,
  listing_id    uuid not null references public.listings(id) on delete cascade,
  price_paid    numeric(10, 2) not null,
  purchased_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table public.purchases enable row level security;
create policy "Users own their purchases"
  on public.purchases for all
  using (user_id = auth.uid()::text);

-- ── resell_listings ───────────────────────────────────────────
create table if not exists public.resell_listings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       text not null,
  purchase_id   uuid not null references public.purchases(id) on delete cascade,
  title         text not null,
  description   text not null,
  price         numeric(10, 2) not null,
  condition     text not null check (condition in ('excellent','good','fair','poor')),
  fb_category   text not null,
  photo_url     text,
  deep_link     text,
  status        text not null default 'draft' check (status in ('draft','posted')),
  created_at    timestamptz not null default now()
);

alter table public.resell_listings enable row level security;
create policy "Users own their resell listings"
  on public.resell_listings for all
  using (user_id = auth.uid()::text);

-- ── Supabase Storage buckets ─────────────────────────────────
-- Run in Supabase Dashboard > Storage or via CLI
-- insert into storage.buckets (id, name, public) values ('room-photos', 'room-photos', true);
-- insert into storage.buckets (id, name, public) values ('item-photos', 'item-photos', true);

-- Storage RLS (room-photos)
-- create policy "Users upload their own room photos"
--   on storage.objects for insert
--   with check (bucket_id = 'room-photos' and auth.role() = 'authenticated');
-- create policy "Room photos are publicly readable"
--   on storage.objects for select
--   using (bucket_id = 'room-photos');

-- ── Realtime ─────────────────────────────────────────────────
-- Enable Realtime for messages table in Supabase Dashboard > Database > Replication
-- or run:
-- alter publication supabase_realtime add table public.messages;
