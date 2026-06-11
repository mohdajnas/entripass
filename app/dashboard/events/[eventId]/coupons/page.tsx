"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { mockCoupons } from "@/lib/mock-data";
import { Plus, Copy, Pencil, Trash2, Percent, IndianRupee, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { createCoupon, updateCoupon, deleteCoupon, CouponInput } from "./actions";

interface Coupon {
  id: string;
  event_id: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
}

export default function CouponsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setCoupons(mockCoupons as any);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("event_id", eventId)
        .order("code", { ascending: true });

      if (error) throw error;
      if (data) setCoupons(data);
    } catch (err: unknown) {
      console.error("Error loading coupons:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load coupons: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [eventId]);

  const openModal = (coupon: Coupon | null = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCode(coupon.code);
      setDiscountType(coupon.discount_type);
      setDiscountValue(coupon.discount_value.toString());
      setMaxUses(coupon.max_uses ? coupon.max_uses.toString() : "");
      setExpiresAt(coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "");
    } else {
      setEditingCoupon(null);
      setCode("");
      setDiscountType("percent");
      setDiscountValue("");
      setMaxUses("");
      setExpiresAt("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      
      const couponInput: CouponInput = {
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (isMock) {
        if (editingCoupon) {
          setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...couponInput } as any : c));
          toast.success("Coupon updated successfully (mock)");
        } else {
          setCoupons(prev => [...prev, {
            id: `cpn-mock-${Date.now()}`,
            event_id: eventId,
            used_count: 0,
            ...couponInput
          } as Coupon]);
          toast.success("Coupon created successfully (mock)");
        }
      } else {
        if (editingCoupon) {
          const res = await updateCoupon(editingCoupon.id, couponInput);
          if (res.success) {
            toast.success("Coupon updated successfully");
            loadCoupons();
          } else {
            toast.error(res.error || "Failed to update coupon");
          }
        } else {
          const res = await createCoupon(eventId, couponInput);
          if (res.success) {
            toast.success("Coupon created successfully");
            loadCoupons();
          } else {
            toast.error(res.error || "Failed to create coupon");
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

  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        toast.success("Coupon deleted (mock)");
        return;
      }

      const res = await deleteCoupon(couponId);
      if (res.success) {
        toast.success("Coupon deleted successfully");
        loadCoupons();
      } else {
        toast.error(res.error || "Failed to delete coupon");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An error occurred while deleting.");
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard!");
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
          <p className="text-slate-500 text-sm mt-1">Manage discount codes for your event</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => openModal()}
            className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Percent className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No coupons yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Create your first discount code to offer special pricing to your guests or VIPs.</p>
          <button 
            onClick={() => openModal()}
            className="btn-gradient px-6 py-2 rounded-xl text-sm font-medium"
          >
            Create your first coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {coupons.map((coupon, i) => {
            const usagePercent = coupon.max_uses ? Math.round((coupon.used_count / coupon.max_uses) * 100) : 0;
            const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;

            return (
              <div
                key={coupon.id}
                className="glass-card p-5 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-pink-500/20 border border-black/5 flex items-center justify-center">
                      {coupon.discount_type === "percent" ? (
                        <Percent className="w-5 h-5 text-teal-400" />
                      ) : (
                        <IndianRupee className="w-5 h-5 text-teal-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold text-slate-900 font-mono tracking-wider">
                          {coupon.code}
                        </code>
                        <button 
                          onClick={() => handleCopy(coupon.code)}
                          className="p-1 rounded hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/20 text-[10px]">
                          {coupon.discount_type === "percent"
                            ? `${coupon.discount_value}% OFF`
                            : `₹${coupon.discount_value} OFF`}
                        </Badge>
                        {isExpired && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/20 text-[10px]">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openModal(coupon)}
                      className="p-2 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(coupon.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Usage</span>
                    <span className="text-slate-600 font-mono">
                      {coupon.used_count} {coupon.max_uses ? `/ ${coupon.max_uses}` : "uses"}
                    </span>
                  </div>
                  {coupon.max_uses ? (
                    <>
                      <Progress value={usagePercent} className="h-1.5 bg-black/5" />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{usagePercent}% used</span>
                        {coupon.expires_at && (
                          <span>
                            Expires{" "}
                            {new Date(coupon.expires_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                    </>
                  ) : coupon.expires_at ? (
                    <div className="flex justify-end text-xs text-slate-400">
                      <span>
                        Expires{" "}
                        {new Date(coupon.expires_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCoupon ? "Edit Coupon" : "Create Coupon"}
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
                  <label className="text-xs font-semibold text-slate-600">Coupon Code</label>
                  <Input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="EARLYBIRD50"
                    className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}
                      className="w-full h-10 px-3 py-2 text-sm bg-black/5 border border-transparent rounded-xl focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Discount Value</label>
                    <Input
                      type="number"
                      min="0"
                      step={discountType === "percent" ? "1" : "0.01"}
                      max={discountType === "percent" ? "100" : undefined}
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percent" ? "50" : "500"}
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Max Uses (Optional)</label>
                    <Input
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Unlimited"
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Expires At (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="bg-black/5 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>
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
                  {editingCoupon ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
