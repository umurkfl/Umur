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

-- Notifications (comment on receipt, reaction on comment)
create table if not exists notifications (
  id          text primary key,
  user_id     text not null,
  type        text not null,        -- 'comment' | 'reaction'
  actor_name  text not null,
  receipt_id  text not null default '',
  comment_id  text not null default '',
  text        text not null default '',
  read        boolean not null default false,
  created_at  text not null
);

alter table notifications enable row level security;

create policy "public read notifications"   on notifications for select using (true);
create policy "public insert notifications" on notifications for insert with check (true);
create policy "public update notifications" on notifications for update using (true);
create policy "public delete notifications" on notifications for delete using (true);

-- User profiles (avatar, cross-device)
create table if not exists user_profiles (
  user_id    text primary key,
  avatar     text not null default '',
  updated_at text not null
);

alter table user_profiles enable row level security;

create policy "public read user_profiles"   on user_profiles for select using (true);
create policy "public insert user_profiles" on user_profiles for insert with check (true);
create policy "public update user_profiles" on user_profiles for update using (true);

-- User settings (privacy, etc.)
create table if not exists user_settings (
  user_id    text primary key,
  privacy    text not null default 'public',
  updated_at text not null
);

alter table user_settings enable row level security;

create policy "public read user_settings"   on user_settings for select using (true);
create policy "public insert user_settings" on user_settings for insert with check (true);
create policy "public update user_settings" on user_settings for update using (true);

-- Location columns on receipts (run if table already exists)
alter table receipts add column if not exists city     text not null default '';
alter table receipts add column if not exists district text not null default '';
alter table receipts add column if not exists lat      numeric;
alter table receipts add column if not exists lng      numeric;

-- Direct messages (run once)
create table if not exists direct_messages (
  id               text primary key,
  from_user_id     text not null,
  from_user_name   text not null,
  from_user_avatar text,
  to_user_id       text not null,
  to_user_name     text not null default '',
  type             text not null default 'receipt',
  receipt_id       text,
  restaurant_name  text,
  note             text,
  created_at       text not null,
  read             boolean not null default false
);

alter table direct_messages enable row level security;

create policy "public read direct_messages"   on direct_messages for select using (true);
create policy "public insert direct_messages" on direct_messages for insert with check (true);
create policy "public update direct_messages" on direct_messages for update using (true);
create policy "public delete direct_messages" on direct_messages for delete using (true);

-- Reply columns (run if table already exists)
alter table direct_messages add column if not exists reply_to_id   text;
alter table direct_messages add column if not exists reply_to_text text;
