"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export function CanvaConnectPanel({
  eventId,
  onImageExported,
}: {
  eventId: string;
  onImageExported: (exportUrl: string) => void;
}) {
  const [isChecking, setIsChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/canva/designs");
      if (res.ok) {
        setIsConnected(true);
        const data = await res.json();
        setDesigns(data.designs || []);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error(err);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnect = () => {
    window.location.href = `/api/auth/canva?eventId=${eventId}`;
  };

  const handleSelectDesign = async (designId: string) => {
    setExportingId(designId);
    try {
      // 1. Start the export job
      const startRes = await fetch("/api/canva/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId }),
      });
      const startData = await startRes.json();

      if (!startRes.ok) throw new Error(startData.error || "Failed to start export");

      const jobId = startData.jobId;

      // 2. Poll the job status
      const pollExport = async () => {
        const pollRes = await fetch(`/api/canva/export?jobId=${jobId}`);
        const pollData = await pollRes.json();
        
        if (!pollRes.ok) throw new Error(pollData.error || "Failed to check export status");

        const status = pollData.job.status;
        if (status === "success") {
          const url = pollData.job.urls[0];
          toast.success("Successfully imported from Canva!");
          onImageExported(url);
          setExportingId(null);
        } else if (status === "failed") {
          throw new Error("Canva export failed");
        } else {
          // Still in progress, poll again in 1.5 seconds
          setTimeout(pollExport, 1500);
        }
      };

      await pollExport();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to export design from Canva");
      setExportingId(null);
    }
  };

  if (isChecking) {
    return (
      <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="w-full p-5 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 8c.5-3 1-5 4-7"/></svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Import from Canva</h4>
            <p className="text-[10px] text-slate-500">Connect your account to use your designs.</p>
          </div>
        </div>
        <button
          onClick={handleConnect}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
        >
          Connect Canva Account
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Your Canva Designs
        </label>
        <button onClick={checkConnection} className="text-[10px] text-blue-600 hover:underline">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
        {designs.length === 0 ? (
          <div className="col-span-2 text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <span className="text-[10px] text-slate-500">No designs found.</span>
          </div>
        ) : (
          designs.map((design) => (
            <button
              key={design.id}
              onClick={() => handleSelectDesign(design.id)}
              disabled={exportingId !== null}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                exportingId === design.id 
                  ? "border-emerald-500" 
                  : "border-slate-200 hover:border-blue-400"
              }`}
            >
              {/* Canva provides thumbnail URLs in design.thumbnail.url */}
              {design.thumbnail?.url ? (
                <img 
                  src={design.thumbnail.url} 
                  alt={design.title || "Design"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">Select</span>
              </div>

              {exportingId === design.id && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 mb-1" />
                  <span className="text-[9px] font-bold text-emerald-700">Importing...</span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
