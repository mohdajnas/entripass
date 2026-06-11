// Mock data for development — replaces Supabase queries until backend is integrated

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
}

export interface Event {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  description: string;
  banner_url: string | null;
  start_time: string;
  end_time: string;
  venue: string;
  map_link?: string | null;
  is_online: boolean;
  show_speakers?: boolean;
  status: "draft" | "published" | "ended";
  max_capacity: number;
  enable_waitlist: boolean;
  enable_checkout: boolean;
  tags: string[];
  registered_count: number;
  checked_in_count: number;
  revenue: number;
  waitlisted_count: number;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  capacity: number;
  sold: number;
  sale_start: string;
  sale_end: string;
  is_visible: boolean;
  max_per_order: number;
  sort_order: number;
}

export interface Guest {
  id: string;
  event_id: string;
  ticket_type_id: string;
  ticket_type_name: string;
  email: string;
  name: string;
  phone: string;
  status: "pending" | "confirmed" | "waitlisted" | "checked_in" | "cancelled";
  qr_code: string;
  checked_in_at: string | null;
  payment_status: "unpaid" | "paid" | "refunded";
  amount_paid: number;
  registered_at: string;
  form_data: Record<string, string>;
}

export interface FormField {
  id: string;
  event_id: string;
  field_type: "text" | "email" | "phone" | "select" | "checkbox" | "file" | "date" | "textarea" | "section";
  label: string;
  placeholder: string;
  options: string[] | null;
  is_required: boolean;
  is_hidden: boolean;
  sort_order: number;
}

export interface Coupon {
  id: string;
  event_id: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
}

export interface Speaker {
  id: string;
  event_id: string;
  name: string;
  bio: string;
  photo_url: string;
  designation: string;
  company: string;
  social_url: string;
}

export interface Sponsor {
  id: string;
  event_id: string;
  name: string;
  logo_url: string;
  website_url: string;
  tier: "platinum" | "gold" | "silver" | "general";
}

export interface Venue {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  checked_in: number;
}

export interface InventoryItem {
  id: string;
  event_id: string;
  name: string;
  total_quantity: number;
  distributed_count: number;
}

export interface EmailTemplate {
  id: string;
  event_id: string;
  trigger_type: "invitation" | "confirmation" | "checkin" | "post_thankyou" | "post_sorry";
  subject: string;
  body_html: string;
  include_ticket: boolean;
  is_active: boolean;
}

export interface MessageLog {
  id: string;
  event_id: string;
  guest_name: string;
  guest_email: string;
  channel: "email" | "whatsapp";
  trigger_type: string;
  status: "sent" | "delivered" | "failed";
  sent_at: string;
}

// ─── Mock Organizations ───
export const mockOrganizations: Organization[] = [
  {
    id: "org-1",
    name: "TechConf Global",
    slug: "techconf-global",
    logo_url: null,
    owner_id: "user-1",
  },
];

// ─── Mock Events ───
export const mockEvents: Event[] = [
  {
    id: "evt-1",
    org_id: "org-1",
    title: "DevConnect 2025",
    slug: "devconnect-2025",
    description: "The premier developer conference bringing together the world's best engineers, designers, and product minds. Three days of workshops, talks, and networking in the heart of Bangalore.",
    banner_url: "/banners/devconnect.jpg",
    start_time: "2025-08-15T09:00:00Z",
    end_time: "2025-08-17T18:00:00Z",
    venue: "Bangalore International Exhibition Centre",
    is_online: false,
    status: "published",
    max_capacity: 2000,
    enable_waitlist: true,
    enable_checkout: true,
    tags: ["tech", "conference", "developers"],
    registered_count: 1247,
    checked_in_count: 892,
    revenue: 1872500,
    waitlisted_count: 53,
  },
  {
    id: "evt-2",
    org_id: "org-1",
    title: "AI Summit India",
    slug: "ai-summit-india",
    description: "Explore the cutting edge of artificial intelligence with industry leaders. Hands-on workshops on LLMs, computer vision, and ML ops.",
    banner_url: "/banners/ai-summit.jpg",
    start_time: "2025-09-20T10:00:00Z",
    end_time: "2025-09-21T17:00:00Z",
    venue: "Hyderabad Convention Centre",
    is_online: false,
    status: "draft",
    max_capacity: 800,
    enable_waitlist: false,
    enable_checkout: true,
    tags: ["AI", "machine learning", "summit"],
    registered_count: 234,
    checked_in_count: 0,
    revenue: 468000,
    waitlisted_count: 0,
  },
  {
    id: "evt-3",
    org_id: "org-1",
    title: "Design Systems Workshop",
    slug: "design-systems-workshop",
    description: "A hands-on workshop exploring modern design systems, component libraries, and design tokens. Learn to build scalable UI architectures.",
    banner_url: "/banners/design-workshop.jpg",
    start_time: "2025-07-10T14:00:00Z",
    end_time: "2025-07-10T18:00:00Z",
    venue: "Online",
    is_online: true,
    status: "ended",
    max_capacity: 200,
    enable_waitlist: false,
    enable_checkout: false,
    tags: ["design", "workshop", "UI/UX"],
    registered_count: 189,
    checked_in_count: 156,
    revenue: 0,
    waitlisted_count: 0,
  },
  {
    id: "evt-4",
    org_id: "org-1",
    title: "Startup Pitch Night",
    slug: "startup-pitch-night",
    description: "An evening of innovation where 10 handpicked startups pitch to a panel of top-tier VCs. Networking, drinks, and the future of tech.",
    banner_url: "/banners/pitch-night.jpg",
    start_time: "2025-10-05T18:00:00Z",
    end_time: "2025-10-05T22:00:00Z",
    venue: "WeWork Galaxy, Bangalore",
    is_online: false,
    status: "published",
    max_capacity: 150,
    enable_waitlist: true,
    enable_checkout: true,
    tags: ["startups", "networking", "VC"],
    registered_count: 142,
    checked_in_count: 0,
    revenue: 71000,
    waitlisted_count: 12,
  },
];

// ─── Mock Ticket Types ───
export const mockTicketTypes: TicketType[] = [
  {
    id: "tkt-1",
    event_id: "evt-1",
    name: "Early Bird",
    description: "Early bird pricing — limited availability",
    price: 999,
    currency: "INR",
    capacity: 500,
    sold: 500,
    sale_start: "2025-01-01T00:00:00Z",
    sale_end: "2025-03-31T23:59:59Z",
    is_visible: true,
    max_per_order: 3,
    sort_order: 0,
  },
  {
    id: "tkt-2",
    event_id: "evt-1",
    name: "Regular",
    description: "Standard conference pass with all sessions",
    price: 1999,
    currency: "INR",
    capacity: 1000,
    sold: 647,
    sale_start: "2025-04-01T00:00:00Z",
    sale_end: "2025-08-14T23:59:59Z",
    is_visible: true,
    max_per_order: 5,
    sort_order: 1,
  },
  {
    id: "tkt-3",
    event_id: "evt-1",
    name: "VIP",
    description: "VIP access with exclusive networking lounge, lunch, and swag bag",
    price: 4999,
    currency: "INR",
    capacity: 100,
    sold: 78,
    sale_start: "2025-01-01T00:00:00Z",
    sale_end: "2025-08-14T23:59:59Z",
    is_visible: true,
    max_per_order: 2,
    sort_order: 2,
  },
  {
    id: "tkt-4",
    event_id: "evt-1",
    name: "Workshop Only",
    description: "Access to workshop sessions only",
    price: 499,
    currency: "INR",
    capacity: 200,
    sold: 22,
    sale_start: "2025-06-01T00:00:00Z",
    sale_end: "2025-08-14T23:59:59Z",
    is_visible: false,
    max_per_order: 1,
    sort_order: 3,
  },
];

// ─── Mock Guests ───
const guestNames = [
  "Arjun Mehta", "Priya Sharma", "Rahul Gupta", "Sneha Patel", "Vikram Singh",
  "Ananya Krishnan", "Deepak Joshi", "Meera Nair", "Karthik Raman", "Divya Iyer",
  "Amit Choudhary", "Neha Reddy", "Sanjay Kumar", "Lakshmi Menon", "Rohan Das",
  "Pooja Hegde", "Arun Vijay", "Kavitha Suresh", "Nikhil Rao", "Shreya Bhat",
];
const statuses: Guest["status"][] = ["pending", "confirmed", "waitlisted", "checked_in", "cancelled"];

export const mockGuests: Guest[] = guestNames.map((name, i) => ({
  id: `guest-${i + 1}`,
  event_id: "evt-1",
  ticket_type_id: ["tkt-1", "tkt-2", "tkt-3"][i % 3],
  ticket_type_name: ["Early Bird", "Regular", "VIP"][i % 3],
  email: `${name.toLowerCase().replace(/ /g, ".")}@email.com`,
  name,
  phone: `+91 ${9800000000 + i * 111111}`,
  status: statuses[i % 5],
  qr_code: `QR-${String(i + 1).padStart(6, "0")}`,
  checked_in_at: i % 5 === 3 ? "2025-08-15T10:30:00Z" : null,
  payment_status: i % 3 === 2 ? "paid" : i % 5 === 0 ? "unpaid" : "paid",
  amount_paid: [999, 1999, 4999][i % 3],
  registered_at: new Date(2025, 4, 1 + i).toISOString(),
  form_data: {
    company: ["Google", "Microsoft", "Amazon", "Flipkart", "Swiggy"][i % 5],
    role: ["Engineer", "Designer", "PM", "Founder", "Student"][i % 5],
    tshirt_size: ["S", "M", "L", "XL"][i % 4],
  },
}));

// ─── Mock Form Fields ───
export const mockFormFields: FormField[] = [
  { id: "ff-1", event_id: "evt-1", field_type: "text", label: "Full Name", placeholder: "Enter your full name", options: null, is_required: true, is_hidden: false, sort_order: 0 },
  { id: "ff-2", event_id: "evt-1", field_type: "email", label: "Email Address", placeholder: "you@company.com", options: null, is_required: true, is_hidden: false, sort_order: 1 },
  { id: "ff-3", event_id: "evt-1", field_type: "phone", label: "Phone Number", placeholder: "+91 XXXXX XXXXX", options: null, is_required: false, is_hidden: false, sort_order: 2 },
  { id: "ff-4", event_id: "evt-1", field_type: "text", label: "Company / Organization", placeholder: "Where do you work?", options: null, is_required: false, is_hidden: false, sort_order: 3 },
  { id: "ff-5", event_id: "evt-1", field_type: "select", label: "Role", placeholder: "Select your role", options: ["Engineer", "Designer", "PM", "Founder", "Student", "Other"], is_required: true, is_hidden: false, sort_order: 4 },
  { id: "ff-6", event_id: "evt-1", field_type: "select", label: "T-Shirt Size", placeholder: "Select size", options: ["S", "M", "L", "XL", "XXL"], is_required: false, is_hidden: false, sort_order: 5 },
  { id: "ff-7", event_id: "evt-1", field_type: "checkbox", label: "I agree to the Code of Conduct", placeholder: "", options: null, is_required: true, is_hidden: false, sort_order: 6 },
];

// ─── Mock Coupons ───
export const mockCoupons: Coupon[] = [
  { id: "cpn-1", event_id: "evt-1", code: "EARLYBIRD20", discount_type: "percent", discount_value: 20, max_uses: 100, used_count: 67, expires_at: "2025-06-30T23:59:59Z" },
  { id: "cpn-2", event_id: "evt-1", code: "SPEAKER50", discount_type: "percent", discount_value: 50, max_uses: 20, used_count: 12, expires_at: "2025-08-14T23:59:59Z" },
  { id: "cpn-3", event_id: "evt-1", code: "FLAT500", discount_type: "flat", discount_value: 500, max_uses: 50, used_count: 31, expires_at: "2025-07-31T23:59:59Z" },
  { id: "cpn-4", event_id: "evt-1", code: "STUDENT100", discount_type: "percent", discount_value: 100, max_uses: 30, used_count: 28, expires_at: "2025-08-14T23:59:59Z" },
];

// ─── Mock Speakers ───
export const mockSpeakers: Speaker[] = [
  { id: "spk-1", event_id: "evt-1", name: "Dr. Aisha Patel", bio: "AI researcher and founder of NeuralForge Labs. Former lead at Google DeepMind with 15+ publications in top ML conferences.", photo_url: "", designation: "Founder & CEO", company: "NeuralForge Labs", social_url: "https://twitter.com/aishapatel" },
  { id: "spk-2", event_id: "evt-1", name: "Marcus Chen", bio: "Distinguished engineer at Netflix building next-gen streaming infrastructure. Speaker at KubeCon, QCon, and Strange Loop.", photo_url: "", designation: "Distinguished Engineer", company: "Netflix", social_url: "https://twitter.com/marcuschen" },
  { id: "spk-3", event_id: "evt-1", name: "Sophia Rodriguez", bio: "Design systems lead creating scalable component architectures for millions of users. Author of 'Systematic Design'.", photo_url: "", designation: "Head of Design Systems", company: "Figma", social_url: "https://twitter.com/sophiarodriguez" },
  { id: "spk-4", event_id: "evt-1", name: "Rajesh Iyer", bio: "Serial entrepreneur with 3 successful exits. Currently building the future of developer tooling in India.", photo_url: "", designation: "Co-founder", company: "DevToolsHQ", social_url: "https://twitter.com/rajeshiyer" },
  { id: "spk-5", event_id: "evt-1", name: "Elena Volkov", bio: "Security engineer focused on zero-trust architectures. Previously at CloudFlare and Stripe security teams.", photo_url: "", designation: "Principal Security Engineer", company: "Stripe", social_url: "https://twitter.com/elenavolkov" },
];

// ─── Mock Sponsors ───
export const mockSponsors: Sponsor[] = [
  { id: "sp-1", event_id: "evt-1", name: "Vercel", logo_url: "", website_url: "https://vercel.com", tier: "platinum" },
  { id: "sp-2", event_id: "evt-1", name: "Supabase", logo_url: "", website_url: "https://supabase.com", tier: "platinum" },
  { id: "sp-3", event_id: "evt-1", name: "GitHub", logo_url: "", website_url: "https://github.com", tier: "gold" },
  { id: "sp-4", event_id: "evt-1", name: "Stripe", logo_url: "", website_url: "https://stripe.com", tier: "gold" },
  { id: "sp-5", event_id: "evt-1", name: "Figma", logo_url: "", website_url: "https://figma.com", tier: "silver" },
  { id: "sp-6", event_id: "evt-1", name: "Railway", logo_url: "", website_url: "https://railway.app", tier: "silver" },
  { id: "sp-7", event_id: "evt-1", name: "Resend", logo_url: "", website_url: "https://resend.com", tier: "general" },
  { id: "sp-8", event_id: "evt-1", name: "Neon", logo_url: "", website_url: "https://neon.tech", tier: "general" },
];

// ─── Mock Venues ───
export const mockVenues: Venue[] = [
  { id: "ven-1", event_id: "evt-1", name: "Main Hall", capacity: 1000, checked_in: 652 },
  { id: "ven-2", event_id: "evt-1", name: "Workshop Room A", capacity: 100, checked_in: 78 },
  { id: "ven-3", event_id: "evt-1", name: "Workshop Room B", capacity: 100, checked_in: 91 },
  { id: "ven-4", event_id: "evt-1", name: "Networking Lounge", capacity: 200, checked_in: 145 },
  { id: "ven-5", event_id: "evt-1", name: "VIP Lounge", capacity: 50, checked_in: 34 },
];

// ─── Mock Inventory Items ───
export const mockInventoryItems: InventoryItem[] = [
  { id: "inv-1", event_id: "evt-1", name: "T-Shirt", total_quantity: 1500, distributed_count: 876 },
  { id: "inv-2", event_id: "evt-1", name: "Sticker Pack", total_quantity: 2000, distributed_count: 1245 },
  { id: "inv-3", event_id: "evt-1", name: "Notebook", total_quantity: 1000, distributed_count: 543 },
  { id: "inv-4", event_id: "evt-1", name: "Water Bottle", total_quantity: 500, distributed_count: 312 },
  { id: "inv-5", event_id: "evt-1", name: "Lunch Voucher", total_quantity: 2000, distributed_count: 1678 },
];

// ─── Mock Email Templates ───
export const mockEmailTemplates: EmailTemplate[] = [
  { id: "eml-1", event_id: "evt-1", trigger_type: "invitation", subject: "You're Invited to {{event_name}}!", body_html: "<h1>Hello {{name}}</h1><p>You are invited to attend {{event_name}} on {{event_date}}.</p>", include_ticket: false, is_active: true },
  { id: "eml-2", event_id: "evt-1", trigger_type: "confirmation", subject: "Registration Confirmed — {{event_name}}", body_html: "<h1>Welcome {{name}}!</h1><p>Your registration for {{event_name}} is confirmed. Your ticket is attached below.</p>", include_ticket: true, is_active: true },
  { id: "eml-3", event_id: "evt-1", trigger_type: "checkin", subject: "You're Checked In! — {{event_name}}", body_html: "<h1>Welcome to the event, {{name}}!</h1><p>You have been checked in at {{checkin_time}}.</p>", include_ticket: false, is_active: true },
  { id: "eml-4", event_id: "evt-1", trigger_type: "post_thankyou", subject: "Thank You for Attending {{event_name}}!", body_html: "<h1>Thank you, {{name}}!</h1><p>We hope you enjoyed {{event_name}}. See you next time!</p>", include_ticket: false, is_active: false },
  { id: "eml-5", event_id: "evt-1", trigger_type: "post_sorry", subject: "We Missed You at {{event_name}}", body_html: "<h1>Hi {{name}},</h1><p>We noticed you couldn't make it to {{event_name}}. We hope to see you at our next event!</p>", include_ticket: false, is_active: false },
];

// ─── Mock Message Logs ───
export const mockMessageLogs: MessageLog[] = [
  { id: "log-1", event_id: "evt-1", guest_name: "Arjun Mehta", guest_email: "arjun.mehta@email.com", channel: "email", trigger_type: "confirmation", status: "delivered", sent_at: "2025-05-02T10:15:00Z" },
  { id: "log-2", event_id: "evt-1", guest_name: "Priya Sharma", guest_email: "priya.sharma@email.com", channel: "email", trigger_type: "confirmation", status: "delivered", sent_at: "2025-05-03T14:22:00Z" },
  { id: "log-3", event_id: "evt-1", guest_name: "Rahul Gupta", guest_email: "rahul.gupta@email.com", channel: "email", trigger_type: "invitation", status: "sent", sent_at: "2025-05-01T09:00:00Z" },
  { id: "log-4", event_id: "evt-1", guest_name: "Sneha Patel", guest_email: "sneha.patel@email.com", channel: "whatsapp", trigger_type: "confirmation", status: "delivered", sent_at: "2025-05-04T16:45:00Z" },
  { id: "log-5", event_id: "evt-1", guest_name: "Vikram Singh", guest_email: "vikram.singh@email.com", channel: "email", trigger_type: "checkin", status: "failed", sent_at: "2025-08-15T10:32:00Z" },
  { id: "log-6", event_id: "evt-1", guest_name: "Ananya Krishnan", guest_email: "ananya.krishnan@email.com", channel: "email", trigger_type: "confirmation", status: "delivered", sent_at: "2025-05-05T11:00:00Z" },
  { id: "log-7", event_id: "evt-1", guest_name: "Deepak Joshi", guest_email: "deepak.joshi@email.com", channel: "whatsapp", trigger_type: "invitation", status: "sent", sent_at: "2025-04-28T08:15:00Z" },
  { id: "log-8", event_id: "evt-1", guest_name: "Meera Nair", guest_email: "meera.nair@email.com", channel: "email", trigger_type: "confirmation", status: "delivered", sent_at: "2025-05-06T13:30:00Z" },
];

// ─── Analytics Mock Data ───
export const mockDailyRegistrations = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2025, 6, i + 1).toISOString().split("T")[0],
  registrations: Math.floor(Math.random() * 60) + 10,
}));

export const mockHourlyCheckins = Array.from({ length: 12 }, (_, i) => ({
  hour: `${8 + i}:00`,
  checkins: Math.floor(Math.random() * 80) + 5,
}));

export const mockDeviceBreakdown = [
  { name: "Mobile", value: 58 },
  { name: "Desktop", value: 35 },
  { name: "Tablet", value: 7 },
];

export const mockTopReferrers = [
  { source: "Twitter/X", visits: 2340 },
  { source: "LinkedIn", visits: 1856 },
  { source: "Direct", visits: 1243 },
  { source: "Google", visits: 987 },
  { source: "WhatsApp", visits: 654 },
  { source: "Newsletter", visits: 432 },
];

export const mockRegistrationsByTime = [
  { period: "Morning (6-12)", count: 312 },
  { period: "Afternoon (12-17)", count: 478 },
  { period: "Evening (17-21)", count: 356 },
  { period: "Night (21-6)", count: 101 },
];

// ─── Helper to find event by id ───
export function getEventById(id: string): Event | undefined {
  return mockEvents.find((e) => e.id === id);
}

export function getEventBySlug(slug: string): Event | undefined {
  return mockEvents.find((e) => e.slug === slug);
}
