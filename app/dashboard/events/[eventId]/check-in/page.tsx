"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { QrCode, Camera, MapPin, LogOut, Gift, Search, CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { searchGuests, processCheckin, processBarcodeScan } from "./actions";
import { createClient } from "@/utils/supabase/client";

type CheckInResult = {
  type: "success" | "duplicate" | "invalid";
  name?: string;
  ticketType?: string;
  time?: string;
  error?: string;
} | null;

interface GuestRecord {
  id: string;
  name: string;
  email: string;
  ticket_type: string;
  qr_code: string;
}

export default function CheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>("");

  const [result, setResult] = useState<CheckInResult>(null);
  
  // Manual Search States
  const [manualSearch, setManualSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GuestRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Barcode Scanner State
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Initial load: Fetch Venues
  useEffect(() => {
    async function loadVenues() {
      const supabase = createClient();
      const { data } = await supabase
        .from("venues")
        .select("id, name")
        .eq("event_id", eventId)
        .order("name");
        
      if (data && data.length > 0) {
        setVenues(data);
        setSelectedVenue(data[0].id); // default to first venue
      }
    }
    loadVenues();
  }, [eventId]);

  // Keep focus on the hidden barcode input if they are on the checkin tab
  useEffect(() => {
    const focusScanner = (e?: MouseEvent) => {
      // Don't steal focus if they are interacting with an input, select, or button
      const target = e?.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" || 
        target?.tagName === "SELECT" || 
        target?.tagName === "BUTTON" ||
        target?.closest("button") ||
        target?.closest("select")
      ) {
        return;
      }
      barcodeInputRef.current?.focus();
    };
    
    document.addEventListener("click", focusScanner);
    focusScanner(); // Initial focus
    return () => document.removeEventListener("click", focusScanner);
  }, []);

  // Handle Manual Search Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (manualSearch.length > 2) {
        setIsSearching(true);
        const res = await searchGuests(eventId, manualSearch);
        if (res.success && res.guests) {
          setSearchResults(res.guests);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [manualSearch, eventId]);

  const showResult = (res: CheckInResult) => {
    setResult(res);
    setTimeout(() => setResult(null), 5000);
  };

  const handleManualCheckIn = async (guestId: string) => {
    if (!selectedVenue) {
      alert("Please select a venue first.");
      return;
    }
    setIsProcessing(true);
    const res = await processCheckin(eventId, selectedVenue, guestId);
    showResult(res as CheckInResult);
    setManualSearch(""); // clear search
    setIsProcessing(false);
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    if (!selectedVenue) {
      alert("Please select a venue first.");
      setBarcodeInput("");
      return;
    }

    setIsProcessing(true);
    const res = await processBarcodeScan(eventId, selectedVenue, barcodeInput);
    showResult(res as CheckInResult);
    setBarcodeInput(""); // clear scanner input
    setIsProcessing(false);
    
    // Refocus scanner
    barcodeInputRef.current?.focus();
  };

  return (
    <div className="space-y-6 animate-fade-in relative max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Check-In</h1>
          <p className="text-slate-500 text-sm mt-1">Scan QR codes to check in attendees</p>
        </div>

        {/* Venue Selector */}
        {venues.length > 0 && (
          <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-xl border border-black/5">
            <MapPin className="w-4 h-4 text-slate-500 ml-2" />
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-900 focus:ring-0 pr-6 py-1 cursor-pointer outline-none"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedVenue && venues.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          You need to create at least one Venue on the Venues page before you can check people in.
        </div>
      ) : null}

      <Tabs defaultValue="checkin" className="space-y-6">
        <TabsList className="bg-black/5 border border-black/5 p-1.5 rounded-xl grid w-full max-w-md grid-cols-2 !h-auto">
          <TabsTrigger value="checkin" className="rounded-lg py-2.5 text-sm whitespace-nowrap font-medium transition-all data-active:shadow-sm data-active:bg-white text-slate-500 data-active:text-slate-900">
            <QrCode className="w-4 h-4 mr-2" /> Check-In
          </TabsTrigger>
          <TabsTrigger value="checkout" className="rounded-lg py-2.5 text-sm whitespace-nowrap font-medium transition-all data-active:shadow-sm data-active:bg-white text-slate-500 data-active:text-slate-900">
            <LogOut className="w-4 h-4 mr-2" /> Check-Out
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="space-y-6">
          
          {/* Result card (Absolute positioned at top or fixed for visibility) */}
          {result && (
            <div className={`p-5 rounded-2xl border backdrop-blur-xl animate-scale-up shadow-xl ${
              result.type === "success"
                ? "bg-emerald-500 border-emerald-600 text-white"
                : result.type === "duplicate"
                  ? "bg-amber-400 border-amber-500 text-amber-950"
                  : "bg-red-500 border-red-600 text-white"
            }`}>
              <div className="flex items-center gap-4">
                {result.type === "success" && <CheckCircle2 className="w-10 h-10" />}
                {result.type === "duplicate" && <AlertCircle className="w-10 h-10" />}
                {result.type === "invalid" && <XCircle className="w-10 h-10" />}
                <div>
                  <p className="text-xl font-bold tracking-tight">
                    {result.type === "success" ? "Check-In Successful!" :
                     result.type === "duplicate" ? "Already Checked In!" : "Invalid Ticket"}
                  </p>
                  {result.name && (
                    <p className="font-medium opacity-90 text-sm mt-0.5">{result.name} • {result.ticketType}</p>
                  )}
                  {result.type === "duplicate" && result.time && (
                    <p className="text-xs opacity-75 mt-1 font-medium">First scanned at {result.time}</p>
                  )}
                  {result.error && (
                    <p className="text-sm opacity-90 mt-0.5">{result.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scanner Area */}
          <div className="glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
              </div>
            )}
            
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden transition-colors group-focus-within:border-emerald-300 group-focus-within:bg-emerald-50/30">
              <Camera className="w-12 h-12 text-slate-300 mb-4 transition-colors group-focus-within:text-emerald-400" />
              <p className="text-sm font-medium text-slate-500 text-center px-6">
                Scan QR Code with <br/> USB Barcode Scanner
              </p>
              
              {/* Hidden Input for USB Barcode Scanners */}
              <form onSubmit={handleBarcodeSubmit} className="absolute inset-0 opacity-0 cursor-default">
                <input 
                  ref={barcodeInputRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full h-full cursor-default"
                  autoFocus
                  autoComplete="off"
                />
              </form>

              {/* Animated scan line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 group-focus-within:animate-pulse" />
            </div>
            
            <p className="text-xs text-slate-400 font-medium mt-6 text-center">
              Make sure this window is focused and simply scan a ticket.<br/>
              (Or type the Ticket ID directly into the scanner box)
            </p>
          </div>

          {/* Manual search */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-slate-100/50 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Manual Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="manual-search-input"
                  placeholder="Search by name, email, or ticket ID..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-emerald-500 shadow-sm"
                />
              </div>
            </div>

            {/* Search Results */}
            {manualSearch.length > 2 && (
              <div className="p-0">
                {isSearching ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-slate-100/50">
                    {searchResults.map((guest) => (
                      <div key={guest.id} className="p-4 px-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{guest.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{guest.email} • {guest.ticket_type || "Standard"}</p>
                        </div>
                        <button
                          onClick={() => handleManualCheckIn(guest.id)}
                          disabled={isProcessing || !selectedVenue}
                          className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          Check In
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">
                    No guests found matching "{manualSearch}"
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="checkout">
          <div className="glass-card p-12 text-center">
            <LogOut className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Check-Out Not Active</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              You can enable the checkout scanning feature in the Event Settings if you need to track when guests leave the venue.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
