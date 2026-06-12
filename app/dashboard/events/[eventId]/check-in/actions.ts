"use server";

import { createClient } from "@/utils/supabase/server";

export async function searchGuests(eventId: string, query: string) {
  if (!query || query.trim() === "") return { success: true, guests: [] };

  const supabase = await createClient();

  // Search by name, email, or exact ticket ID (qr_code)
  const q = `%${query.trim()}%`;
  
  const { data, error } = await supabase
    .from("guests")
    .select("id, name, email, ticket_type, qr_code")
    .eq("event_id", eventId)
    .or(`name.ilike.${q},email.ilike.${q},qr_code.eq.${query.trim()}`)
    .limit(10);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, guests: data };
}

export async function processCheckin(eventId: string, venueId: string, guestId: string) {
  const supabase = await createClient();

  // 1. Verify guest belongs to event
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("id, name, ticket_type")
    .eq("id", guestId)
    .eq("event_id", eventId)
    .single();

  if (guestError || !guest) {
    return { type: "invalid", error: "Guest not found or does not belong to this event." };
  }

  // 2. Check for duplicate checkin at this venue
  const { data: existingCheckin } = await supabase
    .from("venue_checkins")
    .select("checked_in_at")
    .eq("guest_id", guestId)
    .eq("venue_id", venueId)
    .single();

  if (existingCheckin) {
    return { 
      type: "duplicate", 
      name: guest.name, 
      ticketType: guest.ticket_type || "Standard",
      time: new Date(existingCheckin.checked_in_at).toLocaleTimeString() 
    };
  }

  // 3. Insert new checkin
  const { error: insertError } = await supabase
    .from("venue_checkins")
    .insert({
      guest_id: guestId,
      venue_id: venueId,
    });

  if (insertError) {
    console.error("Check-in Error:", insertError);
    return { type: "invalid", error: "Failed to record check-in." };
  }

  return { 
    type: "success", 
    name: guest.name, 
    ticketType: guest.ticket_type || "Standard",
    time: new Date().toLocaleTimeString() 
  };
}

export async function processBarcodeScan(eventId: string, venueId: string, barcode: string) {
  const supabase = await createClient();

  // Find guest by exact QR code/barcode
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("id")
    .eq("event_id", eventId)
    .eq("qr_code", barcode.trim())
    .single();

  if (guestError || !guest) {
    return { type: "invalid", error: "Invalid ticket QR code." };
  }

  // Proceed to normal check-in
  return await processCheckin(eventId, venueId, guest.id);
}
