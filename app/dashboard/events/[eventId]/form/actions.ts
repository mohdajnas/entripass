"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface FormFieldData {
  id?: string;
  event_id: string;
  field_type: string;
  label: string;
  placeholder?: string;
  is_required: boolean;
  sort_order: number;
}

export async function addFormField(data: FormFieldData) {
  const supabase = await createClient();

  const { error } = await supabase.from("form_fields").insert({
    event_id: data.event_id,
    field_type: data.field_type,
    label: data.label,
    placeholder: data.placeholder || null,
    is_required: data.is_required,
    sort_order: data.sort_order,
  });

  if (error) {
    console.error("Error adding form field:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/events/${data.event_id}/form`);
  return { success: true };
}

export async function updateFormField(id: string, eventId: string, updates: Partial<FormFieldData>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("form_fields")
    .update({
      field_type: updates.field_type,
      label: updates.label,
      placeholder: updates.placeholder || null,
      is_required: updates.is_required,
      sort_order: updates.sort_order,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating form field:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/form`);
  return { success: true };
}

export async function deleteFormField(id: string, eventId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("form_fields").delete().eq("id", id);

  if (error) {
    console.error("Error deleting form field:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/form`);
  return { success: true };
}
