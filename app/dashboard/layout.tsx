"use client";

import { GlassSidebar } from "@/components/layout/GlassSidebar";
import { GlassNavbar } from "@/components/layout/GlassNavbar";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extract eventId from path if present, ignoring 'new'
  const eventMatch = pathname.match(/\/dashboard\/events\/([^/]+)/);
  const eventId = eventMatch && eventMatch[1] !== "new" ? eventMatch[1] : undefined;

  return (
    <div className="flex h-screen bg-[var(--sidebar)] overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <GlassSidebar 
        eventId={eventId} 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 p-2 ml-0 ${
          collapsed ? "md:ml-[68px]" : "md:ml-[220px]"
        } md:pl-0`}
      >
        <div className="flex-1 flex flex-col bg-[#f8fafc] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl relative">
          <GlassNavbar onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
