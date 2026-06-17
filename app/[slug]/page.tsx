import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Calendar, MapPin, Share2, Ticket } from "lucide-react";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the event by slug
  const { data: event } = await supabase
    .from("events")
    .select("*, organizations(name, logo_url)")
    .eq("slug", slug)
    .single();

  if (!event) {
    return notFound();
  }

  // Fetch ticket types for this event
  const { data: tickets } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
      <MarketingHeader />

      <main className="flex-1 pt-24 pb-20">
        {/* Hero Image Section */}
        <div className="w-full h-[50vh] min-h-[400px] bg-slate-900 relative">
          {event.banner_url ? (
            <img 
              src={event.banner_url} 
              alt={event.title} 
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>

        {/* Content Section */}
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  {event.organizations?.logo_url ? (
                    <img src={event.organizations.logo_url} alt={event.organizations.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                      {event.organizations?.name?.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold text-slate-600">By {event.organizations?.name || "Organizer"}</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                  {event.title}
                </h1>

                <div className="flex flex-col sm:flex-row gap-6 mb-8 text-slate-600 font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-[var(--primary)]">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Date & Time</p>
                      <p>{event.start_time ? new Date(event.start_time).toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : "TBA"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-[var(--primary)]">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Location</p>
                      <p>{event.venue || "TBA"}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 my-8" />

                <h2 className="text-2xl font-bold text-slate-900 mb-4">About this event</h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap break-words break-all">
                  {event.description ? event.description.split(" ||TICKET_DESIGN|| ")[0] : "No description provided."}
                </div>
              </div>
            </div>

            {/* Right Column: Ticketing */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-28">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[var(--primary)]" /> Select Tickets
                </h3>

                {tickets && tickets.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-900">{ticket.name}</h4>
                          <span className="font-bold text-emerald-600">
                            {ticket.price > 0 ? `${ticket.currency} ${ticket.price}` : 'Free'}
                          </span>
                        </div>
                        {ticket.description && (
                          <p className="text-sm text-slate-500 mb-3">{ticket.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl mb-6">
                    No tickets available yet.
                  </div>
                )}

                <button 
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg shadow-lg shadow-[var(--primary)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!tickets || tickets.length === 0}
                >
                  Checkout
                </button>

                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center">
                  <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                    <Share2 className="w-4 h-4" /> Share Event
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
