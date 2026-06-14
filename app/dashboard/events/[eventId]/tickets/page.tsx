"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Wand2,
  ZoomIn,
  ZoomOut,
  Layers
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
import { CanvaConnectPanel } from "@/components/dashboard/CanvaConnectPanel";

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
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  rotation?: number;
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
    qrCode: { x: number; y: number; size: number; visible: boolean; rotation?: number; color?: string; bgColor?: string };
    [key: string]: any;
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
  const [zoomLevel, setZoomLevel] = useState(1);

  // Drag Guides States
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [dragGuides, setDragGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] });

  // Drag States & Values
  const [activeDragElement, setActiveDragElement] = useState<string | null>(null);
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null);

  // Draggable Elements
  const [elements, setElements] = useState<TicketDesign["elements"]>({
    name: { x: 10, y: 35, fontSize: 16, fontFamily: "Inter", fontWeight: "800", fontStyle: "normal", color: "#ffffff", visible: false, textTransform: "none", rotation: 0 },
    ticketId: { x: 10, y: 55, fontSize: 11, fontFamily: "Fira Code", fontWeight: "400", fontStyle: "normal", color: "#a1a1aa", visible: false, textTransform: "none", rotation: 0 },
    eventTitle: { x: 10, y: 15, fontSize: 18, fontFamily: "Outfit", fontWeight: "700", fontStyle: "normal", color: "#ffffff", visible: false, textTransform: "none", rotation: 0 },
    venue: { x: 10, y: 72, fontSize: 11, fontFamily: "Inter", fontWeight: "400", fontStyle: "normal", color: "#d1d5db", visible: false, textTransform: "none", rotation: 0 },
    dateTime: { x: 10, y: 84, fontSize: 11, fontFamily: "Inter", fontWeight: "400", fontStyle: "normal", color: "#d1d5db", visible: false, textTransform: "none", rotation: 0 },
    qrCode: { x: 72, y: 22, size: 90, visible: false, rotation: 0 },
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
    } else if (activeDragElement.startsWith("qrCode")) {
      setElements((prev) => ({
        ...prev,
        [activeDragElement]: { ...prev[activeDragElement], x: xPercent, y: yPercent },
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

  const handleDuplicateElement = (key: string) => {
    if (!elements[key]) return;
    const newKey = `${key.split('_')[0]}_dup_${Date.now()}`;
    const originalEl = elements[key] as CanvasElement;
    setElements(prev => ({
      ...prev,
      [newKey]: {
        ...originalEl,
        x: Math.min(95, originalEl.x + 2), // offset slightly
        y: Math.min(95, originalEl.y + 2),
      }
    }));
    setSelectedElementKey(newKey);
    toast.success("Element duplicated!");
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
      {/* FULLSCREEN PHOTOSHOP-STYLE TICKET DESIGNER */}
      {/* ========================================================================= */}
      {mounted && activeTab === "designer" && createPortal((
        <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col text-neutral-300 font-sans animate-fade-in overflow-hidden">
          {/* Dynamic Fonts Import inside the fixed portal */}
          {googleFontsUrl && (
            <style dangerouslySetInnerHTML={{__html: `@import url('${googleFontsUrl}');`}} />
          )}

          {/* TOP ACTION BAR */}
          <div className="h-14 border-b border-neutral-800/80 bg-neutral-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("types")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" /> Exit Editor
              </button>
              <div className="w-px h-6 bg-neutral-800" />
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => { setDesignerMode("own"); setCanvasFormat("minimal"); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                    designerMode === "own" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Type className="w-3 h-3 text-emerald-500" /> Simple Mode
                </button>
                <button
                  onClick={() => { setDesignerMode("canvas"); setCanvasFormat("default"); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                    designerMode === "canvas" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Palette className="w-3 h-3 text-emerald-500" /> Advanced Canvas
                </button>
              </div>
            </div>

            {/* Quick Templates Center Menu */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-neutral-500">Presets:</span>
              <div className="flex gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                {TICKET_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded transition-colors"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-neutral-300 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleSaveDesign}
                disabled={isSavingDesign}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50 transition-colors"
              >
                {isSavingDesign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Design
              </button>
            </div>
          </div>

          {/* MAIN WORKSPACE SPLIT */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT PANEL: LAYERS & ELEMENTS */}
            <div className="w-64 border-r border-neutral-800/80 bg-neutral-900/40 flex flex-col shrink-0 overflow-y-auto">
              <div className="p-4 space-y-5">
                {/* Background Setting */}
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-neutral-500 mb-2 flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Canvas Background</h3>
                  <div className="space-y-2">
                    <button onClick={() => bgFileInputRef.current?.click()} className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-300 rounded border border-neutral-700 transition-colors flex items-center justify-center gap-1.5">
                      Upload Local Image
                    </button>
                    <input type="file" ref={bgFileInputRef} onChange={handleBgImageUpload} accept="image/*" className="hidden" />
                    
                    <CanvaConnectPanel 
                      eventId={eventId}
                      onImageExported={(exportUrl) => { setBgType("image"); setBgValue(exportUrl); updateImageAspectRatio(exportUrl); }} 
                    />

                    {designerMode === "canvas" && (
                      <div className="pt-2">
                        <span className="text-[10px] text-neutral-500 block mb-1">Gradient / Color Preset</span>
                        <div className="flex gap-1.5 items-center flex-wrap">
                          {PRESET_GRADIENTS.map((grad, idx) => (
                            <button
                              key={idx}
                              onClick={() => { selectGradient(grad); setBgAspectRatio(null); }}
                              className={`w-6 h-6 rounded border transition-all ${ bgValue === grad ? "border-emerald-500" : "border-neutral-700 hover:border-neutral-500" } ${grad}`}
                            />
                          ))}
                          <div className="relative">
                            <input
                              type="color"
                              value={bgType === "color" ? bgValue : "#000000"}
                              onChange={(e) => { setBgType("color"); setBgValue(e.target.value); setBgAspectRatio(null); }}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer opacity-0 absolute inset-0"
                            />
                            <div
                              className={`w-6 h-6 rounded border transition-all flex items-center justify-center pointer-events-none ${ bgType === "color" ? "border-emerald-500" : "border-neutral-700" }`}
                              style={{ backgroundColor: bgType === "color" ? bgValue : "#333" }}
                            >
                              <Palette className="w-3 h-3 text-white mix-blend-difference" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {designerMode === "canvas" && (
                  <div className="pt-4 border-t border-neutral-800/80">
                    <h3 className="text-[10px] uppercase font-bold text-neutral-500 mb-2 flex items-center gap-1.5"><Layers className="w-3 h-3" /> Shape Structure</h3>
                    <select
                      value={canvasFormat}
                      onChange={(e) => setCanvasFormat(e.target.value as TicketDesign["canvasFormat"])}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded focus:outline-none focus:border-emerald-500"
                    >
                      <option value="default">Standard Rectangular</option>
                      <option value="notch">Double Notch Cuts</option>
                      <option value="badge">Vertical Badge (Lanyard)</option>
                      <option value="minimal">Minimalist Dividers</option>
                    </select>
                  </div>
                )}

                {/* Layers Panel */}
                <div className="pt-4 border-t border-neutral-800/80">
                  <h3 className="text-[10px] uppercase font-bold text-neutral-500 mb-2 flex items-center gap-1.5"><Layers className="w-3 h-3" /> Placeholders</h3>
                  <div className="space-y-1">
                    {Object.keys(elements).map((key) => {
                      const isVisible = elements[key].visible;
                      const isSelected = selectedElementKey === key;
                      const label = key === "qrCode" ? "QR Code" : key.replace(/([A-Z])/g, " $1").trim();
                      return (
                        <div
                          key={key}
                          onClick={() => {
                            if (!isVisible) { setElements((prev) => ({ ...prev, [key]: { ...prev[key], visible: true } })); }
                            setSelectedElementKey(key);
                          }}
                          className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-950 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-transparent"
                          }`}
                        >
                          <span className="capitalize">{label}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setElements((prev) => ({ ...prev, [key]: { ...prev[key], visible: !isVisible } })); if(isVisible && isSelected) setSelectedElementKey(null); }}
                            className={`p-1 rounded hover:bg-neutral-700/50 ${isVisible ? "text-neutral-300" : "text-neutral-600"}`}
                          >
                            {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sponsors Layers */}
                {designerMode === "canvas" && (
                  <div className="pt-4 border-t border-neutral-800/80">
                    <h3 className="text-[10px] uppercase font-bold text-neutral-500 mb-2 flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Sponsor Logos</h3>
                    <div className="space-y-1 mb-3">
                      {eventSponsors.map((s) => {
                        const isAdded = sponsors.some((el) => el.id === s.id);
                        return (
                          <button
                            key={s.id}
                            disabled={isAdded}
                            onClick={() => handleAddSponsorToCanvas(s)}
                            className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-colors ${
                              isAdded ? "bg-neutral-950 text-neutral-600 cursor-not-allowed" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                            }`}
                          >
                            + Add {s.name}
                          </button>
                        );
                      })}
                      <button onClick={() => sponsorFileInputRef.current?.click()} className="w-full text-left px-2 py-1.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                        + Upload Custom Logo
                      </button>
                      <input type="file" ref={sponsorFileInputRef} onChange={handleUploadCustomSponsorLogo} accept="image/png" className="hidden" />
                    </div>

                    {sponsors.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-neutral-500 mb-1 block">Placed Logos</span>
                        {sponsors.map((s) => (
                          <div key={s.id} className="flex justify-between items-center px-2 py-1.5 rounded text-xs bg-neutral-950 text-neutral-300 border border-neutral-800">
                            <span className="truncate max-w-[80px]">{s.name}</span>
                            <button onClick={() => handleRemoveSponsorFromCanvas(s.id)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CENTER VIEWPORT (CANVAS AREA) */}
            <div className="flex-1 bg-[#535353] relative overflow-hidden flex flex-col items-center justify-center group"
                 onMouseDown={handleViewportMouseDown}
                 onMouseMove={handleViewportMouseMove}
                 onMouseUp={handleViewportMouseUp}
                 onMouseLeave={handleViewportMouseUp}
            >
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
              
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase bg-neutral-900/80 px-2 py-1 rounded backdrop-blur border border-neutral-800 cursor-pointer hover:text-neutral-200">
                    <input type="checkbox" checked={snapToGuides} onChange={(e) => setSnapToGuides(e.target.checked)} className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 h-3 w-3" />
                    Snap Guides
                 </label>
              </div>

              {/* The Actual Canvas Scaling Wrapper */}
              <div style={{ transform: `scale(${zoomLevel}) translate(${canvasPan.x}px, ${canvasPan.y}px)`, transformOrigin: 'center center', transition: isPanning ? 'none' : 'transform 0.1s ease-out' }} className="relative flex items-center justify-center">
                <div
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  className={`relative select-none bg-cover bg-center overflow-hidden ${
                    designerMode === "canvas" && bgType === "gradient" ? bgValue : ""
                  } ${
                    designerMode === "canvas"
                      ? `shadow-2xl border border-white/10 ${
                          canvasFormat === "notch" ? "rounded-xl" : canvasFormat === "badge" ? "rounded-2xl" : "rounded-3xl"
                        }`
                      : bgType === "image" 
                        ? "shadow-2xl" 
                        : "bg-white border border-neutral-800 shadow-xl"
                  }`}
                  style={{
                    width: designerMode === "canvas" ? (canvasFormat === "badge" ? "400px" : "800px") : "800px",
                    backgroundImage: bgType === "image" ? `url(${bgValue})` : undefined,
                    backgroundColor: bgType === "color" ? bgValue : undefined,
                    aspectRatio: bgType === "image" && bgAspectRatio ? String(bgAspectRatio) : undefined,
                    height: bgType === "image" && bgAspectRatio ? "auto" : (designerMode === "canvas" && canvasFormat === "badge" ? "600px" : "360px"),
                  }}
                >
                  {/* Canvas Notch Cutouts */}
                  {designerMode === "canvas" && canvasFormat === "notch" && (
                    <>
                      <div className="absolute top-1/2 -left-6 -tranneutral-y-1/2 w-12 h-12 rounded-full bg-[#535353] border-r border-[#1a1a1a] z-10" />
                      <div className="absolute top-1/2 -right-6 -tranneutral-y-1/2 w-12 h-12 rounded-full bg-[#535353] border-l border-[#1a1a1a] z-10" />
                      <div className="absolute top-1/2 left-6 right-6 h-0 border-t-2 border-dashed border-white/20 -tranneutral-y-1/2 pointer-events-none" />
                    </>
                  )}
                  {/* Canvas Badge Cutouts */}
                  {designerMode === "canvas" && canvasFormat === "badge" && (
                    <div className="absolute top-4 left-1/2 -tranneutral-x-1/2 w-16 h-4 rounded-full bg-[#535353] z-10 flex items-center justify-center shadow-inner" />
                  )}

                  {isUploadingBg && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-2 z-30">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    </div>
                  )}

                  {/* DRAGGABLE TEXT ELEMENTS */}
                  {Object.keys(elements).filter(k => !k.startsWith("qrCode")).map((key) => {
                    const elKey = key as keyof TicketDesign["elements"];
                    if (elKey === "qrCode") return null;
                    const el = elements[elKey] as CanvasElement;
                    if (!el.visible) return null;
                    
                    const texts: Record<string, string> = {
                      eventTitle: "Techfed Kerala 2026",
                      name: "Arjun Mehta",
                      ticketId: "VIP PASS - QR_8A2FD",
                      venue: "Kochi Infopark Auditorium",
                      dateTime: "15 June • 10:00 AM"
                    };
                    const baseKey = key.split('_')[0];
                    const textContent = texts[baseKey] || texts["name"];

                    return (
                      <div
                        key={key}
                        onMouseDown={(e) => handleDragStart(key, e)}
                        onClick={(e) => { e.stopPropagation(); setSelectedElementKey(key); }}
                        className={`absolute cursor-grab active:cursor-grabbing p-2 border rounded select-none whitespace-nowrap ${
                          selectedElementKey === key ? "border-emerald-500 bg-emerald-500/20 z-20 shadow-lg shadow-emerald-500/10" : "border-transparent hover:border-white/30 z-10"
                        }`}
                        style={{
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          fontFamily: el.fontFamily,
                          fontSize: `${el.fontSize}px`,
                          fontWeight: el.fontWeight || "normal",
                          fontStyle: el.fontStyle || "normal",
                          color: el.color,
                          textTransform: el.textTransform || "none",
                          transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                        }}
                      >
                        {textContent}
                      </div>
                    );
                  })}

                  {/* QR CODES */}
                  {Object.keys(elements).filter(k => k.startsWith("qrCode")).map((key) => {
                    const qrEl = elements[key];
                    if (!qrEl.visible) return null;
                    return (
                      <div
                        key={key}
                        onMouseDown={(e) => handleDragStart(key, e)}
                        onClick={(e) => { e.stopPropagation(); setSelectedElementKey(key); }}
                        className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none border-2 ${
                          selectedElementKey === key ? "border-emerald-500 bg-emerald-500/20 z-20" : "border-dashed border-white/20 hover:border-white/50 z-10"
                        }`}
                        style={{
                          left: `${qrEl.x}%`,
                          top: `${qrEl.y}%`,
                          width: `${qrEl.size}px`,
                          height: `${qrEl.size}px`,
                          transform: `rotate(${qrEl.rotation || 0}deg)`,
                          backgroundColor: qrEl.bgColor || 'white'
                        }}
                      >
                        <ImageIcon className="w-1/2 h-1/2" style={{ color: qrEl.color || 'black', opacity: 0.2 }} />
                      </div>
                    );
                  })}

                  {/* SPONSOR LOGOS */}
                  {designerMode === "canvas" && sponsors.map((s) => (
                    <div
                      key={s.id}
                      onMouseDown={(e) => handleDragStart(`sponsor-${s.id}`, e)}
                      className="absolute p-2 border border-dashed border-transparent hover:border-emerald-500 rounded flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
                      style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: `${s.width}px`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.logoUrl} alt={s.name} className="max-h-12 w-full object-contain pointer-events-none select-none" />
                    </div>
                  ))}

                  {/* Drag Guides Snapping Lines */}
                  {dragGuides.vertical.map((val, idx) => (
                    <div key={`v-${idx}`} className="absolute top-0 bottom-0 border-l border-emerald-400 z-50 pointer-events-none" style={{ left: `${val}%` }} />
                  ))}
                  {dragGuides.horizontal.map((val, idx) => (
                    <div key={`h-${idx}`} className="absolute left-0 right-0 border-t border-emerald-400 z-50 pointer-events-none" style={{ top: `${val}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: PROPERTIES */}
            <div className="w-72 border-l border-neutral-800/80 bg-neutral-900/40 flex flex-col shrink-0 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-[10px] uppercase font-bold text-neutral-500 mb-4 tracking-wider">Properties</h3>
                
                {!selectedElementKey && (
                  <div className="text-center p-6 bg-neutral-950/50 rounded-lg border border-neutral-800 border-dashed text-neutral-500 text-xs">
                    Select an element on the canvas or from the layers panel to edit its properties.
                  </div>
                )}

                {selectedElementKey && !selectedElementKey.startsWith("qrCode") && selectedEl && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                        {selectedElementKey.split('_')[0]} Properties
                      </span>
                      <button 
                        onClick={() => handleDuplicateElement(selectedElementKey)}
                        className="p-1 text-neutral-400 hover:text-white bg-neutral-800 rounded flex items-center justify-center transition-colors"
                        title="Duplicate Element"
                      >
                        <Layers className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Font Family & Weight */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Typography</span>
                        <select
                          value={selectedEl.fontFamily}
                          onChange={(e) => {
                            const newFont = GOOGLE_FONTS.find(f => f.family === e.target.value);
                            updateSelectedElementStyle("fontFamily", e.target.value);
                            if (newFont) {
                              const defaultVariant = newFont.variants.find(v => v.weight === "400" && v.style === "normal") || newFont.variants[0];
                              updateSelectedElementStyle("fontWeight", defaultVariant.weight);
                              updateSelectedElementStyle("fontStyle", defaultVariant.style);
                            }
                          }}
                          className="w-full p-2 bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded focus:border-emerald-500 focus:outline-none"
                        >
                          {GOOGLE_FONTS.map((font) => <option key={font.family} value={font.family}>{font.family}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={`${selectedEl.fontWeight}|${selectedEl.fontStyle}`}
                          onChange={(e) => {
                            const [weight, style] = e.target.value.split("|");
                            updateSelectedElementStyle("fontWeight", weight);
                            updateSelectedElementStyle("fontStyle", style);
                          }}
                          className="w-full p-2 bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded focus:border-emerald-500 focus:outline-none"
                        >
                          {GOOGLE_FONTS.find(f => f.family === selectedEl.fontFamily)?.variants.map((v) => (
                            <option key={`${v.weight}|${v.style}`} value={`${v.weight}|${v.style}`}>{v.label}</option>
                          ))}
                        </select>
                        <div className="flex bg-neutral-950 border border-neutral-800 rounded px-2">
                          <span className="text-[9px] font-bold text-neutral-500 self-center pr-1">SIZE</span>
                          <input
                            type="number" min="9" max="72"
                            value={selectedEl.fontSize}
                            onChange={(e) => updateSelectedElementStyle("fontSize", Number(e.target.value) || 12)}
                            className="w-full bg-transparent text-xs text-neutral-300 text-right focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color & Case */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-800/80">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Color</span>
                        <div className="flex bg-neutral-950 border border-neutral-800 rounded p-1">
                          <input type="color" value={selectedEl.color} onChange={(e) => updateSelectedElementStyle("color", e.target.value)} className="w-6 h-6 rounded cursor-pointer p-0 border-0 bg-transparent" />
                          <input type="text" value={selectedEl.color.toUpperCase()} onChange={(e) => updateSelectedElementStyle("color", e.target.value)} className="w-full bg-transparent text-[11px] font-mono font-bold text-neutral-300 px-1 focus:outline-none uppercase" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Text Case</span>
                        <select
                          value={selectedEl.textTransform || "none"}
                          onChange={(e) => updateSelectedElementStyle("textTransform", e.target.value)}
                          className="w-full p-1.5 h-8 bg-neutral-950 border border-neutral-800 text-[11px] font-semibold text-neutral-300 rounded focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="none">Aa Normal</option>
                          <option value="uppercase">AA UPPER</option>
                          <option value="lowercase">aa lower</option>
                          <option value="capitalize">Aa Cap</option>
                        </select>
                      </div>
                    </div>

                    {/* Geometry */}
                    <div className="pt-4 border-t border-neutral-800/80">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Transform</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-neutral-950 border border-neutral-800 rounded p-1 flex flex-col items-center">
                          <span className="text-[8px] text-neutral-500 font-bold">X (%)</span>
                          <input type="number" value={selectedEl.x} onChange={(e) => updateSelectedElementStyle("x", Number(e.target.value))} className="w-full bg-transparent text-xs text-center text-neutral-300 focus:outline-none mt-0.5" />
                        </div>
                        <div className="bg-neutral-950 border border-neutral-800 rounded p-1 flex flex-col items-center">
                          <span className="text-[8px] text-neutral-500 font-bold">Y (%)</span>
                          <input type="number" value={selectedEl.y} onChange={(e) => updateSelectedElementStyle("y", Number(e.target.value))} className="w-full bg-transparent text-xs text-center text-neutral-300 focus:outline-none mt-0.5" />
                        </div>
                        <div className="bg-neutral-950 border border-neutral-800 rounded p-1 flex flex-col items-center">
                          <span className="text-[8px] text-neutral-500 font-bold">ROT (°)</span>
                          <input type="number" value={selectedEl.rotation || 0} onChange={(e) => updateSelectedElementStyle("rotation", Number(e.target.value))} className="w-full bg-transparent text-xs text-center text-neutral-300 focus:outline-none mt-0.5" />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* QR Code Special Properties */}
                {selectedElementKey?.startsWith("qrCode") && elements[selectedElementKey] && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                        {selectedElementKey.split('_')[0]} Properties
                      </span>
                      <button 
                        onClick={() => handleDuplicateElement(selectedElementKey)}
                        className="p-1 text-neutral-400 hover:text-white bg-neutral-800 rounded flex items-center justify-center transition-colors"
                        title="Duplicate QR Code"
                      >
                        <Layers className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="pt-2">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-2">QR Code Size</span>
                      <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded p-2">
                        <input type="range" min="40" max="200" value={elements[selectedElementKey].size} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], size: Number(e.target.value)}}))} className="flex-1 accent-emerald-500 h-1 bg-neutral-800 rounded" />
                        <span className="text-xs font-mono font-bold text-neutral-300 w-10 text-right">{elements[selectedElementKey].size}px</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Code Color</span>
                        <div className="flex bg-neutral-950 border border-neutral-800 rounded p-1">
                          <input type="color" value={elements[selectedElementKey].color || "#000000"} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], color: e.target.value}}))} className="w-6 h-6 rounded cursor-pointer p-0 border-0 bg-transparent" />
                          <input type="text" value={(elements[selectedElementKey].color || "#000000").toUpperCase()} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], color: e.target.value}}))} className="w-full bg-transparent text-[11px] font-mono font-bold text-neutral-300 px-1 focus:outline-none uppercase" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Background</span>
                        <div className="flex bg-neutral-950 border border-neutral-800 rounded p-1">
                          <input type="color" disabled={elements[selectedElementKey].bgColor === "transparent"} value={elements[selectedElementKey].bgColor === "transparent" ? "#ffffff" : (elements[selectedElementKey].bgColor || "#ffffff")} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], bgColor: e.target.value}}))} className="w-6 h-6 rounded cursor-pointer p-0 border-0 bg-transparent disabled:opacity-30" />
                          <input type="text" disabled={elements[selectedElementKey].bgColor === "transparent"} value={elements[selectedElementKey].bgColor === "transparent" ? "NONE" : (elements[selectedElementKey].bgColor || "#ffffff").toUpperCase()} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], bgColor: e.target.value}}))} className="w-full bg-transparent text-[11px] font-mono font-bold text-neutral-300 px-1 focus:outline-none uppercase disabled:opacity-30" />
                        </div>
                        <label className="flex items-center gap-1.5 mt-2 cursor-pointer group">
                          <input type="checkbox" checked={elements[selectedElementKey].bgColor === "transparent"} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], bgColor: e.target.checked ? "transparent" : "#ffffff"}}))} className="w-3 h-3 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0" />
                          <span className="text-[9px] font-bold text-neutral-400 group-hover:text-neutral-300 uppercase">Transparent</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="bg-neutral-950 border border-neutral-800 rounded p-1 flex flex-col items-center">
                        <span className="text-[8px] text-neutral-500 font-bold">X (%)</span>
                        <input type="number" value={elements[selectedElementKey].x} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], x: Number(e.target.value)}}))} className="w-full bg-transparent text-xs text-center text-neutral-300 focus:outline-none mt-0.5" />
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded p-1 flex flex-col items-center">
                        <span className="text-[8px] text-neutral-500 font-bold">Y (%)</span>
                        <input type="number" value={elements[selectedElementKey].y} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], y: Number(e.target.value)}}))} className="w-full bg-transparent text-xs text-center text-neutral-300 focus:outline-none mt-0.5" />
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded p-1 flex flex-col items-center">
                        <span className="text-[8px] text-neutral-500 font-bold">ROT (°)</span>
                        <input type="number" value={elements[selectedElementKey].rotation || 0} onChange={(e) => setElements(p => ({...p, [selectedElementKey]: {...p[selectedElementKey], rotation: Number(e.target.value)}}))} className="w-full bg-transparent text-xs text-center text-neutral-300 focus:outline-none mt-0.5" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Sponsor Logo Properties */}
                {selectedElementKey?.startsWith("sponsor-") && (
                  <div className="space-y-4">
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-2">Sponsor Logo Size</span>
                    <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded p-2">
                        <input type="range" min="20" max="250" value={sponsors.find(s => `sponsor-${s.id}` === selectedElementKey)?.width || 60} onChange={(e) => setSponsors(prev => prev.map(s => `sponsor-${s.id}` === selectedElementKey ? {...s, width: Number(e.target.value)} : s))} className="flex-1 accent-emerald-500 h-1 bg-neutral-800 rounded" />
                        <span className="text-xs font-mono font-bold text-neutral-300 w-10 text-right">{sponsors.find(s => `sponsor-${s.id}` === selectedElementKey)?.width}px</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      ), document.body)}
      {/* ========================================================================= */}
      {/* TICKET TYPE MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-neutral-200 shadow-2xl rounded-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-950 font-serif">
                    {editingTicket ? "Edit Ticket Type" : "Add Ticket Type"}
                  </h3>
                  <p className="text-xs text-neutral-500">Configure ticket availability, cost, and capacity</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-200/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitTicketType}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600">Ticket Class Name</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="General Admission, VIP Pass, Early Bird..."
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what access/benefits this ticket provides (e.g. food included, front-row seat)..."
                    rows={3}
                    className="w-full p-3 text-sm bg-black/5 border border-transparent rounded-xl focus:outline-none focus:border-emerald-500/50 transition-colors resize-none text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600">Price (INR)</label>
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
                    <label className="text-xs font-semibold text-neutral-600">Capacity Limits</label>
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
                    <label className="text-xs font-semibold text-neutral-600">Sale Start Date/Time</label>
                    <Input
                      type="datetime-local"
                      required
                      value={saleStart}
                      onChange={(e) => setSaleStart(e.target.value)}
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600">Sale End Date/Time</label>
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
                    <label className="text-xs font-semibold text-neutral-600">Max Passes per Order</label>
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
                    <span className="text-xs font-semibold text-neutral-600">Make Ticket Visible</span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setIsVisible(e.target.checked)}
                      className="rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 p-5 border-t border-neutral-100 bg-neutral-50/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
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
