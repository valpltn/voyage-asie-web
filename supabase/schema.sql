-- Supabase schema for the Voyage Mobilite app.
-- Run this in the Supabase SQL editor after creating the project and before importing data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.travel_folders (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  folder_id text not null references public.travel_folders(id) on delete cascade,
  title text not null,
  description text not null,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('draft', 'planned', 'active', 'archived')),
  stats jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  bookings jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  notes text,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  trip_id text references public.trips(id) on delete set null,
  label text not null,
  category text not null,
  kind text not null check (kind in ('planned', 'actual')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists travel_folders_public_idx on public.travel_folders (is_public, sort_order);
create index if not exists trips_public_folder_idx on public.trips (is_public, folder_id, sort_order);
create index if not exists expenses_owner_idx on public.expenses (owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_travel_folders_updated_at on public.travel_folders;
create trigger set_travel_folders_updated_at
before update on public.travel_folders
for each row execute function public.set_updated_at();

drop trigger if exists set_trips_updated_at on public.trips;
create trigger set_trips_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.travel_folders enable row level security;
alter table public.trips enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Profiles readable by owner" on public.profiles;
create policy "Profiles readable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Folders public read" on public.travel_folders;
create policy "Folders public read"
on public.travel_folders for select
using (is_public = true);

drop policy if exists "Folders owner write" on public.travel_folders;
create policy "Folders owner write"
on public.travel_folders for all
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_admin = true
  )
);

drop policy if exists "Trips public read" on public.trips;
create policy "Trips public read"
on public.trips for select
using (
  is_public = true
  and exists (
    select 1
    from public.travel_folders folder
    where folder.id = trips.folder_id
      and folder.is_public = true
  )
);

drop policy if exists "Trips owner write" on public.trips;
create policy "Trips owner write"
on public.trips for all
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_admin = true
  )
);

drop policy if exists "Expenses owner only" on public.expenses;
drop policy if exists "Expenses public read" on public.expenses;
create policy "Expenses public read"
on public.expenses for select
using (true);

drop policy if exists "Expenses admin write" on public.expenses;
create policy "Expenses admin write"
on public.expenses for all
using (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_admin = true
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_admin = true
  )
);
