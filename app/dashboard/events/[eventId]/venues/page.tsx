"use client";

import { mockVenues } from "@/lib/mock-data";
import { Plus, MapPin, Pencil, Trash2, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function VenuesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Venues</h1>
          <p className="text-slate-500 text-sm mt-1">Manage sub-venues and capacity</p>
        </div>
        <button className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Add Venue
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {mockVenues.map((venue, i) => {
          const fillPercent = Math.round((venue.checked_in / venue.capacity) * 100);
          return (
            <div key={venue.id} className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-black/5 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{venue.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> Capacity: {venue.capacity}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-all"><Pencil className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Checked in: {venue.checked_in}</span>
                  <span className="text-xs text-slate-500">{fillPercent}%</span>
                </div>
                <Progress value={fillPercent} className="h-2 bg-black/5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
