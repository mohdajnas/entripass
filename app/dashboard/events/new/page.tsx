"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Calendar, 
  Ticket as TicketIcon, 
  FileText, 
  Trash2, 
  Plus, 
  Loader2 
} from "lucide-react";
import { createEvent, TicketInput, FormFieldInput } from "./actions";

const steps = [
  { label: "Basic Info", icon: Calendar },
  { label: "Tickets", icon: TicketIcon },
  { label: "Form Fields", icon: FileText },
];

export default function NewEventPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 0: Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState<number | "">("");

  // Step 1: Ticket Types
  const [tickets, setTickets] = useState<TicketInput[]>([
    { name: "General Admission", price: 0, capacity: 100, maxPerOrder: 5 }
  ]);

  // Step 2: Custom Registration Fields
  const [customFields, setCustomFields] = useState<FormFieldInput[]>([]);

  // Helpers for Ticket management
  const addTicketType = () => {
    setTickets([
      ...tickets,
      { name: "VIP Ticket", price: 999, capacity: 20, maxPerOrder: 2 }
    ]);
  };

  const removeTicketType = (index: number) => {
    setTickets(tickets.filter((_, idx) => idx !== index));
  };

  const updateTicketType = (index: number, key: keyof TicketInput, value: string | number) => {
    setTickets(tickets.map((t, idx) => {
      if (idx === index) {
        return { ...t, [key]: value };
      }
      return t;
    }));
  };

  // Helpers for Custom Form Fields
  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { fieldType: "text", label: "Company Name", placeholder: "e.g. Acme Corp", isRequired: false }
    ]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const updateCustomField = (index: number, key: keyof FormFieldInput, value: string | boolean) => {
    setCustomFields(customFields.map((f, idx) => {
      if (idx === index) {
        return { ...f, [key]: value };
      }
      return f;
    }));
  };

  const handleNext = () => {
    setErrorMessage("");
    if (step === 0) {
      if (!title.trim()) {
        setErrorMessage("Event title is required.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (tickets.length === 0) {
        setErrorMessage("You must add at least one ticket type.");
        return;
      }
      // Validate ticket details
      for (const t of tickets) {
        if (!t.name.trim()) {
          setErrorMessage("All ticket types must have a name.");
          return;
        }
        if (t.price < 0 || t.capacity <= 0 || t.maxPerOrder <= 0) {
          setErrorMessage("Ticket price, capacity, and max per order must be valid positive values.");
          return;
        }
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    // Validate form fields
    for (const f of customFields) {
      if (!f.label.trim()) {
        setErrorMessage("All custom form fields must have a label.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await createEvent({
        title,
        description,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        venue: isOnline ? "Online" : venue || undefined,
        mapLink: isOnline ? undefined : mapLink || undefined,
        isOnline,
        maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
        tickets,
        customFields,
      });

      if (res.success) {
        router.push("/dashboard");
      } else {
        setErrorMessage(res.error || "An error occurred while creating the event.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Create New Event</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Set up your event details, tickets, and custom registration fields</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3 flex-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border transition-all ${
              i < step 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : i === step 
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-md shadow-emerald-500/10" 
                  : "bg-slate-100 text-slate-400 border-slate-200"
            }`}>
              {i < step ? <Check className="w-4 h-4 stroke-[3px]" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? "text-slate-900 font-semibold" : "text-slate-400 font-medium"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? "bg-emerald-500/30" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Step content */}
      <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> Event Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Event Title *</label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DevConnect 2025" 
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell attendees about your event..." 
                  rows={4} 
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl resize-none focus-visible:ring-emerald-500/20" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Start Date & Time</label>
                  <Input 
                    type="datetime-local" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">End Date & Time</label>
                  <Input 
                    type="datetime-local" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <div>
                  <label className="text-sm font-semibold text-slate-800 block">Online Event</label>
                  <span className="text-xs text-slate-400">Attendees will join virtually</span>
                </div>
                <Switch 
                  checked={isOnline}
                  onCheckedChange={setIsOnline}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {!isOnline && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Venue Location</label>
                    <Input 
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. BKC Convention Centre, Mumbai" 
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Google Maps Location Link (URL or Embed Share Link)</label>
                    <Input 
                      value={mapLink}
                      onChange={(e) => setMapLink(e.target.value)}
                      placeholder="e.g. https://maps.google.com/?q=... or iframe src" 
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11" 
                      type="url"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Max Capacity</label>
                <Input 
                  type="number" 
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Unlimited" 
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl w-48 h-11" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Ticket Types */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TicketIcon className="w-5 h-5 text-emerald-600" /> Ticket Types
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Define registration options and pricing</p>
              </div>
              <button 
                type="button"
                onClick={addTicketType}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ticket
              </button>
            </div>

            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <div 
                  key={index}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 relative group"
                >
                  {tickets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketType(index)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Ticket Name</label>
                      <Input 
                        value={ticket.name}
                        onChange={(e) => updateTicketType(index, "name", e.target.value)}
                        placeholder="e.g. VIP Admission" 
                        className="bg-white border-slate-200 text-slate-900 rounded-xl h-10 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Price (INR)</label>
                      <Input 
                        type="number" 
                        value={ticket.price}
                        onChange={(e) => updateTicketType(index, "price", Number(e.target.value))}
                        placeholder="0 (Free)" 
                        className="bg-white border-slate-200 text-slate-900 rounded-xl h-10 text-sm" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Capacity</label>
                      <Input 
                        type="number" 
                        value={ticket.capacity}
                        onChange={(e) => updateTicketType(index, "capacity", Number(e.target.value))}
                        placeholder="100" 
                        className="bg-white border-slate-200 text-slate-900 rounded-xl h-10 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Max per Order</label>
                      <Input 
                        type="number" 
                        value={ticket.maxPerOrder}
                        onChange={(e) => updateTicketType(index, "maxPerOrder", Number(e.target.value))}
                        placeholder="5" 
                        className="bg-white border-slate-200 text-slate-900 rounded-xl h-10 text-sm" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Custom Registration Form Fields */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" /> Registration Form
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Collect attendee details during booking</p>
              </div>
              <button 
                type="button"
                onClick={addCustomField}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>

            {/* Static Default Fields */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Standard Fields</span>
              {["Full Name", "Email Address"].map((field) => (
                <div key={field} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700">{field}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-auto uppercase bg-slate-100 px-2 py-0.5 rounded-md">Required</span>
                </div>
              ))}
            </div>

            {/* Custom Interactive Fields */}
            {customFields.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Custom Fields</span>
                {customFields.map((field, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 relative group items-start sm:items-center"
                  >
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="absolute top-4 right-4 sm:static text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors sm:order-last"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Input 
                          value={field.label}
                          onChange={(e) => updateCustomField(index, "label", e.target.value)}
                          placeholder="Field Label (e.g. Age)" 
                          className="bg-white border-slate-200 text-slate-900 rounded-xl h-9 text-sm w-full" 
                        />
                      </div>
                      
                      <div>
                        <select
                          value={field.fieldType}
                          onChange={(e) => updateCustomField(index, "fieldType", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 text-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-9"
                        >
                          <option value="text">Text Input</option>
                          <option value="email">Email Address</option>
                          <option value="phone">Phone Number</option>
                          <option value="checkbox">Checkbox</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-1 mt-2 sm:mt-0">
                      <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Required</label>
                      <Switch 
                        checked={field.isRequired}
                        onCheckedChange={(checked) => updateCustomField(index, "isRequired", checked)}
                        className="scale-90 data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => step > 0 ? setStep(step - 1) : router.push("/dashboard")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? "Cancel" : "Back"}
        </button>
        
        {step < 2 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white font-semibold shadow-md shadow-emerald-500/10"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm text-white font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                Create Event <Check className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
