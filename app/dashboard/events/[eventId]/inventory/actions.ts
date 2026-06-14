"use server";

import { createClient } from "@/utils/supabase/server";

export interface InventoryInput {
  name: string;
  total_quantity: number;
}

export async function createInventoryItem(eventId: string, data: InventoryInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("inventory_items")
    .insert({
      event_id: eventId,
      name: data.name,
      total_quantity: data.total_quantity,
      distributed_count: 0
    });

  if (error) {
    console.error("Create inventory error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateInventoryItem(itemId: string, data: InventoryInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: data.name,
      total_quantity: data.total_quantity,
    })
    .eq("id", itemId);

  if (error) {
    console.error("Update inventory error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function deleteInventoryItem(itemId: string) {
  const supabase = await createClient();

  // First verify if any claims exist
  const { count } = await supabase
    .from("inventory_claims")
    .select("*", { count: "exact", head: true })
    .eq("item_id", itemId);

  if (count && count > 0) {
    return { success: false, error: "Cannot delete this item because some have already been distributed to guests." };
  }

  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Delete inventory error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
