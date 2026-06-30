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

export async function sendRealEmail(
  eventId: string,
  emails: string[],
  subject: string,
  body: string,
  triggerType?: string,
  guestIds?: string[]
) {
  const supabase = await createClient();

  const { data: smtpConfig, error } = await supabase.rpc("get_smtp_config_secure", {
    p_event_id: eventId,
    p_secret: "entripass-internal-secret-8842"
  });

  if (error || !smtpConfig) {
    console.error("Error fetching SMTP config:", error);
    if (triggerType && guestIds && guestIds.length > 0) {
      const logs = guestIds.map((id) => ({
        event_id: eventId,
        guest_id: id,
        channel: "email",
        trigger_type: triggerType,
        status: "failed",
        sent_at: new Date().toISOString(),
      }));
      await supabase.from("message_logs").insert(logs);
    }
    return { success: false, error: "SMTP configuration not found for this event." };
  }

  if (!smtpConfig.smtp_host || !smtpConfig.smtp_user || !smtpConfig.smtp_pass) {
    if (triggerType && guestIds && guestIds.length > 0) {
      const logs = guestIds.map((id) => ({
        event_id: eventId,
        guest_id: id,
        channel: "email",
        trigger_type: triggerType,
        status: "failed",
        sent_at: new Date().toISOString(),
      }));
      await supabase.from("message_logs").insert(logs);
    }
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://entrypass.sociup.in";
    // Always use the public production URL for the logo to avoid broken images in email clients when testing locally
    const logoUrl = "https://entrypass.sociup.in/ticket-branding/BACKUP-S-C.png";

    const htmlWithFooter = `
      <div style="font-family: system-ui, -apple-system, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; line-height: 1.5;">
        ${body}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">Powered By <strong>Entripass</strong></p>
          <img src="${logoUrl}" alt="Entripass Logo" style="height: 24px; width: auto; opacity: 0.7;" />
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Event Team" <${smtpConfig.smtp_user}>`,
      to: smtpConfig.smtp_user, 
      bcc: emails,
      subject: subject,
      html: htmlWithFooter,
    });

    console.log(`Successfully sent email to ${emails.length} guests.`);

    if (triggerType && guestIds && guestIds.length > 0) {
      const logs = guestIds.map((id) => ({
        event_id: eventId,
        guest_id: id,
        channel: "email",
        trigger_type: triggerType,
        status: "sent",
        sent_at: new Date().toISOString(),
      }));
      await supabase.from("message_logs").insert(logs);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error sending real email:", err);
    if (triggerType && guestIds && guestIds.length > 0) {
      const logs = guestIds.map((id) => ({
        event_id: eventId,
        guest_id: id,
        channel: "email",
        trigger_type: triggerType,
        status: "failed",
        sent_at: new Date().toISOString(),
      }));
      await supabase.from("message_logs").insert(logs);
    }
    return { success: false, error: err.message || "Failed to send email" };
  }
}

export async function sendInvitationEmails(eventId: string, guestIds: string[]) {
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("email_templates")
    .select("subject, body_html, is_active, include_ticket")
    .eq("event_id", eventId)
    .eq("trigger_type", "invitation")
    .single();

  if (!template || !template.is_active) {
    return { success: false, error: "Invitation template is inactive or not found." };
  }

  const { data: eventData } = await supabase.from("events").select("title, start_time").eq("id", eventId).single();
  const eventName = eventData?.title || "our event";
  const eventDate = eventData?.start_time 
    ? new Date(eventData.start_time).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "TBD";

  const { data: guests } = await supabase.from("guests").select("id, name, email, checked_in_at, ticket_types(name)").in("id", guestIds);
  if (!guests || guests.length === 0) return { success: false, error: "No guests found." };

  const emailPromises = guests.filter((g) => g.email).map(async (guest) => {
    const ticketTypeName = (guest.ticket_types as any)?.name || "General Admission";
    const checkinTime = guest.checked_in_at 
      ? new Date(guest.checked_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) 
      : "Not checked in";

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
      const ticketUrl = `${siteUrl}/tickets/${guest.id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${guest.id}`;
      finalBody += `<br><br><div style="padding: 24px; border: 2px dashed #a3e635; border-radius: 12px; text-align: center; margin-top: 20px; background-color: #f8fafc;">
        <h3 style="margin: 0 0 16px 0; color: #022c22; font-size: 20px;">Your Event Ticket</h3>
        <img src="${qrUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px; margin: 0 auto; display: block; border-radius: 8px;" />
        <p style="font-size: 18px; font-weight: bold; margin: 16px 0 8px 0; color: #0b1a10; word-break: break-all;">${guest.id}</p>
        <p style="font-size: 13px; color: #71717a; margin: 0 0 20px 0;">Present this QR code at the entrance to check in.</p>
        <a href="${ticketUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px;">View & Download Full Ticket</a>
      </div>`;
    }

    return sendRealEmail(eventId, [guest.email], finalSubject, finalBody, "invitation", [guest.id]);
  });

  const results = await Promise.allSettled(emailPromises);
  const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length;

  return { success: true, count: successCount };
}
