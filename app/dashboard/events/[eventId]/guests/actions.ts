"use server";

import { createClient } from "@/utils/supabase/server";

export async function updateGuestStatus(guestId: string, status: string) {
  const supabase = await createClient();

  const updateFields: Record<string, string | number | boolean | null | undefined> = { status };
  if (status === "checked_in") {
    updateFields.checked_in_at = new Date().toISOString();
  } else if (status === "confirmed") {
    updateFields.payment_status = "paid";
  }

  const { error } = await supabase
    .from("guests")
    .update(updateFields)
    .eq("id", guestId);

  if (error) {
    console.error("Error updating guest status:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function bulkUpdateStatus(guestIds: string[], status: string) {
  const supabase = await createClient();

  const updateFields: Record<string, string | number | boolean | null | undefined> = { status };
  if (status === "checked_in") {
    updateFields.checked_in_at = new Date().toISOString();
  } else if (status === "confirmed") {
    updateFields.payment_status = "paid";
  }

  const { error } = await supabase
    .from("guests")
    .update(updateFields)
    .in("id", guestIds);

  if (error) {
    console.error("Error bulk updating status:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteGuest(guestId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId);

  if (error) {
    console.error("Error deleting guest:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function bulkUploadGuests(
  eventId: string,
  guests: Array<{
    name: string;
    email: string;
    phone?: string;
    ticket_type_id?: string;
    status?: string;
    amount_paid?: number;
    payment_status?: string;
    form_data?: Record<string, unknown>;
  }>
) {
  const supabase = await createClient();

  const rowsToInsert = guests.map((g) => {
    const qrCode = `QR_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      event_id: eventId,
      name: g.name,
      email: g.email,
      phone: g.phone || null,
      ticket_type_id: g.ticket_type_id || null,
      status: g.status || "confirmed",
      qr_code: qrCode,
      payment_status: g.payment_status || (Number(g.amount_paid) > 0 ? "paid" : "paid"),
      amount_paid: g.amount_paid || 0,
      form_data: g.form_data || {},
      registered_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("guests").insert(rowsToInsert);

  if (error) {
    console.error("Error bulk uploading guests:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function sendMockEmail(emails: string[], subject: string, body: string) {
  // Mock sending email
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log(`Sending email to ${emails.join(", ")}:\nSubject: ${subject}\nBody: ${body}`);
  return { success: true };
}
