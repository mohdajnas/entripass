"use server";

import { createClient } from "@/utils/supabase/server";
import { sendRealEmail } from "@/app/dashboard/events/[eventId]/guests/actions";

export async function getPostEventData(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get checked-in guests count
  const { count: checkedInCount } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "checked_in");

  // Get no-show guests count (status is just "registered")
  const { count: noShowCount } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "registered");

  // Get template active status
  const { data: templates } = await supabase
    .from("email_templates")
    .select("trigger_type, is_active")
    .eq("event_id", eventId)
    .in("trigger_type", ["post_thankyou", "post_sorry"]);

  let thankYouActive = false;
  let sorryActive = false;

  templates?.forEach(t => {
    if (t.trigger_type === "post_thankyou") thankYouActive = t.is_active;
    if (t.trigger_type === "post_sorry") sorryActive = t.is_active;
  });

  return {
    success: true,
    data: {
      checkedInCount: checkedInCount || 0,
      noShowCount: noShowCount || 0,
      thankYouActive,
      sorryActive
    }
  };
}

export async function downloadAttendanceCsv(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }
  
  const { data: guests, error } = await supabase
    .from("guests")
    .select("name, email, status, checked_in_at")
    .eq("event_id", eventId)
    .order("name", { ascending: true });

  if (error || !guests) {
    return { success: false, error: "Failed to fetch attendance records" };
  }

  // Generate CSV
  const headers = ["Name,Email,Status,Check-in Time"];
  const rows = guests.map(g => {
    // Escape quotes in names or emails just in case
    const name = `"${(g.name || "").replace(/"/g, '""')}"`;
    const email = `"${(g.email || "").replace(/"/g, '""')}"`;
    const status = g.status;
    const time = g.checked_in_at ? new Date(g.checked_in_at).toLocaleString() : "N/A";
    
    return `${name},${email},${status},"${time}"`;
  });

  const csv = [...headers, ...rows].join("\n");
  
  return { success: true, csv };
}

export async function sendPostThankYouEmails(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // Get active thank you template
  const { data: template } = await supabase
    .from("email_templates")
    .select("subject, body_html, is_active, include_ticket")
    .eq("event_id", eventId)
    .eq("trigger_type", "post_thankyou")
    .single();

  if (!template || !template.is_active) {
    return { success: false, error: "Thank You template is inactive or not found" };
  }

  // Get checked-in guests
  const { data: guests, error } = await supabase
    .from("guests")
    .select("id, name, email")
    .eq("event_id", eventId)
    .eq("status", "checked_in");

  if (error || !guests || guests.length === 0) {
    return { success: false, error: "No checked-in guests found" };
  }

  const { data: eventData } = await supabase.from("events").select("title").eq("id", eventId).single();
  const eventName = eventData?.title || "our event";

  // Send emails individually to support variable replacement (name)
  let sentCount = 0;
  for (const guest of guests) {
    if (!guest.email) continue;
    let finalSubject = template.subject.replace(/{{name}}/g, guest.name || "").replace(/{{event_name}}/g, eventName);
    let finalBody = template.body_html.replace(/{{name}}/g, guest.name || "").replace(/{{event_name}}/g, eventName);

    try {
      await sendRealEmail(eventId, [guest.email], finalSubject, finalBody, "post_thankyou", [guest.id]);
      sentCount++;
    } catch (e) {
      console.error("Failed to send thank you to", guest.email);
    }
  }

  return { success: true, count: sentCount };
}

export async function sendPostSorryEmails(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // Get active sorry template
  const { data: template } = await supabase
    .from("email_templates")
    .select("subject, body_html, is_active, include_ticket")
    .eq("event_id", eventId)
    .eq("trigger_type", "post_sorry")
    .single();

  if (!template || !template.is_active) {
    return { success: false, error: "Sorry template is inactive or not found" };
  }

  // Get no-show guests
  const { data: guests, error } = await supabase
    .from("guests")
    .select("id, name, email")
    .eq("event_id", eventId)
    .eq("status", "registered");

  if (error || !guests || guests.length === 0) {
    return { success: false, error: "No no-show guests found" };
  }

  const { data: eventData } = await supabase.from("events").select("title").eq("id", eventId).single();
  const eventName = eventData?.title || "our event";

  let sentCount = 0;
  for (const guest of guests) {
    if (!guest.email) continue;
    let finalSubject = template.subject.replace(/{{name}}/g, guest.name || "").replace(/{{event_name}}/g, eventName);
    let finalBody = template.body_html.replace(/{{name}}/g, guest.name || "").replace(/{{event_name}}/g, eventName);

    try {
      await sendRealEmail(eventId, [guest.email], finalSubject, finalBody, "post_sorry", [guest.id]);
      sentCount++;
    } catch (e) {
      console.error("Failed to send sorry email to", guest.email);
    }
  }

  return { success: true, count: sentCount };
}
