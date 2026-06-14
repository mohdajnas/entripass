"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Activity, Users, Clock, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getInEventLiveData } from "./actions";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-slate-900 font-semibold">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function InEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [data, setData] = useState({
    totalGuests: 0,
    totalCheckins: 0,
    venues: [] as any[],
    hourlyCheckins: [] as any[],
    recentCheckins: [] as any[],
    inventory: [] as any[],
  });

  const loadData = async (background = false) => {
    if (!background) setLoading(true);
    else setIsRefreshing(true);

    const res = await getInEventLiveData(eventId);
    if (res.success && res.data) {
      setData(res.data);
    }
    
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
          <h1 className="text-2xl font-bold text-slate-900">In-Event Live</h1>
          <span className="text-xs text-slate-500 font-medium tracking-wide">REAL-TIME DASHBOARD</span>
        </div>
        
        {isRefreshing && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" /> Auto-syncing...
          </div>
        )}
      </div>

      {/* Live counter */}
      <div className="glass-card p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent opacity-50" />
        <div className="relative z-10">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Live Check-ins</p>
          <p className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-500 to-emerald-700 tabular-nums drop-shadow-sm">
            {data.totalCheckins}
          </p>
          <p className="text-sm font-semibold text-slate-500 mt-3">
            of {data.totalGuests} registered guests
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Hourly rate chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Hourly Check-in Rate
          </h3>
          <div className="h-52">
            {data.hourlyCheckins.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourlyCheckins}>
                  <defs>
                    <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="checkins" stroke="#10b981" strokeWidth={3} fill="url(#liveGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm font-medium">No check-ins today</p>
              </div>
            )}
          </div>
        </div>

        {/* Venue capacity */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Venue Capacity (Live)
          </h3>
          <div className="space-y-4">
            {data.venues.length > 0 ? (
              data.venues.map((venue) => {
                const pct = venue.capacity ? Math.min(100, Math.round((venue.checked_in / venue.capacity) * 100)) : 0;
                return (
                  <div key={venue.id}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-semibold text-slate-700">{venue.name}</span>
                      <span className="text-xs font-bold text-slate-500">
                        {venue.checked_in} <span className="font-medium text-slate-400">/ {venue.capacity} ({pct}%)</span>
                      </span>
                    </div>
                    <Progress value={pct} className="h-2 bg-slate-100" />
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">No venues configured</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent check-ins ticker */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" /> Recent Check-ins
          </h3>
          <div className="space-y-2">
            {data.recentCheckins.length > 0 ? (
              data.recentCheckins.map((guest, i) => (
                <div key={guest.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-all animate-slide-up bg-slate-50/50" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <span className="text-sm font-bold text-slate-900">{guest.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-mono bg-white px-2 py-0.5 rounded shadow-sm">
                    {guest.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm font-medium">No recent check-ins</div>
            )}
          </div>
        </div>

        {/* Inventory progress */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" /> Inventory Distribution
          </h3>
          <div className="space-y-4">
            {data.inventory.length > 0 ? (
              data.inventory.map((item) => {
                const pct = item.total_quantity ? Math.min(100, Math.round((item.distributed_count / item.total_quantity) * 100)) : 0;
                return (
                  <div key={item.id}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                      <span className="text-xs font-bold text-slate-500">
                        {item.distributed_count} <span className="font-medium text-slate-400">/ {item.total_quantity}</span>
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-slate-100" />
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm font-medium">No inventory items tracked</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
