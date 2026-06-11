import { createClient } from "@/utils/supabase/server";
import { DashboardClient, LiveEvent } from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return redirect("/setup-profile");
  }

  // Fetch events from Supabase.
  // For now, we fetch all events that belong to the user's organization.
  // We'll join with the organizations table to filter by owner_id.
  
  // 1. Find organizations owned by this user
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id);

  let events: LiveEvent[] = [];

  if (orgs && orgs.length > 0) {
    const orgIds = orgs.map((o: { id: string }) => o.id);
    
    // 2. Fetch events belonging to these orgs
    const { data: userEvents } = await supabase
      .from("events")
      .select("*")
      .in("org_id", orgIds)
      .order("created_at", { ascending: false });
      
    if (userEvents) {
      events = userEvents;
    }
  }

  return <DashboardClient events={events} />;
}

