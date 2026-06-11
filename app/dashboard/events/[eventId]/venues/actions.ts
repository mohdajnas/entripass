"use server";

import { createClient } from "@/utils/supabase/server";

export interface VenueInput {
  name: string;
  capacity?: number | null;
  location_url?: string | null;
}

export async function createVenue(eventId: string, venue: VenueInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("venues")
    .insert({
      event_id: eventId,
      name: venue.name,
      capacity: venue.capacity || null,
      location_url: venue.location_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating venue:", error);
    return { success: false, error: error.message };
  }

  return { success: true, venue: data };
}

export async function updateVenue(venueId: string, venue: Partial<VenueInput>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("venues")
    .update({
      ...venue,
    })
    .eq("id", venueId);

  if (error) {
    console.error("Error updating venue:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteVenue(venueId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("venues")
    .delete()
    .eq("id", venueId);

  if (error) {
    console.error("Error deleting venue:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
