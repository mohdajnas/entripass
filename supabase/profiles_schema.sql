create table profiles (
  id uuid references auth.users not null primary key,
  full_name text not null,
  username text unique,
  phone_number text,
  email text,
  gender text,
  dob date,
  city text,
  state text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Allow public read access" on public.profiles
  for select using (true);

create policy "Allow individual insert access" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Allow individual update access" on public.profiles
  for update using (auth.uid() = id);

-- Add map_link to events table
alter table public.events add column if not exists map_link text;

-- Enable Row Level Security on organizations
alter table public.organizations enable row level security;

-- Create policies for organizations
create policy "Allow public read access" on public.organizations
  for select using (true);

create policy "Allow individual insert access" on public.organizations
  for insert with check (auth.uid() = owner_id);

create policy "Allow individual update access" on public.organizations
  for update using (auth.uid() = owner_id);
