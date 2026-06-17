"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import { getEventById, mockGuests, Guest } from "@/lib/mock-data";
import { BackgroundOrbs } from "@/components/layout/BackgroundOrbs";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, Download, Share2, Loader2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { generateGoogleFontsUrl } from "@/lib/google-fonts";
import { toPng } from "html-to-image";
import { toast } from "sonner";

interface LiveEvent {
  id: string;
  title: string;
  start_time: string | null;
  venue: string | null;
  description: string | null;
}

interface LiveGuest {
  id: string;
  event_id: string;
  name: string;
  email: string;
  status: string;
  qr_code: string;
  ticket_types: {
    name: string;
  } | null;
}

interface CanvasElement {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: string;
  color: string;
  visible: boolean;
  textTransform?: string;
  rotation?: number;
}

interface SponsorLogoElement {
  id: string;
  name: string;
  logoUrl: string;
  x: number;
  y: number;
  width: number;
  visible: boolean;
}

interface TicketDesign {
  mode: "own" | "canvas";
  backgroundType: "gradient" | "image" | "color";
  backgroundValue: string;
  canvasFormat: "default" | "notch" | "badge" | "minimal";
  theme: "dark" | "light";
  elements: {
    name: CanvasElement;
    ticketId: CanvasElement;
    eventTitle: CanvasElement;
    venue: CanvasElement;
    dateTime: CanvasElement;
    qrCode?: { x: number; y: number; size: number; visible: boolean; rotation?: number; color?: string; bgColor?: string };
    [key: string]: any;
  };
  sponsors: SponsorLogoElement[];
}

export default function ViewTicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [loading, setLoading] = useState(true);
  const [liveGuest, setLiveGuest] = useState<LiveGuest | null>(null);
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);
  const [bgAspectRatio, setBgAspectRatio] = useState<number | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Resolve current guest and event data synchronously for hook dependencies
  const isMock = !liveGuest;
  const guest = liveGuest || mockGuests.find(g => g.id === ticketId) || mockGuests[0];
  const event = liveEvent || getEventById(guest.event_id) || getEventById("evt_123");

  const ticketDesign = useMemo<TicketDesign | null>(() => {
    if (!event) return null;
    let design: TicketDesign | null = null;
    if (event.description) {
      const parts = event.description.split(" ||TICKET_DESIGN|| ");
      if (parts.length > 1) {
        try {
          design = JSON.parse(parts[1]);
        } catch (e) {
          console.error("Error parsing design data:", e);
        }
      }
    }
    // Check localStorage for mock template
    if (isMock && typeof window !== "undefined") {
      const savedMock = localStorage.getItem(`mock_ticket_design_${event.id}`);
      if (savedMock) {
        try {
          design = JSON.parse(savedMock);
        } catch {}
      }
    }
    return design;
  }, [event, isMock]);

  useEffect(() => {
    if (!ticketRef.current || !ticketDesign) return;
    const baseWidth = ticketDesign.mode === "canvas" && ticketDesign.canvasFormat === "badge" ? 400 : 800;
    
    // Initial scale calculation
    const rect = ticketRef.current.getBoundingClientRect();
    if (rect.width > 0) {
      setScale(rect.width / baseWidth);
    }

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width === 0) return;
      setScale(width / baseWidth);
    });
    observer.observe(ticketRef.current);
    return () => observer.disconnect();
  }, [ticketDesign?.mode, ticketDesign?.canvasFormat]);

  const handleShareTicket = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Event Ticket',
          text: 'Check out my event ticket!',
          url: url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Failed to share ticket.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Ticket link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link.");
      }
    }
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      toast.loading("Generating your ticket...", { id: "download" });
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 4, // ultra high quality
      });
      const link = document.createElement("a");
      link.download = `EntryPass-Ticket-${ticketId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Ticket downloaded successfully!", { id: "download" });
    } catch (err) {
      console.error("Failed to download ticket", err);
      toast.error("Failed to download ticket", { id: "download" });
    }
  };

  useEffect(() => {
    const isMock = !liveGuest;
    const guestObj = liveGuest || mockGuests.find(g => g.id === ticketId) || mockGuests[0];
    const currentEvent = liveEvent || getEventById(guestObj?.event_id) || getEventById("evt_123");
    if (!currentEvent) return;

    let design: TicketDesign | null = null;
    if (currentEvent.description) {
      const parts = currentEvent.description.split(" ||TICKET_DESIGN|| ");
      if (parts.length > 1) {
        try {
          design = JSON.parse(parts[1]);
        } catch {}
      }
    }

    if (!design && isMock && typeof window !== "undefined") {
      const savedMock = localStorage.getItem(`mock_ticket_design_${currentEvent.id}`);
      if (savedMock) {
        try {
          design = JSON.parse(savedMock);
        } catch {}
      }
    }

    if (design && design.backgroundType === "image" && design.backgroundValue) {
      const img = new window.Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setBgAspectRatio(img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = design.backgroundValue;
    } else {
      setTimeout(() => {
        setBgAspectRatio(null);
      }, 0);
    }
  }, [liveEvent, liveGuest, ticketId]);


  useEffect(() => {
    async function fetchTicketData() {
      if (!ticketId || ticketId.startsWith("guest-") || ticketId.startsWith("guest_")) {
        setLoading(false);
        return; // Fallback to mock data
      }

      const supabase = createClient();
      try {
        // Fetch Guest with ticket type relation
        const { data: guestData, error: guestError } = await supabase
          .from("guests")
          .select("id, event_id, name, email, status, qr_code, ticket_types(name)")
          .eq("id", ticketId)
          .single();

        if (guestError || !guestData) {
          console.error("Error fetching guest details:", guestError);
          setLoading(false);
          return;
        }

        // Fetch Event Details (with description to parse ticket template)
        const { data: eventData } = await supabase
          .from("events")
          .select("id, title, start_time, venue, description")
          .eq("id", guestData.event_id)
          .single();

        setLiveGuest(guestData as unknown as LiveGuest);
        if (eventData) {
          setLiveEvent(eventData);
        }
      } catch (err) {
        console.error("Error loading ticket:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTicketData();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const ticketTypeName = isMock 
    ? (guest as Guest).ticket_type_name 
    : (liveGuest?.ticket_types?.name || "General Admission");

  const formattedDate = event.start_time 
    ? new Date(event.start_time).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })
    : "Date TBD";

  const formattedTime = event.start_time
    ? new Date(event.start_time).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })
    : "";

  let googleFontsUrl = "";
  if (ticketDesign) {
    const fontsToLoad = Object.values(ticketDesign.elements)
      .filter((el: any) => el.visible && el.fontFamily)
      .map((el: any) => ({
        family: el.fontFamily,
        weight: String(el.fontWeight || "400"),
        style: el.fontStyle || "normal",
      }));
    googleFontsUrl = generateGoogleFontsUrl(fontsToLoad);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-20 bg-slate-50 relative">
      <BackgroundOrbs />

      {/* Dynamic Fonts Import */}
      {googleFontsUrl && (
        <style dangerouslySetInnerHTML={{__html: `@import url('${googleFontsUrl}');`}} />
      )}
      
      <div className="w-full max-w-md animate-slide-up space-y-6">
        {/* Navigation / Actions Header */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleShareTicket}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownloadTicket}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CUSTOM TICKET DESIGN RENDERER */}
        {ticketDesign ? (
          <div className="relative group perspective-1000">
            <div
              ref={ticketRef}
              className={`w-full relative shadow-2xl transition-all select-none bg-cover bg-center ${
                ticketDesign.mode === "canvas"
                  ? `overflow-hidden border border-slate-800/80 ${
                      ticketDesign.canvasFormat === "notch" 
                        ? "rounded-xl" 
                        : ticketDesign.canvasFormat === "badge" 
                          ? "rounded-2xl max-w-[380px] mx-auto" 
                          : "rounded-3xl"
                    }`
                  : ticketDesign.backgroundType === "image"
                    ? "overflow-hidden border border-slate-800/80"
                    : "overflow-hidden border border-slate-800/80 rounded-3xl"
              } ${
                ticketDesign.mode === "canvas" && ticketDesign.backgroundType === "gradient" ? ticketDesign.backgroundValue : ""
              }`}
              style={{
                backgroundImage:
                  ticketDesign.backgroundType === "image" 
                    ? `url(${ticketDesign.backgroundValue})` 
                    : undefined,
                backgroundColor:
                  ticketDesign.backgroundType === "color" ? ticketDesign.backgroundValue : undefined,
                aspectRatio: ticketDesign.backgroundType === "image" && bgAspectRatio ? String(bgAspectRatio) : (ticketDesign.canvasFormat === "badge" ? "400 / 600" : "800 / 320"),
                height: "auto",
              }}
            >
              {/* circular cutout notches for Notch Preset */}
              {ticketDesign.mode === "canvas" && ticketDesign.canvasFormat === "notch" && (
                <>
                  <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-800 z-10" />
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-800 z-10" />
                  <div className="absolute top-1/2 left-4 right-4 h-0 border-t border-dashed border-white/20 -translate-y-1/2 pointer-events-none" />
                </>
              )}

              {/* lanyard cutout slot for Badge Preset */}
              {ticketDesign.mode === "canvas" && ticketDesign.canvasFormat === "badge" && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-slate-50 border border-slate-800 z-10 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-300/40 rounded-full" />
                </div>
              )}

              {/* Card Glare/Overlay */}
              <div className={`absolute inset-0 bg-white/[0.03] ${ticketDesign.mode === "canvas" && ticketDesign.backgroundType === "gradient" ? "backdrop-blur-[0.5px]" : ""}`} />

              {/* Dynamic Text Elements */}
              {Object.keys(ticketDesign.elements).filter(k => !k.startsWith("qrCode")).map((key) => {
                const el = ticketDesign.elements[key];
                if (!el?.visible) return null;
                const baseKey = key.split('_')[0];
                
                let textContent = "";
                if (baseKey === "eventTitle") textContent = event.title || "Event Title";
                else if (baseKey === "name") textContent = guest.name || "Guest Name";
                else if (baseKey === "ticketId") {
                  const shortId = guest.id.includes("-") ? guest.id.substring(0, 8) : guest.id;
                  textContent = `${ticketTypeName} • ${shortId.toUpperCase()}`;
                }
                else if (baseKey === "venue") textContent = event.venue || "TBD Venue";
                else if (baseKey === "dateTime") {
                  textContent = event.start_time 
                    ? new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                    : "TBD Date & Time";
                }

                return (
                  <div
                    key={key}
                    className="absolute whitespace-nowrap"
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      fontFamily: el.fontFamily,
                      fontSize: `${el.fontSize * scale}px`,
                      fontWeight: el.fontWeight || "normal",
                      fontStyle: el.fontStyle || "normal",
                      color: el.color,
                      textTransform: el.textTransform as any || "none",
                      transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                    }}
                  >
                    {textContent}
                  </div>
                );
              })}

              {/* Dynamic QR Codes */}
              {Object.keys(ticketDesign.elements).filter(k => k.startsWith("qrCode")).map((key) => {
                const qrEl = ticketDesign.elements[key];
                if (!qrEl?.visible) return null;
                return (
                  <div
                    key={key}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: `${qrEl.x}%`,
                      top: `${qrEl.y}%`,
                      width: `${qrEl.size * scale}px`,
                      height: `${qrEl.size * scale}px`,
                      transform: `rotate(${qrEl.rotation || 0}deg)`,
                      backgroundColor: qrEl.bgColor || 'white'
                    }}
                  >
                    <QRCodeSVG
                      value={guest.qr_code || `eventpass://checkin/${guest.id}`}
                      size={qrEl.size * scale}
                      level="H"
                      includeMargin={false}
                      bgColor="transparent"
                      fgColor={qrEl.color || '#000000'}
                    />
                  </div>
                );
              })}

              {/* 7. Draggable Sponsor Logos */}
              {ticketDesign.mode === "canvas" &&
                ticketDesign.sponsors &&
                ticketDesign.sponsors.map((s) => (
                  <div
                    key={s.id}
                    className="absolute p-0.5 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center"
                    style={{
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      width: `${s.width * scale}px`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      className="max-h-7 object-contain filter brightness-95"
                    />
                  </div>
                ))}
            </div>

            {/* Bottom event sheet summary details */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-lg space-y-3 mt-4">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Pass Details</h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 font-medium">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Attendee Email</span>
                  <span className="truncate block">{guest.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Status</span>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-transparent text-[9px] font-bold">
                    {guest.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* DEFAULT CLEAN GLASS TICKET DESIGN */
          <div className="relative group perspective-1000">
            <div className="relative transform-style-3d transition-transform duration-500 rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 border-dashed relative">
                {/* Notches */}
                <div className="absolute -left-3 -bottom-3 w-6 h-6 rounded-full bg-slate-50 border-r border-t border-slate-200 rotate-45" />
                <div className="absolute -right-3 -bottom-3 w-6 h-6 rounded-full bg-slate-50 border-l border-t border-slate-200 -rotate-45" />
                
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-transparent font-bold">
                    {ticketTypeName}
                  </Badge>
                  {guest.status === "checked_in" && (
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-transparent font-bold">
                      Checked In
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h2>
                <div className="space-y-2 text-sm text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>{formattedDate}{formattedTime && `, ${formattedTime}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>{event.venue || "TBD"}</span>
                  </div>
                </div>
              </div>

              {/* QR Code section */}
              <div className="p-8 flex flex-col items-center justify-center relative">
                <div className="p-4 bg-white rounded-2xl mb-6 shadow-md border border-slate-100 relative group-hover:scale-105 transition-transform duration-300">
                  <QRCodeSVG 
                    value={guest.qr_code || `eventpass://checkin/${guest.id}`} 
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ticket ID</p>
                <p className="font-mono text-base font-bold text-slate-900 tracking-wider">
                  {guest.id.includes("-") ? guest.id.substring(0, 8).toUpperCase() : guest.id.toUpperCase()}
                </p>
              </div>

              {/* Footer / Guest details */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Guest</p>
                    <p className="font-bold text-slate-800">{guest.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Email</p>
                    <p className="font-bold text-slate-800 truncate">{guest.email}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
