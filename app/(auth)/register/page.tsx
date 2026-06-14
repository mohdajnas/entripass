import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { signup, signInWithGoogle } from "../actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <div className="min-h-screen flex bg-[#08160c]">
      {/* Left Branding Sidebar */}
      <div className="hidden lg:flex w-1/2 bg-[#08160c] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/30 rounded-full mix-blend-screen filter blur-[100px] opacity-50" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-teal-500/30 rounded-full mix-blend-screen filter blur-[100px] opacity-50" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div 
            className="h-12 w-48 bg-white"
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

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            The world's most powerful ticketing platform.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Create, manage, and scale your events seamlessly. Join thousands of organizers who trust EntryPass for their ticketing needs.
          </p>
          
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <img 
                  key={i}
                  src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  alt={`Organizer ${i}`}
                  className="w-10 h-10 rounded-full border-2 border-[#08160c] object-cover bg-white" 
                />
              ))}
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">Trusted by 10,000+</p>
              <p className="text-slate-400">event organizers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white lg:rounded-l-[40px]">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo for mobile only */}
          <div className="flex lg:hidden items-center justify-center mb-10">
            <div 
              className="h-12 w-48 bg-[#08160c]"
              style={{
                maskImage: 'url(/ticket-branding/sidebar-new.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center center',
                WebkitMaskImage: 'url(/ticket-branding/sidebar-new.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center center'
              }}
            />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create an account</h1>
          <p className="text-slate-500 mb-8 text-lg">Start managing your events today</p>

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {message}
            </div>
          )}

          <form className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Full Name</label>
              <Input
                type="text"
                name="name"
                required
                placeholder="Arjun Mehta"
                className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-12 focus-visible:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Email address</label>
              <Input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-12 focus-visible:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Password</label>
              <Input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-12 focus-visible:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Confirm Password</label>
              <Input
                type="password"
                name="confirmPassword"
                required
                placeholder="••••••••"
                className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-12 focus-visible:ring-emerald-500"
              />
            </div>

            <button
              formAction={signup}
              className="btn-gradient w-full py-3.5 rounded-xl text-sm font-semibold mt-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
            >
              Create Account
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs font-medium text-slate-500 bg-white uppercase tracking-wider">or continue with</span>
            </div>
          </div>

          <form action={signInWithGoogle}>
            <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
