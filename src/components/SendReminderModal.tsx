"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Send, AlertTriangle, ShieldCheck, Mail, Sparkles, ArrowRight } from "lucide-react";


interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  reminderData: {
    invoiceId: string;
    invoiceNumber: string;
    recipientEmail: string;
    clientName: string;
    subject: string;
    body: string;
    tone: string;
    amountRupeesFormatted: string;
    isSimulated?: boolean;
    apiKeyConfigured?: boolean;
  };
}

export default function SendReminderModal({
  isOpen,
  onClose,
  onSuccess,
  reminderData,
}: SendReminderModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(reminderData.recipientEmail);
  const [subject, setSubject] = useState(reminderData.subject);
  const [bodyText, setBodyText] = useState(reminderData.body);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!confirmed) {
      setError("Please check the confirmation box before sending");
      return;
    }

    try {
      setSending(true);
      setError(null);

      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: reminderData.invoiceId,
          recipientEmail: recipientEmail.trim(),
          subject: subject.trim(),
          body: bodyText.trim(),
          tone: reminderData.tone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reminder");
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Sending failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Review & Confirm Follow-Up</h2>
              <p className="text-xs text-slate-400">Explicit confirmation required before dispatching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span>{error}</span>
              {(error.toLowerCase().includes("upgrade") || error.toLowerCase().includes("subscription") || error.toLowerCase().includes("trial")) && (
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

          {/* Delivery Mode Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200">Delivery Channel: </span>
                <span className="text-slate-400">
                  {reminderData.isSimulated
                    ? "Safe Demo-Send Simulation (Recorded to history without contacting recipient)"
                    : "Verified Resend Email Provider"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-lime-400" /> Recipient Email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full bg-[#0C1222] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#0C1222] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Message Body (Editable)</label>
              <span className="text-[10px] text-lime-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" /> Tone: {reminderData.tone}
              </span>
            </div>
            <textarea
              rows={7}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full bg-[#0C1222] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-lime-500"
              required
            />
          </div>

          {/* Explicit User Confirmation Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-lime-500 focus:ring-lime-400 border-slate-700 bg-slate-800"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-200">
                I have reviewed the email draft and authorize sending this payment reminder.
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The invoice status will be updated to <span className="text-amber-400">REMINDER_SENT</span> and an audit entry will be created.
              </p>
            </div>
          </label>

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
              type="button"
              onClick={handleSend}
              disabled={!confirmed || sending}
              className="px-5 py-2 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending..." : "Approve & Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
