"use client";

import Link from "next/link";
import { Plus, Calendar, Users, MapPin, Globe, ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  published: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  ended: "bg-black/[0.03] text-slate-500 border-black/5",
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
  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className="glass-card group p-0 overflow-hidden animate-slide-up"
      style={{ animationDelay: `${i * 80}ms` }}
    >
      {/* Banner placeholder */}
      <div className="h-36 bg-gradient-to-br from-emerald-600/30 to-teal-700/30 relative overflow-hidden">
        {event.banner_url && (
          <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(255,255,255,0.9)] to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <Badge
            className={`border text-[10px] font-semibold uppercase tracking-wider ${statusStyles[event.status] || "bg-black/5"}`}
          >
            {event.status}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-2 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {event.start_time ? new Date(event.start_time).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }) : "TBD"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {event.is_online ? (
              <Globe className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
            <span className="truncate">{event.venue || "Online / TBD"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            <span>
              {/* Needs actual registered count via join or RPC */}
              Max Capacity: {event.max_capacity?.toLocaleString() || "Unlimited"}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {event.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-500 border border-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Manage link */}
        <div className="flex items-center gap-1 pt-2 text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
          View event
          <ArrowRight className="w-3 h-3" />
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

