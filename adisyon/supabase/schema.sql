-- Adisyon – Supabase schema
-- Run this in Supabase Dashboard → SQL Editor

create table if not exists receipts (
  id            text primary key,
  user_id       text not null,
  user_name     text not null,
  restaurant_name text not null,
  total         numeric not null,
  people        integer not null,
  per_person    numeric not null,
  rating        integer not null default 0,
  comment       text not null default '',
  created_at    text not null
);

create table if not exists comments (
  id          text primary key,
  user_id     text not null,
  user_name   text not null,
  receipt_id  text not null,
  text        text not null,
  created_at  text not null
);

-- Allow public read + write (no auth required)
alter table receipts enable row level security;
alter table comments enable row level security;

create policy "public read receipts"  on receipts for select using (true);
create policy "public insert receipts" on receipts for insert with check (true);
create policy "public read comments"  on comments for select using (true);
create policy "public insert comments" on comments for insert with check (true);
