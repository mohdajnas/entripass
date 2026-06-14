"use server";

import { createClient } from "@/utils/supabase/server";
import { mockEmailTemplates } from "@/lib/mock-data";

export interface SmtpConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
}

export interface TemplateUpdate {
  subject: string;
  body_html: string;
  is_active: boolean;
  include_ticket: boolean;
}

// Ensure the 5 base templates exist for the event
export async function getEmailTemplates(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: existing, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("event_id", eventId)
    .order("trigger_type");

  if (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: error.message };
  }

  const triggers = ["invitation", "confirmation", "checkin", "post_thankyou", "post_sorry"];
  const existingTriggers = new Set(existing?.map(t => t.trigger_type) || []);

  const missingTriggers = triggers.filter(t => !existingTriggers.has(t));

  if (missingTriggers.length > 0) {
    const defaultData = missingTriggers.map(trigger => {
      // Find matching mock data to use as default subject/body
      const mock = mockEmailTemplates.find(m => m.trigger_type === trigger);
      return {
        event_id: eventId,
        trigger_type: trigger,
        subject: mock?.subject || `Event ${trigger}`,
        body_html: mock?.body_html || `<p>Default ${trigger} email body</p>`,
        is_active: mock?.is_active ?? false,
        include_ticket: mock?.include_ticket ?? false,
      };
    });

    const { error: insertError } = await supabase
      .from("email_templates")
      .insert(defaultData);

    if (insertError) {
      console.error("Error creating default templates:", insertError);
    } else {
      // Re-fetch after insert
      const { data: fullList } = await supabase
        .from("email_templates")
        .select("*")
        .eq("event_id", eventId)
        .order("trigger_type");
      
      return { success: true, templates: fullList };
    }
  }

  return { success: true, templates: existing };
}

export async function updateTemplate(templateId: string, updates: TemplateUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("email_templates")
    .update(updates)
    .eq("id", templateId);

  if (error) {
    console.error("Update template error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateSmtpSettings(eventId: string, config: SmtpConfig) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Update SMTP config on all templates for this event
  const { error } = await supabase
    .from("email_templates")
    .update({
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_user: config.smtp_user,
      smtp_pass: config.smtp_pass,
    })
    .eq("event_id", eventId);

  if (error) {
    console.error("Update SMTP error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
