-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  owner_id uuid references auth.users not null,
  created_at timestamptz default now()
);

-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations not null,
  title text not null,
  slug text not null,
  description text,
  banner_url text,
  start_time timestamptz,
  end_time timestamptz,
  venue text,
  location_url text,
  is_online boolean default false,
  status text default 'draft', -- draft | published | ended
  max_capacity int,
  enable_waitlist boolean default false,
  enable_checkout boolean default false,
  enable_remote_printing boolean default false,
  checkin_confirmation boolean default true,
  show_speakers boolean default true,
  is_public boolean default false,
  tags text[],
  created_at timestamptz default now(),
  unique(org_id, slug)
);

-- Child Events
create table child_events (
  id uuid primary key default gen_random_uuid(),
  parent_event_id uuid references events not null,
  title text not null,
  description text,
  start_time timestamptz,
  capacity int
);

-- Ticket Types
create table ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  name text not null,
  description text,
  price decimal(10,2) default 0,
  currency text default 'INR',
  capacity int,
  sale_start timestamptz,
  sale_end timestamptz,
  is_visible boolean default true,
  max_per_order int default 1,
  sort_order int default 0
);

-- Form Fields (custom registration form)
create table form_fields (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  field_type text not null, -- text|email|phone|select|checkbox|file|date
  label text not null,
  placeholder text,
  options jsonb, -- for select/radio
  is_required boolean default false,
  is_hidden boolean default false,
  sort_order int default 0,
  conditions jsonb -- conditional logic rules
);

-- Coupons
create table coupons (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  code text not null,
  discount_type text not null, -- percent | flat
  discount_value decimal(10,2) not null,
  max_uses int,
  used_count int default 0,
  expires_at timestamptz,
  unique(event_id, code)
);

-- Guests / Registrations
create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  ticket_type_id uuid references ticket_types,
  form_data jsonb not null default '{}',
  email text not null,
  name text not null,
  phone text,
  status text default 'pending', -- pending | confirmed | waitlisted | checked_in | cancelled
  qr_code text unique not null default gen_random_uuid()::text,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  payment_status text default 'unpaid', -- unpaid | paid | refunded
  payment_intent_id text,
  coupon_id uuid references coupons,
  amount_paid decimal(10,2) default 0,
  registered_at timestamptz default now()
);

-- Venues (sub-venues inside an event)
create table venues (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  name text not null,
  capacity int,
  location_url text
);

-- Venue Check-ins
create table venue_checkins (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests not null,
  venue_id uuid references venues not null,
  checked_in_at timestamptz default now()
);

-- Inventory (goodies/perks)
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  name text not null,
  total_quantity int not null,
  distributed_count int default 0
);

-- Guest Inventory Claims
create table inventory_claims (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests not null,
  item_id uuid references inventory_items not null,
  quantity int default 1,
  claimed_at timestamptz default now()
);

-- Speakers
create table speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  name text not null,
  bio text,
  photo_url text,
  designation text,
  company text,
  social_url text
);

-- Sponsors
create table sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  name text not null,
  logo_url text,
  website_url text,
  tier text default 'general' -- platinum | gold | silver | general
);

-- Email Templates
create table email_templates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  trigger_type text not null, -- invitation | confirmation | checkin | post_thankyou | post_sorry
  subject text not null,
  body_html text not null,
  include_ticket boolean default true,
  is_active boolean default true,
  smtp_host text,
  smtp_port int,
  smtp_user text,
  smtp_pass text, -- encrypted
  unique(event_id, trigger_type)
);

-- Email/WhatsApp Logs
create table message_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  guest_id uuid references guests,
  channel text not null, -- email | whatsapp
  trigger_type text not null,
  status text not null, -- sent | delivered | failed
  sent_at timestamptz default now()
);

-- Page View Analytics
create table page_views (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  visitor_id text, -- anonymous fingerprint
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  device_type text, -- desktop | mobile | tablet
  browser text,
  country text,
  city text,
  viewed_at timestamptz default now()
);

-- Custom Insights
create table custom_insights (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  title text not null,
  form_field_id uuid references form_fields,
  chart_type text not null, -- bar | pie | line | table
  is_public boolean default false,
  sort_order int default 0
);

-- Team Roles
create table team_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events,
  org_id uuid references organizations,
  user_id uuid references auth.users not null,
  role text not null, -- owner | admin | check_in | viewer
  invited_email text
);

-- Remote Printers
create table remote_printers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  printer_id text not null unique,
  label text,
  last_ping timestamptz,
  status text default 'offline'
);

-- Print Jobs
create table print_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null,
  guest_id uuid references guests not null,
  printer_id text references remote_printers(printer_id),
  status text default 'queued', -- queued | printing | done | failed
  created_at timestamptz default now()
);
