"use client";

import React, { useState } from "react";
import { X, CreditCard, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    totalPaise: number;
    paidPaise: number;
  };
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}: RecordPaymentModalProps) {
  const remainingPaise = Math.max(0, invoice.totalPaise - invoice.paidPaise);
  const remainingRupees = Math.round(remainingPaise / 100);

  const [amountRupees, setAmountRupees] = useState<number>(remainingRupees);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceNote, setReferenceNote] = useState("Payment received via UPI transaction");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amountRupees || amountRupees <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/invoices/${invoice.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountRupees,
          paymentMethod,
          referenceNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Manual Payment</h2>
              <p className="text-xs text-slate-400">Explicitly records verified receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Invoice:</span>
              <span className="font-semibold text-white">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Client:</span>
              <span className="text-slate-200">{invoice.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Billed:</span>
              <span className="text-slate-200">{formatINR(invoice.totalPaise)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 text-sm font-semibold">
              <span className="text-slate-400">Balance Remaining:</span>
              <span className="text-lime-400">{formatINR(remainingPaise)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Amount (INR ₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-medium">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amountRupees}
                onChange={(e) => setAmountRupees(Number(e.target.value))}
                className="w-full bg-[#0C1222] border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500 font-semibold"
                required
              />
            </div>
            {amountRupees >= remainingRupees && (
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> This payment will mark the invoice as fully PAID.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-[#0C1222] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500"
            >
              <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
              <option value="BANK_TRANSFER">Bank IMPS / NEFT / RTGS</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="MANUAL">Other Manual Entry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reference Note / Transaction ID</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref: 40291848912"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              className="w-full bg-[#0C1222] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            ℹ️ <span className="font-semibold text-slate-300">Hackathon Note:</span> Payments are registered locally in SQLite with a full audit log. Future automated reminders will immediately halt once settled.
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
