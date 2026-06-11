"use client";

import { useState } from "react";
import { QrCode, Camera, MapPin, LogOut, Gift, Search, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

type CheckInResult = {
  type: "success" | "duplicate" | "invalid";
  name?: string;
  ticketType?: string;
  time?: string;
} | null;

export default function CheckInPage() {
  const [result, setResult] = useState<CheckInResult>(null);
  const [manualSearch, setManualSearch] = useState("");

  const simulateScan = (type: NonNullable<CheckInResult>["type"]) => {
    if (type === "success") {
      setResult({ type: "success", name: "Arjun Mehta", ticketType: "VIP", time: new Date().toLocaleTimeString() });
    } else if (type === "duplicate") {
      setResult({ type: "duplicate", name: "Priya Sharma", ticketType: "Regular", time: "10:15 AM" });
    } else {
      setResult({ type: "invalid" });
    }
    setTimeout(() => setResult(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Check-In</h1>
        <p className="text-slate-500 text-sm mt-1">Scan QR codes to check in attendees</p>
      </div>

      <Tabs defaultValue="checkin" className="space-y-6">
        <TabsList className="bg-black/5 border border-black/5 p-1 rounded-xl">
          <TabsTrigger value="checkin" className="data-[state=active]:bg-black/[0.03] data-[state=active]:text-slate-900 text-slate-500 rounded-lg px-4 py-2 text-sm">
            <QrCode className="w-4 h-4 mr-2" /> Check-In
          </TabsTrigger>
          <TabsTrigger value="venue" className="data-[state=active]:bg-black/[0.03] data-[state=active]:text-slate-900 text-slate-500 rounded-lg px-4 py-2 text-sm">
            <MapPin className="w-4 h-4 mr-2" /> Venue
          </TabsTrigger>
          <TabsTrigger value="checkout" className="data-[state=active]:bg-black/[0.03] data-[state=active]:text-slate-900 text-slate-500 rounded-lg px-4 py-2 text-sm">
            <LogOut className="w-4 h-4 mr-2" /> Check-Out
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-black/[0.03] data-[state=active]:text-slate-900 text-slate-500 rounded-lg px-4 py-2 text-sm">
            <Gift className="w-4 h-4 mr-2" /> Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="space-y-6">
          {/* QR Scanner area */}
          <div className="glass-card p-8 flex flex-col items-center justify-center">
            <div className="w-72 h-72 rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center bg-black/[0.02] relative overflow-hidden">
              <Camera className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 text-center">Camera QR scanner<br />would appear here</p>
              {/* Animated scan line */}
              <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent top-1/2 animate-pulse" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => simulateScan("success")} className="px-4 py-2 rounded-xl text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all">
                Simulate: Success
              </button>
              <button onClick={() => simulateScan("duplicate")} className="px-4 py-2 rounded-xl text-sm bg-amber-500/20 text-amber-300 border border-amber-500/20 hover:bg-amber-500/30 transition-all">
                Simulate: Duplicate
              </button>
              <button onClick={() => simulateScan("invalid")} className="px-4 py-2 rounded-xl text-sm bg-red-500/20 text-red-300 border border-red-500/20 hover:bg-red-500/30 transition-all">
                Simulate: Invalid
              </button>
            </div>
          </div>

          {/* Result card */}
          {result && (
            <div className={`p-5 rounded-2xl border backdrop-blur-xl animate-slide-up ${
              result.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : result.type === "duplicate"
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-red-500/10 border-red-500/20"
            }`}>
              <div className="flex items-center gap-3">
                {result.type === "success" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                {result.type === "duplicate" && <AlertCircle className="w-8 h-8 text-amber-400" />}
                {result.type === "invalid" && <XCircle className="w-8 h-8 text-red-400" />}
                <div>
                  <p className={`text-lg font-bold ${
                    result.type === "success" ? "text-emerald-300" :
                    result.type === "duplicate" ? "text-amber-300" : "text-red-300"
                  }`}>
                    {result.type === "success" ? "Check-In Successful!" :
                     result.type === "duplicate" ? "Already Checked In" : "Invalid QR Code"}
                  </p>
                  {result.name && (
                    <p className="text-sm text-slate-600">{result.name} • {result.ticketType}</p>
                  )}
                  {result.type === "duplicate" && result.time && (
                    <p className="text-xs text-slate-500 mt-1">First checked in at {result.time}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual search */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Manual Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or ticket ID..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                className="pl-9 bg-black/5 border-black/5 text-slate-900 placeholder:text-slate-400 h-10 rounded-xl"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="venue">
          <div className="glass-card p-8 text-center">
            <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">Select a venue first, then scan to check in</p>
          </div>
        </TabsContent>

        <TabsContent value="checkout">
          <div className="glass-card p-8 text-center">
            <LogOut className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">Scan QR to record departure time</p>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="glass-card p-8 text-center">
            <Gift className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">Select a goodie item, then scan guest QR to distribute</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
