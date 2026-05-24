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
  photo         text not null default '',
  created_at    text not null
);

create table if not exists comments (
  id          text primary key,
  user_id     text not null,
  user_name   text not null,
  user_avatar text not null default '',
  receipt_id  text not null,
  text        text not null,
  created_at  text not null
);

create table if not exists comment_reactions (
  id          text primary key,
  user_id     text not null,
  comment_id  text not null,
  reaction    text not null,  -- 'like' or 'dislike'
  unique(user_id, comment_id)
);

-- Row-level security (public read + write, no auth required)
alter table receipts          enable row level security;
alter table comments          enable row level security;
alter table comment_reactions enable row level security;

create policy "public read receipts"           on receipts          for select using (true);
create policy "public insert receipts"         on receipts          for insert with check (true);
create policy "public read comments"           on comments          for select using (true);
create policy "public insert comments"         on comments          for insert with check (true);
create policy "public delete comments"         on comments          for delete using (true);
create policy "public read reactions"          on comment_reactions for select using (true);
create policy "public insert reactions"        on comment_reactions for insert with check (true);
create policy "public update reactions"        on comment_reactions for update using (true);
create policy "public delete reactions"        on comment_reactions for delete using (true);

-- Storage: create the 'receipt-photos' bucket in Supabase Dashboard → Storage → New bucket
-- Name: receipt-photos, Public: true
-- Then run these policies:
create policy "public read receipt photos"
  on storage.objects for select using (bucket_id = 'receipt-photos');
create policy "public insert receipt photos"
  on storage.objects for insert with check (bucket_id = 'receipt-photos');

-- Friendships
create table if not exists friendships (
  id          text primary key,
  user_id     text not null,
  friend_id   text not null,
  user_name   text not null,
  friend_name text not null,
  status      text not null default 'pending',
  created_at  text not null,
  unique(user_id, friend_id)
);

alter table friendships enable row level security;

create policy "public read friendships"   on friendships for select using (true);
create policy "public insert friendships" on friendships for insert with check (true);
create policy "public update friendships" on friendships for update using (true);
create policy "public delete friendships" on friendships for delete using (true);

-- Check-ins
create table if not exists check_ins (
  id              text primary key,
  user_id         text not null,
  user_name       text not null,
  restaurant_name text not null,
  message         text not null default '',
  created_at      text not null
);

alter table check_ins enable row level security;

create policy "public read check_ins"   on check_ins for select using (true);
create policy "public insert check_ins" on check_ins for insert with check (true);
create policy "public delete check_ins" on check_ins for delete using (true);
