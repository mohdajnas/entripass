"use server";

import { createClient } from "@/utils/supabase/server";

export async function getInEventLiveData(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Total Registered Guests
  const { count: totalGuests } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  // 2. Venues & Live Capacity Fill
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, capacity")
    .eq("event_id", eventId);

  const venueIds = venues?.map(v => v.id) || [];
  
  // Fetch all checkins for these venues
  const { data: allCheckins } = await supabase
    .from("venue_checkins")
    .select("id, venue_id, checked_in_at")
    .in("venue_id", venueIds.length > 0 ? venueIds : ['00000000-0000-0000-0000-000000000000']);

  const safeCheckins = allCheckins || [];
  const totalCheckinsCount = safeCheckins.length;

  const venuesWithCapacity = venues?.map(v => {
    const checked_in = safeCheckins.filter(c => c.venue_id === v.id).length;
    return {
      id: v.id,
      name: v.name,
      capacity: v.capacity || 1000, // fallback if null
      checked_in,
    };
  }) || [];

  // 3. Hourly Checkin Rate
  const checkinMap: Record<string, number> = {};
  safeCheckins.forEach(c => {
    const d = new Date(c.checked_in_at);
    const hourStr = `${d.getHours().toString().padStart(2, "0")}:00`;
    checkinMap[hourStr] = (checkinMap[hourStr] || 0) + 1;
  });

  const hourlyCheckins = Object.entries(checkinMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hour, checkins]) => ({ hour, checkins }));

  // 4. Recent Check-ins
  const { data: recentCheckinData } = await supabase
    .from("venue_checkins")
    .select(`
      id,
      checked_in_at,
      guests:guest_id (name)
    `)
    .in("venue_id", venueIds.length > 0 ? venueIds : ['00000000-0000-0000-0000-000000000000'])
    .order("checked_in_at", { ascending: false })
    .limit(8);

  const recentCheckins = recentCheckinData?.map(c => ({
    id: c.id,
    name: (c.guests as any)?.name || "Unknown",
    time: new Date(c.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })) || [];

  // 5. Inventory Distribution
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("id, name, total_quantity")
    .eq("event_id", eventId);

  const itemIds = inventoryItems?.map(i => i.id) || [];
  
  const { data: claims } = await supabase
    .from("inventory_claims")
    .select("item_id, quantity_claimed")
    .in("item_id", itemIds.length > 0 ? itemIds : ['00000000-0000-0000-0000-000000000000']);

  const safeClaims = claims || [];
  
  const inventoryData = inventoryItems?.map(item => {
    const distributed_count = safeClaims
      .filter(c => c.item_id === item.id)
      .reduce((sum, c) => sum + (c.quantity_claimed || 1), 0);
    return {
      id: item.id,
      name: item.name,
      total_quantity: item.total_quantity,
      distributed_count,
    };
  }) || [];

  return {
    success: true,
    data: {
      totalGuests: totalGuests || 0,
      totalCheckins: totalCheckinsCount,
      venues: venuesWithCapacity,
      hourlyCheckins,
      recentCheckins,
      inventory: inventoryData,
    }
  };
}
