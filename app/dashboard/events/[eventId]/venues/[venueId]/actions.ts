"use server";

import { createClient } from "@/utils/supabase/server";

export async function getVenueDetails(venueId: string) {
  const supabase = await createClient();

  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .single();

  if (venueError) {
    return { success: false, error: venueError.message };
  }

  // Fetch checkins for this venue joined with guests
  const { data: checkins, error: checkinsError } = await supabase
    .from("venue_checkins")
    .select(`
      id,
      checked_in_at,
      guests (
        id,
        name,
        email,
        qr_code
      )
    `)
    .eq("venue_id", venueId)
    .order("checked_in_at", { ascending: false });

  if (checkinsError) {
    return { success: false, error: checkinsError.message };
  }

  return { 
    success: true, 
    venue, 
    checkins: checkins?.map(c => {
      const guest = Array.isArray(c.guests) ? c.guests[0] : c.guests;
      return {
        id: c.id,
        checked_in_at: c.checked_in_at,
        guest_name: guest?.name || "Unknown",
        guest_email: guest?.email || "Unknown",
        guest_id: guest?.id,
      };
    }) || []
  };
}
