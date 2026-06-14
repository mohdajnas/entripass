"use server";

import { createClient } from "@/utils/supabase/server";

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
