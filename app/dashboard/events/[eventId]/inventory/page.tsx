"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Package, Download, Pencil, Trash2, X, Loader2, Navigation } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { createInventoryItem, updateInventoryItem, deleteInventoryItem, InventoryInput } from "./actions";

interface InventoryItem {
  id: string;
  name: string;
  total_quantity: number;
  distributed_count: number;
}

export default function InventoryPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const loadItems = async () => {
    setLoading(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setItems([
          { id: "mock-1", name: "Premium T-Shirt", total_quantity: 500, distributed_count: 243 },
          { id: "mock-2", name: "Welcome Kit", total_quantity: 1000, distributed_count: 890 },
          { id: "mock-3", name: "Lunch Coupon", total_quantity: 1500, distributed_count: 1450 },
          { id: "mock-4", name: "VIP Badge", total_quantity: 50, distributed_count: 12 },
        ]);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: unknown) {
      console.error("Error loading inventory:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load inventory: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [eventId]);

  const openModal = (item: InventoryItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setQuantity(item.total_quantity.toString());
    } else {
      setEditingItem(null);
      setName("");
      setQuantity("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity) {
      toast.error("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      const itemInput: InventoryInput = {
        name,
        total_quantity: parseInt(quantity),
      };

      if (isMock) {
        if (editingItem) {
          setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...itemInput } : i));
          toast.success("Item updated successfully (mock)");
        } else {
          setItems(prev => [...prev, {
            id: `inv-mock-${Date.now()}`,
            distributed_count: 0,
            ...itemInput
          }]);
          toast.success("Item added successfully (mock)");
        }
      } else {
        if (editingItem) {
          const res = await updateInventoryItem(editingItem.id, itemInput);
          if (res.success) {
            toast.success("Item updated successfully");
            loadItems();
          } else {
            toast.error(res.error || "Failed to update item");
          }
        } else {
          const res = await createInventoryItem(eventId, itemInput);
          if (res.success) {
            toast.success("Item added successfully");
            loadItems();
          } else {
            toast.error(res.error || "Failed to add item");
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

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to completely remove this inventory item?")) return;

    try {
      const isMock = eventId.startsWith("evt-") || eventId === "evt_123";
      if (isMock) {
        setItems(prev => prev.filter(i => i.id !== itemId));
        toast.success("Item removed (mock)");
        return;
      }

      const res = await deleteInventoryItem(itemId);
      if (res.success) {
        toast.success("Item removed successfully");
        loadItems();
      } else {
        toast.error(res.error || "Failed to remove item");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An error occurred while removing.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Track goodies and perks distribution</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-black/5 text-slate-700 border border-black/5 hover:bg-black/[0.03] transition-all">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button 
            onClick={() => openModal()}
            className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center mt-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No inventory yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Track event goodies, T-Shirts, welcome kits, and lunch coupons by adding them to your inventory.</p>
          <button 
            onClick={() => openModal()}
            className="btn-gradient px-6 py-2 rounded-xl text-sm font-medium"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const percent = Math.min(100, Math.round((item.distributed_count / item.total_quantity) * 100));
            const remaining = item.total_quantity - item.distributed_count;
            return (
              <div key={item.id} className="glass-card p-5 animate-slide-up relative group" style={{ animationDelay: `${i * 80}ms` }}>
                
                {/* Hover Actions */}
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => openModal(item)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-black/5 flex items-center justify-center">
                    <Package className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="pr-16">
                    <h3 className="text-base font-semibold text-slate-900 truncate">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Total limit: {item.total_quantity}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center py-3 rounded-xl bg-slate-50 border border-slate-100/50">
                    <p className="text-xl font-bold text-slate-900">{item.distributed_count}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Distributed</p>
                  </div>
                  <div className="text-center py-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                    <p className="text-xl font-bold text-emerald-600">{remaining < 0 ? 0 : remaining}</p>
                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mt-0.5">Remaining</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distribution Progress</span>
                    <span className="text-xs font-bold text-slate-700">{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-1.5 bg-slate-100" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-pink-500" />
                {editingItem ? "Edit Item" : "Add Inventory Item"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Item Name</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Premium T-Shirt"
                    className="bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Quantity</label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 500"
                    className="bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl shadow-sm"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">How many of this item do you have in total?</p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gradient px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
