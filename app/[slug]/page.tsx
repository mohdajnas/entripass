"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getEventById, mockTicketTypes, mockSpeakers, mockSponsors } from "@/lib/mock-data";
import { Calendar, MapPin, Globe, Share2, Ticket, Check, Loader2, X } from "lucide-react";
import { BackgroundOrbs } from "@/components/layout/BackgroundOrbs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { registerGuest } from "../events/[eventId]/actions";

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  map_link: string | null;
  is_online: boolean;
  tags: string[] | null;
  banner_url: string | null;
  poster_url: string | null;
  show_speakers: boolean | null;
  organizations?: { name: string; logo_url: string | null } | null;
}

interface LiveTicketType {
  id: string;
  name: string;
  price: number;
  description: string | null;
  capacity: number;
  is_visible: boolean;
}

interface LiveFormField {
  id: string;
  field_type: string;
  label: string;
  placeholder: string | null;
  is_required: boolean;
}

interface LiveSpeaker {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  designation: string | null;
  company: string | null;
  social_url: string | null;
}

interface LiveSponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: "platinum" | "gold" | "silver" | "general";
}

export default function PublicSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);
  const [liveTickets, setLiveTickets] = useState<LiveTicketType[]>([]);
  const [liveFields, setLiveFields] = useState<LiveFormField[]>([]);
  const [liveSpeakers, setLiveSpeakers] = useState<LiveSpeaker[]>([]);
  const [liveSponsors, setLiveSponsors] = useState<LiveSponsor[]>([]);
  
  // Checkout Modal State
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, string>>({});
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    async function fetchEventData() {
      if (!slug) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      try {
        // Fetch Event Details by Slug
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("id, title, description, start_time, end_time, venue, map_link, is_online, tags, banner_url, poster_url, show_speakers, organizations(name, logo_url)")
          .eq("slug", slug)
          .single();

        if (eventError || !eventData) {
          console.error("Error fetching event details:", eventError);
          setLoading(false);
          return;
        }

        const eventId = eventData.id;

        // Fetch Ticket Types
        const { data: ticketTypesData } = await supabase
          .from("ticket_types")
          .select("id, name, price, description, capacity, is_visible")
          .eq("event_id", eventId)
          .order("sort_order", { ascending: true });

        // Fetch Custom Form Fields
        const { data: formFieldsData } = await supabase
          .from("form_fields")
          .select("id, field_type, label, placeholder, is_required")
          .eq("event_id", eventId)
          .order("sort_order", { ascending: true });

        // Fetch Speakers
        const { data: speakersData } = await supabase
          .from("speakers")
          .select("id, name, bio, photo_url, designation, company, social_url")
          .eq("event_id", eventId)
          .order("name", { ascending: true });

        // Fetch Sponsors
        const { data: sponsorsData } = await supabase
          .from("sponsors")
          .select("id, name, logo_url, website_url, tier")
          .eq("event_id", eventId)
          .order("name", { ascending: true });

        setLiveEvent(eventData);
        if (ticketTypesData) {
          setLiveTickets(ticketTypesData);
          if (ticketTypesData.length > 0) {
            setSelectedTicketId(ticketTypesData[0].id);
          }
        }
        if (formFieldsData) {
          const customOnly = formFieldsData.filter(
            (f: LiveFormField) => f.label.toLowerCase() !== "full name" && f.label.toLowerCase() !== "email address"
          );
          setLiveFields(customOnly);
        }
        if (speakersData) {
          setLiveSpeakers(speakersData);
        }
        if (sponsorsData) {
          setLiveSponsors(sponsorsData);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEventData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading event page...</p>
        </div>
      </div>
    );
  }

  const isMock = !liveEvent;
  const event = liveEvent;
  const tickets = isMock ? mockTicketTypes : liveTickets;

  if (!event) return null;

  const getEmbedUrl = () => {
    if (event.is_online) return null;
    if (!event.map_link && !event.venue) return null;

    const link = event.map_link;

    if (link && link.includes("<iframe")) {
      const match = link.match(/src="([^"]+)"/);
      if (match && match[1]) return match[1];
    }

    if (link && (link.includes("google.com/maps/embed") || link.includes("google.com/maps/d/embed"))) {
      return link;
    }

    let query = event.venue || "";
    if (link) {
      try {
        if (link.includes("?")) {
          const urlParams = new URLSearchParams(link.split("?")[1]);
          const q = urlParams.get("q") || urlParams.get("query");
          if (q) query = q;
        } else {
          const placeMatch = link.match(/\/maps\/place\/([^/]+)/);
          if (placeMatch && placeMatch[1]) {
            query = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
          }
        }
      } catch (e) {
        console.error("Error parsing map link:", e);
      }
    }

    if (!query || query === "Online") return null;

    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const embedUrl = getEmbedUrl();
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleReserveSpot = () => {
    if (!selectedTicketId) {
      alert("Please select a ticket type first.");
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");
    setSubmittingRegistration(true);

    if (!checkoutName.trim() || !checkoutEmail.trim()) {
      setCheckoutError("Name and Email are required.");
      setSubmittingRegistration(false);
      return;
    }

    for (const f of liveFields) {
      if (f.is_required && !customFieldsData[f.label]?.trim()) {
        setCheckoutError(`The field "${f.label}" is required.`);
        setSubmittingRegistration(false);
        return;
      }
    }

    try {
      const res = await registerGuest({
        eventId: event.id,
        ticketTypeId: selectedTicketId,
        name: checkoutName,
        email: checkoutEmail,
        phone: checkoutPhone || undefined,
        formData: customFieldsData,
        amountPaid: selectedTicket?.price || 0,
      });

      if (res.success && res.guestId) {
        setIsCheckoutOpen(false);
        router.push(`/tickets/${res.guestId}`);
      } else {
        setCheckoutError(res.error || "Failed to register. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setCheckoutError("An unexpected error occurred.");
    } finally {
      setSubmittingRegistration(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Event link copied to clipboard!");
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <BackgroundOrbs />
      
      {/* Banner */}
      <div className="h-[40vh] md:h-[50vh] relative overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-950">
        {event.banner_url && (
          <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(248,250,252,1)] to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                {event.tags?.map(tag => (
                  <Badge key={tag} className="bg-black/[0.03] text-slate-700 border-black/5 text-xs">{tag}</Badge>
                )) || <Badge className="bg-emerald-500/10 text-emerald-700 border-transparent text-xs">Event</Badge>}
              </div>

              <div className="flex items-center gap-3 mb-4">
                {event.organizations?.logo_url ? (
                  <img src={event.organizations.logo_url} alt={event.organizations.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                    {event.organizations?.name?.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-slate-600 text-sm">By {event.organizations?.name || "Organizer"}</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">{event.title}</h1>
              
              <div className="flex flex-wrap gap-6 text-sm text-slate-700 mb-8">
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <span>
                    {event.start_time ? new Date(event.start_time).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : "Date TBD"}
                    {event.start_time && event.end_time && (
                      <>
                        <br/>
                        {new Date(event.start_time).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                  {event.is_online ? <Globe className="w-5 h-5 text-emerald-500" /> : <MapPin className="w-5 h-5 text-emerald-500" />}
                  <span>{event.venue || "TBD"}</span>
                </div>
              </div>
            </div>

            <div className="glass-card bg-white border border-slate-200 p-8 shadow-sm rounded-2xl animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About this event</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words break-all">
                {event.description ? event.description.split(" ||TICKET_DESIGN|| ")[0] : "No description provided for this event."}
              </div>
            </div>

            {/* Google Maps Location Preview Box */}
            {!event.is_online && event.venue && (event.map_link || event.venue !== "Online") && (
              <div className="glass-card bg-white border border-slate-200 p-8 shadow-sm rounded-2xl space-y-4 animate-slide-up" style={{ animationDelay: "150ms" }}>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5.5 h-5.5 text-emerald-600" /> Venue & Location
                </h2>
                
                {embedUrl ? (
                  <div className="w-full h-72 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-900">{event.venue}</p>
                    <p className="text-xs text-slate-500 mt-1">No map link provided.</p>
                  </div>
                )}
              </div>
            )}

            {/* Speakers */}
            {(event.show_speakers !== false && liveSpeakers.length > 0) && (
              <div className="space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <h2 className="text-2xl font-bold text-slate-900">Speakers</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {liveSpeakers.map((speaker) => (
                    <div key={speaker.id} className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden flex flex-col p-2">
                      <div className="w-full aspect-[4/5] bg-slate-100 rounded-[20px] overflow-hidden relative">
                        <img 
                          src={speaker.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(speaker.name)}&backgroundColor=059669`} 
                          alt={speaker.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex flex-col flex-1 px-1.5 pt-4 pb-2">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{speaker.name}</h3>
                        <p className="text-sm text-slate-500 flex-1 leading-snug line-clamp-3">
                          {speaker.bio || `${speaker.designation || ""} ${speaker.company ? `at ${speaker.company}` : ""}`}
                        </p>
                        
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100/80">
                          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span>Speaker</span>
                          </div>
                          {speaker.social_url ? (
                            <a href={speaker.social_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full text-sm font-bold text-slate-900">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                              Follow
                            </a>
                          ) : (
                            <span className="px-4 py-1.5 bg-transparent rounded-full text-sm font-bold text-transparent">
                              -
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sponsors */}
            {liveSponsors.length > 0 && (
              <div className="space-y-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
                <h2 className="text-2xl font-bold text-slate-900">Sponsors</h2>
                <div className="flex flex-wrap items-center gap-8 md:gap-12 mt-8">
                  {liveSponsors.map((sponsor) => (
                    <a 
                      key={sponsor.id} 
                      href={sponsor.website_url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 relative group"
                    >
                      {sponsor.logo_url ? (
                        <img 
                          src={sponsor.logo_url} 
                          alt={sponsor.name} 
                          className="h-10 md:h-12 object-contain" 
                        />
                      ) : (
                        <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-400 group-hover:text-emerald-500 transition-colors">{sponsor.name}</h3>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <div className="glass-card bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Select Tickets</h3>
                
                <div className="space-y-4 mb-6">
                  {tickets.filter(t => t.is_visible).map((ticket) => {
                    const isSelected = selectedTicketId === ticket.id;
                    return (
                      <div 
                        key={ticket.id} 
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
                          isSelected 
                            ? "border-emerald-500 bg-emerald-50/50 shadow-inner" 
                            : "border-slate-200 bg-slate-50/50 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-semibold transition-colors ${
                            isSelected ? "text-emerald-700" : "text-slate-900 group-hover:text-emerald-700"
                          }`}>{ticket.name}</h4>
                          <span className="font-bold text-slate-900">
                            {ticket.price === 0 ? "Free" : `₹${ticket.price}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{ticket.description || "General admission access."}</p>
                        {isSelected && (
                          <div className="absolute bottom-2 right-2 bg-emerald-500 text-white rounded-full p-0.5">
                            <Check className="w-3 h-3 stroke-[3px]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {tickets.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No tickets available.</p>
                  )}
                </div>

                <button 
                  onClick={handleReserveSpot}
                  className="btn-gradient w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 mb-4 text-white shadow-lg shadow-emerald-500/10"
                >
                  <Ticket className="w-5 h-5" /> Reserve Spot
                </button>
                <p className="text-xs text-center text-slate-500 font-medium">
                  By registering, you agree to the Terms & Conditions
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Checkout overlay modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />
          
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsCheckoutOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Checkout Details</h3>
            <p className="text-sm text-slate-500 mb-6">
              You are booking a **{selectedTicket?.name}** ticket {selectedTicket?.price === 0 ? "(Free)" : `for ₹${selectedTicket?.price}`}
            </p>

            {checkoutError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                {checkoutError}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name *</label>
                <Input
                  required
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  placeholder="e.g. Priyan Nair"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address *</label>
                <Input
                  type="email"
                  required
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone Number (Optional)</label>
                <Input
                  type="tel"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
                />
              </div>

              {/* Dynamic Custom Registration Fields */}
              {liveFields.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Additional Information</p>
                  
                  {liveFields.map((field) => {
                    const isRequired = field.is_required;
                    return (
                      <div key={field.id}>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                          {field.label} {isRequired && "*"}
                        </label>
                        {field.field_type === "checkbox" ? (
                          <div className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              required={isRequired}
                              checked={customFieldsData[field.label] === "true"}
                              onChange={(e) => setCustomFieldsData({
                                ...customFieldsData,
                                [field.label]: e.target.checked ? "true" : "false"
                              })}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <span className="text-sm text-slate-500 font-medium">I agree / Yes</span>
                          </div>
                        ) : (
                          <Input
                            type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : "text"}
                            required={isRequired}
                            value={customFieldsData[field.label] || ""}
                            onChange={(e) => setCustomFieldsData({
                              ...customFieldsData,
                              [field.label]: e.target.value
                            })}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingRegistration}
                className="btn-gradient w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
              >
                {submittingRegistration ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                  </>
                ) : (
                  <>
                    Complete Booking <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
