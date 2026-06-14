"use client";

import Link from "next/link";
import { Plus, Calendar, Users, MapPin, Globe, ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "text-amber-400",
  published: "text-[#a3e635]",
  ended: "text-slate-400",
};

// Update this to match the live Supabase event schema
export interface LiveEvent {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  description: string;
  banner_url: string | null;
  start_time: string;
  end_time: string;
  venue: string;
  is_online: boolean;
  status: string;
  max_capacity: number;
  tags: string[];
}

function EventCard({ event, i }: { event: LiveEvent; i: number }) {
  const eventDate = event.start_time ? new Date(event.start_time) : null;
  const day = eventDate ? eventDate.getDate().toString().padStart(2, '0') : "--";
  const month = eventDate ? eventDate.toLocaleString('default', { month: 'short' }) : "TBD";
  const year = eventDate ? eventDate.getFullYear().toString() : "";

  return (
    <Link href={`/dashboard/events/${event.id}`} className="block w-full max-w-sm mx-auto animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
      <div className="bg-[#08160c] p-2.5 rounded-[2.5rem] w-full relative group cursor-pointer hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md">
        <div className="relative w-full aspect-[4/4.5] rounded-[2rem] overflow-hidden bg-[#0b1a10] shadow-inner">
          {/* Background Image & Gradients */}
          <div className="absolute inset-0 bg-[#0b1a10] overflow-hidden">
            {event.banner_url ? (
              <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#08160c] to-[#0a2012]" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0b1a10] to-transparent" />
          </div>

          {/* Top Right Text */}
          <div className="absolute top-6 right-6 text-right z-10 pointer-events-none">
            <h3 className={cn("font-semibold text-[17px] tracking-tight drop-shadow-sm uppercase", statusColors[event.status] || "text-white")}>
              {event.status}
            </h3>
            <p className="text-white/70 text-[13px] font-medium drop-shadow-sm mt-0.5">
              Event Status
            </p>
          </div>

          {/* The SVG Folder Shape */}
          <div className="absolute bottom-0 left-0 w-full h-[65%] z-20 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full text-[#0b1a10] fill-current" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,0 L42,0 C48,0 52,22 58,22 L100,22 L100,100 L0,100 Z" />
            </svg>
            
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              {/* Folder Header */}
              <div className="mt-1 w-[52%]">
                <h2 className="text-white text-[20px] leading-tight font-bold tracking-tight pr-2 line-clamp-2" title={event.title}>
                  {event.title}
                </h2>
                <p className="text-[#8e8e93] text-[13px] mt-1.5 font-medium truncate flex items-center gap-1.5">
                  {event.is_online ? <Globe className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {event.is_online ? "Online Event" : (event.venue || "TBD")}
                </p>
              </div>

              {/* Folder Stats */}
              <div className="flex items-end justify-between mb-1">
                <div className="flex items-baseline">
                  <span className="text-white text-[56px] leading-none font-bold tracking-tighter">
                    {day}
                  </span>
                  <span className="text-white/40 text-[28px] font-bold tracking-tighter ml-1">
                    /{month}
                  </span>
                  <span className="text-[#a3e635]/90 font-semibold text-[15px] mb-2 ml-2">
                    {year}
                  </span>
                </div>
                <div className="text-right mb-2">
                  <span className="text-white font-bold text-[17px]">
                    {event.max_capacity ? `${event.max_capacity} Cap.` : "∞"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DashboardClient({ events }: { events: LiveEvent[] }) {
  const [activeTab, setActiveTab] = useState<"organized" | "participated">("organized");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Later we can filter this properly by whether the user is the owner of the event
  // or just a ticket holder. For now, we will show all fetched events in "organized".
  const organizedEvents = events;
  const participatedEvents: LiveEvent[] = [];

  let displayedEvents = activeTab === "organized" ? organizedEvents : participatedEvents;

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    displayedEvents = displayedEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        (e.venue && e.venue.toLowerCase().includes(query)) ||
        (e.tags && e.tags.some((t) => t.toLowerCase().includes(query)))
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Manage your events
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-px">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("organized")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "organized"
                ? "border-emerald-500 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            Organized
          </button>
          <button
            onClick={() => setActiveTab("participated")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "participated"
                ? "border-emerald-500 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            Participated
          </button>
        </div>

        <div className="relative w-full sm:w-64 mb-2 sm:mb-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl h-10"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {displayedEvents.map((event, i) => (
          <EventCard key={event.id} event={event} i={i} />
        ))}
      </div>
      
      {displayedEvents.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500">No {activeTab} events found.</p>
        </div>
      )}
    </div>
  );
}

