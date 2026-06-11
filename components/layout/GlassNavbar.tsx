"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GlassNavbar({ title, onMenuClick }: { title?: string, onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-9 rounded-xl focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--primary)]" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center ring-2 ring-[var(--primary)]/20">
          <span className="text-xs font-bold text-white">AW</span>
        </div>
      </div>
    </header>
  );
}
