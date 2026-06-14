import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="bg-[#f5f5f7] pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div 
              className="h-12 w-48 bg-[#08160c]"
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
          </div>
          <p className="text-slate-500 font-medium mb-6">
            The modern ticketing platform for events of all sizes.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6">Discover</h4>
          <ul className="space-y-4 font-medium text-slate-500">
            <li><Link href="/events" className="hover:text-[var(--primary)]">All Events</Link></li>
            <li><Link href="#" className="hover:text-[var(--primary)]">Concerts</Link></li>
            <li><Link href="#" className="hover:text-[var(--primary)]">Festivals</Link></li>
            <li><Link href="#" className="hover:text-[var(--primary)]">Conferences</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6">Organizers</h4>
          <ul className="space-y-4 font-medium text-slate-500">
            <li><Link href="/organizers" className="hover:text-[var(--primary)]">Why EntryPass?</Link></li>
            <li><Link href="/pricing" className="hover:text-[var(--primary)]">Pricing</Link></li>
            <li><Link href="/register" className="hover:text-[var(--primary)]">Create an Event</Link></li>
            <li><Link href="#" className="hover:text-[var(--primary)]">Help Center</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6">Company</h4>
          <ul className="space-y-4 font-medium text-slate-500">
            <li><Link href="#" className="hover:text-[var(--primary)]">About Us</Link></li>
            <li><Link href="#" className="hover:text-[var(--primary)]">Careers</Link></li>
            <li><Link href="#" className="hover:text-[var(--primary)]">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-[var(--primary)]">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1400px] mx-auto px-6 pt-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400 font-medium">
        <p>© 2026 EntryPass. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <span>English (US)</span>
          <span>€ EUR</span>
        </div>
      </div>
    </footer>
  );
}
