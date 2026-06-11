"use client";

import { Mail, Send, Upload, Download, Image, CheckCircle2, XCircle } from "lucide-react";

export default function PostEventPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Post-Event</h1>
        <p className="text-slate-500 text-sm mt-1">Follow up with attendees and wrap up</p>
      </div>

      {/* Batch email actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-black/5 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Thank You Email</h3>
              <p className="text-xs text-slate-500">Send to all checked-in guests</p>
            </div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Recipients</span>
              <span className="text-slate-900 font-medium">892 guests</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Template</span>
              <span className="text-emerald-400 text-xs">Active ✓</span>
            </div>
          </div>
          <button className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm w-full justify-center">
            <Send className="w-4 h-4" /> Send Thank You Emails
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-black/5 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Sorry Email</h3>
              <p className="text-xs text-slate-500">Send to no-show registrants</p>
            </div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Recipients</span>
              <span className="text-slate-900 font-medium">355 guests</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Template</span>
              <span className="text-amber-400 text-xs">Inactive ✗</span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm w-full justify-center bg-black/5 text-slate-700 border border-black/5 hover:bg-black/[0.03] transition-all">
            <Send className="w-4 h-4" /> Send Sorry Emails
          </button>
        </div>
      </div>

      {/* Media upload */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Image className="w-5 h-5 text-slate-500" /> Event Media Gallery
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-black/5 text-slate-700 border border-black/5 hover:bg-black/[0.03] transition-all">
            <Upload className="w-4 h-4" /> Upload Photos
          </button>
        </div>
        <div className="border-2 border-dashed border-black/5 rounded-2xl p-12 text-center">
          <Upload className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Drag and drop event photos here</p>
          <p className="text-xs text-white/25 mt-1">PNG, JPG up to 10MB each</p>
        </div>
      </div>

      {/* Attendance report */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Attendance Report</h3>
            <p className="text-xs text-slate-500 mt-1">Download the final attendance data</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-black/5 text-slate-700 border border-black/5 hover:bg-black/[0.03] transition-all">
            <Download className="w-4 h-4" /> Download XLSX
          </button>
        </div>
      </div>
    </div>
  );
}
