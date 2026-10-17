"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  BellRing,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function RemindersPage() {
  const [data, setData] = useState<{ history: any[]; suggestions: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reminders");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleCheckDueReminders = async () => {
    setChecking(true);
    await fetchReminders();
    setTimeout(() => {
      setChecking(false);
      alert("Due reminders scanned! All stage-qualified overdue and pending invoices are listed below.");
    }, 400);
  };

  const scheduleStages = [
    { stage: "Stage 1", timing: "1 Day Before Due Date (-1d)", tone: "Friendly", color: "text-blue-400" },
    { stage: "Stage 2", timing: "On Due Date (0d)", tone: "Friendly", color: "text-lime-400" },
    { stage: "Stage 3", timing: "3 Days Overdue (+3d)", tone: "Professional", color: "text-amber-400" },
    { stage: "Stage 4", timing: "7+ Days Overdue (+7d)", tone: "Firm", color: "text-rose-400" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <BellRing className="w-7 h-7 text-lime-400" />
              Smart Follow-Up Schedule
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Automated multi-stage escalation rules for overdue receivables
            </p>
          </div>

          <button
            onClick={handleCheckDueReminders}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-500/20 transition active:scale-95 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Scanning Due Invoices..." : "Check Due Reminders"}</span>
          </button>
        </div>

        {/* 4-Stage Rule Visualizer */}
        <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Escalation Cadence Pipeline</h2>
            <span className="text-[11px] text-slate-400">Halts automatically when paid</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scheduleStages.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 relative"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${s.color}`}>
                    {s.stage}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {s.tone}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white mt-1">{s.timing}</div>
                <p className="text-[10px] text-slate-400">
                  {idx === 0
                    ? "Courteous heads-up before deadline"
                    : idx === 1
                    ? "Polite reminder with UPI/Bank details"
                    : idx === 2
                    ? "Professional business escalation"
                    : "Firm follow-up for settlement"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Due Invoices Recommended for Follow-Up */}
        <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Recommended Follow-Ups Today</h2>
              <p className="text-xs text-slate-400">Invoices meeting schedule triggers</p>
            </div>
            <span className="text-xs font-semibold text-lime-400">
              {data?.suggestions?.length || 0} Actionable
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Scanning schedule...</div>
          ) : !data?.suggestions || data.suggestions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>Great news! No invoices currently overdue or due today needing reminders.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {data.suggestions.map((sug: any) => (
                <div
                  key={sug.invoiceId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800 gap-3 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">{sug.invoiceNumber}</span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-slate-200 text-xs font-semibold">{sug.clientName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {sug.scheduleStage}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Due: {formatDate(sug.dueDate)}</span>
                      <span>Amount: {formatINR(sug.totalPaise - sug.paidPaise)}</span>
                      {sug.lastReminderSentAt && (
                        <span>Last Sent: {formatDate(sug.lastReminderSentAt)}</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/assistant?invoiceId=${sug.invoiceId}&tone=${sug.recommendedTone}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition active:scale-95 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Draft {sug.recommendedTone} Reminder</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complete Sent Reminders History */}
        <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white">Full Sent Reminders Log</h2>
          {!data?.history || data.history.length === 0 ? (
            <p className="text-xs text-slate-400">No sent reminder history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Date Sent</th>
                    <th className="pb-3 font-semibold">Invoice #</th>
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Tone</th>
                    <th className="pb-3 font-semibold">Channel</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.history.map((h: any) => (
                    <tr key={h.id} className="hover:bg-slate-900/40">
                      <td className="py-3 text-slate-400">{formatDate(h.sentAt || h.createdAt)}</td>
                      <td className="py-3 font-mono font-semibold text-slate-200">
                        {h.invoice?.invoiceNumber}
                      </td>
                      <td className="py-3 text-slate-300">{h.invoice?.client?.name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-lime-400">
                          {h.tone}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {h.provider === "RESEND" ? "Live Resend Email" : "Simulated Demo Send"}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
