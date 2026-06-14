import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: publicEvents } = await supabase
    .from("events")
    .select("id, title, description, banner_url, start_time, venue, slug")
    .eq("is_public", true)
    .order("start_time", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
      <MarketingHeader />
      
      <main className="flex-1 pt-32 pb-20 px-4 md:px-6 max-w-[1400px] mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-4">All Events</h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">Browse the best upcoming concerts, festivals, and conferences.</p>
        </div>

        {publicEvents && publicEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {publicEvents.map((event) => (
              <Link href={`/${event.slug}`} key={event.id} className="group flex flex-col">
                <div className="aspect-[3/4] w-full rounded-[24px] overflow-hidden bg-slate-100 mb-5 relative">
                  {event.banner_url ? (
                    <img 
                      src={event.banner_url} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute bottom-4 inset-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="bg-white text-slate-900 text-center py-3 rounded-full font-bold shadow-xl">
                      Get Tickets
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center px-2">
                  <h3 className="text-lg font-black uppercase tracking-wide text-slate-900 mb-1.5 line-clamp-1">{event.title}</h3>
                  <div className="flex items-center text-sm font-semibold text-slate-500 gap-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    {event.start_time ? new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : "TBA"}
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-400 gap-2 truncate">
                    <MapPin className="w-4 h-4" />
                    {event.venue || "TBA"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-[40px]">
            <h3 className="text-xl font-bold text-slate-900 mb-2">No events found</h3>
            <p className="text-slate-500">Check back later for new events!</p>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
