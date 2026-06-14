"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Search, Filter, RefreshCw, Mail, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getMessageLogs } from "./actions";

const channelIcons: Record<string, any> = { email: Mail, whatsapp: MessageSquare };
const statusStyles: Record<string, string> = {
  sent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function LogsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const res = await getMessageLogs(eventId);
      if (res.success && res.logs) {
        setLogs(res.logs);
      } else {
        toast.error(res.error || "Failed to load logs");
      }
      setLoading(false);
    }

    loadData();
  }, [eventId]);

  const filtered = logs.filter((log) => {
    const matchesChannel = channelFilter === "all" || log.channel === channelFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      log.guest_name.toLowerCase().includes(searchLower) || 
      log.guest_email.toLowerCase().includes(searchLower);
      
    return matchesChannel && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Message Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            All sent emails and messages
          </p>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipient name or email..." 
            className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-9 rounded-xl font-medium" 
          />
        </div>
        <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v || "all")}>
          <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200 text-slate-900 h-9 rounded-xl font-medium">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-[130px] bg-slate-50 border-slate-200 text-slate-900 h-9 rounded-xl font-medium">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="p-4 pl-6 font-semibold">Recipient</th>
                <th className="p-4 font-semibold">Channel</th>
                <th className="p-4 font-semibold">Trigger</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Sent At</th>
                <th className="p-4 pr-6 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                    No logs match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const ChannelIcon = channelIcons[log.channel] || Mail;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="text-sm font-semibold text-slate-900">{log.guest_name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{log.guest_email}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <ChannelIcon className="w-4 h-4" />
                          <span className="capitalize">{log.channel}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600 capitalize">
                        {log.trigger_type.replace("_", " ")}
                      </td>
                      <td className="p-4">
                        <Badge className={`border text-[10px] font-bold uppercase tracking-wider ${statusStyles[log.status] || statusStyles.sent}`}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500">
                        {new Date(log.sent_at).toLocaleDateString("en-IN", { 
                          day: "numeric", month: "short", year: "numeric", 
                          hour: "2-digit", minute: "2-digit" 
                        })}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {log.status === "failed" ? (
                          <button 
                            onClick={() => toast.success("Retry queued")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200"
                          >
                            <RefreshCw className="w-3 h-3" /> Retry
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
