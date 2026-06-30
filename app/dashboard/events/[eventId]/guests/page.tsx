"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { mockGuests as initialMockGuests } from "@/lib/mock-data";
import {
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  X,
  CheckCircle2,
  Loader2,
  QrCode,
  Calendar,
  DollarSign,
  User,
  Phone,
  Trash2,
  Check,
  Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateGuestStatus,
  bulkUpdateStatus,
  deleteGuest,
  bulkUploadGuests,
  sendRealEmail,
  sendInvitationEmails,
} from "./actions";

const statusStyles: Record<string, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  waitlisted: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  checked_in: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "pending" | "confirmed" | "waitlisted" | "checked_in" | "cancelled";
  qr_code: string;
  checked_in_at: string | null;
  payment_status: string;
  amount_paid: number;
  registered_at: string;
  form_data: Record<string, unknown>;
  ticket_type_id: string | null;
  ticket_type_name?: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
}

interface SupabaseGuestRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  qr_code: string;
  checked_in_at: string | null;
  payment_status: string;
  amount_paid: number | string;
  registered_at: string;
  form_data: Record<string, unknown> | null;
  ticket_type_id: string | null;
  ticket_types: { name: string } | null;
}

export default function GuestsPage() {
  const params = useParams();
  const eventId = params?.eventId as string;

  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string>("all");
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());

  // Modal States
  const [activeModal, setActiveModal] = useState<"details" | "email" | "upload" | null>(null);
  const [selectedGuestForDetails, setSelectedGuestForDetails] = useState<Guest | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTargetIds, setEmailTargetIds] = useState<string[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch guests and ticket types
  const fetchEventGuests = useCallback(async () => {
    await Promise.resolve();
    if (!eventId) return;
    
    // Check if mock data fallback is needed
    if (eventId.startsWith("evt-") || eventId === "evt_123") {
      setGuests(initialMockGuests.filter((g) => g.event_id === eventId) as Guest[]);
      setTicketTypes([
        { id: "tkt-1", name: "Early Bird", price: 999 },
        { id: "tkt-2", name: "Regular", price: 1999 },
        { id: "tkt-3", name: "VIP", price: 4999 },
      ]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    try {
      // Fetch ticket types for filtering and upload mapping
      const { data: ticketTypesData } = await supabase
        .from("ticket_types")
        .select("id, name, price")
        .eq("event_id", eventId);
      
      if (ticketTypesData) {
        setTicketTypes(ticketTypesData);
      }

      // Fetch guests
      const { data: guestsData, error } = await supabase
        .from("guests")
        .select(`
          id,
          name,
          email,
          phone,
          status,
          qr_code,
          checked_in_at,
          payment_status,
          amount_paid,
          registered_at,
          form_data,
          ticket_type_id,
          ticket_types(name)
        `)
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (guestsData) {
        const formattedGuests: Guest[] = (guestsData as unknown as SupabaseGuestRow[]).map((g) => ({
          id: g.id,
          name: g.name,
          email: g.email,
          phone: g.phone,
          status: g.status as Guest["status"],
          qr_code: g.qr_code,
          checked_in_at: g.checked_in_at,
          payment_status: g.payment_status,
          amount_paid: Number(g.amount_paid) || 0,
          registered_at: g.registered_at,
          form_data: g.form_data || {},
          ticket_type_id: g.ticket_type_id,
          ticket_type_name: g.ticket_types?.name || "Free Ticket",
        }));
        setGuests(formattedGuests);
      }
    } catch (error: unknown) {
      console.error("Error fetching guests:", error);
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to load guests: " + message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEventGuests();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEventGuests]);

  // Handle Action Operations
  const handleUpdateStatus = async (guestId: string, status: "pending" | "confirmed" | "waitlisted" | "checked_in" | "cancelled") => {
    // Optimistic UI update or direct execution
    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, status, checked_in_at: status === "checked_in" ? new Date().toISOString() : g.checked_in_at } : g))
      );
      toast.success(`Guest status updated to ${status.replace("_", " ")}`);
      return;
    }

    const res = await updateGuestStatus(guestId, status);
    if (res.success) {
      toast.success(`Guest status updated to ${status.replace("_", " ")}`);
      fetchEventGuests();
    } else {
      toast.error("Failed to update status: " + res.error);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
      toast.success("Guest registration cancelled");
      return;
    }

    const res = await deleteGuest(guestId);
    if (res.success) {
      toast.success("Guest registration cancelled");
      fetchEventGuests();
    } else {
      toast.error("Failed to cancel registration: " + res.error);
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    const ids = Array.from(selectedGuests);
    if (ids.length === 0) return;

    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      setGuests((prev) =>
        prev.map((g) => (ids.includes(g.id) ? { ...g, status: "confirmed", payment_status: "paid" } : g))
      );
      setSelectedGuests(new Set());
      toast.success(`${ids.length} guests approved`);
      return;
    }

    const res = await bulkUpdateStatus(ids, "confirmed");
    if (res.success) {
      toast.success(`${ids.length} guests approved`);
      setSelectedGuests(new Set());
      fetchEventGuests();
    } else {
      toast.error("Bulk action failed: " + res.error);
    }
  };

  const handleBulkCancel = async () => {
    const ids = Array.from(selectedGuests);
    if (ids.length === 0) return;

    const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
    if (isMock) {
      setGuests((prev) =>
        prev.map((g) => (ids.includes(g.id) ? { ...g, status: "cancelled" } : g))
      );
      setSelectedGuests(new Set());
      toast.success(`${ids.length} registrations cancelled`);
      return;
    }

    const res = await bulkUpdateStatus(ids, "cancelled");
    if (res.success) {
      toast.success(`${ids.length} registrations cancelled`);
      setSelectedGuests(new Set());
      fetchEventGuests();
    } else {
      toast.error("Bulk action failed: " + res.error);
    }
  };

  // Sending email
  const triggerEmailModal = (targetIds: string[]) => {
    setEmailTargetIds(targetIds);
    setEmailSubject("");
    setEmailBody("");
    setActiveModal("email");
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Please fill in email subject and message body");
      return;
    }
    setIsSendingEmail(true);

    const emailList = guests
      .filter((g) => emailTargetIds.includes(g.id))
      .map((g) => g.email);

    try {
      const res = await sendRealEmail(eventId as string, emailList, emailSubject, emailBody);
      if (res.success) {
        toast.success(`Email sent successfully to ${emailList.length} recipient(s)`);
        setActiveModal(null);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error occurred";
      toast.error("Failed to send email: " + message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendInvitations = async () => {
    const ids = Array.from(selectedGuests);
    if (ids.length === 0) return;
    
    setIsSendingInvitations(true);
    try {
      const res = await sendInvitationEmails(eventId, ids);
      if (res.success) {
        toast.success(`Successfully sent ${res.count} invitation emails!`);
        setSelectedGuests(new Set());
      } else {
        toast.error("Failed to send invitations: " + res.error);
      }
    } catch (e: unknown) {
      toast.error("An error occurred while sending invitations.");
    } finally {
      setIsSendingInvitations(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (guests.length === 0) {
      toast.error("No guests to export");
      return;
    }

    const headers = ["ID", "Name", "Email", "Phone", "Ticket Type", "Status", "Amount Paid", "Registered At", "Payment Status", "QR Code"];
    const rows = guests.map((g) => [
      g.id,
      g.name,
      g.email,
      g.phone || "",
      g.ticket_type_name || "Free Ticket",
      g.status,
      g.amount_paid,
      g.registered_at,
      g.payment_status,
      g.qr_code,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_${eventId}_guests.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Guests exported successfully");
  };

  // CSV parsing & Bulk Upload
  const handleCSVUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      setIsUploading(true);
      try {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          toast.error("CSV file is empty or invalid");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
        const parsedGuests = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV line parser
          const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          if (row.name && row.email) {
            // Find ticket type ID by comparing name
            const matchingTktType = ticketTypes.find(
              (t) => t.name.toLowerCase() === (row.ticket || row.ticket_type || "").toLowerCase()
            );

            parsedGuests.push({
              name: row.name,
              email: row.email,
              phone: row.phone || undefined,
              ticket_type_id: matchingTktType?.id || (ticketTypes[0]?.id || undefined),
              status: (row.status || "confirmed") as Guest["status"],
              amount_paid: Number(row.amount_paid) || matchingTktType?.price || 0,
              payment_status: row.payment_status || (Number(row.amount_paid) > 0 ? "paid" : "paid"),
              form_data: {
                company: row.company || "",
                role: row.role || "",
                imported: "true",
              },
            });
          }
        }

        if (parsedGuests.length === 0) {
          toast.error("No valid guests found in CSV. Ensure Name and Email headers are present.");
          return;
        }

        const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
        if (isMock) {
          const newMockRows: Guest[] = parsedGuests.map((g, index) => {
            const mockGuestId = `guest-imported-${Date.now()}-${index}`;
            return {
              id: mockGuestId,
              name: g.name,
              email: g.email,
              phone: g.phone || null,
              status: g.status,
              qr_code: mockGuestId,
            checked_in_at: null,
            payment_status: g.payment_status,
            amount_paid: g.amount_paid,
            registered_at: new Date().toISOString(),
            form_data: g.form_data,
            ticket_type_id: g.ticket_type_id || null,
            ticket_type_name: ticketTypes.find((t) => t.id === g.ticket_type_id)?.name || "Regular",
          };
        });
        setGuests((prev) => [...newMockRows, ...prev]);
          toast.success(`Successfully imported ${parsedGuests.length} guests (mock mode)`);
        } else {
          const res = await bulkUploadGuests(eventId, parsedGuests);
          if (res.success) {
            toast.success(`Successfully imported ${parsedGuests.length} guests`);
            fetchEventGuests();
          } else {
            toast.error("Import failed: " + res.error);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error("Error reading CSV file: " + message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Filter calculation
  const filtered = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    const matchesTicketType =
      ticketTypeFilter === "all" || g.ticket_type_id === ticketTypeFilter;
    return matchesSearch && matchesStatus && matchesTicketType;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedGuests = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelect = (id: string) => {
    setSelectedGuests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedGuests.size === filtered.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(filtered.map((g) => g.id)));
    }
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
      {/* Hidden CSV Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guest Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {guests.length} total guests registered
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCSVUploadClick}
            disabled={isUploading}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/10 text-[#022c22]"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/10 text-[#022c22]"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-black/5 border-black/5 text-slate-900 placeholder:text-slate-400 h-9 rounded-xl focus-visible:ring-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-black/5 px-2 py-1.5 rounded-xl border border-black/5">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer pr-1"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Ticket Type Filter */}
        <div className="flex items-center gap-1.5 bg-black/5 px-2 py-1.5 rounded-xl border border-black/5">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
          <select
            value={ticketTypeFilter}
            onChange={(e) => {
              setTicketTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer pr-1"
          >
            <option value="all">All Ticket Types</option>
            {ticketTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedGuests.size > 0 && (
        <div className="glass-card p-3 flex items-center justify-between border-l-4 border-l-emerald-500 animate-slide-up">
          <span className="text-sm text-slate-700 font-medium">
            {selectedGuests.size} guest{selectedGuests.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={handleSendInvitations}
              disabled={isSendingInvitations}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20 hover:bg-violet-500/30 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingInvitations ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Send Invitations
            </button>
            <button
              onClick={() => triggerEmailModal(Array.from(selectedGuests))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/30 transition-all flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              Custom Email
            </button>
            <button
              onClick={handleBulkCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/20 hover:bg-red-500/30 transition-all flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-slate-50/50">
                <th className="p-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedGuests.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-black/10 bg-black/5"
                  />
                </th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registered</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    No guests match the selected filter.
                  </td>
                </tr>
              ) : (
                paginatedGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => toggleSelect(guest.id)}
                        className="rounded border-black/10 bg-black/5"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{guest.name}</p>
                        <p className="text-xs text-slate-500">{guest.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-600 font-medium">{guest.ticket_type_name || "Free Ticket"}</span>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={`border text-[10px] font-semibold ${statusStyles[guest.status] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}
                      >
                        {guest.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(guest.registered_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-mono font-medium">
                      ₹{guest.amount_paid.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-black/5 transition-all">
                          <MoreHorizontal className="w-4 h-4 text-slate-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-lg rounded-xl min-w-[140px]">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedGuestForDetails(guest);
                              setActiveModal("details");
                            }}
                            className="text-slate-700 hover:text-slate-900 focus:text-slate-900 focus:bg-black/5 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => triggerEmailModal([guest.id])}
                            className="text-slate-700 hover:text-slate-900 focus:text-slate-900 focus:bg-black/5 cursor-pointer"
                          >
                            <Mail className="w-4 h-4 mr-2 text-slate-500" /> Send Email
                          </DropdownMenuItem>
                          {guest.status !== "checked_in" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(guest.id, "checked_in")}
                              className="text-slate-700 hover:text-slate-900 focus:text-slate-900 focus:bg-black/5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500" /> Check In
                            </DropdownMenuItem>
                          )}
                          {guest.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(guest.id, "confirmed")}
                              className="text-slate-700 hover:text-slate-900 focus:text-slate-900 focus:bg-black/5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="text-red-500 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2 text-red-500" /> Cancel Ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200/50">
          <span className="text-xs text-slate-500">
            Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} to{" "}
            {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length} guests
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-black/5 text-slate-500 transition-all disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentPage === idx + 1
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "hover:bg-black/5 text-slate-600"
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-black/5 text-slate-500 transition-all disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Guest Details Modal */}
      {activeModal === "details" && selectedGuestForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg glass-card shadow-2xl rounded-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Guest Registration Details</h3>
                  <p className="text-xs text-slate-500">ID: {selectedGuestForDetails.id}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Profile Card Summary */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-md font-bold text-slate-900">{selectedGuestForDetails.name}</h4>
                  <p className="text-xs text-slate-500">{selectedGuestForDetails.email}</p>
                  {selectedGuestForDetails.phone && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedGuestForDetails.phone}
                    </p>
                  )}
                </div>
                <Badge
                  className={`border text-[10px] font-semibold ${
                    statusStyles[selectedGuestForDetails.status] || "bg-slate-500/20 text-slate-300 border-slate-500/30"
                  }`}
                >
                  {selectedGuestForDetails.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Grid with Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> QR Code Ref
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{selectedGuestForDetails.qr_code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Amount Paid
                  </p>
                  <p className="text-sm font-semibold text-slate-800 font-mono">
                    ₹{selectedGuestForDetails.amount_paid} ({selectedGuestForDetails.payment_status})
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Registered On
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(selectedGuestForDetails.registered_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Checked In
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedGuestForDetails.checked_in_at
                      ? new Date(selectedGuestForDetails.checked_in_at).toLocaleString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Not Checked In"}
                  </p>
                </div>
              </div>

              {/* Custom Form Fields */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-emerald-500" /> Custom Form Responses
                </h5>
                {Object.keys(selectedGuestForDetails.form_data).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No custom form answers provided.</p>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 border border-slate-100">
                    {Object.entries(selectedGuestForDetails.form_data).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                        <span className="text-slate-500 capitalize">{key.replace(/_/g, " ")}:</span>
                        <span className="font-semibold text-slate-800">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-5 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {activeModal === "email" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg glass-card shadow-2xl rounded-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 font-serif">Compose Broadcast Email</h3>
                  <p className="text-xs text-slate-500">Sending to {emailTargetIds.length} guest(s)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Subject</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Welcome to Techfed Kerala!"
                  className="bg-black/5 border-black/5 text-slate-900 placeholder:text-slate-400 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Dear Guest,

We are thrilled to welcome you. Here is your admission ticket:
..."
                  rows={8}
                  className="w-full p-3 text-sm bg-black/5 border border-transparent text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-5 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setActiveModal(null)}
                disabled={isSendingEmail}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {isSendingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
