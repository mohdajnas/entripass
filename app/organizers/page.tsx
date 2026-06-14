import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { QrCode, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function OrganizersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
      <MarketingHeader />
      
      <main className="flex-1 pt-32 pb-20 px-4 md:px-6 max-w-[1400px] mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-bold mb-6">
            <Zap className="w-4 h-4" /> Built for scale
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Everything you need to <span className="text-slate-400">run perfect events.</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium mb-10">
            From your first attendee to your millionth ticket sold, EntryPass provides the tools to manage your crowd effortlessly.
          </p>
          <Link href="/register" className="inline-block bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-[var(--primary-foreground)] px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-[var(--primary)]/20 text-lg">
            Create your first event
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="bg-slate-50 rounded-[32px] p-8 text-center border border-black/5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <QrCode className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Lightning Check-in</h3>
            <p className="text-slate-500 font-medium">Scan QR codes in milliseconds. Keep your lines moving fast, even without internet access.</p>
          </div>

          <div className="bg-slate-50 rounded-[32px] p-8 text-center border border-black/5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Users className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Audience CRM</h3>
            <p className="text-slate-500 font-medium">Own your data. Understand your attendees, send targeted emails, and build a loyal community.</p>
          </div>

          <div className="bg-slate-50 rounded-[32px] p-8 text-center border border-black/5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <TrendingUp className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Analytics</h3>
            <p className="text-slate-500 font-medium">Track sales, check-ins, and conversions live. Make data-driven decisions on the fly.</p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
