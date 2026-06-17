"use server";

import { createClient } from "@/utils/supabase/server";

export interface TicketTypeInput {
  name: string;
  description?: string | null;
  price: number;
  capacity: number;
  sale_start: string;
  sale_end: string;
  is_visible?: boolean;
  max_per_order?: number;
  sort_order?: number;
}

export async function createTicketType(eventId: string, ticket: TicketTypeInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ticket_types")
    .insert({
      event_id: eventId,
      name: ticket.name,
      description: ticket.description || null,
      price: ticket.price,
      capacity: ticket.capacity,
      sale_start: ticket.sale_start,
      sale_end: ticket.sale_end,
      is_visible: ticket.is_visible ?? true,
      max_per_order: ticket.max_per_order ?? 1,
      sort_order: ticket.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating ticket type:", error);
    return { success: false, error: error.message };
  }

  return { success: true, ticket: data };
}

export async function updateTicketType(ticketId: string, ticket: Partial<TicketTypeInput>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ticket_types")
    .update({
      name: ticket.name,
      description: ticket.description ?? undefined,
      price: ticket.price,
      capacity: ticket.capacity,
      sale_start: ticket.sale_start,
      sale_end: ticket.sale_end,
      is_visible: ticket.is_visible,
      max_per_order: ticket.max_per_order,
      sort_order: ticket.sort_order,
    })
    .eq("id", ticketId);

  if (error) {
    console.error("Error updating ticket type:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteTicketType(ticketId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ticket_types")
    .delete()
    .eq("id", ticketId);

  if (error) {
    console.error("Error deleting ticket type:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function toggleTicketVisibility(ticketId: string, isVisible: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ticket_types")
    .update({ is_visible: isVisible })
    .eq("id", ticketId);

  if (error) {
    console.error("Error toggling ticket visibility:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function saveTicketDesign(eventId: string, design: any) {
  const supabase = await createClient();

  // If the background is a temporary Canva export, download it and store it permanently
  if (design.backgroundType === "image" && design.backgroundValue && design.backgroundValue.startsWith("https://export-download.canva.com/")) {
    try {
      const response = await fetch(design.backgroundValue);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${eventId}/canva-bg-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("ticket-designs")
          .upload(fileName, buffer, { contentType: "image/png", upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("ticket-designs")
            .getPublicUrl(fileName);
          
          design.backgroundValue = publicUrl;
        } else {
          console.error("Failed to upload Canva image to Supabase:", uploadError);
        }
      }
    } catch (e) {
      console.error("Failed to fetch Canva image:", e);
    }
  }

  // First fetch the event description
  const { data: eventData, error: fetchError } = await supabase
    .from("events")
    .select("description")
    .eq("id", eventId)
    .single();

  if (fetchError || !eventData) {
    console.error("Error fetching event for design save:", fetchError);
    return { success: false, error: fetchError?.message || "Event not found" };
  }

  // Parse description
  const rawDescription = eventData.description || "";
  const parts = rawDescription.split(" ||TICKET_DESIGN|| ");
  const originalDescription = parts[0];

  // Concatenate new design data
  const updatedDescription = `${originalDescription} ||TICKET_DESIGN|| ${JSON.stringify(design)}`;

  const { error: updateError } = await supabase
    .from("events")
    .update({ description: updatedDescription })
    .eq("id", eventId);

  if (updateError) {
    console.error("Error saving ticket design:", updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

