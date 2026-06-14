"use client";

import { useState, useEffect } from "react";
import { getIntegrations, updateIntegrations } from "./actions";
import { Loader2, KeyRound, Save, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function ConfigurationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const data = await getIntegrations();
      setIntegrations(data);
      setLoading(false);
    }
    loadData();
  }, []);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    const result = await updateIntegrations(formData);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Configurations saved successfully!");
      const data = await getIntegrations();
      setIntegrations(data);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Mask function for UI display
  const maskSecret = (secret?: string) => {
    if (!secret) return "";
    if (secret.length <= 4) return "••••";
    return `••••••••••••${secret.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Configurations</h1>
          <p className="text-slate-500 mt-1">Manage global API credentials and integrations securely.</p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 md:p-8 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Shield className="w-48 h-48" />
          </div>

          <div className="relative z-10 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                Razorpay Integration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key ID</label>
                  <input
                    name="razorpay_key_id"
                    type="text"
                    placeholder={integrations?.razorpay_key_id ? maskSecret(integrations.razorpay_key_id) : "Enter Razorpay Key ID"}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Secret</label>
                  <input
                    name="razorpay_key_secret"
                    type="password"
                    placeholder={integrations?.razorpay_key_secret ? "••••••••••••••••" : "Enter Razorpay Key Secret"}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                Canva App Integration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client ID</label>
                  <input
                    name="canva_client_id"
                    type="text"
                    placeholder={integrations?.canva_client_id ? maskSecret(integrations.canva_client_id) : "Enter Canva Client ID"}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Secret</label>
                  <input
                    name="canva_client_secret"
                    type="password"
                    placeholder={integrations?.canva_client_secret ? "••••••••••••••••" : "Enter Canva Client Secret"}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Configurations
          </button>
        </div>
      </form>
    </div>
  );
}
