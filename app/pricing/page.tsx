import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
      <MarketingHeader />
      
      <main className="flex-1 pt-32 pb-20 px-4 md:px-6 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">Simple, transparent pricing.</h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto">Start for free. Only pay when you sell paid tickets.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-slate-50 rounded-[40px] p-8 md:p-10 border border-black/5 hover:border-black/10 transition-colors">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Free Events</h3>
            <p className="text-slate-500 font-medium mb-6">Perfect for meetups, RSVP events, and free gatherings.</p>
            <div className="text-5xl font-black text-slate-900 mb-8">$0</div>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-slate-600 font-medium">
                <Check className="w-5 h-5 text-[var(--primary)]" /> Unlimited free tickets
              </li>
              <li className="flex items-center gap-3 text-slate-600 font-medium">
                <Check className="w-5 h-5 text-[var(--primary)]" /> Unlimited events
              </li>
              <li className="flex items-center gap-3 text-slate-600 font-medium">
                <Check className="w-5 h-5 text-[var(--primary)]" /> Basic QR scanning
              </li>
            </ul>
            <Link href="/register" className="block text-center bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold transition-all w-full">
              Get Started
            </Link>
          </div>

          {/* Paid Tier */}
          <div className="bg-slate-900 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[var(--primary)] rounded-full blur-[80px] opacity-20" />
            
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-white mb-2">Paid Events</h3>
              <p className="text-slate-400 font-medium mb-6">For professional organizers selling tickets and managing large crowds.</p>
              <div className="flex items-end gap-2 mb-8">
                <div className="text-5xl font-black text-white">2.5%</div>
                <div className="text-slate-400 font-medium mb-1">+ $0.99 / ticket</div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-slate-300 font-medium">
                  <Check className="w-5 h-5 text-[var(--primary)]" /> Everything in Free
                </li>
                <li className="flex items-center gap-3 text-slate-300 font-medium">
                  <Check className="w-5 h-5 text-[var(--primary)]" /> Instant payouts
                </li>
                <li className="flex items-center gap-3 text-slate-300 font-medium">
                  <Check className="w-5 h-5 text-[var(--primary)]" /> Advanced analytics
                </li>
              </ul>
              <Link href="/register" className="block text-center bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-[var(--primary-foreground)] px-8 py-4 rounded-full font-bold transition-all w-full shadow-lg shadow-[var(--primary)]/20">
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
