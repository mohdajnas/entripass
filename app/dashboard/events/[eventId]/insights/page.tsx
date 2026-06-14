"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BarChart3, Plus, Share2, Loader2, AlertCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getLiveInsights } from "./actions";

const COLORS = ["oklch(0.62 0.2 270)", "oklch(0.6 0.22 300)", "oklch(0.65 0.25 330)", "oklch(0.7 0.18 240)"];
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
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      pageViews: "0",
      uniqueVisitors: "0",
      conversionRate: "0%",
    },
    dailyRegistrations: [] as any[],
    registrationsByTime: [] as any[],
    deviceBreakdown: [] as any[],
    topReferrers: [] as any[],
    hourlyCheckins: [] as any[],
  });

  useEffect(() => {
    async function loadInsights() {
      setLoading(true);

      try {
        const res = await getLiveInsights(eventId);
        if (res.success && res.data) {
          const liveData = res.data;
          
          setData({
            stats: {
              pageViews: liveData.stats.pageViews.toLocaleString(),
              uniqueVisitors: liveData.stats.uniqueVisitors.toLocaleString(),
              conversionRate: liveData.stats.conversionRate + "%",
            },
            dailyRegistrations: liveData.dailyRegistrations,
            registrationsByTime: liveData.registrationsByTime,
            deviceBreakdown: liveData.deviceBreakdown,
            topReferrers: liveData.topReferrers,
            hourlyCheckins: liveData.hourlyCheckins,
          });
        }
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Insights & Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Understand your live event performance
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-black/5 text-slate-700 border border-black/5 hover:bg-black/[0.03] transition-all">
            <Share2 className="w-4 h-4" /> Export Report
          </button>
          <button className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> Custom Insight
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Page Views", value: data.stats.pageViews, change: "Live" },
          { label: "Unique Visitors", value: data.stats.uniqueVisitors, change: "Live" },
          { label: "Conversion Rate", value: data.stats.conversionRate, change: "Live" },
          { label: "Avg. Time on Page", value: "N/A", change: "Live" },
        ].map((stat, i) => (
          <div key={stat.label} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            <p className={`text-xs mt-1 font-semibold ${stat.change === 'Live' ? 'text-emerald-500 flex items-center gap-1' : 'text-emerald-400'}`}>
              {stat.change === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Registration Trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" /> Registration Trend (Daily)
          </h3>
          <div className="h-64">
            {data.dailyRegistrations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyRegistrations}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="registrations" stroke="#7c5cfc" strokeWidth={3} fill="url(#regGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No registrations yet</div>
            )}
          </div>
        </div>

        {/* Hourly Check-ins */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Hourly Check-ins</h3>
          <div className="h-64">
            {data.hourlyCheckins.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyCheckins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="checkins" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No check-ins yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Device breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Device Breakdown</h3>
          <div className="h-52">
            {data.deviceBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.deviceBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {data.deviceBreakdown.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => <span className="text-slate-600 font-semibold text-xs ml-1">{value}</span>} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No traffic yet</div>
            )}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Top Referrers</h3>
          <div className="h-52">
            {data.topReferrers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topReferrers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="source" type="category" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="visits" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No referrers yet</div>
            )}
          </div>
        </div>

        {/* Registration by Time */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Registration Time</h3>
          <div className="h-52">
            {data.registrationsByTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.registrationsByTime} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No registrations yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
