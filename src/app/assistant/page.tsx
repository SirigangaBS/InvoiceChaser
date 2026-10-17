"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import SendReminderModal from "@/components/SendReminderModal";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileText,
  User,
  Building,
  KeyRound,
} from "lucide-react";
import { formatINR, formatDate, getDaysOverdue } from "@/lib/utils";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AssistantContent() {
  const searchParams = useSearchParams();
  const preselectedInvoiceId = searchParams.get("invoiceId");
  const preselectedTone = searchParams.get("tone");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preselectedInvoiceId || "");
  const [tone, setTone] = useState<string>(preselectedTone || "Professional");
  const [customNote, setCustomNote] = useState<string>("");

  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [editableBody, setEditableBody] = useState<string>("");
  const [editableSubject, setEditableSubject] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [recentReminders, setRecentReminders] = useState<any[]>([]);

  const fetchOverdueInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter invoices that are not paid and not cancelled
        const eligible = data.filter(
          (inv) => inv.effectiveStatus !== "PAID" && inv.effectiveStatus !== "CANCELLED"
        );
        setInvoices(eligible);
        if (!selectedInvoiceId && eligible.length > 0) {
          setSelectedInvoiceId(eligible[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReminderHistory = async () => {
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      if (data?.history) {
        setRecentReminders(data.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOverdueInvoices();
    fetchReminderHistory();
  }, []);

  const handleGenerate = async () => {
    if (!selectedInvoiceId) return;
    try {
      setGenerating(true);
      const res = await fetch("/api/ai/generate-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          tone,
          customNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate reminder");

      setGeneratedDraft(data);
      setEditableSubject(data.subject);
      setEditableBody(data.body);
    } catch (err: any) {
      alert(err.message || "Error generating draft");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!editableBody) return;
    navigator.clipboard.writeText(`Subject: ${editableSubject}\n\n${editableBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);
  const daysOverdue = selectedInvoice ? getDaysOverdue(selectedInvoice.dueDate) : 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-lime-500 text-slate-950 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                AI Payment Follow-Up Studio
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Draft polite, personalized, high-converting payment follow-ups using trusted invoice records
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              <span>Prompt Injection Guard Active</span>
            </span>
          </div>
        </div>

        {/* 2 Column Main Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Invoice Context (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Select Invoice */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-lime-400">
                  Step 1: Target Invoice
                </span>
                <span className="text-xs text-slate-400">{invoices.length} Eligible</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Choose Invoice to Follow Up
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.client.name} ({formatINR(inv.totalPaise - inv.paidPaise)})
                    </option>
                  ))}
                  {invoices.length === 0 && (
                    <option value="">No pending invoices found</option>
                  )}
                </select>
              </div>

              {/* Factual Invoice Context Card */}
              {selectedInvoice && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-sm">{selectedInvoice.client.name}</div>
                      {selectedInvoice.client.businessName && (
                        <div className="text-[11px] text-slate-400">
                          {selectedInvoice.client.businessName}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-lime-400 font-bold">
                      {selectedInvoice.invoiceNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400">Amount Due:</span>
                      <div className="font-extrabold text-white text-sm">
                        {formatINR(selectedInvoice.totalPaise - selectedInvoice.paidPaise)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400">Due Date:</span>
                      <div className="font-medium text-slate-200">
                        {formatDate(selectedInvoice.dueDate)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Overdue Status:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        daysOverdue > 0 ? "text-rose-400" : "text-amber-400"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {daysOverdue > 0 ? `${daysOverdue} Days Overdue` : "Due Soon"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Tone & Preferences */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-lime-400">
                Step 2: Tone & Style
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Follow-Up Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Friendly", desc: "Gentle nudge, warm relationship" },
                    { name: "Professional", desc: "Balanced, businesslike reminder" },
                    { name: "Firm", desc: "Urgent, overdue escalation" },
                  ].map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setTone(t.name)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        tone === t.name
                          ? "bg-lime-500/20 text-lime-400 border-lime-500/50 shadow-sm"
                          : "bg-[#080C16] text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="font-bold text-xs">{t.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional Context for AI (e.g. milestone completed)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mention that Phase 2 source code was shared on Monday"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !selectedInvoiceId}
                className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-lime-500/20 transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? "Drafting Reminder..." : "Generate AI Reminder Draft"}
              </button>
            </div>
          </div>

          {/* Generated Result & Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Generated Follow-Up Draft</span>
                    {generatedDraft && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {generatedDraft.isSimulated ? "Demo Simulated AI" : "OpenAI gpt-4o-mini"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating || !selectedInvoiceId}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Regenerate draft"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!editableBody}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {!generatedDraft ? (
                  <div className="py-24 text-center text-slate-400 space-y-3">
                    <Sparkles className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                    <p className="text-xs">
                      Select an invoice on the left and click{" "}
                      <span className="text-lime-400 font-semibold">"Generate AI Reminder Draft"</span> to start.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={editableSubject}
                        onChange={(e) => setEditableSubject(e.target.value)}
                        className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Message Content (Click to edit directly)
                      </label>
                      <textarea
                        rows={11}
                        value={editableBody}
                        onChange={(e) => setEditableBody(e.target.value)}
                        className="w-full bg-[#080C16] border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-lime-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {generatedDraft && (
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Recipient: <span className="text-slate-200">{generatedDraft.clientEmail}</span>
                  </div>

                  <button
                    onClick={() =>
                      setIsSendModalOpen(true)
                    }
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-lg shadow-lime-500/20 transition active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Approve & Send Email</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reminder History Log */}
        <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white">Recent Follow-Up Activity & History</h2>
          {recentReminders.length === 0 ? (
            <p className="text-xs text-slate-400">No follow-ups recorded yet in this workspace.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Invoice #</th>
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Tone</th>
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold">Provider / Status</th>
                    <th className="pb-3 font-semibold text-right">Sent Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentReminders.slice(0, 6).map((rem: any) => (
                    <tr key={rem.id} className="hover:bg-slate-900/40">
                      <td className="py-3 font-mono font-semibold text-slate-200">
                        {rem.invoice?.invoiceNumber}
                      </td>
                      <td className="py-3 text-slate-300">{rem.invoice?.client?.name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-lime-400 border border-slate-700">
                          {rem.tone}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 max-w-xs truncate">{rem.subject}</td>
                      <td className="py-3">
                        <span className="text-[10px] text-slate-400">
                          {rem.provider === "RESEND" ? "Live Resend Email" : "Simulated Demo Send"}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400">
                        {formatDate(rem.sentAt || rem.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isSendModalOpen && generatedDraft && (
        <SendReminderModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          onSuccess={() => {
            fetchReminderHistory();
            fetchOverdueInvoices();
            alert("Reminder dispatched and recorded successfully!");
          }}
          reminderData={{
            invoiceId: generatedDraft.invoiceId,
            invoiceNumber: generatedDraft.invoiceNumber,
            recipientEmail: generatedDraft.clientEmail,
            clientName: generatedDraft.clientName,
            subject: editableSubject,
            body: editableBody,
            tone: tone,
            amountRupeesFormatted: generatedDraft.amountRupeesFormatted,
            isSimulated: generatedDraft.isSimulated,
          }}
        />
      )}
    </AppLayout>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090D16] p-8 text-slate-400 text-xs flex items-center justify-center">
          Loading AI studio...
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}

