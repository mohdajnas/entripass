"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { mockSponsors } from "@/lib/mock-data";
import { Plus, Pencil, Trash2, ExternalLink, Building2, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { createSponsor, updateSponsor, deleteSponsor, SponsorInput } from "./actions";

interface Sponsor {
  id: string;
  event_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: "platinum" | "gold" | "silver" | "general";
}

const tierStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  platinum: { bg: "from-slate-300/20 to-white/20", text: "text-slate-200", border: "border-slate-300/30", label: "Platinum" },
  gold: { bg: "from-amber-500/20 to-yellow-500/20", text: "text-amber-300", border: "border-amber-500/30", label: "Gold" },
  silver: { bg: "from-gray-400/20 to-slate-400/20", text: "text-gray-300", border: "border-gray-400/30", label: "Silver" },
  general: { bg: "from-emerald-500/20 to-teal-500/20", text: "text-emerald-300", border: "border-emerald-500/30", label: "General" },
};

export default function SponsorsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [tier, setTier] = useState<"platinum" | "gold" | "silver" | "general">("general");

  const loadSponsors = async () => {
    setLoading(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setSponsors(mockSponsors as any);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setSponsors(data);
    } catch (err: unknown) {
      console.error("Error loading sponsors:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load sponsors: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSponsors();
  }, [eventId]);

  const openModal = (sponsor: Sponsor | null = null) => {
    if (sponsor) {
      setEditingSponsor(sponsor);
      setName(sponsor.name);
      setLogoUrl(sponsor.logo_url || "");
      setWebsiteUrl(sponsor.website_url || "");
      setTier(sponsor.tier);
    } else {
      setEditingSponsor(null);
      setName("");
      setLogoUrl("");
      setWebsiteUrl("");
      setTier("general");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Sponsor name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      
      const sponsorInput: SponsorInput = {
        name,
        logo_url: logoUrl || null,
        website_url: websiteUrl || null,
        tier,
      };

      if (isMock) {
        if (editingSponsor) {
          setSponsors(prev => prev.map(s => s.id === editingSponsor.id ? { ...s, ...sponsorInput } as any : s));
          toast.success("Sponsor updated successfully (mock)");
        } else {
          setSponsors(prev => [...prev, {
            id: `spn-mock-${Date.now()}`,
            event_id: eventId,
            ...sponsorInput
          } as Sponsor]);
          toast.success("Sponsor added successfully (mock)");
        }
      } else {
        if (editingSponsor) {
          const res = await updateSponsor(editingSponsor.id, sponsorInput);
          if (res.success) {
            toast.success("Sponsor updated successfully");
            loadSponsors();
          } else {
            toast.error(res.error || "Failed to update sponsor");
          }
        } else {
          const res = await createSponsor(eventId, sponsorInput);
          if (res.success) {
            toast.success("Sponsor added successfully");
            loadSponsors();
          } else {
            toast.error(res.error || "Failed to add sponsor");
          }
        }
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error("Submission error:", err);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sponsorId: string) => {
    if (!confirm("Are you sure you want to remove this sponsor?")) return;

    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setSponsors(prev => prev.filter(s => s.id !== sponsorId));
        toast.success("Sponsor removed (mock)");
        return;
      }

      const res = await deleteSponsor(sponsorId);
      if (res.success) {
        toast.success("Sponsor removed successfully");
        loadSponsors();
      } else {
        toast.error(res.error || "Failed to remove sponsor");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An error occurred while removing.");
    }
  };

  const tiersList = ["platinum", "gold", "silver", "general"] as const;

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sponsors</h1>
          <p className="text-slate-500 text-sm mt-1">Manage event sponsors by tier</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Sponsor
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : sponsors.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No sponsors yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Add sponsors to highlight the partners supporting your event.</p>
          <button 
            onClick={() => openModal()}
            className="btn-gradient px-6 py-2 rounded-xl text-sm font-medium"
          >
            Add your first sponsor
          </button>
        </div>
      ) : (
        tiersList.map((tier) => {
          const tierSponsors = sponsors.filter((s) => s.tier === tier);
          if (tierSponsors.length === 0) return null;
          const style = tierStyles[tier];

          return (
            <div key={tier}>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`border ${style.border} bg-gradient-to-r ${style.bg} ${style.text} text-xs font-semibold px-3`}>
                  {style.label}
                </Badge>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tierSponsors.map((sponsor, i) => (
                  <div
                    key={sponsor.id}
                    className="glass-card p-5 group animate-slide-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      {sponsor.logo_url ? (
                        <div className={`w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm`}>
                          <img 
                            src={sponsor.logo_url} 
                            alt={sponsor.name} 
                            className="max-w-full max-h-full object-contain p-2" 
                          />
                        </div>
                      ) : (
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.bg} border border-black/5 flex items-center justify-center flex-shrink-0`}>
                          <Building2 className={`w-6 h-6 ${style.text} opacity-60`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900">{sponsor.name}</h3>
                        {sponsor.website_url && (
                          <a
                            href={sponsor.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1 mt-0.5 transition-colors font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Website
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(sponsor)}
                          className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(sponsor.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingSponsor ? "Edit Sponsor" : "Add Sponsor"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Sponsor Name</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Corp"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Sponsorship Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as "platinum" | "gold" | "silver" | "general")}
                    className="w-full h-10 px-3 py-2 text-sm bg-black/5 border border-transparent rounded-xl focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Logo URL (Optional)</label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Website URL (Optional)</label>
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://acmecorp.com"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gradient px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingSponsor ? "Save Changes" : "Add Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
