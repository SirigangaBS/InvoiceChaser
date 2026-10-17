"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import {
  FileText,
  ArrowLeft,
  Download,
  CreditCard,
  Sparkles,
  Calendar,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { formatINR, formatDate, getStatusBadgeInfo, getDaysOverdue } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/pdfGenerator";
import { Suspense } from "react";
import Link from "next/link";

function InvoiceDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Invoice not found");
      const data = await res.json();
      setInvoice(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const handleDownloadPdf = () => {
    if (!invoice) return;
    generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      description: invoice.description,
      subtotalPaise: invoice.subtotalPaise,
      taxRatePercent: invoice.taxRatePercent,
      taxPaise: invoice.taxPaise,
      totalPaise: invoice.totalPaise,
      status: invoice.effectiveStatus,
      paymentLink: invoice.paymentLink,
      notes: invoice.notes,
      items: invoice.items,
      client: invoice.client,
      user: invoice.user,
    });
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchInvoice();
      }
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  if (loading && !invoice) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-2 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-lime-400" />
          <span className="text-xs">Loading invoice details...</span>
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="text-center py-24 space-y-3">
          <p className="text-slate-400">Invoice not found or deleted.</p>
          <Link href="/invoices" className="text-lime-400 text-xs hover:underline">
            ← Back to all invoices
          </Link>
        </div>
      </AppLayout>
    );
  }

  const badge = getStatusBadgeInfo(invoice.effectiveStatus);
  const remainingPaise = Math.max(0, invoice.totalPaise - invoice.paidPaise);
  const daysOverdue = getDaysOverdue(invoice.dueDate);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono">
                  {invoice.invoiceNumber}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{invoice.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {invoice.effectiveStatus !== "PAID" && invoice.effectiveStatus !== "CANCELLED" && (
              <Link
                href={`/assistant?invoiceId=${invoice.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-400 hover:bg-lime-500/25 text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Follow-Up</span>
              </Link>
            )}

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {invoice.effectiveStatus !== "PAID" && invoice.effectiveStatus !== "CANCELLED" && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Invoice Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Deliverables Table */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
                Itemized Deliverables & Services
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2 font-semibold">Description</th>
                      <th className="pb-2 font-semibold text-center">Qty</th>
                      <th className="pb-2 font-semibold text-right">Rate</th>
                      <th className="pb-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoice.items?.map((it: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3 text-slate-200 font-medium">{it.description}</td>
                        <td className="py-3 text-center text-slate-400">{it.quantity}</td>
                        <td className="py-3 text-right text-slate-300">
                          ₹{Number(it.rate).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 text-right font-semibold text-white">
                          ₹{Number(it.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    {(!invoice.items || invoice.items.length === 0) && (
                      <tr>
                        <td className="py-3 text-slate-200 font-medium">{invoice.description}</td>
                        <td className="py-3 text-center text-slate-400">1</td>
                        <td className="py-3 text-right text-slate-300">
                          {formatINR(invoice.subtotalPaise)}
                        </td>
                        <td className="py-3 text-right font-semibold text-white">
                          {formatINR(invoice.subtotalPaise)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-slate-200">{formatINR(invoice.subtotalPaise)}</span>
                </div>
                {invoice.taxRatePercent > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax / GST ({invoice.taxRatePercent}%):</span>
                    <span className="text-slate-200">+{formatINR(invoice.taxPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Amount:</span>
                  <span className="text-lime-400">{formatINR(invoice.totalPaise)}</span>
                </div>
                {invoice.paidPaise > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-emerald-400">
                    <span>Paid to Date:</span>
                    <span>-{formatINR(invoice.paidPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-200 pt-2 border-t border-slate-800/60">
                  <span>Outstanding Balance:</span>
                  <span className={remainingPaise > 0 ? "text-rose-400" : "text-emerald-400"}>
                    {formatINR(remainingPaise)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white">Recorded Payments History</h2>
              {invoice.payments?.length === 0 ? (
                <p className="text-xs text-slate-400">No payments recorded yet for this invoice.</p>
              ) : (
                <div className="space-y-2">
                  {invoice.payments?.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-semibold text-white">{formatINR(p.amountPaise)}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.paymentMethod} • {formatDate(p.paymentDate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">{p.referenceNote}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reminder History for this Invoice */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white">Follow-Up & Reminder Logs</h2>
              {invoice.reminders?.length === 0 ? (
                <p className="text-xs text-slate-400">No automated reminders sent yet.</p>
              ) : (
                <div className="space-y-2">
                  {invoice.reminders?.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lime-400 flex items-center gap-1">
                          <Send className="w-3 h-3" /> {r.tone} Tone Follow-Up
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(r.sentAt || r.createdAt)}</span>
                      </div>
                      <div className="text-slate-300 font-mono text-[11px] line-clamp-2 bg-slate-950 p-2 rounded">
                        {r.body}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Recipient: {r.recipientEmail} • Provider: {r.provider}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client & Banking Details Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Client Info Card */}
            <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To</span>
              <div>
                <h3 className="text-base font-bold text-white">{invoice.client.name}</h3>
                {invoice.client.businessName && (
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {invoice.client.businessName}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-lime-400" />
                  <span>{invoice.client.email}</span>
                </div>
                {invoice.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{invoice.client.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Key Dates Card */}
            <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-2.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Schedule</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Issue Date:</span>
                <span className="text-white font-medium">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date:</span>
                <span className="text-white font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
              {daysOverdue > 0 && invoice.effectiveStatus === "OVERDUE" && (
                <div className="flex justify-between text-rose-400 font-semibold pt-1 border-t border-slate-800">
                  <span>Overdue Duration:</span>
                  <span>{daysOverdue} Days</span>
                </div>
              )}
            </div>

            {/* Payment Instructions Card */}
            <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your Payment Credentials
              </span>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">UPI ID:</span>
                <div className="text-lime-400 font-mono text-xs">{invoice.user.upiId}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Bank Details:</span>
                <div className="text-slate-300 text-[11px]">{invoice.user.bankDetails}</div>
              </div>
            </div>

            {/* Quick Status Override */}
            {invoice.status === "DRAFT" && (
              <button
                onClick={() => handleUpdateStatus("SENT")}
                className="w-full py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Publish & Mark as Sent
              </button>
            )}
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={fetchInvoice}
          invoice={{
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.client.name,
            totalPaise: invoice.totalPaise,
            paidPaise: invoice.paidPaise || 0,
          }}
        />
      )}
    </AppLayout>
  );
}

export default function InvoiceDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090D16] p-8 text-slate-400 text-xs flex items-center justify-center">
          Loading invoice details...
        </div>
      }
    >
      <InvoiceDetailsContent />
    </Suspense>
  );
}

