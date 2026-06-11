export interface CanvasElementTemplate {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string;
  fontStyle?: string;
  color: string;
  visible: boolean;
}

export interface TicketTemplate {
  id: string;
  name: string;
  mode: "own" | "canvas";
  backgroundType: "gradient" | "image" | "color";
  backgroundValue: string;
  canvasFormat: "default" | "notch" | "badge" | "minimal";
  elements: {
    name: CanvasElementTemplate;
    ticketId: CanvasElementTemplate;
    eventTitle: CanvasElementTemplate;
    venue: CanvasElementTemplate;
    dateTime: CanvasElementTemplate;
    qrCode: { x: number; y: number; size: number; visible: boolean };
  };
}

export const TICKET_TEMPLATES: TicketTemplate[] = [
  {
    id: "tech-badge",
    name: "Tech Conference Badge",
    mode: "canvas",
    backgroundType: "gradient",
    backgroundValue: "bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950",
    canvasFormat: "badge",
    elements: {
      eventTitle: { x: 5, y: 15, fontSize: 24, fontFamily: "Outfit", fontWeight: "800", fontStyle: "normal", color: "#ffffff", visible: true },
      name: { x: 5, y: 50, fontSize: 28, fontFamily: "Inter", fontWeight: "700", fontStyle: "normal", color: "#4ade80", visible: true },
      ticketId: { x: 5, y: 65, fontSize: 12, fontFamily: "Fira Code", fontWeight: "400", fontStyle: "normal", color: "#94a3b8", visible: true },
      venue: { x: 5, y: 72, fontSize: 14, fontFamily: "Inter", fontWeight: "500", fontStyle: "normal", color: "#e2e8f0", visible: true },
      dateTime: { x: 5, y: 78, fontSize: 14, fontFamily: "Inter", fontWeight: "500", fontStyle: "normal", color: "#e2e8f0", visible: true },
      qrCode: { x: 25, y: 85, size: 100, visible: true }, // Centered roughly on badge (badge width is 400px, 25% is 100px)
    },
  },
  {
    id: "vip-pass",
    name: "VIP Night Pass",
    mode: "canvas",
    backgroundType: "gradient",
    backgroundValue: "bg-gradient-to-br from-slate-900 to-slate-950",
    canvasFormat: "default",
    elements: {
      eventTitle: { x: 10, y: 20, fontSize: 28, fontFamily: "Outfit", fontWeight: "900", fontStyle: "normal", color: "#fbbf24", visible: true },
      name: { x: 10, y: 50, fontSize: 20, fontFamily: "Outfit", fontWeight: "600", fontStyle: "normal", color: "#ffffff", visible: true },
      ticketId: { x: 10, y: 80, fontSize: 14, fontFamily: "Fira Code", fontWeight: "400", fontStyle: "normal", color: "#64748b", visible: true },
      venue: { x: 60, y: 50, fontSize: 14, fontFamily: "Inter", fontWeight: "400", fontStyle: "normal", color: "#94a3b8", visible: true },
      dateTime: { x: 60, y: 65, fontSize: 14, fontFamily: "Inter", fontWeight: "400", fontStyle: "normal", color: "#94a3b8", visible: true },
      qrCode: { x: 75, y: 15, size: 120, visible: true },
    },
  },
  {
    id: "festival-notch",
    name: "Music Festival Ticket",
    mode: "canvas",
    backgroundType: "gradient",
    backgroundValue: "bg-gradient-to-br from-rose-950 via-red-900 to-slate-950",
    canvasFormat: "notch",
    elements: {
      eventTitle: { x: 8, y: 15, fontSize: 32, fontFamily: "Outfit", fontWeight: "900", fontStyle: "italic", color: "#ffffff", visible: true },
      name: { x: 8, y: 40, fontSize: 18, fontFamily: "Inter", fontWeight: "700", fontStyle: "normal", color: "#fda4af", visible: true },
      ticketId: { x: 8, y: 75, fontSize: 12, fontFamily: "Fira Code", fontWeight: "400", fontStyle: "normal", color: "#fecdd3", visible: true },
      venue: { x: 45, y: 40, fontSize: 14, fontFamily: "Inter", fontWeight: "600", fontStyle: "normal", color: "#e2e8f0", visible: true },
      dateTime: { x: 45, y: 55, fontSize: 14, fontFamily: "Inter", fontWeight: "600", fontStyle: "normal", color: "#e2e8f0", visible: true },
      qrCode: { x: 80, y: 30, size: 90, visible: true },
    },
  },
  {
    id: "minimalist",
    name: "Minimalist Entry",
    mode: "canvas",
    backgroundType: "gradient",
    backgroundValue: "bg-gradient-to-br from-slate-900 to-slate-950",
    canvasFormat: "minimal",
    elements: {
      eventTitle: { x: 10, y: 15, fontSize: 20, fontFamily: "Inter", fontWeight: "300", fontStyle: "normal", color: "#ffffff", visible: true },
      name: { x: 10, y: 45, fontSize: 16, fontFamily: "Inter", fontWeight: "400", fontStyle: "normal", color: "#94a3b8", visible: true },
      ticketId: { x: 10, y: 80, fontSize: 10, fontFamily: "Fira Code", fontWeight: "300", fontStyle: "normal", color: "#475569", visible: true },
      venue: { x: 50, y: 45, fontSize: 12, fontFamily: "Inter", fontWeight: "300", fontStyle: "normal", color: "#64748b", visible: true },
      dateTime: { x: 50, y: 60, fontSize: 12, fontFamily: "Inter", fontWeight: "300", fontStyle: "normal", color: "#64748b", visible: true },
      qrCode: { x: 75, y: 30, size: 100, visible: true },
    },
  }
];
