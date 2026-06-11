-- =========================================================================
-- OPTION A: DISABLE ROW LEVEL SECURITY (Recommended for Dev/Prototyping)
-- Run this if you want to bypass all RLS check errors completely.
-- =========================================================================

alter table public.profiles disable row level security;
alter table public.organizations disable row level security;
alter table public.events disable row level security;
alter table public.child_events disable row level security;
alter table public.ticket_types disable row level security;
alter table public.form_fields disable row level security;
alter table public.coupons disable row level security;
alter table public.guests disable row level security;
alter table public.venues disable row level security;
alter table public.venue_checkins disable row level security;
alter table public.inventory_items disable row level security;
alter table public.inventory_claims disable row level security;
alter table public.speakers disable row level security;
alter table public.sponsors disable row level security;
alter table public.email_templates disable row level security;
alter table public.message_logs disable row level security;
alter table public.page_views disable row level security;
alter table public.custom_insights disable row level security;
alter table public.team_members disable row level security;
alter table public.remote_printers disable row level security;
alter table public.print_jobs disable row level security;


-- =========================================================================
-- OPTION B: ENABLE RLS AND APPLY SECURE POLICIES
-- Run this if you want strict security enabled.
-- =========================================================================

/*
-- 1. Enable RLS on core tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.form_fields enable row level security;

-- 2. Profiles policies
create policy "Allow public read profiles" on public.profiles for select using (true);
create policy "Allow self insert profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Allow self update profile" on public.profiles for update using (auth.uid() = id);

-- 3. Organizations policies
create policy "Allow public read organizations" on public.organizations for select using (true);
create policy "Allow self insert organization" on public.organizations for insert with check (auth.uid() = owner_id);
create policy "Allow self update organization" on public.organizations for update using (auth.uid() = owner_id);

-- 4. Events policies
create policy "Allow public read events" on public.events for select using (true);
create policy "Allow org owner insert event" on public.events for insert with check (
  exists (
    select 1 from public.organizations
    where organizations.id = org_id and organizations.owner_id = auth.uid()
  )
);
create policy "Allow org owner update event" on public.events for update using (
  exists (
    select 1 from public.organizations
    where organizations.id = org_id and organizations.owner_id = auth.uid()
  )
);

-- 5. Ticket Types policies
create policy "Allow public read ticket types" on public.ticket_types for select using (true);
create policy "Allow event owner manage ticket types" on public.ticket_types for all using (
  exists (
    select 1 from public.events
    join public.organizations on organizations.id = events.org_id
    where events.id = event_id and organizations.owner_id = auth.uid()
  )
);

-- 6. Form Fields policies
create policy "Allow public read form fields" on public.form_fields for select using (true);
create policy "Allow event owner manage form fields" on public.form_fields for all using (
  exists (
    select 1 from public.events
    join public.organizations on organizations.id = events.org_id
    where events.id = event_id and organizations.owner_id = auth.uid()
  )
);
*/
