"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Ticket,
  QrCode,
  Gift,
  BarChart3,
  Mail,
  FileText,
  Radio,
  PartyPopper,
  Settings,
  Mic2,
  Building2,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const eventNavItems: NavItem[] = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Form Builder", href: "/form", icon: FileText },
  { label: "Guests", href: "/guests", icon: Users },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Coupons", href: "/coupons", icon: Tag },
  { label: "Speakers", href: "/speakers", icon: Mic2 },
  { label: "Sponsors", href: "/sponsors", icon: Building2 },
  { label: "Venues", href: "/venues", icon: MapPin },
  { label: "Check-In", href: "/check-in", icon: QrCode },
  { label: "Inventory", href: "/inventory", icon: Gift },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Communications", href: "/communications", icon: Mail },
  { label: "Logs", href: "/logs", icon: FileText },
  { label: "In-Event", href: "/in-event", icon: Radio },
  { label: "Post-Event", href: "/post-event", icon: PartyPopper },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function GlassSidebar({ 
  eventId,
  collapsed,
  setCollapsed,
  mobileMenuOpen,
  setMobileMenuOpen
}: { 
  eventId?: string,
  collapsed: boolean,
  setCollapsed: (c: boolean) => void,
  mobileMenuOpen: boolean,
  setMobileMenuOpen: (m: boolean) => void
}) {
  const pathname = usePathname();

  const basePath = eventId ? `/dashboard/events/${eventId}` : "/dashboard";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300",
        "bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-r border-[var(--sidebar-border)]",
        "w-[260px] md:w-auto", // Fixed width on mobile, dynamic on desktop
        collapsed ? "md:w-[68px]" : "md:w-[260px]",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 h-16 border-b border-[var(--sidebar-border)]",
        collapsed ? "justify-center" : "justify-start"
      )}>
        <img 
          src="/ticket-branding/BCCKUP.png" 
          alt="EntryPass Logo" 
          className="w-14 h-14 object-contain flex-shrink-0"
        />
        {!collapsed && (
          <span 
            className="text-2xl font-semibold text-white tracking-tight"
            style={{ fontFamily: "'Myriad Pro', sans-serif", fontWeight: 600 }}
          >
            EntryPass
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {/* Dashboard home link */}
        <Link
          href="/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            pathname === "/dashboard"
              ? "bg-[var(--sidebar-accent)] text-white"
              : "text-white hover:bg-[var(--sidebar-accent)]"
          )}
        >
          <CalendarDays className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        <Link
          href="/dashboard/profile"
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            pathname === "/dashboard/profile"
              ? "bg-[var(--sidebar-accent)] text-white"
              : "text-white hover:bg-[var(--sidebar-accent)]"
          )}
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Profile</span>}
        </Link>

        {eventId && (
          <>
            <div className={cn("px-3 pt-4 pb-2", collapsed && "px-0 text-center")}>
              {!collapsed && (
                <span className="text-[10px] uppercase tracking-widest text-white font-semibold">
                  Event
                </span>
              )}
            </div>
            {eventNavItems.map((item) => {
              const fullHref = `${basePath}${item.href}`;
              const isActive =
                item.href === ""
                  ? pathname === basePath
                  : pathname === fullHref || pathname.startsWith(fullHref + "/");

              return (
                <Link
                  key={item.label}
                  href={fullHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                      : "text-white hover:bg-[var(--sidebar-accent)]"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-[var(--sidebar-border)] p-3 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white hover:bg-[var(--sidebar-accent)] transition-all w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white hover:text-red-400 hover:bg-[var(--sidebar-accent)] transition-all w-full">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
