"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { mockTicketTypes as initialMockTicketTypes } from "@/lib/mock-data";
import { generateGoogleFontsUrl, GOOGLE_FONTS } from "@/lib/google-fonts";
import {
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Ticket as TicketIcon,
  Loader2,
  X,
  Calendar,
  DollarSign,
  Users,
  Image as ImageIcon,
  Move,
  Save,
  Palette,
  Type,
  Wand2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import {
  createTicketType,
  updateTicketType,
  deleteTicketType,
  toggleTicketVisibility,
  saveTicketDesign,
} from "./actions";
import { TICKET_TEMPLATES, TicketTemplate } from "@/lib/ticket-templates";

interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  capacity: number;
  sold: number;
  sale_start: string;
  sale_end: string;
  is_visible: boolean;
  max_per_order: number;
  sort_order: number;
}

interface SupabaseTicketTypeRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  capacity: number | null;
  sale_start: string;
  sale_end: string;
  is_visible: boolean;
  max_per_order: number | null;
  sort_order: number | null;
}

interface CanvasElement {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  visible: boolean;
}

interface SponsorLogoElement {
  id: string;
  name: string;
  logoUrl: string;
  x: number;
  y: number;
  width: number;
  visible: boolean;
}

interface TicketDesign {
  mode: "own" | "canvas"; // own = simple designer, canvas = structural presets & sponsors
  backgroundType: "gradient" | "image" | "color";
  backgroundValue: string;
  canvasFormat: "default" | "notch" | "badge" | "minimal";
  theme: "dark" | "light";
  elements: {
    name: CanvasElement;
    ticketId: CanvasElement;
    eventTitle: CanvasElement;
    venue: CanvasElement;
    dateTime: CanvasElement;
    qrCode: { x: number; y: number; size: number; visible: boolean };
  };
  sponsors: SponsorLogoElement[];
}

interface DBEventSponsor {
  id: string;
  name: string;
  logo_url: string;
}

const PRESET_GRADIENTS = [
  "bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950",
  "bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950",
  "bg-gradient-to-br from-rose-950 via-red-900 to-slate-950",
  "bg-gradient-to-br from-blue-950 via-slate-900 to-zinc-950",
  "bg-gradient-to-br from-slate-900 to-slate-950",
];


export default function TicketsPage() {
  const params = useParams();
  const eventId = params?.eventId as string;

  const [activeTab, setActiveTab] = useState<"types" | "designer">("types");
  const [designerMode, setDesignerMode] = useState<"own" | "canvas">("own");
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [eventSponsors, setEventSponsors] = useState<DBEventSponsor[]>([]);
  const [bgAspectRatio, setBgAspectRatio] = useState<number | null>(null);

  const updateImageAspectRatio = useCallback((src: string) => {
    if (typeof window === "undefined") return;
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setBgAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = src;
  }, []);

  // Modal States for Ticket Types
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [capacity, setCapacity] = useState("100");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");
  const [maxPerOrder, setMaxPerOrder] = useState("1");
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Designer States
  const [bgType, setBgType] = useState<"gradient" | "image" | "color">("gradient");
  const [bgValue, setBgValue] = useState(PRESET_GRADIENTS[0]);
  const [canvasFormat, setCanvasFormat] = useState<"default" | "notch" | "badge" | "minimal">("default");
  const [designTheme, setDesignTheme] = useState<"dark" | "light">("dark");
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  const selectGradient = useCallback((grad: string) => {
    setBgType("gradient");
    setBgValue(grad);
    setBgAspectRatio(null);
  }, [setBgType, setBgValue, setBgAspectRatio]);


  // Canvas Viewport & Panning States
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });

  // Drag Guides States
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [dragGuides, setDragGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] });

  // Drag States & Values
  const [activeDragElement, setActiveDragElement] = useState<string | null>(null);
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null);

  // Draggable Elements
  const [elements, setElements] = useState<TicketDesign["elements"]>({
    name: { x: 10, y: 35, fontSize: 16, fontFamily: "Inter", fontWeight: "800", fontStyle: "normal", color: "#ffffff", visible: false },
    ticketId: { x: 10, y: 55, fontSize: 11, fontFamily: "Fira Code", fontWeight: "400", fontStyle: "normal", color: "#a1a1aa", visible: false },
    eventTitle: { x: 10, y: 15, fontSize: 18, fontFamily: "Outfit", fontWeight: "700", fontStyle: "normal", color: "#ffffff", visible: false },
    venue: { x: 10, y: 72, fontSize: 11, fontFamily: "Inter", fontWeight: "400", fontStyle: "normal", color: "#d1d5db", visible: false },
    dateTime: { x: 10, y: 84, fontSize: 11, fontFamily: "Inter", fontWeight: "400", fontStyle: "normal", color: "#d1d5db", visible: false },
    qrCode: { x: 72, y: 22, size: 90, visible: false },
  });

  const [sponsors, setSponsors] = useState<SponsorLogoElement[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const sponsorFileInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const loadTicketTypes = useCallback(async () => {
    if (!eventId) return;

    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      setTickets(initialMockTicketTypes.filter((t) => t.event_id === eventId) as TicketType[]);
      setEventSponsors([
        { id: "mock-s1", name: "Google", logo_url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" },
        { id: "mock-s2", name: "Stripe", logo_url: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.png" },
      ]);
      
      const savedMock = localStorage.getItem(`mock_ticket_design_${eventId}`);
      if (savedMock) {
        try {
          const parsed: TicketDesign = JSON.parse(savedMock);
          setDesignerMode(parsed.mode || "own");
          setBgType(parsed.backgroundType || "gradient");
          setBgValue(parsed.backgroundValue || PRESET_GRADIENTS[0]);
          setCanvasFormat(parsed.canvasFormat || "default");
          setDesignTheme(parsed.theme || "dark");
          setElements(parsed.elements);
          setSponsors(parsed.sponsors || []);
          if (parsed.backgroundType === "image") {
            updateImageAspectRatio(parsed.backgroundValue);
          }
        } catch {}
      }
      setLoading(false);
      return;
    }

    const supabase = createClient();
    try {
      // Fetch Event details for design metadata
      const { data: eventData } = await supabase
        .from("events")
        .select("description")
        .eq("id", eventId)
        .single();

      if (eventData) {
        const rawDesc = eventData.description || "";
        const parts = rawDesc.split(" ||TICKET_DESIGN|| ");
        if (parts.length > 1) {
          try {
            const design: TicketDesign = JSON.parse(parts[1]);
            setDesignerMode(design.mode || "own");
            setBgType(design.backgroundType || "gradient");
            setBgValue(design.backgroundValue || PRESET_GRADIENTS[0]);
            setCanvasFormat(design.canvasFormat || "default");
            setDesignTheme(design.theme || "dark");
            setElements(design.elements);
            setSponsors(design.sponsors || []);
            if (design.backgroundType === "image") {
              updateImageAspectRatio(design.backgroundValue);
            }
          } catch (e) {
            console.error("Error parsing design template:", e);
          }
        }
      }

      // Fetch Sponsors
      const { data: sponsorsData } = await supabase
        .from("sponsors")
        .select("id, name, logo_url")
        .eq("event_id", eventId);
      
      if (sponsorsData) {
        setEventSponsors(sponsorsData);
      }

      // Fetch Ticket Types
      const { data: ticketTypesData, error: ticketTypesError } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });

      if (ticketTypesError) {
        throw ticketTypesError;
      }

      // Fetch guest counts
      const { data: guestsData, error: guestsError } = await supabase
        .from("guests")
        .select("ticket_type_id, status")
        .eq("event_id", eventId);

      if (guestsError) {
        throw guestsError;
      }

      const soldMap: Record<string, number> = {};
      guestsData?.forEach((g) => {
        if (g.ticket_type_id && g.status !== "cancelled") {
          soldMap[g.ticket_type_id] = (soldMap[g.ticket_type_id] || 0) + 1;
        }
      });

      if (ticketTypesData) {
        const formatted: TicketType[] = (ticketTypesData as SupabaseTicketTypeRow[]).map((t) => ({
          id: t.id,
          event_id: t.event_id,
          name: t.name,
          description: t.description,
          price: Number(t.price) || 0,
          currency: t.currency || "INR",
          capacity: t.capacity || 1000,
          sold: soldMap[t.id] || 0,
          sale_start: t.sale_start || new Date().toISOString(),
          sale_end: t.sale_end || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          is_visible: t.is_visible,
          max_per_order: t.max_per_order || 1,
          sort_order: t.sort_order || 0,
        }));
        setTickets(formatted);
      }
    } catch (err: unknown) {
      console.error("Error loading tickets:", err);
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      toast.error("Failed to load ticket types: " + message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTicketTypes();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTicketTypes]);

  const openModal = (ticket: TicketType | null = null) => {
    if (ticket) {
      setEditingTicket(ticket);
      setName(ticket.name);
      setDescription(ticket.description || "");
      setPrice(ticket.price.toString());
      setCapacity(ticket.capacity.toString());
      setSaleStart(new Date(ticket.sale_start).toISOString().slice(0, 16));
      setSaleEnd(new Date(ticket.sale_end).toISOString().slice(0, 16));
      setIsVisible(ticket.is_visible);
      setMaxPerOrder(ticket.max_per_order.toString());
    } else {
      setEditingTicket(null);
      setName("");
      setDescription("");
      setPrice("0");
      setCapacity("100");
      setSaleStart(new Date().toISOString().slice(0, 16));
      setSaleEnd(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16));
      setIsVisible(true);
      setMaxPerOrder("10");
    }
    setIsModalOpen(true);
  };

  // Form Submission for Ticket Type CRUD
  const handleSubmitTicketType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a ticket name");
      return;
    }
    setIsSubmitting(true);

    const ticketInput = {
      name,
      description: description || null,
      price: Number(price) || 0,
      capacity: Number(capacity) || 100,
      sale_start: new Date(saleStart).toISOString(),
      sale_end: new Date(saleEnd).toISOString(),
      max_per_order: Number(maxPerOrder) || 1,
      is_visible: isVisible,
      sort_order: editingTicket ? editingTicket.sort_order : tickets.length,
    };

    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      if (editingTicket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === editingTicket.id ? { ...t, ...ticketInput } : t))
        );
        toast.success("Ticket type updated successfully (mock mode)");
      } else {
        const newTicket: TicketType = {
          id: `tkt-mock-${Date.now()}`,
          event_id: eventId,
          sold: 0,
          currency: "INR",
          ...ticketInput,
        };
        setTickets((prev) => [...prev, newTicket]);
        toast.success("Ticket type added successfully (mock mode)");
      }
      setIsModalOpen(false);
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingTicket) {
        const res = await updateTicketType(editingTicket.id, ticketInput);
        if (res.success) {
          toast.success("Ticket type updated successfully");
          loadTicketTypes();
          setIsModalOpen(false);
        } else {
          toast.error("Failed to update ticket type: " + res.error);
        }
      } else {
        const res = await createTicketType(eventId, ticketInput);
        if (res.success) {
          toast.success("Ticket type created successfully");
          loadTicketTypes();
          setIsModalOpen(false);
        } else {
          toast.error("Failed to create ticket type: " + res.error);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      toast.error("An error occurred: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async (ticket: TicketType) => {
    const nextVal = !ticket.is_visible;
    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";

    if (isMock) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, is_visible: nextVal } : t))
      );
      toast.success(`Ticket is now ${nextVal ? "visible" : "hidden"}`);
      return;
    }

    const res = await toggleTicketVisibility(ticket.id, nextVal);
    if (res.success) {
      toast.success(`Ticket is now ${nextVal ? "visible" : "hidden"}`);
      loadTicketTypes();
    } else {
      toast.error("Failed to change visibility: " + res.error);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket type? This action cannot be undone.")) {
      return;
    }

    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      toast.success("Ticket type deleted");
      return;
    }

    const res = await deleteTicketType(ticketId);
    if (res.success) {
      toast.success("Ticket type deleted");
      loadTicketTypes();
    } else {
      toast.error("Failed to delete ticket type: " + res.error);
    }
  };

  // =========================================================================
  // INTERACTIVE DESIGNER DRAGGING & PANNING LOGIC
  // =========================================================================
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeDragElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    let xPercent = Math.round((xPx / rect.width) * 100);
    let yPercent = Math.round((yPx / rect.height) * 100);

    xPercent = Math.max(0, Math.min(95, xPercent));
    yPercent = Math.max(0, Math.min(95, yPercent));

    if (snapToGuides) {
      const snapThreshold = 2; // 2%
      const xTargets = [0, 50, 100];
      const yTargets = [0, 50, 100];

      Object.entries(elements).forEach(([key, el]) => {
        if (key !== activeDragElement && el.visible) {
          xTargets.push(el.x);
          yTargets.push(el.y);
        }
      });
      sponsors.forEach(s => {
        if (`sponsor-${s.id}` !== activeDragElement) {
          xTargets.push(s.x);
          yTargets.push(s.y);
        }
      });

      let snappedX: number[] = [];
      let snappedY: number[] = [];

      for (const t of xTargets) {
        if (Math.abs(xPercent - t) <= snapThreshold) {
          xPercent = t;
          snappedX = [t];
          break;
        }
      }
      for (const t of yTargets) {
        if (Math.abs(yPercent - t) <= snapThreshold) {
          yPercent = t;
          snappedY = [t];
          break;
        }
      }

      setDragGuides({ vertical: snappedX, horizontal: snappedY });
    }

    if (activeDragElement.startsWith("sponsor-")) {
      const sponsorId = activeDragElement.replace("sponsor-", "");
      setSponsors((prev) =>
        prev.map((s) => (s.id === sponsorId ? { ...s, x: xPercent, y: yPercent } : s))
      );
    } else if (activeDragElement === "qrCode") {
      setElements((prev) => ({
        ...prev,
        qrCode: { ...prev.qrCode, x: xPercent, y: yPercent },
      }));
    } else {
      const key = activeDragElement as keyof TicketDesign["elements"];
      if (elements[key]) {
        setElements((prev) => ({
          ...prev,
          [key]: { ...prev[key], x: xPercent, y: yPercent },
        }));
      }
    }
  };

  const handleDragStart = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDragElement(key);
    if (!key.startsWith("sponsor-")) {
      setSelectedElementKey(key);
    }
  };

  const handleDragEnd = () => {
    setActiveDragElement(null);
    setDragGuides({ vertical: [], horizontal: [] });
  };

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPanPos({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });
  };

  const handleViewportMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setCanvasPan({
        x: e.clientX - startPanPos.x,
        y: e.clientY - startPanPos.y
      });
    } else if (activeDragElement) {
      handleCanvasMouseMove(e);
    }
  };

  const handleViewportMouseUp = () => {
    setIsPanning(false);
    handleDragEnd();
  };


  // Background Upload
  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBg(true);
    const toastId = toast.loading("Uploading background image...");
    
    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setBgType("image");
          setBgValue(base64);
          updateImageAspectRatio(base64);
          toast.success("Background loaded locally (mock mode)", { id: toastId });
        }
        setIsUploadingBg(false);
      };
      reader.onerror = () => setIsUploadingBg(false);
      reader.readAsDataURL(file);
      return;
    }

    const supabase = createClient();
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${eventId}/ticket-bg-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("ticket-designs")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.warn("Storage upload failed, falling back to base64:", uploadError.message);
        if (file.size > 800 * 1024) {
          toast.error("Storage upload failed & file is too large for database fallback (>800KB).", { id: toastId });
          setIsUploadingBg(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (base64) {
            setBgType("image");
            setBgValue(base64);
            updateImageAspectRatio(base64);
            toast.success("Uploaded locally (base64 database fallback)", { id: toastId });
          }
          setIsUploadingBg(false);
        };
        reader.onerror = () => setIsUploadingBg(false);
        reader.readAsDataURL(file);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("ticket-designs")
        .getPublicUrl(filePath);

      setBgType("image");
      setBgValue(publicUrl);
      updateImageAspectRatio(publicUrl);
      toast.success("Background uploaded to Supabase Storage!", { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      toast.error("Upload error. Loaded local copy instead.", { id: toastId });
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setBgType("image");
          setBgValue(base64);
          updateImageAspectRatio(base64);
        }
        setIsUploadingBg(false);
      };
      reader.onerror = () => setIsUploadingBg(false);
      reader.readAsDataURL(file);
    }
    setIsUploadingBg(false);
  };

  // Add Sponsor Logo to canvas
  const handleAddSponsorToCanvas = (sponsor: DBEventSponsor) => {
    // Check if already on canvas
    if (sponsors.some((s) => s.id === sponsor.id)) {
      toast.error(`${sponsor.name} logo is already placed on the canvas`);
      return;
    }

    const newSponsorEl: SponsorLogoElement = {
      id: sponsor.id,
      name: sponsor.name,
      logoUrl: sponsor.logo_url,
      x: 45,
      y: 75,
      width: 60,
      visible: true,
    };
    setSponsors((prev) => [...prev, newSponsorEl]);
    toast.success(`Added ${sponsor.name} logo to canvas. Drag to arrange it!`);
  };

  const handleRemoveSponsorFromCanvas = (id: string) => {
    setSponsors((prev) => prev.filter((s) => s.id !== id));
  };

  // Upload Custom Sponsor Logo directly to canvas (FileReader fallback)
  const handleUploadCustomSponsorLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const newSponsorEl: SponsorLogoElement = {
          id: `custom-sponsor-${Date.now()}`,
          name: file.name.split(".")[0],
          logoUrl: base64,
          x: 45,
          y: 75,
          width: 60,
          visible: true,
        };
        setSponsors((prev) => [...prev, newSponsorEl]);
        toast.success("Added custom sponsor logo to canvas!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Save full design configuration
  const handleSaveDesign = async () => {
    setIsSavingDesign(true);
    const design: TicketDesign = {
      mode: designerMode,
      backgroundType: bgType,
      backgroundValue: bgValue,
      canvasFormat: canvasFormat,
      theme: designTheme,
      elements,
      sponsors,
    };

    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      localStorage.setItem(`mock_ticket_design_${eventId}`, JSON.stringify(design));
      toast.success("Ticket design saved successfully (mock mode)");
      setIsSavingDesign(false);
      return;
    }

    try {
      const res = await saveTicketDesign(eventId, design);
      if (res.success) {
        toast.success("Ticket template design saved successfully!");
      } else {
        toast.error("Failed to save design: " + res.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      toast.error("An error occurred: " + message);
    } finally {
      setIsSavingDesign(false);
    }
  };

  const applyTemplate = (template: TicketTemplate) => {
    // Preserve existing elements, but update specific styles based on template
    setElements(prev => {
      const next = { ...prev };
      // Copy all fields from template, preserving user-added custom ones
      for (const [key, val] of Object.entries(template.elements)) {
        if ((next as any)[key]) {
          (next as any)[key] = {
            ...(next as any)[key],
            ...val
          };
        }
      }
      return next;
    });

    setDesignerMode(template.mode);
    setCanvasFormat(template.canvasFormat);
    setBgType(template.backgroundType);
    setBgValue(template.backgroundValue);
    toast.success(`Applied "${template.name}" template!`);
  };

  // Style adjustments for selected element
  const updateSelectedElementStyle = (field: keyof CanvasElement, val: string | number | boolean) => {
    if (!selectedElementKey || selectedElementKey === "qrCode") return;
    setElements((prev) => {
      const current = prev[selectedElementKey as keyof typeof elements] as CanvasElement;
      return {
        ...prev,
        [selectedElementKey]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const getSelectedElement = (): CanvasElement | null => {
    if (!selectedElementKey || selectedElementKey === "qrCode") return null;
    return elements[selectedElementKey as keyof typeof elements] as CanvasElement;
  };

  const selectedEl = getSelectedElement();

  const googleFontsUrl = useMemo(() => {
    const fontsToLoad = Object.values(elements)
      .filter((el: any) => el.visible && el.fontFamily)
      .map((el: any) => ({
        family: el.fontFamily,
        weight: String(el.fontWeight || "400"),
        style: el.fontStyle || "normal",
      }));
    return generateGoogleFontsUrl(fontsToLoad);
  }, [elements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Dynamic Fonts Import */}
      {googleFontsUrl && (
        <style dangerouslySetInnerHTML={{__html: `@import url('${googleFontsUrl}');`}} />
      )}

      {/* Header and Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets Settings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage ticket types and design passes dynamically.
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/50 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("types")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "types"
                ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Ticket Types
          </button>
          <button
            onClick={() => setActiveTab("designer")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "designer"
                ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Ticket Designer
          </button>
        </div>
      </div>

      {activeTab === "types" && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Classes & Allocations</h2>
            <button
              onClick={() => openModal(null)}
              className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Ticket Type
            </button>
          </div>

          {/* Ticket List */}
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-500">
                <TicketIcon className="w-10 h-10 mx-auto mb-3 text-slate-400 opacity-60" />
                <p className="text-sm">No ticket types created for this event yet.</p>
                <button
                  onClick={() => openModal(null)}
                  className="mt-3 text-xs font-semibold text-emerald-500 hover:underline"
                >
                  Create your first ticket type
                </button>
              </div>
            ) : (
              tickets.map((ticket, i) => {
                const capacityLimit = ticket.capacity || 1;
                const soldPercent = Math.min(100, Math.round((ticket.sold / capacityLimit) * 100));
                return (
                  <div
                    key={ticket.id}
                    className={`glass-card p-5 border-l-4 transition-all ${
                      ticket.is_visible
                        ? "border-l-emerald-500"
                        : "border-l-slate-400/50 opacity-80"
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-black/5 flex items-center justify-center shadow-sm">
                              <TicketIcon className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {ticket.name}
                                {!ticket.is_visible && (
                                  <Badge className="bg-slate-100 text-slate-500 border border-slate-200/50 text-[10px] px-1.5 py-0.5 rounded font-normal">
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Hidden
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">{ticket.description || "No description provided."}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleVisibility(ticket)}
                              title={ticket.is_visible ? "Hide Ticket Type" : "Make Ticket Visible"}
                              className="p-2 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                            >
                              {ticket.is_visible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            <button
                              onClick={() => openModal(ticket)}
                              title="Edit Ticket Details"
                              className="p-2 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ticket.id)}
                              title="Delete Ticket Type"
                              className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                              <DollarSign className="w-3 h-3 text-slate-400" /> Price
                            </p>
                            <p className="text-md font-bold text-slate-900 font-mono mt-0.5">
                              {ticket.price === 0 ? (
                                <span className="text-emerald-500">Free</span>
                              ) : (
                                `₹${ticket.price.toLocaleString("en-IN")}`
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                              <Users className="w-3 h-3 text-slate-400" /> Sold / Capacity
                            </p>
                            <p className="text-md font-bold text-slate-900 mt-0.5">
                              {ticket.sold}
                              <span className="text-xs text-slate-400 font-normal">
                                {" "}
                                / {ticket.capacity}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                              Max per Order
                            </p>
                            <p className="text-md font-bold text-slate-900 mt-0.5">{ticket.max_per_order}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                              <Calendar className="w-3 h-3 text-slate-400" /> Sale Period
                            </p>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                              {new Date(ticket.sale_start).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                              {" → "}
                              {new Date(ticket.sale_end).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-slate-400">Total Allocations</span>
                            <span className="text-[10px] font-semibold text-slate-500">{soldPercent}% sold</span>
                          </div>
                          <Progress
                            value={soldPercent}
                            className="h-1.5 bg-black/5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* DUAL WORKSPACE TICKET DESIGNER */}
      {/* ========================================================================= */}
      {activeTab === "designer" && (
        <div className="space-y-6">
          {/* Workspace Mode Selection */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/50 w-full md:w-fit">
            <button
              onClick={() => {
                setDesignerMode("own");
                setCanvasFormat("minimal");
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                designerMode === "own"
                  ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Type className="w-4 h-4 text-emerald-500" />
              1. Own Designer (Simple Text Only)
            </button>
            <button
              onClick={() => {
                setDesignerMode("canvas");
                setCanvasFormat("default");
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                designerMode === "canvas"
                  ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Palette className="w-4 h-4 text-emerald-500" />
              2. Structural Designer Canvas
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-1 space-y-5">
              
              {/* Quick Templates Card */}
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <Wand2 className="w-4 h-4 text-purple-500" /> Quick Templates
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TICKET_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors text-left cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-slate-700">{template.name}</span>
                      <span className="text-[9px] font-medium text-slate-500 uppercase">{template.canvasFormat} format</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 space-y-5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-500" /> Design Settings
                </h3>

                {/* Plain upload description for both */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Plain Background image
                  </label>
                  <button
                    onClick={() => bgFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-black/5 hover:bg-black/10 border border-transparent rounded-xl transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    {bgType === "image" ? "Change Image" : "Upload Plain Background"}
                  </button>
                  <input
                    type="file"
                    ref={bgFileInputRef}
                    onChange={handleBgImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {designerMode === "canvas" && (bgType === "gradient" || bgType === "color") && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 block mb-1">Preset Gradient or Custom Color</span>
                      <div className="flex gap-2 items-center flex-wrap">
                        {PRESET_GRADIENTS.map((grad, idx) => (
                          <button
                            key={idx}
                            onClick={() => { selectGradient(grad); setBgAspectRatio(null); }}
                            className={`w-7 h-7 rounded-lg border transition-all cursor-pointer ${
                              bgValue === grad ? "border-emerald-500 scale-105" : "border-transparent"
                            } ${grad}`}
                          />
                        ))}
                        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
                        <div className="relative">
                          <input
                            type="color"
                            value={bgType === "color" ? bgValue : "#000000"}
                            onChange={(e) => {
                              setBgType("color");
                              setBgValue(e.target.value);
                              setBgAspectRatio(null);
                            }}
                            className="w-8 h-8 p-0 border-0 rounded-lg cursor-pointer overflow-hidden opacity-0 absolute inset-0"
                          />
                          <div
                            className={`w-7 h-7 rounded-lg border transition-all pointer-events-none flex items-center justify-center ${
                              bgType === "color" ? "border-emerald-500 scale-105" : "border-slate-300"
                            }`}
                            style={{ backgroundColor: bgType === "color" ? bgValue : "#e2e8f0" }}
                          >
                            <Palette className="w-3 h-3 text-slate-600 mix-blend-difference" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Canvas structures - Mode 2 Only */}
                {designerMode === "canvas" && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Ticket Shape Structures & Cuts
                    </label>
                    <select
                      value={canvasFormat}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCanvasFormat(e.target.value as TicketDesign["canvasFormat"])}
                      className="w-full p-2 bg-black/5 border border-transparent text-xs text-slate-800 rounded-xl focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                    >
                      <option value="default">Standard Rectangular Card</option>
                      <option value="notch">Double Notch Ticket (Circular Cuts)</option>
                      <option value="badge">Vertical Conference Badge (Lanyard Cut)</option>
                      <option value="minimal">Minimalist Dividers Layout</option>
                    </select>
                  </div>
                )}

                {/* AVAILABLE PLACEHOLDERS */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Available Placeholders
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(elements) as Array<keyof TicketDesign["elements"]>).map((key) => {
                      const isVisible = elements[key].visible;
                      const isSelected = selectedElementKey === key;
                      const label = key === "qrCode" ? "QR Code" : key.replace(/([A-Z])/g, " $1").trim();
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            if (!isVisible) {
                              setElements((prev) => ({ ...prev, [key]: { ...prev[key], visible: true } }));
                            }
                            setSelectedElementKey(key);
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                              : isVisible
                                ? "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 shadow-sm"
                                : "bg-black/5 border-transparent text-slate-500 hover:bg-black/10"
                          }`}
                        >
                          {isVisible ? "" : "+ "}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TEXT FIELDS FORMATTER (For both modes) */}
                {selectedElementKey && selectedElementKey !== "qrCode" && selectedEl && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Format: <span className="text-emerald-500 capitalize">{selectedElementKey.replace(/([A-Z])/g, " $1")}</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-slate-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEl.visible}
                          onChange={(e) => updateSelectedElementStyle("visible", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
                        />
                        Show
                      </label>
                    </div>

                    {selectedEl.visible && (
                      <div className="space-y-2.5">
                        {/* Font selection using Google Fonts */}
                        <div className="grid grid-cols-1 gap-3">
                          {/* Font Family */}
                          <div>
                            <span className="text-[9px] text-slate-400 block font-medium">Font Family</span>
                            <select
                              value={selectedEl.fontFamily}
                              onChange={(e) => {
                                const newFont = GOOGLE_FONTS.find(f => f.family === e.target.value);
                                updateSelectedElementStyle("fontFamily", e.target.value);
                                if (newFont) {
                                  // automatically select regular 400 as default on change
                                  const defaultVariant = newFont.variants.find(v => v.weight === "400" && v.style === "normal") || newFont.variants[0];
                                  updateSelectedElementStyle("fontWeight", defaultVariant.weight);
                                  updateSelectedElementStyle("fontStyle", defaultVariant.style);
                                }
                              }}
                              className="w-full mt-0.5 p-1.5 bg-black/5 border border-transparent text-xs text-slate-800 rounded-lg focus:outline-none cursor-pointer"
                            >
                              {GOOGLE_FONTS.map((font) => (
                                <option key={font.family} value={font.family}>
                                  {font.family}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Font Variant */}
                            <div>
                              <span className="text-[9px] text-slate-400 block font-medium">Font Variant</span>
                              <select
                                value={`${selectedEl.fontWeight}|${selectedEl.fontStyle}`}
                                onChange={(e) => {
                                  const [weight, style] = e.target.value.split("|");
                                  updateSelectedElementStyle("fontWeight", weight);
                                  updateSelectedElementStyle("fontStyle", style);
                                }}
                                className="w-full mt-0.5 p-1.5 bg-black/5 border border-transparent text-xs text-slate-800 rounded-lg focus:outline-none cursor-pointer"
                              >
                                {GOOGLE_FONTS.find(f => f.family === selectedEl.fontFamily)?.variants.map((v) => (
                                  <option key={`${v.weight}|${v.style}`} value={`${v.weight}|${v.style}`}>
                                    {v.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Font Size */}
                            <div>
                              <span className="text-[9px] text-slate-400 block font-medium">Font Size</span>
                              <input
                                type="number"
                                min="9"
                                max="36"
                                value={selectedEl.fontSize}
                                onChange={(e) => updateSelectedElementStyle("fontSize", Number(e.target.value) || 12)}
                                className="w-full mt-0.5 p-1.5 bg-black/5 border border-transparent text-xs text-slate-800 rounded-lg focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Color Selector */}
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Text Color</span>
                          <div className="flex gap-2 items-center mt-1">
                            <input
                              type="color"
                              value={selectedEl.color}
                              onChange={(e) => updateSelectedElementStyle("color", e.target.value)}
                              className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                            />
                            <Input
                              value={selectedEl.color}
                              onChange={(e) => updateSelectedElementStyle("color", e.target.value)}
                              className="h-8 bg-black/5 border-transparent focus-visible:ring-emerald-500 text-xs font-mono font-bold rounded-lg flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SPONSOR LOGOS DRAG INCLUSION - Mode 2 Only */}
                {designerMode === "canvas" && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Sponsor Logos Overlay
                    </label>

                    {/* DB sponsors loader */}
                    {eventSponsors.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-400 block">Click to place brand logo on ticket:</span>
                        <div className="flex flex-wrap gap-2">
                          {eventSponsors.map((s) => {
                            const isAdded = sponsors.some((el) => el.id === s.id);
                            return (
                              <button
                                key={s.id}
                                disabled={isAdded}
                                onClick={() => handleAddSponsorToCanvas(s)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                  isAdded
                                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600"
                                }`}
                              >
                                + {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 block italic">
                        No event sponsors declared.
                      </span>
                    )}

                    {/* Custom Sponsor Image Upload */}
                    <div className="pt-1.5">
                      <button
                        onClick={() => sponsorFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-slate-600 bg-black/5 hover:bg-black/10 rounded-lg border border-transparent transition-all cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                        Upload custom sponsor PNG
                      </button>
                      <input
                        type="file"
                        ref={sponsorFileInputRef}
                        onChange={handleUploadCustomSponsorLogo}
                        accept="image/png"
                        className="hidden"
                      />
                    </div>

                    {/* Placed sponsor list with size controls */}
                    {sponsors.length > 0 && (
                      <div className="space-y-2 pt-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 mt-2">
                        <span className="text-[9px] font-bold text-slate-500 block uppercase">Placed Sponsors Sizes</span>
                        {sponsors.map((s) => (
                          <div key={s.id} className="flex justify-between items-center gap-2 text-xs border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                            <span className="font-semibold text-slate-700 truncate max-w-[80px]">{s.name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-400">Width:</span>
                              <input
                                type="number"
                                min="20"
                                max="150"
                                value={s.width}
                                onChange={(e) =>
                                  setSponsors((prev) =>
                                    prev.map((el) => (el.id === s.id ? { ...el, width: Number(e.target.value) || 40 } : el))
                                  )
                                }
                                className="w-12 p-0.5 bg-black/5 text-center text-xs rounded"
                              />
                              <button
                                onClick={() => handleRemoveSponsorFromCanvas(s.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveDesign}
                disabled={isSavingDesign}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSavingDesign ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Custom Template
              </button>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Move className="w-3.5 h-3.5 text-emerald-500" /> Click on elements to select and format. Drag to rearrange them.
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={snapToGuides} 
                        onChange={(e) => setSnapToGuides(e.target.checked)} 
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      Snap Guides
                    </label>
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-transparent text-[10px] font-bold">
                      {designerMode === "own" ? "Own Simple Designer" : "Canvas Preset Cutout"}
                    </Badge>
                  </div>
                </div>

                {/* Viewport Container with Rulers */}
                <div 
                  className="w-full h-[600px] border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex flex-col"
                >
                  {/* Top Ruler */}
                  <div className="h-6 w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 relative z-10 shrink-0"
                       style={{
                         backgroundImage: `linear-gradient(90deg, #cbd5e1 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
                         backgroundSize: `100px 100%, 10px 100%`,
                         backgroundPosition: `${canvasPan.x}px 0`
                       }}
                  ></div>

                  <div className="flex-1 flex overflow-hidden relative">
                    {/* Left Ruler */}
                    <div className="w-6 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 relative z-10 shrink-0"
                         style={{
                           backgroundImage: `linear-gradient(180deg, #cbd5e1 1px, transparent 1px), linear-gradient(180deg, #e2e8f0 1px, transparent 1px)`,
                           backgroundSize: `100% 100px, 100% 10px`,
                           backgroundPosition: `0 ${canvasPan.y}px`
                         }}
                    ></div>

                    {/* Draggable Viewport Canvas */}
                    <div 
                      className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-slate-950"
                      onMouseDown={handleViewportMouseDown}
                      onMouseMove={handleViewportMouseMove}
                      onMouseUp={handleViewportMouseUp}
                      onMouseLeave={handleViewportMouseUp}
                    >
                      <div
                        ref={canvasRef}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        className={`absolute select-none bg-cover bg-center ${
                          designerMode === "canvas" && bgType === "gradient" ? bgValue : ""
                        } ${
                          designerMode === "canvas"
                            ? `shadow-2xl overflow-hidden border border-slate-800/80 ${
                                canvasFormat === "notch" ? "rounded-xl" : canvasFormat === "badge" ? "rounded-2xl" : "rounded-3xl"
                              }`
                            : bgType === "image" 
                              ? "shadow-lg" 
                              : "bg-white border-2 border-dashed border-slate-300 shadow-sm"
                        }`}
                        style={{
                          transform: `translate(calc(40px + ${canvasPan.x}px), calc(40px + ${canvasPan.y}px))`,
                          width: designerMode === "canvas" ? (canvasFormat === "badge" ? "400px" : "600px") : "600px",
                          backgroundImage: bgType === "image" ? `url(${bgValue})` : undefined,
                          backgroundColor: bgType === "color" ? bgValue : undefined,
                          aspectRatio: bgType === "image" && bgAspectRatio ? String(bgAspectRatio) : undefined,
                          height: bgType === "image" && bgAspectRatio ? "auto" : (designerMode === "canvas" && canvasFormat === "badge" ? "450px" : "300px"),
                        }}
                      >
                  {/* Canvas Notch Cutouts Overlay - Notch Cut Preset */}
                  {designerMode === "canvas" && canvasFormat === "notch" && (
                    <>
                      {/* Left circular cutout notch */}
                      <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-800 z-10" />
                      {/* Right circular cutout notch */}
                      <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-800 z-10" />
                      {/* Dashed divider line across notches */}
                      <div className="absolute top-1/2 left-4 right-4 h-0 border-t border-dashed border-white/20 -translate-y-1/2 pointer-events-none" />
                    </>
                  )}

                  {/* Canvas Badge Cutouts Overlay - Vertical Badge Preset */}
                  {designerMode === "canvas" && canvasFormat === "badge" && (
                    <>
                      {/* Lanyard Hole Cutout Slot */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-800 z-10 flex items-center justify-center">
                        <div className="w-10 h-1 bg-slate-300/40 rounded-full" />
                      </div>
                    </>
                  )}

                  {/* Visual overlay */}
                  <div className={`absolute inset-0 bg-white/[0.02] ${designerMode === "canvas" && bgType === "gradient" ? "backdrop-blur-[0.5px]" : ""}`} />

                  {/* Uploading loading overlay */}
                  {isUploadingBg && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-2 z-30 transition-all">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                      <p className="text-xs font-semibold text-emerald-300">Uploading template image...</p>
                    </div>
                  )}

                  {/* 1. DRAGGABLE: Event Title */}
                  {elements.eventTitle.visible && (
                    <div
                      onMouseDown={(e) => handleDragStart("eventTitle", e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementKey("eventTitle");
                      }}
                      className={`absolute cursor-grab active:cursor-grabbing p-1.5 border border-dashed rounded select-none ${
                        selectedElementKey === "eventTitle" ? "border-emerald-500 bg-emerald-500/15" : "border-transparent hover:border-white/30"
                      }`}
                      style={{
                        left: `${elements.eventTitle.x}%`,
                        top: `${elements.eventTitle.y}%`,
                        fontFamily: elements.eventTitle.fontFamily,
                        fontSize: `${elements.eventTitle.fontSize}px`,
                        fontWeight: elements.eventTitle.fontWeight || "bold",
                        fontStyle: elements.eventTitle.fontStyle || "normal",
                        color: elements.eventTitle.color,
                      }}
                    >
                      Techfed Kerala 2026
                    </div>
                  )}

                  {/* 2. DRAGGABLE: Attendee Name */}
                  {elements.name.visible && (
                    <div
                      onMouseDown={(e) => handleDragStart("name", e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementKey("name");
                      }}
                      className={`absolute cursor-grab active:cursor-grabbing p-1.5 border border-dashed rounded select-none ${
                        selectedElementKey === "name" ? "border-emerald-500 bg-emerald-500/15" : "border-transparent hover:border-white/30"
                      }`}
                      style={{
                        left: `${elements.name.x}%`,
                        top: `${elements.name.y}%`,
                        fontFamily: elements.name.fontFamily,
                        fontSize: `${elements.name.fontSize}px`,
                        fontWeight: elements.name.fontWeight || "extrabold",
                        fontStyle: elements.name.fontStyle || "normal",
                        color: elements.name.color,
                      }}
                    >
                      Arjun Mehta
                    </div>
                  )}

                  {/* 3. DRAGGABLE: Ticket ID */}
                  {elements.ticketId.visible && (
                    <div
                      onMouseDown={(e) => handleDragStart("ticketId", e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementKey("ticketId");
                      }}
                      className={`absolute cursor-grab active:cursor-grabbing p-1.5 border border-dashed rounded select-none ${
                        selectedElementKey === "ticketId" ? "border-emerald-500 bg-emerald-500/15" : "border-transparent hover:border-white/30"
                      }`}
                      style={{
                        left: `${elements.ticketId.x}%`,
                        top: `${elements.ticketId.y}%`,
                        fontFamily: elements.ticketId.fontFamily,
                        fontSize: `${elements.ticketId.fontSize}px`,
                        fontWeight: elements.ticketId.fontWeight || "normal",
                        fontStyle: elements.ticketId.fontStyle || "normal",
                        color: elements.ticketId.color,
                      }}
                    >
                      VIP PASS - QR_8A2FD
                    </div>
                  )}

                  {/* 4. DRAGGABLE: Venue Name */}
                  {elements.venue.visible && (
                    <div
                      onMouseDown={(e) => handleDragStart("venue", e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementKey("venue");
                      }}
                      className={`absolute cursor-grab active:cursor-grabbing p-1.5 border border-dashed rounded select-none ${
                        selectedElementKey === "venue" ? "border-emerald-500 bg-emerald-500/15" : "border-transparent hover:border-white/30"
                      }`}
                      style={{
                        left: `${elements.venue.x}%`,
                        top: `${elements.venue.y}%`,
                        fontFamily: elements.venue.fontFamily,
                        fontSize: `${elements.venue.fontSize}px`,
                        fontWeight: elements.venue.fontWeight || "normal",
                        fontStyle: elements.venue.fontStyle || "normal",
                        color: elements.venue.color,
                      }}
                    >
                      Kochi Infopark Auditorium
                    </div>
                  )}

                  {/* 5. DRAGGABLE: Date & Time */}
                  {elements.dateTime.visible && (
                    <div
                      onMouseDown={(e) => handleDragStart("dateTime", e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementKey("dateTime");
                      }}
                      className={`absolute cursor-grab active:cursor-grabbing p-1.5 border border-dashed rounded select-none ${
                        selectedElementKey === "dateTime" ? "border-emerald-500 bg-emerald-500/15" : "border-transparent hover:border-white/30"
                      }`}
                      style={{
                        left: `${elements.dateTime.x}%`,
                        top: `${elements.dateTime.y}%`,
                        fontFamily: elements.dateTime.fontFamily,
                        fontSize: `${elements.dateTime.fontSize}px`,
                        fontWeight: elements.dateTime.fontWeight || "normal",
                        fontStyle: elements.dateTime.fontStyle || "normal",
                        color: elements.dateTime.color,
                      }}
                    >
                      15 June • 10:00 AM
                    </div>
                  )}

                  {/* 6. DRAGGABLE: QR Code */}
                  {elements.qrCode.visible && (
                    <div
                      onMouseDown={(e) => handleDragStart("qrCode", e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementKey("qrCode");
                      }}
                      className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none border-2 border-dashed ${
                        selectedElementKey === "qrCode" ? "border-emerald-500" : "border-transparent hover:border-slate-400/50"
                      }`}
                      style={{
                        left: `${elements.qrCode.x}%`,
                        top: `${elements.qrCode.y}%`,
                        width: `${elements.qrCode.size}px`,
                        height: `${elements.qrCode.size}px`,
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-900/50" />
                      </div>
                    </div>
                  )}

                  {/* DRAGGABLE: SPONSOR LOGOS (Mode 2 only) */}
                  {designerMode === "canvas" &&
                    sponsors.map((s) => (
                      <div
                        key={s.id}
                        onMouseDown={(e) => handleDragStart(`sponsor-${s.id}`, e)}
                        className="absolute p-1 border border-dashed border-white/20 hover:border-emerald-500 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center group cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${s.x}%`,
                          top: `${s.y}%`,
                          width: `${s.width}px`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.logoUrl}
                          alt={s.name}
                          className="max-h-8 object-contain pointer-events-none select-none filter brightness-95"
                        />
                      </div>
                    ))}

                  {/* Drag Guides (Alignment Snapping) */}
                  {dragGuides.vertical.map((val, idx) => (
                    <div key={`v-${idx}`} className="absolute top-0 bottom-0 border-l border-emerald-500 z-50 pointer-events-none" style={{ left: `${val}%` }} />
                  ))}
                  {dragGuides.horizontal.map((val, idx) => (
                    <div key={`h-${idx}`} className="absolute left-0 right-0 border-t border-emerald-500 z-50 pointer-events-none" style={{ top: `${val}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Element quick control sliders */}
                {selectedElementKey === "qrCode" && (
                  <div className="mt-4 flex items-center gap-4 bg-white p-3 rounded-xl border w-full max-w-[340px] text-xs">
                    <span className="font-semibold text-slate-600">QR Size:</span>
                    <input
                      type="range"
                      min="60"
                      max="140"
                      value={elements.qrCode.size}
                      onChange={(e) =>
                        setElements((prev) => ({
                          ...prev,
                          qrCode: { ...prev.qrCode, size: Number(e.target.value) || 90 },
                        }))
                      }
                      className="flex-1 accent-emerald-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono font-bold">{elements.qrCode.size}px</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TICKET TYPE MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 font-serif">
                    {editingTicket ? "Edit Ticket Type" : "Add Ticket Type"}
                  </h3>
                  <p className="text-xs text-slate-500">Configure ticket availability, cost, and capacity</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitTicketType}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Ticket Class Name</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="General Admission, VIP Pass, Early Bird..."
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what access/benefits this ticket provides (e.g. food included, front-row seat)..."
                    rows={3}
                    className="w-full p-3 text-sm bg-black/5 border border-transparent rounded-xl focus:outline-none focus:border-emerald-500/50 transition-colors resize-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Price (INR)</label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="999"
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Capacity Limits</label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="100"
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Sale Start Date/Time</label>
                    <Input
                      type="datetime-local"
                      required
                      value={saleStart}
                      onChange={(e) => setSaleStart(e.target.value)}
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Sale End Date/Time</label>
                    <Input
                      type="datetime-local"
                      required
                      value={saleEnd}
                      onChange={(e) => setSaleEnd(e.target.value)}
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Max Passes per Order</label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={maxPerOrder}
                      onChange={(e) => setMaxPerOrder(e.target.value)}
                      placeholder="5"
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-black/5 p-3 rounded-xl border border-transparent mt-5 h-9">
                    <span className="text-xs font-semibold text-slate-600">Make Ticket Visible</span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setIsVisible(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 p-5 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTicket ? "Save Changes" : "Create Ticket Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
