"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getIntegrations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get the organization id for this user
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (orgError || !org) {
    return null;
  }

  const { data, error } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("org_id", org.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching integrations:", error);
    return null;
  }

  return data;
}

export async function updateIntegrations(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!org) {
    return { error: "Organization not found" };
  }

  const razorpayKeyId = formData.get("razorpay_key_id") as string;
  const razorpayKeySecret = formData.get("razorpay_key_secret") as string;
  const canvaClientId = formData.get("canva_client_id") as string;
  const canvaClientSecret = formData.get("canva_client_secret") as string;

  const updates: any = {};
  if (razorpayKeyId) updates.razorpay_key_id = razorpayKeyId;
  if (razorpayKeySecret) updates.razorpay_key_secret = razorpayKeySecret;
  if (canvaClientId) updates.canva_client_id = canvaClientId;
  if (canvaClientSecret) updates.canva_client_secret = canvaClientSecret;

  if (Object.keys(updates).length === 0) {
    return { error: "No fields to update" };
  }

  // Check if row exists
  const { data: existing } = await supabase
    .from("organization_integrations")
    .select("org_id")
    .eq("org_id", org.id)
    .single();

  let error;
  if (existing) {
    const res = await supabase
      .from("organization_integrations")
      .update(updates)
      .eq("org_id", org.id);
    error = res.error;
  } else {
    updates.org_id = org.id;
    const res = await supabase
      .from("organization_integrations")
      .insert(updates);
    error = res.error;
  }

  if (error) {
    console.error("Error updating integrations:", error);
    return { error: "Failed to update integrations" };
  }

  revalidatePath("/dashboard/configurations");
  return { success: true };
}
