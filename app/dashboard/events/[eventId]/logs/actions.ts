"use server";

import { createClient } from "@/utils/supabase/server";

export async function getMessageLogs(eventId: string, searchParams: any = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("message_logs")
    .select(`
      id,
      channel,
      trigger_type,
      status,
      sent_at,
      guests:guest_id (
        id,
        name,
        email
      )
    `)
    .eq("event_id", eventId)
    .order("sent_at", { ascending: false });

  if (error) {
    console.error("Error fetching message logs:", error);
    return { success: false, error: error.message };
  }

  // Format the data to match the UI requirements
  const logs = data?.map(log => ({
    id: log.id,
    channel: log.channel,
    trigger_type: log.trigger_type,
    status: log.status,
    sent_at: log.sent_at,
    guest_name: (log.guests as any)?.name || "Unknown Guest",
    guest_email: (log.guests as any)?.email || "No email",
  })) || [];

  return { success: true, logs };
}
