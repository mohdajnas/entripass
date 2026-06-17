"use client";

import { Bell, Search, Menu, LogOut, User, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

export function GlassNavbar({ title, onMenuClick }: { title?: string, onMenuClick?: () => void }) {
  const router = useRouter();
  const [initials, setInitials] = useState("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
        if (profile?.full_name) {
          const names = profile.full_name.split(" ");
          if (names.length >= 2) {
            setInitials((names[0][0] + names[names.length - 1][0]).toUpperCase());
          } else {
            setInitials(profile.full_name.substring(0, 2).toUpperCase());
          }
        }
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Basic global search implementation
      router.push(`/dashboard?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block mr-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400/80 stroke-[2px]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search..."
            className="w-[280px] pl-10 bg-[#f8f9fa] border-slate-200/80 text-slate-900 placeholder:text-slate-400 h-10 rounded-full focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 text-[15px]"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center w-10 h-10 outline-none">
            <Bell className="w-5 h-5 stroke-[2px]" />
            <span className="absolute top-[9px] right-[10px] w-2.5 h-2.5 rounded-full bg-[var(--primary)] border-[2px] border-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-slate-500">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger className="w-9 h-9 ml-2 rounded-full bg-[var(--primary)] flex items-center justify-center ring-[4px] ring-[var(--primary)]/20 cursor-pointer hover:ring-[var(--primary)]/40 transition-all shadow-sm outline-none border-none p-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[14px] font-bold text-white tracking-wide">{initials}</span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
