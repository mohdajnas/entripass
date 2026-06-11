"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Users, Loader2, Clock } from "lucide-react";
import { getVenueDetails } from "./actions";
import { toast } from "sonner";
import Link from "next/link";

interface CheckinLog {
  id: string;
  checked_in_at: string;
  guest_name: string;
  guest_email: string;
  guest_id: string;
}

interface VenueDetails {
  id: string;
  name: string;
  capacity: number | null;
  location_url: string | null;
}

export default function VenuePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const venueId = params.venueId as string;

  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [checkins, setCheckins] = useState<CheckinLog[]>([]);

  useEffect(() => {
    async function loadData() {
      if (venueId.startsWith("ven-mock-") || eventId.startsWith("evt-")) {
        // Mock data
        setVenue({
          id: venueId,
          name: "Mock Venue Area",
          capacity: 500,
          location_url: null,
        });
        setCheckins([
          { id: "1", checked_in_at: new Date().toISOString(), guest_name: "John Doe", guest_email: "john@example.com", guest_id: "g1" },
          { id: "2", checked_in_at: new Date(Date.now() - 1500000).toISOString(), guest_name: "Jane Smith", guest_email: "jane@example.com", guest_id: "g2" },
        ]);
        setLoading(false);
        return;
      }

      const res = await getVenueDetails(venueId);
      if (res.success) {
        setVenue(res.venue);
        setCheckins(res.checkins);
      } else {
        toast.error(res.error || "Failed to load venue details");
      }
      setLoading(false);
    }
    loadData();
  }, [venueId, eventId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center p-12 text-slate-500">
        Venue not found.
        <br />
        <Link href={`/dashboard/events/${eventId}/venues`} className="text-emerald-600 font-medium hover:underline mt-4 inline-block">
          Return to Venues
        </Link>
      </div>
    );
  }

  const fillPercent = venue.capacity ? Math.min(100, Math.round((checkins.length / venue.capacity) * 100)) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/dashboard/events/${eventId}/venues`}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{venue.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Venue Dashboard & Analytics
          </p>
        </div>
      </div>

      {/* Interactive Map Banner */}
      <div className="w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden bg-slate-900 relative shadow-lg ring-1 ring-black/5">
        <iframe 
          src={`https://maps.google.com/maps?q=${encodeURIComponent(venue.location_url || venue.name)}&t=&z=14&ie=UTF8&iwloc=&output=embed`} 
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          title={`${venue.name} Map Banner`}
        />
        {/* Subtle overlay pointer events none to allow interaction but style corners */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-black/10" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Checked-In</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{checkins.length}</span>
              <span className="text-slate-500 font-medium pb-1">Guests</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Live Attendance</p>
              <p className="text-xs text-slate-500">Recorded directly at this venue</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Capacity Fill</h3>
              <span className="text-sm font-bold text-slate-900">{venue.capacity ? venue.capacity : "∞"} max</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{fillPercent}%</span>
              <span className="text-slate-500 font-medium pb-1">Full</span>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-emerald-600">{checkins.length} inside</span>
              <span className="text-slate-400">{venue.capacity ? venue.capacity - checkins.length : "Unlimited"} remaining</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                style={{ width: `${fillPercent}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Guest Check-in Logs */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Check-in Logs</h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
            {checkins.length} Records
          </span>
        </div>
        
        {checkins.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No check-ins recorded here yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                  <th className="p-4 pl-6 font-semibold">Guest</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 pr-6 text-right font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {checkins.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-900">{log.guest_name}</td>
                    <td className="p-4 text-slate-500 text-sm">{log.guest_email}</td>
                    <td className="p-4 pr-6 text-right text-sm font-medium text-slate-700">
                      {new Date(log.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
