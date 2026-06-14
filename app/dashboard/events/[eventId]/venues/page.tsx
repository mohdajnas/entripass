"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, MapPin, Pencil, Trash2, Users, X, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { createVenue, updateVenue, deleteVenue, VenueInput } from "./actions";

interface Venue {
  id: string;
  event_id: string;
  name: string;
  capacity: number | null;
  location_url: string | null;
  checked_in: number;
  total_registrations: number;
}

export default function VenuesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [mapLink, setMapLink] = useState("");

  const loadVenues = async () => {
    setLoading(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        // Just mock some basic venues
        setVenues([
          { id: "mock-1", event_id: eventId, name: "Main Hall", capacity: 500, checked_in: 0, total_registrations: 150, location_url: null },
          { id: "mock-2", event_id: eventId, name: "Workshop Room A", capacity: 50, checked_in: 0, total_registrations: 150, location_url: null },
        ]);
        return;
      }

      const supabase = createClient();

      // 1. Fetch event's primary venue to ensure it exists
      const { data: eventData } = await supabase
        .from("events")
        .select("venue, max_capacity, location_url")
        .eq("id", eventId)
        .single();

      // 2. Fetch existing sub-venues
      const { data: venuesData, error: venuesError } = await supabase
        .from("venues")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });

      if (venuesError) throw venuesError;

      const currentVenues = [...(venuesData || [])];

      // 3. Auto-sync primary venue if missing
      const primaryVenueName = eventData?.venue;
      if (primaryVenueName && primaryVenueName !== "Online") {
        const exists = currentVenues.some(v => v.name.trim().toLowerCase() === primaryVenueName.trim().toLowerCase());
        if (!exists) {
          const { data: newV, error: insertErr } = await supabase
            .from("venues")
            .insert({
              event_id: eventId,
              name: primaryVenueName,
              capacity: eventData.max_capacity || null,
              location_url: eventData.location_url || null,
            })
            .select()
            .single();
            
          if (!insertErr && newV) {
            currentVenues.unshift(newV); // Add to the top of the list
          }
        }
      }

      if (venuesError) throw venuesError;

      // Fetch checkins to count them
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("venue_checkins")
        .select("venue_id");
        
      // Fetch total event registrations
      const { count: registrationsCount } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      const totalReg = registrationsCount || 0;
        
      // Just filter checkins manually for now (or could use an RPC)
      const checkinMap: Record<string, number> = {};
      if (checkinsData) {
        checkinsData.forEach(c => {
          checkinMap[c.venue_id] = (checkinMap[c.venue_id] || 0) + 1;
        });
      }

      if (currentVenues.length > 0) {
        setVenues(currentVenues.map(v => ({
          ...v,
          checked_in: checkinMap[v.id] || 0,
          total_registrations: totalReg
        })));
      } else {
        setVenues([]);
      }
    } catch (err: unknown) {
      console.error("Error loading venues:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load venues: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, [eventId]);

  const openModal = (venue: Venue | null = null) => {
    if (venue) {
      setEditingVenue(venue);
      setName(venue.name);
      setCapacity(venue.capacity ? venue.capacity.toString() : "");
      setMapLink(venue.location_url || "");
    } else {
      setEditingVenue(null);
      setName("");
      setCapacity("");
      setMapLink("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Venue name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      const venueInput: VenueInput = {
        name,
        capacity: capacity ? parseInt(capacity) : null,
        location_url: mapLink || null,
      };

      if (isMock) {
        if (editingVenue) {
          setVenues(prev => prev.map(v => v.id === editingVenue.id ? { ...v, ...venueInput } as Venue : v));
          toast.success("Venue updated successfully (mock)");
        } else {
          setVenues(prev => [...prev, {
            id: `ven-mock-${Date.now()}`,
            event_id: eventId,
            checked_in: 0,
            total_registrations: 150,
            ...venueInput
          } as Venue]);
          toast.success("Venue added successfully (mock)");
        }
      } else {
        if (editingVenue) {
          const res = await updateVenue(editingVenue.id, venueInput);
          if (res.success) {
            toast.success("Venue updated successfully");
            loadVenues();
          } else {
            toast.error(res.error || "Failed to update venue");
          }
        } else {
          const res = await createVenue(eventId, venueInput);
          if (res.success) {
            toast.success("Venue added successfully");
            loadVenues();
          } else {
            toast.error(res.error || "Failed to add venue");
          }
        }
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error("Submission error:", err);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (venueId: string) => {
    if (!confirm("Are you sure you want to remove this venue?")) return;

    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setVenues(prev => prev.filter(v => v.id !== venueId));
        toast.success("Venue removed (mock)");
        return;
      }

      const res = await deleteVenue(venueId);
      if (res.success) {
        toast.success("Venue removed successfully");
        loadVenues();
      } else {
        toast.error(res.error || "Failed to remove venue");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An error occurred while removing.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Venues</h1>
          <p className="text-slate-500 text-sm mt-1">Manage sub-venues and capacity</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" /> Add Venue
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : venues.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Navigation className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No venues yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Add sub-venues like "Main Hall" or "Workshop Room A" to manage capacity.</p>
          <button 
            onClick={() => openModal()}
            className="btn-gradient px-6 py-2 rounded-xl text-sm font-medium"
          >
            Add your first venue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center md:justify-items-start">
          {venues.map((venue, i) => (
            <div key={venue.id} className="animate-slide-up w-full" style={{ animationDelay: `${i * 80}ms` }}>
              <VenueCard 
                venue={venue} 
                onEdit={() => openModal(venue)} 
                onDelete={() => handleDelete(venue.id)} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingVenue ? "Edit Venue" : "Add Venue"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Venue Name</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Main Hall"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Capacity (Optional)</label>
                  <Input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 500"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Google Maps Link (Optional)</label>
                  <Input
                    type="url"
                    value={mapLink}
                    onChange={(e) => setMapLink(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gradient px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingVenue ? "Save Changes" : "Add Venue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function VenueCard({ venue, onEdit, onDelete }: { venue: Venue, onEdit: () => void, onDelete: () => void }) {
  const fillPercent = venue.capacity ? Math.min(100, Math.round((venue.checked_in / venue.capacity) * 100)) : 0;

  return (
    <Link href={`/dashboard/events/${venue.event_id}/venues/${venue.id}`} className="block w-full max-w-sm mx-auto">
      <div className="bg-[#101010] p-2.5 rounded-[2.5rem] w-full relative group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
        <div className="relative w-full aspect-[4/4.5] rounded-[2rem] overflow-hidden bg-slate-900 shadow-xl">
        {/* Background Map Preview & Gradients */}
        <div className="absolute inset-0 bg-slate-900 overflow-hidden">
          <iframe 
            src={`https://maps.google.com/maps?q=${encodeURIComponent(venue.name)}&t=&z=14&ie=UTF8&iwloc=&output=embed`} 
            className="w-[150%] h-[150%] absolute top-[-25%] left-[-25%] pointer-events-none opacity-50 filter grayscale-[0.8] contrast-125"
            style={{ border: 0 }}
            loading="lazy"
            title={`${venue.name} map preview`}
          />
          <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors duration-700 ease-out" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101010]/90 via-[#101010]/30 to-transparent" />
        </div>
        
        {/* Abstract light blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-white/10 blur-[50px] rounded-full mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-[30%] right-[-10%] w-[60%] h-[60%] bg-black/40 blur-[40px] rounded-full mix-blend-overlay pointer-events-none" />

        {/* Top Right Text */}
        <div className="absolute top-6 right-6 text-right z-10 pointer-events-none">
          <h3 className="text-white font-semibold text-[17px] tracking-tight drop-shadow-sm">
            Venue Space
          </h3>
          <p className="text-white/90 text-[13px] font-medium drop-shadow-sm mt-0.5">
            Capacity Manager
          </p>
        </div>

        {/* The SVG Folder Shape */}
        <div className="absolute bottom-0 left-0 w-full h-[65%] z-20 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full text-[#1c1c1e] fill-current" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,0 L42,0 C48,0 52,22 58,22 L100,22 L100,100 L0,100 Z" />
          </svg>
          
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            {/* Folder Header */}
            <div className="mt-1 w-[52%]">
              <h2 className="text-white text-[20px] leading-tight font-bold tracking-tight pr-2 line-clamp-2" title={venue.name}>
                {venue.name}
              </h2>
              <p className="text-[#8e8e93] text-[13px] mt-1 font-medium truncate">
                Sub-Venue Tracking
              </p>
            </div>

            {/* Folder Stats */}
            <div className="flex items-end justify-between mb-1">
              <div className="flex items-baseline">
                <span className="text-white text-[56px] leading-none font-bold tracking-tighter">
                  {venue.checked_in < 10 ? `0${venue.checked_in}` : venue.checked_in}
                </span>
                <span className="text-white/40 text-[28px] font-bold tracking-tighter ml-1">
                  /{venue.total_registrations < 10 ? `0${venue.total_registrations}` : venue.total_registrations}
                </span>
                <span className="text-white/90 font-semibold text-[15px] mb-2 ml-2">
                  Guests
                </span>
              </div>
              <div className="text-right mb-2">
                <span className="text-white font-bold text-[17px]">
                  {venue.capacity ? venue.capacity : "∞"} Cap.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Actions */}
        <div className="absolute top-6 left-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-lg"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-10 h-10 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar Line */}
        {venue.capacity && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/40 z-30">
            <div 
              className="h-full bg-white transition-all duration-1000 ease-out"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        )}
      </div>
      </div>
    </Link>
  );
}
