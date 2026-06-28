"use server";

import { createClient } from "@/utils/supabase/server";
import nodemailer from "nodemailer";

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
    const guestId = crypto.randomUUID();
    return {
      event_id: eventId,
      name: g.name,
      email: g.email,
      phone: g.phone || null,
      ticket_type_id: g.ticket_type_id || null,
      status: g.status || "confirmed",
      id: guestId,
      qr_code: guestId,
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

export async function sendRealEmail(eventId: string, emails: string[], subject: string, body: string) {
  const supabase = await createClient();

  const { data: templates, error } = await supabase
    .from("email_templates")
    .select("smtp_host, smtp_port, smtp_user, smtp_pass")
    .eq("event_id", eventId)
    .limit(1);

  if (error || !templates || templates.length === 0) {
    console.error("Error fetching SMTP config:", error);
    return { success: false, error: "SMTP configuration not found for this event." };
  }

  const smtpConfig = templates[0];
  
  if (!smtpConfig.smtp_host || !smtpConfig.smtp_user || !smtpConfig.smtp_pass) {
    return { success: false, error: "Incomplete SMTP configuration. Please configure it in the Communications tab." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_port || 587,
      secure: smtpConfig.smtp_port === 465,
      auth: {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_pass,
      },
    });

    const htmlWithFooter = `
      <div style="font-family: system-ui, -apple-system, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; line-height: 1.5;">
        ${body}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">Powered By <strong>Entripass</strong></p>
          <img src="cid:entripasslogo" alt="Entripass Logo" style="height: 24px; width: auto; opacity: 0.7;" />
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Event Team" <${smtpConfig.smtp_user}>`,
      to: smtpConfig.smtp_user, 
      bcc: emails,
      subject: subject,
      html: htmlWithFooter,
      attachments: [{
        filename: 'entripass-logo.png',
        path: process.cwd() + '/public/ticket-branding/BACKUP-S-C.png',
        cid: 'entripasslogo'
      }]
    });

    console.log(`Successfully sent email to ${emails.length} guests.`);
    return { success: true };
  } catch (err: any) {
    console.error("Error sending real email:", err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}
