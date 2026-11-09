-- ══════════════════════════════════════════════════════════════════
-- CYATH SUPABASE POSTGRES SCHEMA & RLS POLICIES
-- Copy & paste this into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wrqcswxonsyxodfnumvy/sql
-- ══════════════════════════════════════════════════════════════════

-- 1. Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  agency_name text not null default 'Independent Studio',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Auto-create profile trigger on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, agency_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'agency_name', 'Independent Studio'))
  on conflict (id) do update set agency_name = excluded.agency_name;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Projects Table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  share_id text unique not null,
  title text not null,
  target_url text not null,
  agency_name text not null default 'Independent Studio',
  is_approved boolean default false not null,
  approved_at timestamp with time zone,
  approved_by text,
  approval_signature text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Pins Table
create table if not exists public.pins (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  number integer not null,
  x_percent double precision not null,
  y_percent double precision not null,
  status text check (status in ('open', 'in_progress', 'resolved')) default 'open' not null,
  device_mode text default 'desktop' not null,
  page_url text not null,
  telemetry jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  resolved_by text
);

-- 4. Comments Table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  pin_id uuid references public.pins on delete cascade not null,
  author_name text not null,
  author_role text default 'client' not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.pins enable row level security;
alter table public.comments enable row level security;

-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Projects: Owners manage own projects; Anyone with share_id can view
create policy "Owners manage own projects" on public.projects for all using (auth.uid() = user_id or auth.uid() is null);
create policy "Public can view projects" on public.projects for select using (true);

-- Pins & Comments: Frictionless client collaboration (no client account needed)
create policy "Public can read and create pins" on public.pins for all using (true);
create policy "Public can read and create comments" on public.comments for all using (true);
