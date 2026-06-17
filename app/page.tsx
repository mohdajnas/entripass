import Link from "next/link";
import { ArrowDown, Calendar, MapPin, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: publicEvents } = await supabase
    .from("events")
    .select("id, title, description, banner_url, poster_url, start_time, venue, slug")
    .eq("is_public", true)
    .order("start_time", { ascending: true })
    .limit(8);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
      <MarketingHeader />

      {/* Hero Section */}
      <main className="flex-1 pt-24 pb-20 px-4 md:px-6 max-w-[1400px] mx-auto w-full">
        <div className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] rounded-[40px] overflow-hidden flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          {/* Background Image & Overlay */}
          <img 
            src="/1.webp" 
            alt="Hero Banner" 
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-slate-900/60 to-slate-900/90" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center max-w-4xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
              Your favorite events in <span className="text-[var(--primary)]">one place.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mb-12 animate-slide-up" style={{ animationDelay: "200ms" }}>
              Secure your tickets to the most anticipated concerts, conferences, and festivals happening near you.
            </p>
            
            {/* Search Bar / CTA */}
            <div className="flex flex-col sm:flex-row items-center w-full max-w-xl gap-3 sm:gap-2 bg-white p-3 sm:p-2 rounded-[2rem] sm:rounded-full shadow-2xl animate-slide-up" style={{ animationDelay: "300ms" }}>
              <div className="flex-1 flex items-center px-4 py-2 sm:py-0 w-full">
                <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search artists, events, or venues..." 
                  className="w-full bg-transparent border-none outline-none text-slate-900 font-medium placeholder:text-slate-400 truncate"
                />
              </div>
              <button className="w-full sm:w-auto bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-[var(--primary-foreground)] px-8 py-3.5 rounded-2xl sm:rounded-full font-bold transition-all whitespace-nowrap">
                Find Tickets
              </button>
            </div>
          </div>
          
        </div>

        {/* Public Events Section */}
        {publicEvents && publicEvents.length > 0 && (
          <div className="mt-24 mb-32 animate-slide-up" style={{ animationDelay: "500ms" }}>
            <div className="flex items-end justify-between mb-10 px-2">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Trending Now</h2>
                <p className="text-lg text-slate-500 font-medium mt-2">Don't miss out on these top picks</p>
              </div>
              <button className="hidden md:flex text-[var(--primary)] font-bold hover:text-[var(--primary)]/80 transition-colors items-center gap-1">
                View all events <ArrowDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {publicEvents.map((event) => (
                <Link href={`/${event.slug}`} key={event.id} className="group flex flex-col">
                  {/* Aspect Ratio 3:4 Image */}
                  <div className="aspect-[3/4] w-full rounded-[24px] overflow-hidden bg-slate-100 mb-5 relative">
                    {event.poster_url || event.banner_url ? (
                      <img 
                        src={event.poster_url || event.banner_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200" />
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute bottom-4 inset-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                      <div className="bg-white text-slate-900 text-center py-3 rounded-full font-bold shadow-xl">
                        Get Tickets
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
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
            
            <button className="md:hidden mt-8 w-full text-center text-[var(--primary)] font-bold py-4 bg-[var(--primary)]/10 rounded-full">
              View all events
            </button>
          </div>
        )}

        {/* CTA Banner */}
        <div className="w-full bg-slate-900 rounded-[40px] p-12 md:p-24 text-center relative overflow-hidden my-24">
          <img 
            src="/2.webp" 
            alt="Bottom Banner Background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/70" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">Host your next big event with EntryPass.</h2>
            <p className="text-xl text-slate-300 font-medium mb-10">Get the best ticketing platform for your events. Setup in minutes, sell out in seconds.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-[var(--primary-foreground)] px-8 py-4 rounded-full font-bold transition-all w-full sm:w-auto text-lg shadow-xl shadow-[var(--primary)]/30">
                Start Selling Tickets
              </Link>
              <Link href="/pricing" className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-bold transition-all w-full sm:w-auto text-lg">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
