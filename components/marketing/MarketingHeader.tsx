import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div 
              className="h-12 w-48 bg-[#08160c] cursor-pointer"
              style={{
                maskImage: 'url(/ticket-branding/sidebar-new.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'left center',
                WebkitMaskImage: 'url(/ticket-branding/sidebar-new.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'left center'
              }}
            />
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 font-semibold text-sm tracking-wide">
          <Link href="/events" className="hover:text-[var(--primary)] transition-colors">Events</Link>
          <Link href="/pricing" className="hover:text-[var(--primary)] transition-colors">Pricing</Link>
          <Link href="/organizers" className="hover:text-[var(--primary)] transition-colors">For Organizers</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-[var(--primary)] transition-colors">
            Log in
          </Link>
          <Link href="/register" className="bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-[var(--primary-foreground)] px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md shadow-[var(--primary)]/20">
            Create Event
          </Link>
        </div>
      </div>
    </header>
  );
}
