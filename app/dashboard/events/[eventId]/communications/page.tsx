"use client";

import { useState } from "react";
import { mockEmailTemplates } from "@/lib/mock-data";
import { Mail, Save, Eye, ToggleLeft, ToggleRight, Variable, Paperclip, Ticket } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const triggerLabels: Record<string, string> = {
  invitation: "Invitation",
  confirmation: "Confirmation",
  checkin: "Check-in",
  post_thankyou: "Thank You",
  post_sorry: "Sorry (No-show)",
};

export default function CommunicationsPage() {
  const [activeTemplate, setActiveTemplate] = useState(mockEmailTemplates[0].trigger_type);
  const template = mockEmailTemplates.find((t) => t.trigger_type === activeTemplate)!;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
          <p className="text-slate-500 text-sm mt-1">Configure email templates for each trigger</p>
        </div>
      </div>

      <Tabs value={activeTemplate} onValueChange={setActiveTemplate} className="space-y-6">
        <TabsList className="bg-black/5 border border-black/5 p-1 rounded-xl flex-wrap h-auto">
          {mockEmailTemplates.map((tmpl) => (
            <TabsTrigger
              key={tmpl.trigger_type}
              value={tmpl.trigger_type}
              className="data-[state=active]:bg-black/[0.03] data-[state=active]:text-slate-900 text-slate-500 rounded-lg px-4 py-2 text-sm"
            >
              <Mail className="w-3.5 h-3.5 mr-2" />
              {triggerLabels[tmpl.trigger_type]}
              {tmpl.is_active && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {mockEmailTemplates.map((tmpl) => (
          <TabsContent key={tmpl.trigger_type} value={tmpl.trigger_type} className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Editor */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700">Template Editor</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Active</span>
                    {tmpl.is_active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Subject</label>
                  <Input
                    defaultValue={tmpl.subject}
                    className="bg-black/5 border-black/5 text-slate-900 placeholder:text-slate-400 rounded-xl"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-500">Body (HTML)</label>
                    <button className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                      <Variable className="w-3 h-3" /> Insert Variable
                    </button>
                  </div>
                  <Textarea
                    defaultValue={tmpl.body_html}
                    rows={10}
                    className="bg-black/5 border-black/5 text-slate-900 placeholder:text-slate-400 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-black/5 text-slate-500 border-black/5 text-[10px] cursor-pointer hover:bg-black/[0.03]">
                    {"{{name}}"}
                  </Badge>
                  <Badge className="bg-black/5 text-slate-500 border-black/5 text-[10px] cursor-pointer hover:bg-black/[0.03]">
                    {"{{email}}"}
                  </Badge>
                  <Badge className="bg-black/5 text-slate-500 border-black/5 text-[10px] cursor-pointer hover:bg-black/[0.03]">
                    {"{{event_name}}"}
                  </Badge>
                  <Badge className="bg-black/5 text-slate-500 border-black/5 text-[10px] cursor-pointer hover:bg-black/[0.03]">
                    {"{{event_date}}"}
                  </Badge>
                  <Badge className="bg-black/5 text-slate-500 border-black/5 text-[10px] cursor-pointer hover:bg-black/[0.03]">
                    {"{{ticket_type}}"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-white/[0.06]">
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <Ticket className="w-3.5 h-3.5" />
                    <input type="checkbox" defaultChecked={tmpl.include_ticket} className="rounded border-black/10" />
                    Attach Ticket
                  </label>
                  <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                    <Paperclip className="w-3.5 h-3.5" /> Add Attachment
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-sm flex-1 justify-center">
                    <Save className="w-4 h-4" /> Save Template
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-black/5 text-slate-700 border border-black/5 hover:bg-black/[0.03] transition-all">
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-medium text-slate-700 mb-4">Live Preview</h3>
                <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06]">
                  <div className="mb-3 pb-3 border-b border-white/[0.06]">
                    <p className="text-xs text-slate-400">Subject:</p>
                    <p className="text-sm text-slate-900 font-medium">
                      {tmpl.subject.replace("{{event_name}}", "DevConnect 2025")}
                    </p>
                  </div>
                  <div
                    className="text-sm text-slate-700 leading-relaxed [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-slate-900 [&>h1]:mb-2 [&>p]:mb-2"
                    dangerouslySetInnerHTML={{
                      __html: tmpl.body_html
                        .replace(/\{\{name\}\}/g, "Arjun Mehta")
                        .replace(/\{\{event_name\}\}/g, "DevConnect 2025")
                        .replace(/\{\{event_date\}\}/g, "Aug 15, 2025")
                        .replace(/\{\{checkin_time\}\}/g, "10:30 AM"),
                    }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
