"use server";

import { createClient } from "@/utils/supabase/server";
import { sendRealEmail } from "@/app/dashboard/events/[eventId]/guests/actions";

export interface RegisterGuestInput {
  eventId: string;
  ticketTypeId: string;
  name: string;
  email: string;
  phone?: string;
  formData: Record<string, string>;
  amountPaid: number;
}

export async function registerGuest(input: RegisterGuestInput) {
  const supabase = await createClient();
  const guestId = crypto.randomUUID();

  const { data: newGuest, error } = await supabase
    .from("guests")
    .insert({
      event_id: input.eventId,
      ticket_type_id: input.ticketTypeId || null,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      form_data: input.formData,
      status: "confirmed",
      id: guestId,
      qr_code: guestId,
      payment_status: input.amountPaid === 0 ? "paid" : "unpaid",
      amount_paid: input.amountPaid,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Guest registration error:", error);
    return { success: false, error: error.message };
  }

  // Trigger Automated Confirmation Email
  try {
    const { data: template } = await supabase.rpc("get_email_template_secure", {
      p_event_id: input.eventId,
      p_trigger_type: "confirmation",
      p_secret: "entripass-internal-secret-8842"
    });

    if (template && template.is_active) {
       // Fetch event title for variable replacement
       const { data: eventData } = await supabase
         .from("events")
         .select("title")
         .eq("id", input.eventId)
         .single();
       const eventName = eventData?.title || "our event";

       let finalSubject = template.subject
         .replace(/{{name}}/g, input.name)
         .replace(/{{event_name}}/g, eventName);

       let finalBody = template.body_html
         .replace(/{{name}}/g, input.name)
         .replace(/{{event_name}}/g, eventName);

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
       await sendRealEmail(input.eventId, [input.email], finalSubject, finalBody, "confirmation", [guestId]);
    }
  } catch (err) {
    console.error("Failed to send automated confirmation email:", err);
  }

  return { success: true, guestId: newGuest.id };
}
