"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import CreateInvoiceModal from "@/components/CreateInvoiceModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import SendReminderModal from "@/components/SendReminderModal";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Plus,
  RefreshCw,
  FileText,
  CreditCard,
  Send,
  Download,
  Calendar,
  DollarSign,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { formatINR, formatDate, getStatusBadgeInfo } from "@/lib/utils";
import Link from "next/link";
import { generateInvoicePdf } from "@/lib/pdfGenerator";

export default function CustomerDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any>(null);
  const [reminderModalData, setReminderModalData] = useState<any>(null);

  // AI Assistant Quick Panel state
  const [selectedAiInvoiceId, setSelectedAiInvoiceId] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("Professional");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const json = await res.json();
      setData(json);

      if (json.upcomingReminders?.length > 0 && !selectedAiInvoiceId) {
        setSelectedAiInvoiceId(json.upcomingReminders[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleGenerateAiReminder = async () => {
    if (!selectedAiInvoiceId) return;
    try {
      setAiGenerating(true);
      const res = await fetch("/api/ai/generate-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedAiInvoiceId,
          tone: selectedTone,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to generate reminder");
      setGeneratedDraft(result);
    } catch (err: any) {
      alert(err.message || "Error generating AI draft");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) throw new Error("Failed to load invoice for PDF");
      const inv = await res.json();
      generateInvoicePdf({
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        description: inv.description,
        subtotalPaise: inv.subtotalPaise,
        taxRatePercent: inv.taxRatePercent,
        taxPaise: inv.taxPaise,
        totalPaise: inv.totalPaise,
        status: inv.effectiveStatus,
        paymentLink: inv.paymentLink,
        notes: inv.notes,
        items: inv.items,
        client: inv.client,
        user: inv.user,
      });
    } catch (e: any) {
      alert("Error generating PDF: " + e.message);
    }
  };

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <RefreshCw className="w-8 h-8 text-lime-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading InvoiceChaser workspace...</p>
        </div>
      </AppLayout>
    );
  }

  const metrics = data?.metrics || {
    outstandingPaise: 18450000,
    overduePaise: 4200000,
    collectedMonthPaise: 32600000,
    collectionRate: 86,
  };

  const maxChartValue = Math.max(
    ...(data?.monthlyChart?.map((m: any) => Math.max(m.collected, m.invoiced)) || [400000])
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-lime-500/15 text-lime-400 border border-lime-500/30">
                Verified Customer Workspace
              </span>
              <span className="text-xs text-slate-500">Paise Precision Accounting</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Financial Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time payment tracking and automated follow-ups for {data?.user?.businessName || "Aarav Creative Studio"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateInvoiceOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Outstanding */}
          <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Outstanding</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatINR(metrics.outstandingPaise)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Awaiting client clearance
            </div>
          </div>

          {/* Overdue */}
          <div className="p-5 rounded-2xl bg-[#0F1629] border border-rose-950/60 shadow-xl relative overflow-hidden group hover:border-rose-900 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Overdue Amount</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
              {formatINR(metrics.overduePaise)}
            </div>
            <div className="mt-2 text-[11px] text-rose-400/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
              Requires smart follow-up
            </div>
          </div>

          {/* Collected This Month */}
          <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Collected This Month</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {formatINR(metrics.collectedMonthPaise)}
            </div>
            <div className="mt-2 text-[11px] text-emerald-400/80 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Direct to verified UPI / Bank
            </div>
          </div>

          {/* Collection Rate */}
          <div className="p-5 rounded-2xl bg-[#0F1629] border border-lime-950/50 shadow-xl relative overflow-hidden group hover:border-lime-900 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-lime-300">Collection Rate</span>
              <div className="w-8 h-8 rounded-lg bg-lime-500/15 text-lime-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-lime-400 tracking-tight">
              {metrics.collectionRate}%
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-lime-400 font-semibold">+14%</span> vs freelancer benchmark
            </div>
          </div>
        </div>

        {/* Charts & AI Assistant Panel (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Collection Bar Chart (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Monthly Collection Dynamics</h3>
                <p className="text-xs text-slate-400">Invoiced vs Actual Realized Collections (INR)</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded-sm bg-lime-500"></span> Collected
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-sm bg-slate-700"></span> Invoiced
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-56 w-full pt-4 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-800 pb-2">
              {data?.monthlyChart?.map((item: any, idx: number) => {
                const collectedHeight = Math.max(12, Math.round((item.collected / (maxChartValue * 1.15)) * 100));
                const invoicedHeight = Math.max(16, Math.round((item.invoiced / (maxChartValue * 1.15)) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[10px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      ₹{(item.collected / 1000).toFixed(0)}k
                    </div>
                    <div className="w-full max-w-[40px] flex items-end justify-center gap-1.5 h-full">
                      {/* Invoiced Bar */}
                      <div
                        style={{ height: `${invoicedHeight}%` }}
                        className="w-1/2 bg-slate-700 hover:bg-slate-600 rounded-t-sm transition-all duration-300"
                        title={`Invoiced: ₹${item.invoiced.toLocaleString("en-IN")}`}
                      ></div>
                      {/* Collected Bar */}
                      <div
                        style={{ height: `${collectedHeight}%` }}
                        className="w-1/2 bg-lime-500 hover:bg-lime-400 rounded-t-sm transition-all duration-300 shadow-sm shadow-lime-500/30"
                        title={`Collected: ₹${item.collected.toLocaleString("en-IN")}`}
                      ></div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 font-medium">{item.month}</div>
                  </div>
                );
              })}
            </div>
            <div className="pt-3 text-[11px] text-slate-400 flex justify-between">
              <span>* Data updated automatically from stored client invoices & settled payments</span>
              <Link href="/invoices" className="text-lime-400 hover:underline flex items-center gap-1">
                View all records <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* AI Payment Assistant Panel (1 col) */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#111B33] to-[#0D1426] border border-lime-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
              <Sparkles className="w-32 h-32 text-lime-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-lime-500 text-slate-950 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">AI Payment Assistant</h3>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-500/30">
                  SMART AGENT
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Generates polite, persuasive payment follow-ups strictly from factual invoice data.
              </p>

              {/* Form Controls */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Select Overdue Invoice
                  </label>
                  <select
                    value={selectedAiInvoiceId}
                    onChange={(e) => setSelectedAiInvoiceId(e.target.value)}
                    className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
                  >
                    {data?.upcomingReminders?.map((rem: any) => (
                      <option key={rem.id} value={rem.id}>
                        {rem.invoiceNumber} — {rem.clientName} ({formatINR(rem.totalPaise - rem.paidPaise)})
                      </option>
                    ))}
                    {(!data?.upcomingReminders || data.upcomingReminders.length === 0) && (
                      <option value="">No overdue invoices pending!</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Select Tone
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Friendly", "Professional", "Firm"].map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setSelectedTone(tone)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                          selectedTone === tone
                            ? "bg-lime-500 text-slate-950 border-lime-400 font-bold"
                            : "bg-[#080C16] text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiReminder}
                  disabled={aiGenerating || !selectedAiInvoiceId}
                  className="w-full mt-2 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-lg shadow-lime-500/20 transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiGenerating ? "Generating Reminder..." : "Generate AI Reminder Draft"}
                </button>
              </div>
            </div>

            {/* Generated Preview or Quick Action */}
            {generatedDraft ? (
              <div className="mt-4 p-3 rounded-xl bg-[#080C16] border border-lime-500/40 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-lime-400 text-[11px]">Draft Ready</span>
                  <span className="text-[10px] text-slate-400">
                    {generatedDraft.isSimulated ? "Demo AI Mode" : "OpenAI Live"}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] line-clamp-3 font-mono">
                  {generatedDraft.body}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href={`/assistant?invoiceId=${selectedAiInvoiceId}&tone=${selectedTone}`}
                    className="text-xs text-lime-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    Open in AI Studio <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => setReminderModalData(generatedDraft)}
                    className="px-3 py-1 bg-lime-500 text-slate-950 font-bold rounded-lg text-[11px] hover:bg-lime-400"
                  >
                    Send Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Safe prompt architecture</span>
                <Link href="/assistant" className="text-lime-400 hover:underline flex items-center gap-1">
                  Full Assistant <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 2 Bottom Tables: Recent Invoices & Upcoming Follow-ups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Recent Invoices</h3>
                <p className="text-xs text-slate-400">Latest billing records and current status</p>
              </div>
              <Link
                href="/invoices"
                className="text-xs text-lime-400 hover:text-lime-300 font-semibold flex items-center gap-1"
              >
                View All ({metrics.activeInvoicesCount}) <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Invoice #</th>
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data?.recentInvoices?.map((inv: any) => {
                    const badge = getStatusBadgeInfo(inv.effectiveStatus);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 font-mono font-semibold text-slate-200">
                          <Link href={`/invoices/${inv.id}`} className="hover:text-lime-400">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-slate-200">{inv.clientName}</div>
                          {inv.clientCompany && (
                            <div className="text-[10px] text-slate-400">{inv.clientCompany}</div>
                          )}
                        </td>
                        <td className="py-3 text-slate-300">{formatDate(inv.dueDate)}</td>
                        <td className="py-3 font-semibold text-white">
                          {formatINR(inv.totalPaise)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => handleDownloadPdf(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                            title="Download PDF Invoice"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {inv.effectiveStatus !== "PAID" && (
                            <button
                              onClick={() =>
                                setPaymentModalInvoice({
                                  id: inv.id,
                                  invoiceNumber: inv.invoiceNumber,
                                  clientName: inv.clientName,
                                  totalPaise: inv.totalPaise,
                                  paidPaise: inv.paidPaise || 0,
                                })
                              }
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium"
                              title="Record payment"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed (1 col) */}
          <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Recent Activity</h3>
                <p className="text-xs text-slate-400">Audit trail of payments & reminders</p>
              </div>
              <Link
                href="/timeline"
                className="text-xs text-lime-400 hover:underline flex items-center gap-1"
              >
                Timeline <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {data?.recentActivity?.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-lime-400">
                      {act.action.replace("_", " ")}
                    </span>
                    <span>{formatDate(act.createdAt)}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{act.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSuccess={fetchDashboard}
      />

      {paymentModalInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentModalInvoice)}
          onClose={() => setPaymentModalInvoice(null)}
          onSuccess={fetchDashboard}
          invoice={paymentModalInvoice}
        />
      )}

      {reminderModalData && (
        <SendReminderModal
          isOpen={Boolean(reminderModalData)}
          onClose={() => setReminderModalData(null)}
          onSuccess={() => {
            fetchDashboard();
            alert("Reminder dispatched successfully!");
          }}
          reminderData={reminderModalData}
        />
      )}
    </AppLayout>
  );
}
