"use client";

import { mockDailyRegistrations, mockHourlyCheckins, mockDeviceBreakdown, mockTopReferrers, mockRegistrationsByTime } from "@/lib/mock-data";
import { BarChart3, Plus, Share2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["oklch(0.62 0.2 270)", "oklch(0.6 0.22 300)", "oklch(0.65 0.25 330)", "oklch(0.7 0.18 240)"];
// Use hex approximations for Recharts
const CHART_COLORS = ["#7c5cfc", "#a855f7", "#ec4899", "#6366f1"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-slate-900 font-semibold">{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function InsightsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Insights & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Understand your event performance</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-black/5 text-slate-700 border border-black/5 hover:bg-black/[0.03] transition-all">
            <Share2 className="w-4 h-4" /> Share Insights
          </button>
          <button className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
            <Plus className="w-4 h-4" /> Custom Insight
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Page Views", value: "12,456", change: "+18%" },
          { label: "Unique Visitors", value: "8,932", change: "+12%" },
          { label: "Conversion Rate", value: "14.2%", change: "+2.1%" },
          { label: "Avg. Time on Page", value: "2m 34s", change: "+0.5%" },
        ].map((stat, i) => (
          <div key={stat.label} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            <p className="text-xs text-emerald-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Registration Trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Registration Trend (Daily)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDailyRegistrations}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="registrations" stroke="#7c5cfc" strokeWidth={2} fill="url(#regGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Check-ins */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4">Hourly Check-ins</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockHourlyCheckins}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="checkins" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Device breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4">Device Breakdown</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockDeviceBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {mockDeviceBreakdown.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span className="text-slate-600 text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Referrers */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4">Top Referrers</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTopReferrers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="source" type="category" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="visits" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registration by Time */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4">Registration Time</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRegistrationsByTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
