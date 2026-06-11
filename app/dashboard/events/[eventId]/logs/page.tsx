"use client";

import { useState } from "react";
import { mockMessageLogs } from "@/lib/mock-data";
import { Search, Filter, RefreshCw, Mail, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const channelIcons = { email: Mail, whatsapp: MessageSquare };
const statusStyles: Record<string, string> = {
  sent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function LogsPage() {
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockMessageLogs.filter((log) => {
    return (channelFilter === "all" || log.channel === channelFilter) &&
           (statusFilter === "all" || log.status === statusFilter);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Message Logs</h1>
        <p className="text-slate-500 text-sm mt-1">All sent emails and messages</p>
      </div>

      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search recipient..." className="pl-9 bg-black/5 border-black/5 text-slate-900 placeholder:text-slate-400 h-9 rounded-xl" />
        </div>
        <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v || "all")}>
          <SelectTrigger className="w-[140px] bg-black/5 border-black/5 text-slate-900 h-9 rounded-xl">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-xl border-black/5">
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-[130px] bg-black/5 border-black/5 text-slate-900 h-9 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-xl border-black/5">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Recipient</th>
              <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Channel</th>
              <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trigger</th>
              <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sent At</th>
              <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const ChannelIcon = channelIcons[log.channel];
              return (
                <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-medium text-slate-900">{log.guest_name}</p>
                    <p className="text-xs text-slate-500">{log.guest_email}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ChannelIcon className="w-4 h-4" />
                      <span className="capitalize">{log.channel}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 capitalize">{log.trigger_type.replace("_", " ")}</td>
                  <td className="p-4">
                    <Badge className={`border text-[10px] font-semibold ${statusStyles[log.status]}`}>
                      {log.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(log.sent_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4">
                    {log.status === "failed" && (
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all">
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
