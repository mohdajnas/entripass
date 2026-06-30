"use server";

import { createClient } from "@/utils/supabase/server";
import { sendRealEmail } from "@/app/dashboard/events/[eventId]/guests/actions";

export async function searchGuests(eventId: string, query: string) {
  if (!query || query.trim() === "") return { success: true, guests: [] };

  const supabase = await createClient();

  // Search by name, email, or exact ticket ID (qr_code)
  const q = `%${query.trim()}%`;
  
  const { data, error } = await supabase
    .from("guests")
    .select("id, name, email, qr_code, ticket_types(name)")
    .eq("event_id", eventId)
    .or(`name.ilike.${q},email.ilike.${q},qr_code.eq.${query.trim()}`)
    .limit(10);

  if (error) {
    return { success: false, error: error.message };
  }

  const formattedGuests = data.map((g: any) => ({
    id: g.id,
    name: g.name,
    email: g.email,
    qr_code: g.qr_code,
    ticket_type: g.ticket_types?.name || "Standard"
  }));

  return { success: true, guests: formattedGuests };
}

export async function processCheckin(eventId: string, venueId: string, guestId: string) {
  const supabase = await createClient();

  // 1. Verify guest belongs to event
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("id, name, email, status, ticket_types(name)")
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
      ticketType: (guest.ticket_types as any)?.name || "Standard",
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

  // Trigger Automated Check-in Email
  try {
    const { data: template } = await supabase
      .from("email_templates")
      .select("subject, body_html, is_active, include_ticket")
      .eq("event_id", eventId)
      .eq("trigger_type", "checkin")
      .single();

    if (template && template.is_active && guest.email) {
       const { data: eventData } = await supabase
         .from("events")
         .select("title, start_time")
         .eq("id", eventId)
         .single();
       const eventName = eventData?.title || "our event";
       const eventDate = eventData?.start_time 
         ? new Date(eventData.start_time).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
         : "TBD";

       const ticketTypeName = (guest.ticket_types as any)?.name || "General Admission";
       const checkinTime = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

       let finalSubject = template.subject
         .replace(/{{name}}/g, guest.name || "")
         .replace(/{{email}}/g, guest.email || "")
         .replace(/{{event_name}}/g, eventName)
         .replace(/{{event_date}}/g, eventDate)
         .replace(/{{ticket_type}}/g, ticketTypeName)
         .replace(/{{checkin_time}}/g, checkinTime);

       let finalBody = template.body_html
         .replace(/{{name}}/g, guest.name || "")
         .replace(/{{email}}/g, guest.email || "")
         .replace(/{{event_name}}/g, eventName)
         .replace(/{{event_date}}/g, eventDate)
         .replace(/{{ticket_type}}/g, ticketTypeName)
         .replace(/{{checkin_time}}/g, checkinTime);

       if (template.include_ticket) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://entrypass.sociup.in";
          const ticketUrl = `${siteUrl}/tickets/${guestId}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${guestId}`;
          finalBody += `<br><br><div style="padding: 24px; border: 2px dashed #a3e635; border-radius: 12px; text-align: center; margin-top: 20px; background-color: #f8fafc;">
            <h3 style="margin: 0 0 16px 0; color: #022c22; font-size: 20px;">Your Event Ticket</h3>
            <img src="${qrUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px; margin: 0 auto; display: block; border-radius: 8px;" />
            <p style="font-size: 18px; font-weight: bold; margin: 16px 0 8px 0; color: #0b1a10; word-break: break-all;">${guestId}</p>
            <p style="font-size: 13px; color: #71717a; margin: 0 0 20px 0;">Present this QR code at the entrance to check in.</p>
            <a href="${ticketUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px;">View & Download Full Ticket</a>
          </div>`;
       }
       await sendRealEmail(eventId, [guest.email], finalSubject, finalBody, "checkin", [guest.id]);
    }
  } catch (err) {
    console.error("Failed to send automated check-in email:", err);
  }

  return { 
    type: "success", 
    name: guest.name, 
    ticketType: (guest.ticket_types as any)?.name || "Standard",
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
