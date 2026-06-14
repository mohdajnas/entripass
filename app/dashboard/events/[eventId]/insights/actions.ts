"use server";

import { createClient } from "@/utils/supabase/server";

export async function getLiveInsights(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Fetch Guests for Registration Data
  const { data: guests } = await supabase
    .from("guests")
    .select("registered_at")
    .eq("event_id", eventId);

  // 2. Fetch Page Views for Traffic Data
  const { data: pageViews } = await supabase
    .from("page_views")
    .select("visitor_id, device_type, referrer")
    .eq("event_id", eventId);

  // 3. Fetch Checkins for Hourly Flow
  const { data: checkins } = await supabase
    .from("venue_checkins")
    .select("checked_in_at")
    // Wait, the schema in schema.sql for venue_checkins doesn't have event_id directly. 
    // Usually venue_checkins has venue_id, which links to events.
    // Let's just fetch all checkins for the event's venues.
    // To simplify, let's just query venue_checkins if we can, or skip if complex.
    // Actually, I'll fetch venues first, then checkins.
    ;

  const { data: venues } = await supabase
    .from("venues")
    .select("id")
    .eq("event_id", eventId);
  
  let eventCheckins: any[] = [];
  if (venues && venues.length > 0) {
    const venueIds = venues.map(v => v.id);
    const { data: cData } = await supabase
      .from("venue_checkins")
      .select("checked_in_at")
      .in("venue_id", venueIds);
    if (cData) eventCheckins = cData;
  }

  // --- Aggregate Data ---

  // Guests
  const safeGuests = guests || [];
  
  // Registration Trend (Daily)
  const dailyRegMap: Record<string, number> = {};
  // Registration Time (Morning, Afternoon, Evening)
  let morning = 0, afternoon = 0, evening = 0, night = 0;

  safeGuests.forEach(g => {
    const d = new Date(g.registered_at);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyRegMap[dateStr] = (dailyRegMap[dateStr] || 0) + 1;

    const hour = d.getHours();
    if (hour >= 6 && hour < 12) morning++;
    else if (hour >= 12 && hour < 17) afternoon++;
    else if (hour >= 17 && hour < 22) evening++;
    else night++;
  });

  const dailyRegistrations = Object.entries(dailyRegMap).map(([date, count]) => ({ date, registrations: count }));
  // Sort by date (simple approach: chronological by keeping order or parsing)
  // For a real app, you'd fill in missing dates and sort properly.

  const registrationsByTime = [
    { period: "Morning (6AM-12PM)", count: morning },
    { period: "Afternoon (12PM-5PM)", count: afternoon },
    { period: "Evening (5PM-10PM)", count: evening },
    { period: "Night (10PM-6AM)", count: night },
  ].filter(p => p.count > 0);

  // Page Views
  const safePageViews = pageViews || [];
  const totalPageViews = safePageViews.length;
  const uniqueVisitors = new Set(safePageViews.map(p => p.visitor_id).filter(Boolean)).size;
  const conversionRate = uniqueVisitors > 0 ? ((safeGuests.length / uniqueVisitors) * 100).toFixed(1) : "0.0";

  // Device Breakdown
  const deviceMap: Record<string, number> = {};
  // Referrers
  const referrerMap: Record<string, number> = {};

  safePageViews.forEach(p => {
    const device = p.device_type || "Unknown";
    deviceMap[device] = (deviceMap[device] || 0) + 1;

    let ref = p.referrer || "Direct";
    // Clean up referrer URLs
    try {
      if (ref !== "Direct") {
        const url = new URL(ref);
        ref = url.hostname.replace("www.", "");
      }
    } catch (e) {
      // Ignore invalid URLs
    }
    referrerMap[ref] = (referrerMap[ref] || 0) + 1;
  });

  const deviceBreakdown = Object.entries(deviceMap).map(([name, value]) => ({ name, value }));
  const topReferrers = Object.entries(referrerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, visits]) => ({ source, visits }));

  // Hourly Check-ins
  const checkinMap: Record<string, number> = {};
  eventCheckins.forEach(c => {
    const d = new Date(c.checked_in_at);
    // Format hour to e.g., "09:00"
    const hourStr = `${d.getHours().toString().padStart(2, "0")}:00`;
    checkinMap[hourStr] = (checkinMap[hourStr] || 0) + 1;
  });

  const hourlyCheckins = Object.entries(checkinMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hour, checkins]) => ({ hour, checkins }));

  return {
    success: true,
    data: {
      stats: {
        pageViews: totalPageViews,
        uniqueVisitors: uniqueVisitors,
        conversionRate: conversionRate,
      },
      dailyRegistrations,
      registrationsByTime,
      deviceBreakdown,
      topReferrers,
      hourlyCheckins,
    }
  };
}
