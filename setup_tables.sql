-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- TASKS TABLE
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  completed boolean default false,
  created_at bigint default extract(epoch from now()) * 1000,
  user_id uuid references auth.users(id) -- Optional if needed for multi-user
);

-- PROFILES TABLE
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  first_name text,
  last_name text,
  age integer,
  gender text,
  city text,
  occupation text,
  height text,
  religious_level text,
  about_me text,
  looking_for text,
  contact_phone text,
  email text,
  access_code text,
  image_url text,
  is_favorite boolean default false,
  private_notes text,
  interaction_history jsonb default '[]'::jsonb,
  "references" jsonb default '[]'::jsonb,
  documents jsonb default '[]'::jsonb,
  aliyah_status text,
  family_background text,
  location_radius integer,
  tags text[],
  created_at bigint default extract(epoch from now()) * 1000,
  updated_at bigint default extract(epoch from now()) * 1000,
  last_active_at bigint,
  -- New fields
  whatsapp text,
  social_networks text,
  nusach text,
  search_nusach text,
  looking_for_job text,
  looking_for_hashkafa text,
  looking_for_yirat_shamayim text
);
alter table profiles enable row level security;
create policy "Public profiles access" on profiles for all using (true) with check (true);

-- EVENTS TABLE
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date text,
  description text,
  location text,
  image_url text, -- Added image support
  created_at bigint default extract(epoch from now()) * 1000
);

-- BLOG POSTS TABLE
create table if not exists blog_posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  excerpt text,
  content text,
  image_url text, -- Added image support
  created_at bigint default extract(epoch from now()) * 1000
);

-- MESSAGES TABLE
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null, 
  direction text check (direction in ('FROM_SHADCHAN', 'FROM_CANDIDATE')),
  content text,
  is_read boolean default false,
  created_at bigint default extract(epoch from now()) * 1000
);

-- ACTIVITY LOGS TABLE
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  type text,
  description text,
  timestamp bigint
);

-- MATCHES TABLE 
create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  boy_id uuid,
  girl_id uuid,
  status text,
  notes text,
  last_updated bigint
);

-- SHADCHAN PROFILE (SETTINGS)
create table if not exists shadchan_profile (
  id integer primary key default 1, -- Single row enforced ideally, but 1 is fine
  check (id = 1),
  name text,
  bio text,
  phone text,
  email text,
  image_url text,
  updated_at bigint default extract(epoch from now()) * 1000
);
-- Initialize default shadchan profile if not exists
insert into shadchan_profile (id, name, bio) values (1, 'Votre Nom', 'Votre biographie ici...') on conflict do nothing;


-- RLS POLICIES (Example: Public Access for Demo Context)
alter table tasks enable row level security;
create policy "Public tasks access" on tasks for all using (true) with check (true);

alter table events enable row level security;
create policy "Public events access" on events for all using (true) with check (true);

alter table blog_posts enable row level security;
create policy "Public blog_posts access" on blog_posts for all using (true) with check (true);

alter table messages enable row level security;
create policy "Public messages access" on messages for all using (true) with check (true);

alter table activity_logs enable row level security;
create policy "Public activity_logs access" on activity_logs for all using (true) with check (true);

alter table matches enable row level security;
create policy "Public matches access" on matches for all using (true) with check (true);

alter table shadchan_profile enable row level security;
create policy "Public shadchan_profile access" on shadchan_profile for all using (true) with check (true);
