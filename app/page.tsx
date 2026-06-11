import Link from "next/link";
import { Sparkles, ArrowRight, Calendar, Users, QrCode, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-[rgba(255,255,255,0.6)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/ticket-branding/BCCKUP.png" alt="EntryPass Logo" className="w-14 h-14 object-contain" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">EntryPass</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Log in
            </Link>
            <Link href="/register" className="btn-gradient px-4 py-2 rounded-xl text-sm font-medium">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-32 px-6 text-center animate-fade-in relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/5 text-xs font-medium text-slate-700 mb-8 animate-slide-up">
          <img src="/ticket-branding/BCCKUP.png" alt="EntryPass Icon" className="w-3.5 h-3.5 object-contain" />
          The next generation of event management
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight max-w-4xl mb-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
          Host unforgettable events with{" "}
          <span className="gradient-text">absolute confidence.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-10 animate-slide-up" style={{ animationDelay: "200ms" }}>
          From seamless registration and beautiful landing pages to lightning-fast on-site check-in. Everything you need to manage world-class events in one unified platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <Link href="/register" className="btn-gradient flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold w-full sm:w-auto justify-center">
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-black/5 text-slate-900 hover:bg-black/[0.03] border border-black/5 transition-all w-full sm:w-auto justify-center">
            View Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32 max-w-6xl w-full animate-slide-up" style={{ animationDelay: "400ms" }}>
          {[
            { icon: Calendar, title: "Form Builder", desc: "Create beautiful, high-converting registration pages in minutes." },
            { icon: Users, title: "Guest Management", desc: "Approve, segment, and communicate with your attendees effortlessly." },
            { icon: QrCode, title: "Lightning Check-in", desc: "Scan QR codes in milliseconds. Keep the lines moving instantly." },
            { icon: Shield, title: "Bank-grade Security", desc: "Enterprise-level data protection and secure payment processing." },
          ].map((feature, i) => (
            <div key={feature.title} className="glass-card p-6 text-left" style={{ animationDelay: `${500 + i * 100}ms` }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-black/5 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-32 max-w-4xl mx-auto border-t border-black/[0.08] pt-16 animate-slide-up" style={{ animationDelay: "800ms" }}>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-8">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-xl font-bold font-mono">ACME Corp</div>
            <div className="text-xl font-bold font-serif">Globex</div>
            <div className="text-xl font-bold tracking-widest">SOYLENT</div>
            <div className="text-xl font-bold italic">Initech</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.08] py-12 text-center text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img src="/ticket-branding/BCCKUP.png" alt="EntryPass Icon" className="w-4 h-4 object-contain grayscale" />
            <span>© 2025 EntryPass. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
