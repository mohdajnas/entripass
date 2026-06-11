"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface TicketInput {
  name: string;
  price: number;
  capacity: number;
  maxPerOrder: number;
}

export interface FormFieldInput {
  fieldType: string;
  label: string;
  placeholder?: string;
  isRequired: boolean;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  mapLink?: string;
  isOnline: boolean;
  maxCapacity?: number;
  tickets: TicketInput[];
  customFields: FormFieldInput[];
}

function generateSlug(text: string) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

export async function createEvent(input: CreateEventInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Fetch user's profile to get organization or name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userDisplayName = profile?.full_name || "User";

  // 2. Find organizations owned by this user
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id);

  let orgId = "";

  if (!orgs || orgs.length === 0) {
    // Automatically create a default organization for the user
    const orgName = `${userDisplayName}'s Org`;
    const orgSlug = generateSlug(orgName);

    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        slug: orgSlug,
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (orgError) {
      console.error("Failed to create default organization:", orgError);
      return { success: false, error: `Organization creation failed: ${orgError.message}` };
    }
    orgId = newOrg.id;
  } else {
    orgId = orgs[0].id;
  }

  // 3. Insert the Event
  const eventSlug = generateSlug(input.title);
  const { data: newEvent, error: eventError } = await supabase
    .from("events")
    .insert({
      org_id: orgId,
      title: input.title,
      slug: eventSlug,
      description: input.description || null,
      start_time: input.startTime ? new Date(input.startTime).toISOString() : null,
      end_time: input.endTime ? new Date(input.endTime).toISOString() : null,
      venue: input.venue || null,
      location_url: input.mapLink || null,
      is_online: input.isOnline,
      max_capacity: input.maxCapacity || null,
      status: "published", // Default to published for convenience
    })
    .select("id")
    .single();

  if (eventError) {
    console.error("Failed to create event:", eventError);
    return { success: false, error: `Event creation failed: ${eventError.message}` };
  }

  const eventId = newEvent.id;

  // 4. Insert Ticket Types
  if (input.tickets && input.tickets.length > 0) {
    const ticketTypesData = input.tickets.map((t, idx) => ({
      event_id: eventId,
      name: t.name,
      price: t.price,
      capacity: t.capacity,
      max_per_order: t.maxPerOrder,
      sort_order: idx,
    }));

    const { error: ticketsError } = await supabase
      .from("ticket_types")
      .insert(ticketTypesData);

    if (ticketsError) {
      console.error("Failed to create ticket types:", ticketsError);
      return { success: false, error: `Ticket types creation failed: ${ticketsError.message}` };
    }
  }

  // 5. Insert Custom Form Fields
  const formFieldsData = [
    // Pre-insert default required fields for reference or rendering if not implicit
    {
      event_id: eventId,
      field_type: "text",
      label: "Full Name",
      is_required: true,
      sort_order: 0,
    },
    {
      event_id: eventId,
      field_type: "email",
      label: "Email Address",
      is_required: true,
      sort_order: 1,
    },
  ];

  if (input.customFields && input.customFields.length > 0) {
    input.customFields.forEach((f, idx) => {
      formFieldsData.push({
        event_id: eventId,
        field_type: f.fieldType,
        label: f.label,
        is_required: f.isRequired,
        sort_order: idx + 2, // offset by default fields
      });
    });
  }

  const { error: formFieldsError } = await supabase
    .from("form_fields")
    .insert(formFieldsData);

  if (formFieldsError) {
    console.error("Failed to create form fields:", formFieldsError);
    return { success: false, error: `Form fields creation failed: ${formFieldsError.message}` };
  }

  // 6. Insert primary venue into venues table for check-ins
  if (!input.isOnline && input.venue) {
    const { error: venueError } = await supabase
      .from("venues")
      .insert({
        event_id: eventId,
        name: input.venue,
        capacity: input.maxCapacity || null,
        location_url: input.mapLink || null,
      });

    if (venueError) {
      console.error("Failed to add primary venue to venues table:", venueError);
      // Non-fatal, so we just log it
    }
  }

  revalidatePath("/dashboard");
  return { success: true, eventId };
}

export async function getRecentVenues() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, venues: [] };

  // Get user's orgs
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id);

  if (!orgs || orgs.length === 0) return { success: true, venues: [] };

  const orgIds = orgs.map(o => o.id);

  // Get events in these orgs
  const { data: events } = await supabase
    .from("events")
    .select("id, venue")
    .in("org_id", orgIds);

  const eventIds = events?.map(e => e.id) || [];
  const eventVenues = events?.map(e => e.venue).filter(v => Boolean(v)) as string[] || [];

  let subVenues: string[] = [];
  if (eventIds.length > 0) {
    const { data: venuesTable } = await supabase
      .from("venues")
      .select("name")
      .in("event_id", eventIds);
    
    if (venuesTable) {
      subVenues = venuesTable.map(v => v.name);
    }
  }

  // Deduplicate
  const uniqueVenues = Array.from(new Set([...eventVenues, ...subVenues]));

  return { success: true, venues: uniqueVenues };
}

