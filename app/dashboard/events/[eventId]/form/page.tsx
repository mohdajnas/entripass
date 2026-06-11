"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Smartphone, 
  Monitor, 
  Copy, 
  Settings2, 
  Type, 
  Mail, 
  Phone, 
  List, 
  CheckSquare, 
  Calendar, 
  Upload, 
  AlignLeft, 
  Minus,
  X,
  Loader2,
  Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { addFormField, updateFormField, deleteFormField } from "./actions";

const fieldTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  email: Mail,
  phone: Phone,
  select: List,
  checkbox: CheckSquare,
  file: Upload,
  date: Calendar,
  textarea: AlignLeft,
  section: Minus,
};

interface FormField {
  id: string;
  field_type: string;
  label: string;
  placeholder: string | null;
  is_required: boolean;
  sort_order: number;
}

export default function FormBuilderPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // Edit Modal State
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState("text");
  const [editPlaceholder, setEditPlaceholder] = useState("");
  const [editRequired, setEditRequired] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const [modalError, setModalError] = useState("");

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(t => t + 1);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("form_fields")
          .select("id, field_type, label, placeholder, is_required, sort_order")
          .eq("event_id", eventId)
          .order("sort_order", { ascending: true });

        if (error) {
          console.error("Error loading fields:", error);
        } else if (data && active) {
          setFields(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [eventId, refreshTrigger]);

  const handleAddField = async () => {
    const nextSortOrder = fields.length > 0 ? Math.max(...fields.map(f => f.sort_order)) + 1 : 0;
    const newFieldData = {
      event_id: eventId,
      field_type: "text",
      label: `Custom Question ${fields.length + 1}`,
      placeholder: "Enter details",
      is_required: false,
      sort_order: nextSortOrder,
    };

    const res = await addFormField(newFieldData);
    if (res.success) {
      triggerRefresh();
    } else {
      alert("Failed to add field: " + res.error);
    }
  };

  const handleEditClick = (field: FormField) => {
    setEditingField(field);
    setEditLabel(field.label);
    setEditType(field.field_type);
    setEditPlaceholder(field.placeholder || "");
    setEditRequired(field.is_required);
    setModalError("");
  };

  const handleSaveFieldSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;

    setSavingField(true);
    setModalError("");

    const res = await updateFormField(editingField.id, eventId, {
      label: editLabel,
      field_type: editType,
      placeholder: editPlaceholder || undefined,
      is_required: editRequired,
    });

    if (res.success) {
      setEditingField(null);
      triggerRefresh();
    } else {
      setModalError(res.error || "Failed to save field settings.");
    }
    setSavingField(false);
  };

  const handleDeleteField = async (id: string) => {
    if (confirm("Are you sure you want to delete this form field?")) {
      const res = await deleteFormField(id, eventId);
      if (res.success) {
        triggerRefresh();
      } else {
        alert("Failed to delete field: " + res.error);
      }
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(url);
    alert("Public registration form link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Form Builder</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Build and customize your attendee registration forms</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all font-semibold"
          >
            <Copy className="w-4 h-4" /> Share Registration Form
          </button>
          <button 
            onClick={handleAddField}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white font-semibold shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" /> Add Custom Field
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Field list */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Form Fields ({fields.length})</h3>
          
          <div className="space-y-3">
            {fields.map((field, i) => {
              const Icon = fieldTypeIcons[field.field_type] || Type;
              const isLocked = field.label.toLowerCase() === "full name" || field.label.toLowerCase() === "email address";
              
              return (
                <div
                  key={field.id}
                  className="glass-card bg-white p-4 flex items-center gap-3 group border border-slate-200 shadow-sm rounded-xl animate-slide-up relative overflow-hidden"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <button className="text-slate-300 hover:text-slate-500 cursor-grab transition-colors flex-shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200/50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{field.label}</p>
                      {field.is_required && (
                        <Badge className="bg-red-50 text-red-600 border-red-100 text-[9px] px-1.5 font-bold uppercase tracking-wider">Required</Badge>
                      )}
                      {isLocked && (
                        <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[9px] px-1.5 font-semibold">Locked</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-semibold capitalize mt-0.5">{field.field_type} field</p>
                  </div>
                  
                  {!isLocked && (
                    <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(field)}
                        className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-800 border border-transparent hover:border-slate-150 transition-all"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 border border-transparent hover:border-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Live Preview</h3>
            <div className="flex gap-1 bg-white border border-slate-200 shadow-sm rounded-xl p-0.5">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 rounded-lg transition-all ${previewMode === "desktop" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 rounded-lg transition-all ${previewMode === "mobile" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`glass-card bg-white border border-slate-200 p-6 shadow-sm rounded-2xl mx-auto transition-all ${
            previewMode === "mobile" ? "max-w-[375px]" : "w-full"
          }`}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Event Registration</h3>
            <p className="text-xs text-slate-400 font-semibold mb-6">Fill out the form below to register</p>
            
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    {field.label}
                    {field.is_required && <span className="text-red-400 ml-1 font-bold">*</span>}
                  </label>
                  
                  {field.field_type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm text-slate-500 font-medium cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                      <span>I agree / Yes</span>
                    </label>
                  ) : (
                    <input
                      disabled
                      type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : "text"}
                      placeholder={field.placeholder || ""}
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-10 px-3 w-full text-xs font-medium cursor-not-allowed"
                    />
                  )}
                </div>
              ))}
              <button className="btn-gradient w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-500/10 mt-2">
                Register Now
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Field Configuration Settings Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingField(null)} />
          
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-scale-up">
            <button 
              onClick={() => setEditingField(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5">
              <Settings2 className="w-5 h-5 text-emerald-600" /> Field Configuration
            </h3>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveFieldSettings} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Question Label / Title *</label>
                <Input
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g. T-Shirt Size"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Field Input Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-11"
                >
                  <option value="text">Text Input</option>
                  <option value="email">Email Address</option>
                  <option value="phone">Phone Number</option>
                  <option value="checkbox">Checkbox (Yes/No)</option>
                </select>
              </div>

              {editType !== "checkbox" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Placeholder text (Optional)</label>
                  <Input
                    value={editPlaceholder}
                    onChange={(e) => setEditPlaceholder(e.target.value)}
                    placeholder="e.g. Enter your company name"
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
                  />
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <div>
                  <label className="text-sm font-semibold text-slate-800 block">Required Question</label>
                  <span className="text-xs text-slate-400">Must be filled before completing order</span>
                </div>
                <Switch 
                  checked={editRequired}
                  onCheckedChange={setEditRequired}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingField}
                className="btn-gradient w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
              >
                {savingField ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Save Settings <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
