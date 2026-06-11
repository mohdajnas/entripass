"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, UserCheck, IndianRupee, Clock, ExternalLink, QrCode, Pencil, TrendingUp, Loader2, Share2 } from "lucide-react";
import Link from "next/link";
import { getEventById, mockGuests } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

interface LiveEvent {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  max_capacity: number | null;
}

interface LiveGuest {
  id: string;
  name: string;
  email: string;
  status: string;
  registered_at: string;
  amount_paid: number;
}

export default function EventOverviewPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);
  const [liveGuests, setLiveGuests] = useState<LiveGuest[]>([]);
  const [stats, setStats] = useState({
    registered: 0,
    checkedIn: 0,
    revenue: 0,
    waitlisted: 0,
  });

  useEffect(() => {
    async function fetchLiveEventDetails() {
      if (!eventId || eventId.startsWith("evt-") || eventId === "evt_123") {
        setLoading(false);
        return; // Fallback to mock data
      }

      const supabase = createClient();
      try {
        // Fetch Event Details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("id, title, start_time, end_time, venue, max_capacity")
          .eq("id", eventId)
          .single();

        if (eventError || !eventData) {
          console.error("Error fetching event details:", eventError);
          setLoading(false);
          return;
        }

        // Fetch Guests
        const { data: guestsData } = await supabase
          .from("guests")
          .select("id, name, email, status, registered_at, amount_paid")
          .eq("event_id", eventId)
          .order("registered_at", { ascending: false });

        setLiveEvent(eventData);

        if (guestsData) {
          setLiveGuests(guestsData);

          // Calculate stats
          const registered = guestsData.length;
          const checkedIn = guestsData.filter(g => g.status === "checked_in").length;
          const waitlisted = guestsData.filter(g => g.status === "waitlisted").length;
          const revenue = guestsData.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);

          setStats({
            registered,
            checkedIn,
            revenue,
            waitlisted,
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Fallback to mock data if it's a dev demo event
  const isMock = !liveEvent;
  const event = liveEvent || getEventById(eventId) || getEventById("evt-1");

  if (!event) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Event not found</p>
      </div>
    );
  }

  const capacityText = event.max_capacity ? event.max_capacity.toLocaleString() : "Unlimited";
  const capacityProgress = event.max_capacity 
    ? Math.min(((isMock ? (event as any).registered_count : stats.registered) / event.max_capacity) * 100, 100) 
    : 0;

  const statsItems = [
    {
      label: "Total Registrations",
      value: isMock ? (event as any).registered_count.toLocaleString() : stats.registered.toLocaleString(),
      subtext: `of ${capacityText} capacity`,
      icon: Users,
      color: "from-emerald-500 to-blue-500",
    },
    {
      label: "Checked In",
      value: isMock ? (event as any).checked_in_count.toLocaleString() : stats.checkedIn.toLocaleString(),
      subtext: isMock 
        ? `${Math.round(((event as any).checked_in_count / (event as any).registered_count) * 100 || 0)}% attendance` 
        : `${Math.round((stats.checkedIn / (stats.registered || 1)) * 100)}% attendance`,
      icon: UserCheck,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Revenue",
      value: isMock 
        ? `₹${((event as any).revenue / 100).toLocaleString()}` 
        : `₹${stats.revenue.toLocaleString()}`,
      subtext: "Total collected",
      icon: IndianRupee,
      color: "from-teal-500 to-pink-500",
    },
    {
      label: "Waitlisted",
      value: isMock ? (event as any).waitlisted_count.toLocaleString() : stats.waitlisted.toLocaleString(),
      subtext: "Awaiting approval",
      icon: Clock,
      color: "from-amber-500 to-orange-500",
    },
  ];

  const displayGuests = isMock ? mockGuests.slice(0, 5) : liveGuests.slice(0, 5);

  const handleShare = () => {
    const url = `${window.location.origin}/events/${event.id}`;
    navigator.clipboard.writeText(url);
    alert("Shareable registration link copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Event header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            {event.start_time ? new Date(event.start_time).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }) : "Date TBD"}{" "}
            • {event.venue || "Venue TBD"}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            Share Link
          </button>
          <Dialog>
            <DialogTrigger className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all font-semibold cursor-pointer">
              <QrCode className="w-4 h-4" />
              Event QR
            </DialogTrigger>
            <DialogContent className="sm:max-w-md flex flex-col items-center p-8">
              <DialogHeader className="w-full text-center mb-6">
                <DialogTitle className="text-xl">Event Registration QR</DialogTitle>
              </DialogHeader>
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 rounded-3xl shadow-2xl w-full max-w-[320px] mx-auto overflow-hidden">
                {/* Ticket Notches */}
                <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-white -translate-y-1/2 z-10 border-r border-slate-200/20 shadow-inner" />
                <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-white -translate-y-1/2 z-10 border-l border-slate-200/20 shadow-inner" />
                <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-dashed border-white/10 -translate-y-1/2 pointer-events-none" />

                <div className="text-center mb-6 relative z-20">
                  <h3 className="text-white font-black text-2xl uppercase tracking-widest truncate drop-shadow-md">{event.title}</h3>
                  <p className="text-emerald-400 text-xs font-bold mt-1 tracking-widest">SCAN TO REGISTER</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl flex justify-center shadow-inner relative z-20 mx-auto w-fit">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.id}`}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="w-full max-w-[320px] mt-6 flex flex-col gap-3">
                <button 
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all cursor-pointer border border-slate-200"
                >
                  <Share2 className="w-4 h-4" />
                  Copy Shareable Link
                </button>
                <p className="text-xs text-slate-400 text-center font-medium leading-relaxed px-4">
                  Share this link or let attendees scan the ticket code to access the registration page.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Link href={`/dashboard/events/${event.id}/settings`}>
            <button className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-semibold cursor-pointer">
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statsItems.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card bg-white border border-slate-200 p-5 shadow-sm rounded-2xl animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                {stat.label}
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-4.5 h-4.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <p className="text-xs text-slate-500 font-semibold mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Capacity progress */}
      {event.max_capacity && (
        <div className="glass-card bg-white border border-slate-200 p-6 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Registration Progress
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {Math.round(capacityProgress)}% full
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
              style={{
                width: `${capacityProgress}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Recent registrations */}
      <div className="glass-card bg-white border border-slate-200 p-6 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Recent Registrations
          </h3>
          <span className="text-xs text-slate-400 font-semibold">Last 5</span>
        </div>
        <div className="space-y-3">
          {displayGuests.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-slate-200 flex items-center justify-center">
                  <span className="text-xs font-semibold text-slate-700">
                    {guest.name[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {guest.name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">{guest.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] rounded-full border font-bold status-${guest.status.replace("_", "-")}`}
                >
                  {guest.status.replace("_", " ")}
                </span>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  {new Date(guest.registered_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
          ))}
          {displayGuests.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4 font-medium">No registrations yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
