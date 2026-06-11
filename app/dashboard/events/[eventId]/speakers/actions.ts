"use server";

import { createClient } from "@/utils/supabase/server";

export interface SpeakerInput {
  name: string;
  bio: string | null;
  photo_url: string | null;
  designation: string | null;
  company: string | null;
  social_url: string | null;
}

export async function createSpeaker(eventId: string, speaker: SpeakerInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("speakers")
    .insert({
      event_id: eventId,
      name: speaker.name,
      bio: speaker.bio,
      photo_url: speaker.photo_url,
      designation: speaker.designation,
      company: speaker.company,
      social_url: speaker.social_url,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating speaker:", error);
    return { success: false, error: error.message };
  }

  return { success: true, speaker: data };
}

export async function updateSpeaker(speakerId: string, speaker: Partial<SpeakerInput>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("speakers")
    .update({
      ...speaker,
    })
    .eq("id", speakerId);

  if (error) {
    console.error("Error updating speaker:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteSpeaker(speakerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("speakers")
    .delete()
    .eq("id", speakerId);

  if (error) {
    console.error("Error deleting speaker:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
