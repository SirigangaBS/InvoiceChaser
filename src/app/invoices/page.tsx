"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import CreateInvoiceModal from "@/components/CreateInvoiceModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  CreditCard,
  Sparkles,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { formatINR, formatDate, getStatusBadgeInfo, getDaysOverdue } from "@/lib/utils";
import Link from "next/link";
import { generateInvoicePdf } from "@/lib/pdfGenerator";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function InvoicesContent() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter !== "ALL") query.set("status", statusFilter);

      const res = await fetch(`/api/invoices?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleDownloadPdf = async (invId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invId}`);
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

  const handleCancelInvoice = async (invId: string, invoiceNum: string) => {
    if (!confirm(`Are you sure you want to cancel ${invoiceNum}?`)) return;
    try {
      const res = await fetch(`/api/invoices/${invId}`, { method: "DELETE" });
      if (res.ok) {
        fetchInvoices();
      } else {
        alert("Failed to cancel invoice");
      }
    } catch {
      alert("Error cancelling invoice");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <FileText className="w-7 h-7 text-lime-400" />
              Invoices
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Create, manage, download GST invoices, and track payment clearance
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-500/20 transition active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by invoice #, client, or purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#080C16] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {["ALL", "OVERDUE", "SENT", "REMINDER_SENT", "PAID", "DRAFT"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === status
                    ? "bg-lime-500 text-slate-950 font-bold"
                    : "bg-[#080C16] text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                {status === "ALL" ? "All Invoices" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl overflow-hidden">
          {loading && invoices.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-lime-400" />
              <span className="text-xs">Loading invoice records...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm">No invoices found matching your search or filters.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
                className="text-xs text-lime-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-semibold">Invoice #</th>
                    <th className="py-3.5 px-4 font-semibold">Client</th>
                    <th className="py-3.5 px-4 font-semibold">Description</th>
                    <th className="py-3.5 px-4 font-semibold">Due Date</th>
                    <th className="py-3.5 px-4 font-semibold">Amount (INR)</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices.map((inv) => {
                    const badge = getStatusBadgeInfo(inv.effectiveStatus);
                    const daysOverdue = getDaysOverdue(inv.dueDate);
                    const remainingPaise = Math.max(0, inv.totalPaise - inv.paidPaise);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="hover:text-lime-400 flex items-center gap-1.5"
                          >
                            {inv.invoiceNumber}
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-200">{inv.client.name}</div>
                          {inv.client.businessName && (
                            <div className="text-[10px] text-slate-400">{inv.client.businessName}</div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-300 max-w-xs truncate">
                          {inv.description}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-200">{formatDate(inv.dueDate)}</div>
                          {daysOverdue > 0 && inv.effectiveStatus === "OVERDUE" && (
                            <span className="text-[10px] text-rose-400 font-semibold">
                              {daysOverdue}d overdue
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-white">{formatINR(inv.totalPaise)}</div>
                          {inv.paidPaise > 0 && inv.paidPaise < inv.totalPaise && (
                            <div className="text-[10px] text-lime-400">
                              Paid: {formatINR(inv.paidPaise)}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-1.5">
                          {/* AI Assistant Quick Follow-up */}
                          {inv.effectiveStatus !== "PAID" && inv.effectiveStatus !== "CANCELLED" && (
                            <Link
                              href={`/assistant?invoiceId=${inv.id}`}
                              className="inline-flex p-1.5 text-lime-400 hover:text-lime-300 rounded hover:bg-slate-800 transition"
                              title="Draft AI Follow-up Reminder"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPdf(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payment */}
                          {inv.effectiveStatus !== "PAID" && inv.effectiveStatus !== "CANCELLED" && (
                            <button
                              onClick={() =>
                                setPaymentModalInvoice({
                                  id: inv.id,
                                  invoiceNumber: inv.invoiceNumber,
                                  clientName: inv.client.name,
                                  totalPaise: inv.totalPaise,
                                  paidPaise: inv.paidPaise || 0,
                                })
                              }
                              className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold transition"
                              title="Record payment"
                            >
                              Pay
                            </button>
                          )}

                          {/* Cancel */}
                          {inv.effectiveStatus !== "CANCELLED" && (
                            <button
                              onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                              title="Cancel / Delete invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchInvoices}
      />

      {paymentModalInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentModalInvoice)}
          onClose={() => setPaymentModalInvoice(null)}
          onSuccess={fetchInvoices}
          invoice={paymentModalInvoice}
        />
      )}
    </AppLayout>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090D16] p-8 text-slate-400 text-xs flex items-center justify-center">
          Loading invoices...
        </div>
      }
    >
      <InvoicesContent />
    </Suspense>
  );
}

