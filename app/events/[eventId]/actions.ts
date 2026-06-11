"use server";

import { createClient } from "@/utils/supabase/server";

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

  const qrCode = `QR_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

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
      qr_code: qrCode,
      payment_status: input.amountPaid === 0 ? "paid" : "unpaid",
      amount_paid: input.amountPaid,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Guest registration error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, guestId: newGuest.id };
}
