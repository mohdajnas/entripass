"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Trash2, Archive, Upload, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ticketDesignRef = useRef<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId || eventId.startsWith("evt-") || eventId === "evt_123") {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      
      if (!error && data) {
        const formatLocal = (isoString: string) => {
          if (!isoString) return "";
          const d = new Date(isoString);
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        let description = data.description || "";
        if (description.includes(" ||TICKET_DESIGN|| ")) {
          const parts = description.split(" ||TICKET_DESIGN|| ");
          description = parts[0];
          ticketDesignRef.current = parts[1] || null;
        }

        setFormData({
          ...data,
          description: description,
          start_time: formatLocal(data.start_time),
          end_time: formatLocal(data.end_time),
        });
      } else {
        toast.error("Failed to load event details");
      }
      setLoading(false);
    }
    fetchEvent();
  }, [eventId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        handleChange("banner_url", e.target?.result as string);
        toast.success("Banner uploaded locally!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData || eventId.startsWith("evt-")) return;
    setSaving(true);
    const supabase = createClient();
    
    // Parse times back to ISO
    const payload = { ...formData };
    if (payload.start_time) payload.start_time = new Date(payload.start_time).toISOString();
    if (payload.end_time) payload.end_time = new Date(payload.end_time).toISOString();
    
    // Append ticket design back to description if it exists
    if (ticketDesignRef.current) {
      payload.description = `${payload.description || ""} ||TICKET_DESIGN|| ${ticketDesignRef.current}`;
    }

    const { error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId);

    if (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } else {
      toast.success("Event settings saved!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!formData) {
    return <div className="text-slate-500">Event not found or using mock data.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Event Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure event details and advanced options</p>
      </div>

      {/* Basic Info */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block">Event Title</label>
            <Input 
              value={formData.title || ""} 
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-black/5 border-black/5 text-slate-900 rounded-xl" 
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block">Description</label>
            <Textarea 
              value={formData.description || ""} 
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4} 
              className="bg-black/5 border-black/5 text-slate-900 rounded-xl resize-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1.5 block">Start Date & Time</label>
              <Input 
                type="datetime-local" 
                value={formData.start_time || ""} 
                onChange={(e) => handleChange("start_time", e.target.value)}
                className="bg-black/5 border-black/5 text-slate-900 rounded-xl" 
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1.5 block">End Date & Time</label>
              <Input 
                type="datetime-local" 
                value={formData.end_time || ""} 
                onChange={(e) => handleChange("end_time", e.target.value)}
                className="bg-black/5 border-black/5 text-slate-900 rounded-xl" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1.5 block">Venue Name</label>
              <Input 
                value={formData.venue || ""} 
                onChange={(e) => handleChange("venue", e.target.value)}
                placeholder="e.g. Grand Convention Center"
                className="bg-black/5 border-black/5 text-slate-900 rounded-xl" 
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1.5 block">Google Maps Link</label>
              <Input 
                value={formData.location_url || ""} 
                onChange={(e) => handleChange("location_url", e.target.value)}
                placeholder="https://maps.google.com/..."
                className="bg-black/5 border-black/5 text-slate-900 rounded-xl" 
              />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <label className="text-sm text-slate-600">Online Event</label>
            <Switch 
              checked={formData.is_online || false} 
              onCheckedChange={(checked) => handleChange("is_online", checked)}
            />
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Banner Image</h3>
          {formData.banner_url && (
            <button 
              onClick={() => handleChange("banner_url", null)} 
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Remove
            </button>
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleBannerUpload} 
        />
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-black/10 rounded-2xl p-8 text-center cursor-pointer hover:bg-black/[0.02] transition-colors relative overflow-hidden group min-h-[200px] flex flex-col items-center justify-center"
        >
          {formData.banner_url ? (
            <>
              <img src={formData.banner_url} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                <p className="text-white font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Change Image
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 font-medium">Click or drag to upload banner</p>
              <p className="text-xs text-slate-500 mt-1">Recommended: 1920×600px, Max size: 5MB</p>
            </>
          )}
        </div>
      </div>

      {/* Capacity & Waitlist */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Capacity</h3>
        <div>
          <label className="text-sm text-slate-600 mb-1.5 block">Max Capacity</label>
          <Input 
            type="number" 
            value={formData.max_capacity || ""} 
            onChange={(e) => handleChange("max_capacity", parseInt(e.target.value) || 0)}
            className="bg-black/5 border-black/5 text-slate-900 rounded-xl w-48" 
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <label className="text-sm text-slate-600">Enable Waitlist</label>
            <p className="text-xs text-slate-400 mt-0.5">Show waitlist CTA when capacity is full</p>
          </div>
          <Switch 
            checked={formData.enable_waitlist || false} 
            onCheckedChange={(checked) => handleChange("enable_waitlist", checked)}
          />
        </div>
      </div>

      {/* Advanced */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Advanced Settings</h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <label className="text-sm text-slate-600">Check-in Confirmation Dialog</label>
            <p className="text-xs text-slate-400 mt-0.5">Ask for confirmation before marking checked in</p>
          </div>
          <Switch 
            checked={formData.checkin_confirmation ?? true} 
            onCheckedChange={(checked) => handleChange("checkin_confirmation", checked)}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <label className="text-sm text-slate-600">Enable Check-out Scanning</label>
            <p className="text-xs text-slate-400 mt-0.5">Allow scanning QR codes to record departure</p>
          </div>
          <Switch 
            checked={formData.enable_checkout || false} 
            onCheckedChange={(checked) => handleChange("enable_checkout", checked)}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <label className="text-sm text-slate-600">Enable Remote Printing</label>
            <p className="text-xs text-slate-400 mt-0.5">Allow remote printers for on-site badge printing</p>
          </div>
          <Switch 
            checked={formData.enable_remote_printing || false} 
            onCheckedChange={(checked) => handleChange("enable_remote_printing", checked)}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <label className="text-sm text-slate-600">Display Speakers List</label>
            <p className="text-xs text-slate-400 mt-0.5">Show the speakers section on the public event page</p>
          </div>
          <Switch 
            checked={formData.show_speakers ?? true} 
            onCheckedChange={(checked) => handleChange("show_speakers", checked)}
          />
        </div>
      </div>

      <Separator className="bg-black/[0.08]" />

      {/* Actions */}
      <div className="flex justify-between">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm disabled:opacity-70"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-medium">
            <Archive className="w-4 h-4" /> Archive
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all font-medium">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
