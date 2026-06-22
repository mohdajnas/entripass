import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createProfile } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SetupProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Prefill values from Google/OAuth user_metadata
  const defaultEmail = user.email || "";
  const defaultFullName = user.user_metadata?.full_name || "";
  const defaultAvatar = user.user_metadata?.avatar_url || "";

  // Check if user needs to set a password (e.g. they logged in via Google and don't have an email provider)
  const providers = user.app_metadata?.providers || [];
  const needsPassword = !providers.includes("email");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="glass-card p-8 w-full max-w-lg animate-slide-up bg-white shadow-xl rounded-2xl border border-slate-200">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8 mt-2">
          <div 
            className="h-10 w-40 bg-[#08160c]"
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

        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">Set up your profile</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Tell us a bit more about yourself before we head to the dashboard.</p>

        {message && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {message}
          </div>
        )}

        <form action={createProfile} className="space-y-4">
          {/* Hidden field for avatar url */}
          <input type="hidden" name="avatarUrl" value={defaultAvatar} />

          {/* Profile Photo Preview */}
          {defaultAvatar && (
            <div className="flex flex-col items-center gap-2 mb-4">
              <img 
                src={defaultAvatar} 
                alt="Profile Preview" 
                className="w-16 h-16 rounded-full border border-slate-200 shadow-sm"
              />
              <span className="text-xs text-slate-400">Profile photo synced from Google</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Username</label>
              <Input
                type="text"
                name="username"
                required
                placeholder="e.g. arjun99"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name</label>
              <Input
                type="text"
                name="fullName"
                required
                defaultValue={defaultFullName}
                placeholder="e.g. Arjun Mehta"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Email Address</label>
              <Input
                type="email"
                name="email"
                required
                defaultValue={defaultEmail}
                placeholder="e.g. name@example.com"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone Number</label>
              <Input
                type="tel"
                name="phoneNumber"
                placeholder="e.g. +91 98765 43210"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Gender</label>
              <select
                name="gender"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-11"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Date of Birth</label>
              <Input
                type="date"
                name="dob"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">City</label>
              <Input
                type="text"
                name="city"
                placeholder="e.g. Mumbai"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">State</label>
              <Input
                type="text"
                name="state"
                placeholder="e.g. Maharashtra"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
              />
            </div>
          </div>

          {needsPassword && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Set Password (Required for Email Login)</label>
                <Input
                  type="password"
                  name="password"
                  required
                  placeholder="Set a password"
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Confirm password"
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Short Bio (Optional)</label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Tell us a bit about yourself..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {!defaultAvatar && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Custom Profile Photo URL (Optional)</label>
              <Input
                type="url"
                name="customAvatarUrl"
                placeholder="e.g. https://example.com/avatar.jpg"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-gradient w-full py-3 rounded-xl text-sm font-medium mt-6 shadow-lg shadow-emerald-500/20"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
