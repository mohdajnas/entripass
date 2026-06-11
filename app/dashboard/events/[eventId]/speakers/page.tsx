"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { mockSpeakers } from "@/lib/mock-data";
import { Plus, GripVertical, Pencil, Trash2, ExternalLink, User, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { createSpeaker, updateSpeaker, deleteSpeaker, SpeakerInput } from "./actions";

interface Speaker {
  id: string;
  event_id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  designation: string | null;
  company: string | null;
  social_url: string | null;
}

export default function SpeakersPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [designation, setDesignation] = useState("");
  const [company, setCompany] = useState("");
  const [socialUrl, setSocialUrl] = useState("");

  const loadSpeakers = async () => {
    setLoading(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setSpeakers(mockSpeakers as any);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setSpeakers(data);
    } catch (err: unknown) {
      console.error("Error loading speakers:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load speakers: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpeakers();
  }, [eventId]);

  const openModal = (speaker: Speaker | null = null) => {
    if (speaker) {
      setEditingSpeaker(speaker);
      setName(speaker.name);
      setBio(speaker.bio || "");
      setPhotoUrl(speaker.photo_url || "");
      setDesignation(speaker.designation || "");
      setCompany(speaker.company || "");
      setSocialUrl(speaker.social_url || "");
    } else {
      setEditingSpeaker(null);
      setName("");
      setBio("");
      setPhotoUrl("");
      setDesignation("");
      setCompany("");
      setSocialUrl("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Speaker name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      
      const speakerInput: SpeakerInput = {
        name,
        bio: bio || null,
        photo_url: photoUrl || null,
        designation: designation || null,
        company: company || null,
        social_url: socialUrl || null,
      };

      if (isMock) {
        if (editingSpeaker) {
          setSpeakers(prev => prev.map(s => s.id === editingSpeaker.id ? { ...s, ...speakerInput } as any : s));
          toast.success("Speaker updated successfully (mock)");
        } else {
          setSpeakers(prev => [...prev, {
            id: `spk-mock-${Date.now()}`,
            event_id: eventId,
            ...speakerInput
          } as Speaker]);
          toast.success("Speaker added successfully (mock)");
        }
      } else {
        if (editingSpeaker) {
          const res = await updateSpeaker(editingSpeaker.id, speakerInput);
          if (res.success) {
            toast.success("Speaker updated successfully");
            loadSpeakers();
          } else {
            toast.error(res.error || "Failed to update speaker");
          }
        } else {
          const res = await createSpeaker(eventId, speakerInput);
          if (res.success) {
            toast.success("Speaker added successfully");
            loadSpeakers();
          } else {
            toast.error(res.error || "Failed to add speaker");
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

  const handleDelete = async (speakerId: string) => {
    if (!confirm("Are you sure you want to remove this speaker?")) return;

    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setSpeakers(prev => prev.filter(s => s.id !== speakerId));
        toast.success("Speaker removed (mock)");
        return;
      }

      const res = await deleteSpeaker(speakerId);
      if (res.success) {
        toast.success("Speaker removed successfully");
        loadSpeakers();
      } else {
        toast.error(res.error || "Failed to remove speaker");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An error occurred while removing.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Speakers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage event speakers</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Speaker
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : speakers.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No speakers yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Add speakers to showcase the brilliant minds joining your event.</p>
          <button 
            onClick={() => openModal()}
            className="btn-gradient px-6 py-2 rounded-xl text-sm font-medium"
          >
            Add your first speaker
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {speakers.map((speaker, i) => (
            <div
              key={speaker.id}
              className="glass-card p-5 animate-slide-up group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-2 mb-4">
                <button className="text-white/15 hover:text-slate-500 cursor-grab transition-colors mt-1">
                  <GripVertical className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {speaker.photo_url ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-black/5 flex-shrink-0">
                        <img 
                          src={speaker.photo_url} 
                          alt={speaker.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(speaker.name)}&backgroundColor=059669`;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-black/5 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-emerald-700">
                          {speaker.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{speaker.name}</h3>
                      <p className="text-xs text-emerald-500 font-medium">{speaker.designation}</p>
                      <p className="text-xs text-slate-500">{speaker.company}</p>
                    </div>
                  </div>
                  {speaker.bio && (
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                      {speaker.bio}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                {speaker.social_url ? (
                  <a
                    href={speaker.social_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1 transition-colors font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Social Profile
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No profile link</span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal(speaker)}
                    className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(speaker.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {editingSpeaker ? "Edit Speaker" : "Add Speaker"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Full Name</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Designation (Optional)</label>
                    <Input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="CTO"
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Company (Optional)</label>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="TechCorp Inc."
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Photo URL (Optional)</label>
                  <Input
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Social URL (Optional)</label>
                  <Input
                    value={socialUrl}
                    onChange={(e) => setSocialUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/janedoe"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Bio (Optional)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Jane is a seasoned engineering leader..."
                    rows={4}
                    className="w-full p-3 text-sm bg-black/5 border border-transparent rounded-xl focus:outline-none focus:border-emerald-500/50 transition-colors resize-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
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
                  {editingSpeaker ? "Save Changes" : "Add Speaker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
