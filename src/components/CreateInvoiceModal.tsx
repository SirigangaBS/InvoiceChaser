"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Plus, Trash2, Calendar, FileText, User, ArrowRight } from "lucide-react";
import { formatINRAmount } from "@/lib/utils";


interface Client {
  id: string;
  name: string;
  businessName?: string | null;
  email: string;
}

interface ItemRow {
  description: string;
  quantity: number;
  rate: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedClientId?: string;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedClientId,
}: CreateInvoiceModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [description, setDescription] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [taxRatePercent, setTaxRatePercent] = useState<number>(0);
  const [notes, setNotes] = useState("Net 15 days payment terms. Please settle via UPI or Bank Transfer.");
  const [paymentLink, setPaymentLink] = useState("");
  const [status, setStatus] = useState<"SENT" | "DRAFT">("SENT");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<ItemRow[]>([
    { description: "UI/UX Design & Frontend Development", quantity: 1, rate: 35000 },
  ]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setClients(data);
            if (!clientId && data.length > 0) {
              setClientId(preselectedClientId || data[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen, clientId, preselectedClientId]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotalRupees = items.reduce(
    (sum, it) => sum + (Number(it.rate) || 0) * (Number(it.quantity) || 1),
    0
  );
  const taxRupees = Math.round(subtotalRupees * ((Number(taxRatePercent) || 0) / 100));
  const totalRupees = subtotalRupees + taxRupees;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Please select a client");
      return;
    }

    if (!description.trim()) {
      setError("Please provide an invoice summary or description");
      return;
    }

    if (totalRupees <= 0) {
      setError("Invoice total must be greater than ₹0");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          description,
          issueDate,
          dueDate,
          items: items.map((it) => ({
            description: it.description || "Service deliverable",
            quantity: Number(it.quantity) || 1,
            rate: Number(it.rate) || 0,
            amount: (Number(it.quantity) || 1) * (Number(it.rate) || 0),
          })),
          subtotalRupees,
          taxRatePercent,
          paymentLink,
          notes,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create invoice");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong creating the invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Invoice</h2>
              <p className="text-xs text-slate-400">Generates clean INR invoice with payment terms</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span>{error}</span>
              {(error.toLowerCase().includes("upgrade") || error.toLowerCase().includes("trial") || error.toLowerCase().includes("limit")) && (
                <Link
                  href="/pricing"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 self-start sm:self-auto transition"
                >
                  <span>View Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {/* Client & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-lime-400" />
                Select Client <span className="text-rose-400">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-[#0C1222] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500"
                required
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.businessName ? `(${c.businessName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Invoice Title / Purpose <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Website Revamp & Branding Sprint"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0C1222] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-[#0C1222] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-lime-400" />
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0C1222] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500"
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Invoice Items / Deliverables</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#0C1222] p-2 rounded-lg border border-slate-800">
                  <input
                    type="text"
                    placeholder="Deliverable description"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    className="flex-1 bg-transparent border-none text-xs text-slate-100 focus:outline-none px-2"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 text-center focus:outline-none"
                    required
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, "rate", Number(e.target.value))}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 text-right focus:outline-none"
                      required
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal & Taxes */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal:</span>
              <span className="text-slate-200 font-medium">{formatINRAmount(subtotalRupees)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                GST / Tax Rate:
                <select
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-0.5"
                >
                  <option value={0}>0% (None / Freelance exemption)</option>
                  <option value={18}>18% (Standard GST)</option>
                  <option value={12}>12% (Reduced GST)</option>
                </select>
              </span>
              <span className="text-slate-200 font-medium">+{formatINRAmount(taxRupees)}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Total Payable:</span>
              <span className="text-lime-400 text-base">{formatINRAmount(totalRupees)}</span>
            </div>
          </div>

          {/* Notes & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Terms / Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0C1222] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("SENT")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                    status === "SENT"
                      ? "bg-lime-500/20 text-lime-400 border-lime-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Mark as Sent
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("DRAFT")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                    status === "DRAFT"
                      ? "bg-slate-700 text-white border-slate-600"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Save as Draft
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Sent invoices qualify for smart automated follow-up reminders.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
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
              className="px-5 py-2 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
