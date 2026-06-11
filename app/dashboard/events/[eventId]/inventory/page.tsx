"use client";

import { mockInventoryItems } from "@/lib/mock-data";
import { Plus, Package, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function InventoryPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Track goodies and perks distribution</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-black/5 text-slate-700 border border-black/5 hover:bg-black/[0.03] transition-all">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {mockInventoryItems.map((item, i) => {
          const percent = Math.round((item.distributed_count / item.total_quantity) * 100);
          const remaining = item.total_quantity - item.distributed_count;
          return (
            <div key={item.id} className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-black/5 flex items-center justify-center">
                  <Package className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500">Total: {item.total_quantity}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-xl font-bold text-slate-900">{item.distributed_count}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Distributed</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-xl font-bold text-emerald-400">{remaining}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Remaining</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400">Distribution</span>
                  <span className="text-[10px] text-slate-400">{percent}%</span>
                </div>
                <Progress value={percent} className="h-1.5 bg-black/5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
