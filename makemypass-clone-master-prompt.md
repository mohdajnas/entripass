# Master Prompt: MakeMyPass Clone with Glassmorphism + shadcn/ui

---

## OVERVIEW

Build a full-stack event management SaaS platform that clones MakeMyPass (makemypass.com) — including every feature module — using a dark glassmorphism design system built on top of shadcn/ui components. The stack is Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (auth + database), Stripe (payments), and Resend (email). Deploy target: Vercel.

---

## DESIGN SYSTEM (GLASSMORPHISM + shadcn)

### Visual Identity
- **Background**: Deep navy-to-purple radial gradient base: `from-[#0a0a1a] via-[#0d0d2b] to-[#0a0f1e]`
- **Glass cards**: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`
- **Glass hover**: `hover:bg-white/10 hover:border-white/20 transition-all duration-300`
- **Glow accents**: Indigo + violet gradient: `from-indigo-500 via-purple-500 to-pink-500`
- **Text**: Primary `text-white`, secondary `text-white/60`, muted `text-white/40`
- **Input fields**: `bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-400 focus:ring-indigo-400/20`
- **Buttons (primary)**: `bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/25`
- **Signature element**: Animated mesh-gradient orbs in the background (CSS radial-gradient blobs with `animate-pulse` and `blur-3xl`) that shift slowly behind all glass surfaces

### shadcn/ui Component Overrides
Override the following shadcn components in `components.json` with glassmorphism tokens:
```
Card         → glass panel (bg-white/5, backdrop-blur-xl, border-white/10)
Dialog       → frosted modal (bg-slate-900/80, backdrop-blur-2xl, border-white/15)
Sheet        → glass side-drawer
Table        → glass rows with hover:bg-white/5
Badge        → translucent colored pills
Tabs         → underline style, white/60 inactive, white active
Input        → glass input (bg-white/5, border-white/20)
Select       → glass dropdown
Button       → gradient primary, glass secondary (bg-white/10)
Toast        → glass notification (bottom-right, backdrop-blur)
Progress     → gradient fill (indigo → purple)
Avatar       → ring-2 ring-white/20
DropdownMenu → bg-slate-900/90 backdrop-blur-xl border-white/10
```

### Typography
- Display: `font-display` → Inter (700, 800) for headings
- Body: Inter 400/500
- Data/Mono: JetBrains Mono for ticket IDs, UUIDs, codes

---

## TECH STACK

```
Framework:     Next.js 14 (App Router, Server Components)
Language:      TypeScript (strict)
Styling:       Tailwind CSS + shadcn/ui (New York style, dark theme)
Database:      Supabase (PostgreSQL)
Auth:          Supabase Auth (email, Google OAuth)
File storage:  Supabase Storage (event banners, media)
Payments:      Stripe (checkout sessions, webhooks)
Email:         Resend + React Email (all 5 trigger types)
WhatsApp:      Twilio / WATI API (optional, flag-controlled)
QR codes:      qrcode.react (generation) + html5-qrcode (scanning)
Charts:        Recharts (wrapped in glass card)
Forms:         React Hook Form + Zod
State:         Zustand (client state) + React Query (server state)
Printing:      react-to-print (ticket PDF printing)
Drag-and-drop: @dnd-kit/core (form builder)
Maps:          None required
Deploy:        Vercel
```

---

## DATABASE SCHEMA (Supabase/PostgreSQL)

```sql
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
  is_online boolean default false,
  status text default 'draft', -- draft | published | ended
  max_capacity int,
  enable_waitlist boolean default false,
  enable_checkout boolean default false,
  enable_remote_printing boolean default false,
  checkin_confirmation boolean default true,
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
  capacity int
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
```

---

## FILE STRUCTURE

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (public)/
│   └── [eventSlug]/
│       ├── page.tsx                    ← Public registration page
│       └── view-ticket/[ticketId]/
│           └── page.tsx                ← Attendee ticket view
├── dashboard/
│   ├── layout.tsx                      ← Glass sidebar layout
│   ├── page.tsx                        ← All events overview
│   └── events/
│       ├── new/page.tsx
│       └── [eventId]/
│           ├── layout.tsx              ← Event nav tabs
│           ├── page.tsx                ← Event overview/dashboard
│           ├── form/page.tsx           ← Form builder
│           ├── guests/
│           │   ├── page.tsx            ← Guest list
│           │   └── [guestId]/page.tsx  ← Guest detail
│           ├── tickets/page.tsx        ← Ticket type management
│           ├── coupons/page.tsx
│           ├── speakers/page.tsx
│           ├── sponsors/page.tsx
│           ├── venues/page.tsx
│           ├── check-in/page.tsx       ← QR scanner + check-in
│           ├── inventory/page.tsx
│           ├── insights/page.tsx
│           ├── communications/page.tsx
│           ├── logs/page.tsx
│           ├── in-event/page.tsx       ← Live real-time stats
│           ├── post-event/page.tsx
│           └── settings/page.tsx
├── api/
│   ├── events/[eventId]/register/route.ts
│   ├── events/[eventId]/checkin/route.ts
│   ├── stripe/webhook/route.ts
│   ├── analytics/pageview/route.ts
│   └── print/[jobId]/route.ts
components/
├── ui/                                 ← shadcn/ui overridden components
├── layout/
│   ├── GlassSidebar.tsx
│   ├── GlassNavbar.tsx
│   └── BackgroundOrbs.tsx              ← Animated mesh gradient blobs
├── events/
│   ├── EventCard.tsx
│   ├── EventBanner.tsx
│   └── PublicEventPage.tsx
├── form-builder/
│   ├── FormBuilder.tsx                 ← dnd-kit drag-and-drop
│   ├── FieldEditor.tsx
│   └── FieldTypes/
├── guests/
│   ├── GuestTable.tsx
│   ├── GuestFilters.tsx
│   ├── BulkUploadDialog.tsx
│   └── GuestDetailSheet.tsx
├── check-in/
│   ├── QRScanner.tsx
│   ├── CheckInResult.tsx
│   ├── InventoryDistribute.tsx
│   └── RemotePrintSetup.tsx
├── insights/
│   ├── InsightsGrid.tsx
│   ├── CustomChartBuilder.tsx
│   └── charts/
├── tickets/
│   └── TicketCard.tsx                  ← Attendee-facing glass ticket
└── email/
    └── templates/                      ← React Email components
```

---

## FEATURE SPECIFICATIONS

### 1. PUBLIC EVENT REGISTRATION PAGE (`/[eventSlug]`)
- Full-width hero with event banner (glassmorphism overlay on image)
- Event title, date, venue, description
- Speaker cards in horizontal scroll (glass cards with photo + bio)
- Sponsor tier grid (Platinum > Gold > Silver > General)
- Registration form built from `form_fields` table — renders dynamically
- Ticket selector with available counts and pricing
- Coupon code input with live validation
- Stripe Checkout for paid tickets
- Submit → confirmation email + ticket QR generated
- Waitlist mode: show "Join Waitlist" CTA when capacity hit
- Embed-ready: `?embed=true` query param renders form-only in iframe
- UTM parameters auto-captured from URL and stored in `page_views`

### 2. VIEW TICKET PAGE (`/[eventSlug]/view-ticket/[ticketId]`)
- Glass card ticket design with:
  - Event name, date, venue
  - Attendee name, ticket type
  - Large QR code (links to check-in verification)
  - Unique ticket UUID in monospace
- "Add to Apple/Google Wallet" button (optional)
- Download as PDF button (`react-to-print`)
- Event details section below ticket

### 3. ORGANIZER DASHBOARD — EVENT OVERVIEW
Glass stat cards (real-time via Supabase Realtime):
- Total registrations / capacity
- Checked-in count
- Revenue collected (INR)
- Waitlisted count
- Recent registrations live feed (last 5)
- Quick action buttons: Share link, Generate QR, Edit event

### 4. FORM BUILDER
- Drag-and-drop field ordering via `@dnd-kit/core`
- Field types: Text, Email, Phone, Long text, Dropdown, Checkbox, Date, File upload, Section header
- Each field: label, placeholder, required toggle, conditional visibility rules
- Preview panel (mobile + desktop toggle)
- "Embed form" button → copy `<iframe>` snippet

### 5. TICKET MANAGEMENT
- Create multiple ticket types per event
- Set price (free or paid), capacity, sale window, per-order max
- Toggle visibility (hide from public)
- Drag to reorder
- Advanced: Link ticket type to specific form fields

### 6. COUPONS
- Create discount codes (% or flat ₹ off)
- Set max usage count and expiry date
- Live usage count display
- Bulk generate codes

### 7. GUEST MANAGEMENT
Full-featured data table (shadcn DataTable with TanStack Table):
- Columns: Name, Email, Ticket type, Status badge, Registered at, Amount paid
- Filter by: status, ticket type, check-in state, date range
- Search by name/email
- Row actions: View, Approve (from waitlist), Send email, Cancel
- Bulk select → Bulk approve / Bulk email / Export
- Bulk CSV/XLSX upload for inviting guests
- Export to XLSX

**Guest Detail Sheet** (side drawer):
- Full form response data
- Status history timeline
- Manual check-in toggle
- Resend confirmation email
- Notes field

### 8. QR SCANNING & CHECK-IN (`/check-in`)
Optimized for mobile, full-screen dark mode:
- Camera QR scanner (html5-qrcode) with glass overlay frame
- 4 mode tabs: Check-in | Venue Check-in | Check-out | Inventory
- **Check-in result cards** (animated slide-up):
  - Green glass = success new check-in
  - Amber glass = already checked in (shows time)
  - Red glass = invalid / not found
  - Optional confirmation dialog before marking checked-in
- **Venue check-in**: Select venue first, then scan
- **Check-out**: Scan to record departure time
- **Inventory mode**: Select goodie → scan guests → track claims
- **Individual inventory**: Scan guest → see all their allocated items → claim each
- **Add bonus**: Manual allocation of un-pre-allocated goodies
- **Remote Printing**:
  - Setup page: Enter printer ID, keep tab open as print receiver
  - On scan: select printer ID → assign print job
  - Receiver tab polls for queued jobs and triggers `window.print()`
- Manual check-in search (fallback when camera unavailable)

### 9. INVENTORY MANAGEMENT
- Create inventory items with total quantities
- Assign items to specific ticket types or all guests
- Real-time claim tracking table
- Export distribution report

### 10. IN-EVENT LIVE DASHBOARD
Powered by Supabase Realtime subscriptions:
- Live check-in counter with animated increment
- Hourly check-in rate chart (Recharts area chart, glass card)
- Venue capacity bars (per venue, live fill)
- Recent check-ins ticker (scrolling list)
- Inventory distribution progress bars

### 11. INSIGHTS & ANALYTICS
**Pre-built metrics:**
- Registration trend (daily line chart from launch)
- Hourly registrations (today vs yesterday bar chart)
- Registration time-of-day breakdown (morning/afternoon/evening/night)
- Page views vs unique visitors vs conversion rate
- Device breakdown (mobile/desktop/tablet) donut chart
- Top referrer sources bar chart
- Geographic distribution (country/city)

**Page View Analytics sub-page:**
- Conversion funnel: Views → Registrations
- UTM source/medium/campaign breakdown table
- Browser and OS pie charts

**Custom Insights:**
- "Create New Insight" button → select any form field → choose chart type (bar/pie/line/table) → renders inline
- Delete custom insight
- "Share Insights" → toggle public access → copy shareable URL (no login required for viewer)

### 12. COMMUNICATIONS
5 email template editors (rich text + variable insertion):
- **Invitation** — triggered manually per guest
- **Confirmation** — auto on registration/approval
- **Check-in** — auto on QR scan
- **After event - Thank you** — batch trigger from post-event page
- **After event - Sorry** — batch trigger for no-shows

Each template:
- Subject line editor
- HTML body editor with `{{field_name}}` variable syntax
- Live preview with sample data
- Attach ticket toggle
- File attachment upload
- Custom SMTP configuration (host/port/user/pass)
- Active/inactive toggle

**WhatsApp messaging**: Toggle in settings; sends via WATI/Twilio

### 13. MESSAGE LOGS
- Table of all emails + WhatsApp messages sent
- Columns: Recipient, Channel, Trigger type, Status, Timestamp
- Filter by channel, status, trigger type
- Retry failed messages

### 14. SPEAKERS
- Add/edit/delete speaker profiles
- Photo upload (Supabase Storage)
- Name, designation, company, bio, social link
- Drag to reorder
- Displayed on public event page

### 15. SPONSORS
- Add sponsors with logo + website
- Assign to tier: Platinum / Gold / Silver / General
- Displayed in tier sections on public page
- Drag to reorder within tier

### 16. VENUES
- Create sub-venues for the event (e.g. Hall A, Workshop Room)
- Set capacity per venue
- Used in venue check-in mode

### 17. POST-EVENT
- Send batch "Thank You" email to all checked-in guests
- Send batch "Sorry we missed you" email to registered but no-show guests
- Upload event photos/media (gallery grid)
- Download final attendance report

### 18. EVENT SETTINGS (EDIT EVENT)
- Basic info: title, description, start/end time, venue, online toggle
- Banner image upload
- Capacity and waitlist settings
- Tags (for organizing events in dashboard)
- Danger zone: Archive / Delete event

**Advanced settings:**
- Enable/disable check-in confirmation dialog
- Enable/disable check-out scanning
- Enable/disable remote printing
- Ticket schema for ID card printing (JSON config)
- Child event management (create sub-events linked to parent)
- Organization assignment

### 19. UTM TRACKING
- In event management page: UTM builder panel
- 5 categories: source, medium, campaign, content, term
- Checkbox to include/exclude each tag
- Live URL preview with params appended
- Copy to clipboard

### 20. TEAM MANAGEMENT
- Invite team members by email to an event or organization
- Role-based access: Owner, Admin, Check-in Staff, Viewer
- Check-in staff: can only access /check-in page
- Viewer: read-only dashboard access

---

## REUSABLE GLASS COMPONENT PATTERNS

```tsx
// Glass Card
<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-300">

// Glass Dialog (shadcn override)
<DialogContent className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 text-white rounded-2xl shadow-2xl shadow-black/50">

// Gradient Button
<Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border-0 shadow-lg shadow-indigo-500/25 text-white font-medium">

// Glass Input
<Input className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-400 focus:ring-indigo-400/20 rounded-xl">

// Status Badge
const statusColors = {
  confirmed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  pending:   "bg-amber-500/20  text-amber-300  border-amber-500/30",
  waitlisted:"bg-blue-500/20   text-blue-300   border-blue-500/30",
  checked_in:"bg-purple-500/20 text-purple-300 border-purple-500/30",
  cancelled: "bg-red-500/20    text-red-300    border-red-500/30",
}
<Badge className={`border text-xs font-medium ${statusColors[status]}`}>

// Background Orbs (in layout)
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
  <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-pink-600/15 rounded-full blur-3xl animate-pulse delay-2000" />
</div>
```

---

## PAGE-BY-PAGE IMPLEMENTATION ORDER

Build in this sequence for progressive functionality:

1. **Auth pages** (login, register) — glass card centered on gradient bg
2. **BackgroundOrbs + GlassSidebar + layout** — establish shell
3. **Dashboard home** — events grid with glass EventCards
4. **Create event wizard** — multi-step form (basic info → tickets → form fields)
5. **Public registration page** — attendee-facing, most critical path
6. **View ticket page** — glass ticket card + QR
7. **Guest management table** — sortable, filterable, paginated
8. **Form builder** — drag-and-drop fields
9. **QR Check-in page** — camera scanner + check-in result cards
10. **Ticket types + coupons** — pricing management
11. **Speakers + sponsors + venues** — content management
12. **Insights dashboard** — Recharts in glass cards
13. **Email template editor** — rich text + variable injection
14. **Message logs** — simple table with filters
15. **Inventory management** — perks distribution flow
16. **In-event live page** — Supabase Realtime subscriptions
17. **Post-event page** — batch emails + media upload
18. **Advanced settings + UTM builder**
19. **Team management + role-based access**
20. **Stripe webhooks + payment confirmation flow**

---

## KEY IMPLEMENTATION NOTES

### QR Code Flow
```
Registration → generate UUID → store as guests.qr_code
→ encode UUID as QR image (qrcode.react)
→ email QR to attendee
→ at event: scan QR → decode UUID → lookup guest → mark checked_in
```

### Stripe Integration
```
Paid ticket selected → create Stripe Checkout Session (server action)
→ redirect to Stripe → webhook receives payment_intent.succeeded
→ update guests.payment_status = 'paid', guests.status = 'confirmed'
→ trigger confirmation email
```

### Real-time Check-in Counter (Supabase Realtime)
```tsx
const channel = supabase
  .channel('checkins')
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'guests',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    if (payload.new.status === 'checked_in') {
      setCheckinCount(c => c + 1)
    }
  })
  .subscribe()
```

### Remote Printing Pattern
```
Scanner device: scan QR → select printer_id → POST /api/print → create print_jobs row
Printer device: poll print_jobs WHERE printer_id = mine AND status = 'queued'
→ fetch ticket HTML → window.print() → update status = 'done'
```

### Custom Insights Rendering
```tsx
// Aggregate form_data JSONB field from guests table
const data = await supabase.rpc('aggregate_form_field', {
  p_event_id: eventId,
  p_field_label: insight.field_label
})
// Returns [{value: 'Option A', count: 42}, ...]
// Render in Recharts BarChart / PieChart / LineChart inside glass card
```

---

## ENVIRONMENT VARIABLES

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
WATI_API_TOKEN=         # optional, WhatsApp
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## SHADCN INIT COMMAND

```bash
npx create-next-app@latest event-pass --typescript --tailwind --app --src-dir=false
cd event-pass
npx shadcn@latest init
# Choose: New York style, Zinc base color, CSS variables YES
# Then add all needed components:
npx shadcn@latest add button card dialog sheet table tabs input select badge
  avatar dropdown-menu toast progress calendar date-picker popover command
  separator skeleton form label textarea switch checkbox radio-group
  alert-dialog tooltip
```

---

## DELIVERABLE

A production-ready Next.js 14 application where:
- Every page uses the dark glassmorphism design system
- All 20 feature modules are implemented end-to-end
- shadcn/ui components are globally overridden with glass tokens in `globals.css`
- Database is fully normalized with RLS policies enabled in Supabase
- Stripe handles all paid ticket flows
- Resend sends all 5 email trigger types via React Email templates
- QR scanning works on mobile browsers without app install
- The check-in page works offline-first (service worker caches guest list)
- Insights page renders all pre-built + custom charts
- Role-based access control enforced at middleware level
