"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail, Send, Upload, Download, Image, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPostEventData, downloadAttendanceCsv, sendPostThankYouEmails, sendPostSorryEmails } from "./actions";

export default function PostEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    checkedInCount: 0,
    noShowCount: 0,
    thankYouActive: false,
    sorryActive: false,
  });

  const [sendingThanks, setSendingThanks] = useState(false);
  const [sendingSorry, setSendingSorry] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const res = await getPostEventData(eventId);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, [eventId]);

  const handleSendThanks = async () => {
    if (!data.thankYouActive) {
      toast.error("Thank You template is inactive. Enable it in Communications.");
      return;
    }
    if (data.checkedInCount === 0) {
      toast.error("No guests have checked in yet!");
      return;
    }
    
    setSendingThanks(true);
    try {
      const res = await sendPostThankYouEmails(eventId);
      if (res.success) {
        toast.success(`Successfully sent ${res.count} Thank You emails!`);
      } else {
        toast.error("Failed to send: " + res.error);
      }
    } catch (e) {
      toast.error("An error occurred while sending emails");
    } finally {
      setSendingThanks(false);
    }
  };

  const handleSendSorry = async () => {
    if (!data.sorryActive) {
      toast.error("Sorry template is inactive. Enable it in Communications.");
      return;
    }
    if (data.noShowCount === 0) {
      toast.error("There are no no-shows to email!");
      return;
    }

    setSendingSorry(true);
    try {
      const res = await sendPostSorryEmails(eventId);
      if (res.success) {
        toast.success(`Successfully sent ${res.count} Sorry emails!`);
      } else {
        toast.error("Failed to send: " + res.error);
      }
    } catch (e) {
      toast.error("An error occurred while sending emails");
    } finally {
      setSendingSorry(false);
    }
  };

  const handleDownloadCsv = async () => {
    setDownloading(true);
    try {
      const res = await downloadAttendanceCsv(eventId);
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `attendance_${eventId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Attendance Report downloaded!");
      } else {
        toast.error("Failed to generate CSV");
      }
    } catch (e) {
      toast.error("Error generating download");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Post-Event</h1>
        <p className="text-slate-500 text-sm mt-1">Follow up with attendees and wrap up</p>
      </div>

      {/* Batch email actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-black/5 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Thank You Email</h3>
              <p className="text-xs text-slate-500">Send to all checked-in guests</p>
            </div>
          </div>
          <div className="bg-white/50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-500 font-medium">Recipients</span>
              <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded shadow-sm">{data.checkedInCount} guests</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Template Status</span>
              {data.thankYouActive ? (
                <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              ) : (
                <span className="text-slate-500 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={handleSendThanks}
            disabled={sendingThanks}
            className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm w-full justify-center font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {sendingThanks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendingThanks ? "Queuing Emails..." : "Send Thank You Emails"}
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-black/5 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Sorry Email</h3>
              <p className="text-xs text-slate-500">Send to no-show registrants</p>
            </div>
          </div>
          <div className="bg-white/50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-500 font-medium">Recipients</span>
              <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded shadow-sm">{data.noShowCount} guests</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Template Status</span>
              {data.sorryActive ? (
                <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Active
                </span>
              ) : (
                <span className="text-slate-500 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={handleSendSorry}
            disabled={sendingSorry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm w-full justify-center bg-slate-100 text-slate-700 font-medium border border-slate-200 hover:bg-slate-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {sendingSorry ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendingSorry ? "Queuing Emails..." : "Send Sorry Emails"}
          </button>
        </div>
      </div>
      {/* Media upload */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Image className="w-5 h-5 text-slate-500" /> Event Media Gallery
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all">
            <Upload className="w-4 h-4" /> Upload Photos
          </button>
        </div>
        <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-12 text-center transition-colors hover:bg-slate-50">
          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Drag and drop event photos here</p>
          <p className="text-xs font-medium text-slate-400 mt-1">PNG, JPG up to 10MB each</p>
        </div>
      </div>

      {/* Attendance report */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Attendance Report</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Download the final attendance data</p>
          </div>
          <button 
            onClick={handleDownloadCsv}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Generating..." : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
