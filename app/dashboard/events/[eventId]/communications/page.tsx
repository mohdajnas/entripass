"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { mockEmailTemplates } from "@/lib/mock-data";
import { Mail, Save, Eye, ToggleLeft, ToggleRight, Variable, Paperclip, Ticket, Settings, Loader2, Send } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getEmailTemplates, updateTemplate, updateSmtpSettings, SmtpConfig, TemplateUpdate } from "./actions";

const triggerLabels: Record<string, string> = {
  invitation: "Invitation",
  confirmation: "Confirmation",
  checkin: "Check-in",
  post_thankyou: "Thank You",
  post_sorry: "Sorry (No-show)",
};

export default function CommunicationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invitation"); // or "settings"
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    smtp_host: "smtp.zoho.in",
    smtp_port: 465,
    smtp_user: "",
    smtp_pass: "",
  });

  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);

  // Active template state
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [includeTicket, setIncludeTicket] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const res = await getEmailTemplates(eventId);
      if (res.success && res.templates && res.templates.length > 0) {
        setTemplates(res.templates);
        // Load first template (invitation)
        const initTemplate = res.templates.find((t: any) => t.trigger_type === "invitation") || res.templates[0];
        loadTemplateState(initTemplate);
        
        // Load shared SMTP config from any template (they all share it)
        const firstWithSmtp = res.templates.find((t: any) => t.smtp_host);
        if (firstWithSmtp) {
          setSmtpConfig({
            smtp_host: firstWithSmtp.smtp_host,
            smtp_port: firstWithSmtp.smtp_port,
            smtp_user: firstWithSmtp.smtp_user || "",
            smtp_pass: firstWithSmtp.smtp_pass || "",
          });
        }
      } else {
        toast.error("Failed to load email templates");
      }
      setLoading(false);
    }
    loadData();
  }, [eventId]);

  const loadTemplateState = (tmpl: any) => {
    setSubject(tmpl.subject || "");
    setBodyHtml(tmpl.body_html || "");
    setIsActive(tmpl.is_active ?? false);
    setIncludeTicket(tmpl.include_ticket ?? false);
  };

  // When switching tabs between different templates
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val !== "settings") {
      const tmpl = templates.find((t) => t.trigger_type === val);
      if (tmpl) loadTemplateState(tmpl);
    }
  };

  const insertVariable = (variable: string) => {
    setBodyHtml(prev => prev + ` {{${variable}}}`);
  };

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    const tmpl = templates.find(t => t.trigger_type === activeTab);

    if (tmpl) {
      const updateData: TemplateUpdate = {
        subject,
        body_html: bodyHtml,
        is_active: isActive,
        include_ticket: includeTicket,
      };

      const res = await updateTemplate(tmpl.id, updateData);
      if (res.success) {
        toast.success("Template saved successfully");
        setTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, ...updateData } : t));
      } else {
        toast.error(res.error || "Failed to save template");
      }
    }
    setIsSavingTemplate(false);
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);

    const res = await updateSmtpSettings(eventId, smtpConfig);
    if (res.success) {
      toast.success("SMTP Settings updated successfully for all templates.");
    } else {
      toast.error(res.error || "Failed to save SMTP settings.");
    }
    setIsSavingSmtp(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const activeTemplateObj = templates.find(t => t.trigger_type === activeTab);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
          <p className="text-slate-500 text-sm mt-1">Configure email templates and mailing settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-black/5 border border-black/5 p-1 rounded-xl flex-wrap h-auto inline-flex overflow-hidden">
          {["invitation", "confirmation", "checkin", "post_thankyou", "post_sorry"].map((trigger) => {
            const tmpl = templates.find(t => t.trigger_type === trigger);
            if (!tmpl) return null;
            return (
              <TabsTrigger
                key={trigger}
                value={trigger}
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 rounded-lg px-4 py-2 text-sm transition-all"
              >
                <Mail className="w-3.5 h-3.5 mr-2" />
                {triggerLabels[trigger]}
                {tmpl.is_active && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
              </TabsTrigger>
            );
          })}
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 rounded-lg px-4 py-2 text-sm transition-all ml-2 border-l border-black/5"
          >
            <Settings className="w-3.5 h-3.5 mr-2" />
            SMTP Settings
          </TabsTrigger>
        </TabsList>

        {/* Dynamic Template Tabs Content */}
        {activeTab !== "settings" && activeTemplateObj && (
          <TabsContent value={activeTab} className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Editor */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Template Editor</h3>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsActive(!isActive)}>
                    <span className="text-xs font-bold text-slate-500">Active</span>
                    {isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Body (HTML)</label>
                  </div>
                  <Textarea
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    rows={12}
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl font-mono text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Insert Variables</p>
                  <div className="flex flex-wrap gap-2">
                    {["name", "email", "event_name", "event_date", "ticket_type", "checkin_time"].map((vr) => (
                      <Badge 
                        key={vr}
                        onClick={() => insertVariable(vr)}
                        className="bg-slate-100 text-slate-600 border-transparent text-[10px] cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        {`{{${vr}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <Ticket className="w-4 h-4 text-emerald-500" />
                    <input 
                      type="checkbox" 
                      checked={includeTicket} 
                      onChange={(e) => setIncludeTicket(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" 
                    />
                    Attach Ticket PDF
                  </label>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors ml-auto">
                    <Paperclip className="w-3.5 h-3.5" /> Attach File
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold flex-1 justify-center disabled:opacity-70"
                  >
                    {isSavingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Template
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all">
                    <Eye className="w-4 h-4 text-slate-400" /> Preview Test
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="glass-card p-5 h-fit sticky top-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Live Preview</h3>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-inner">
                  <div className="mb-4 pb-4 border-b border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</p>
                    <p className="text-sm text-slate-900 font-semibold mt-1">
                      {subject.replace(/\{\{event_name\}\}/g, "Tech Summit 2026")}
                    </p>
                  </div>
                  <div
                    className="text-sm text-slate-700 leading-relaxed font-medium [&>h1]:text-xl [&>h1]:font-black [&>h1]:text-slate-900 [&>h1]:mb-3 [&>p]:mb-3 [&>a]:text-emerald-600 [&>a]:underline"
                    dangerouslySetInnerHTML={{
                      __html: bodyHtml
                        .replace(/\{\{name\}\}/g, "Arjun Mehta")
                        .replace(/\{\{event_name\}\}/g, "Tech Summit 2026")
                        .replace(/\{\{event_date\}\}/g, "October 24, 2026")
                        .replace(/\{\{ticket_type\}\}/g, "VIP Pass")
                        .replace(/\{\{checkin_time\}\}/g, "10:30 AM"),
                    }}
                  />
                  
                  {includeTicket && (
                    <div className="mt-6 p-4 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs">
                      <Ticket className="w-4 h-4" /> [PDF Ticket Attached]
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* SMTP Settings Tab */}
        {activeTab === "settings" && (
          <TabsContent value="settings" className="animate-fade-in max-w-2xl">
            <div className="glass-card p-6 md:p-8">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Zoho Mail Integration</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Configure your custom SMTP server to send emails directly from your own domain. By default, we recommend <strong>Zoho Mail</strong> for reliable delivery.
                </p>
              </div>

              <form onSubmit={handleSaveSmtp} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">SMTP Host</label>
                    <Input
                      required
                      value={smtpConfig.smtp_host}
                      onChange={(e) => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})}
                      placeholder="smtp.zoho.in"
                      className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">SMTP Port</label>
                    <Input
                      required
                      type="number"
                      value={smtpConfig.smtp_port}
                      onChange={(e) => setSmtpConfig({...smtpConfig, smtp_port: parseInt(e.target.value)})}
                      placeholder="465"
                      className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Username</label>
                  <Input
                    required
                    type="email"
                    value={smtpConfig.smtp_user}
                    onChange={(e) => setSmtpConfig({...smtpConfig, smtp_user: e.target.value})}
                    placeholder="events@yourdomain.com"
                    className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-500 font-medium">Your Zoho Mail address.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">App Password</label>
                  <Input
                    required
                    type="password"
                    value={smtpConfig.smtp_pass}
                    onChange={(e) => setSmtpConfig({...smtpConfig, smtp_pass: e.target.value})}
                    placeholder="••••••••••••••••"
                    className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-500 font-medium">Use an App-Specific Password generated from Zoho Security settings, not your main account password.</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSmtp}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70"
                  >
                    {isSavingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Integration
                  </button>
                </div>
              </form>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
