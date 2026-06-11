"use server";

import { createClient } from "@/utils/supabase/server";

export interface SponsorInput {
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: "platinum" | "gold" | "silver" | "general";
}

export async function createSponsor(eventId: string, sponsor: SponsorInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sponsors")
    .insert({
      event_id: eventId,
      name: sponsor.name,
      logo_url: sponsor.logo_url,
      website_url: sponsor.website_url,
      tier: sponsor.tier,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating sponsor:", error);
    return { success: false, error: error.message };
  }

  return { success: true, sponsor: data };
}

export async function updateSponsor(sponsorId: string, sponsor: Partial<SponsorInput>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sponsors")
    .update({
      ...sponsor,
    })
    .eq("id", sponsorId);

  if (error) {
    console.error("Error updating sponsor:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteSponsor(sponsorId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sponsors")
    .delete()
    .eq("id", sponsorId);

  if (error) {
    console.error("Error deleting sponsor:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
