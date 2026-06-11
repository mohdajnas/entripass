"use client";

import { mockVenues, mockHourlyCheckins, mockInventoryItems, mockGuests } from "@/lib/mock-data";
import { Activity, Users, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const checkedInGuests = mockGuests.filter((g) => g.status === "checked_in");
  const recentCheckins = checkedInGuests.slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        <h1 className="text-2xl font-bold text-slate-900">In-Event Live</h1>
        <span className="text-xs text-slate-500">Real-time updates</span>
      </div>

      {/* Live counter */}
      <div className="glass-card p-8 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Live Check-ins</p>
        <p className="text-7xl font-bold gradient-text tabular-nums">892</p>
        <p className="text-sm text-slate-500 mt-2">of 1,247 registered</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Hourly rate chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Hourly Check-in Rate
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHourlyCheckins}>
                <defs>
                  <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="checkins" stroke="#10b981" strokeWidth={2} fill="url(#liveGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Venue capacity */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Venue Capacity (Live)
          </h3>
          <div className="space-y-4">
            {mockVenues.map((venue) => {
              const pct = Math.round((venue.checked_in / venue.capacity) * 100);
              return (
                <div key={venue.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-700">{venue.name}</span>
                    <span className="text-xs text-slate-500">{venue.checked_in}/{venue.capacity} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-2 bg-black/5" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent check-ins ticker */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Check-ins
          </h3>
          <div className="space-y-2">
            {recentCheckins.map((guest, i) => (
              <div key={guest.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-all animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-slate-900">{guest.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">10:{30 + i} AM</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory progress */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Inventory Distribution
          </h3>
          <div className="space-y-4">
            {mockInventoryItems.map((item) => {
              const pct = Math.round((item.distributed_count / item.total_quantity) * 100);
              return (
                <div key={item.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.distributed_count}/{item.total_quantity}</span>
                  </div>
                  <Progress value={pct} className="h-1.5 bg-black/5" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
