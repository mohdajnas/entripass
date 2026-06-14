-- =======================================================
-- INTEGRATIONS & CREDENTIALS
-- =======================================================

-- Create the organization_integrations table to store API keys
create table organization_integrations (
  org_id uuid primary key references organizations(id) on delete cascade,
  razorpay_key_id text,
  razorpay_key_secret text,
  canva_client_id text,
  canva_client_secret text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table organization_integrations enable row level security;

-- Only the owner of the organization can view or edit these integrations
create policy "Integrations: Owner access" on organization_integrations
  for all using (
    exists (
      select 1 from organizations o
      where o.id = org_id and o.owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
create trigger update_organization_integrations_updated_at
  before update on organization_integrations
  for each row execute function update_updated_at_column();
