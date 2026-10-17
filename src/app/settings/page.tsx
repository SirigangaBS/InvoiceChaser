"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Settings as SettingsIcon,
  Save,
  Building,
  Mail,
  Phone,
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>({
    name: "",
    email: "",
    businessName: "",
    businessAddress: "",
    upiId: "",
    bankDetails: "",
    phone: "",
  });
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.user) setUser(data.user);
      if (data.status) setStatus(data.status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert("Failed to save settings");
      }
    } catch (e: any) {
      alert("Error saving settings: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <SettingsIcon className="w-7 h-7 text-lime-400" />
              Settings & Integrations
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your business profile, UPI payment instructions, and provider credentials
            </p>
          </div>
        </div>

        {/* Integration Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* OpenAI Integration */}
          <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-lime-500/15 text-lime-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Engine</h3>
                  <p className="text-[11px] text-slate-400">OpenAI GPT-4o-mini</p>
                </div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  status?.openai?.configured
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }`}
              >
                {status?.openai?.configured ? "Live Key Configured" : "Simulated Demo Active"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {status?.openai?.configured
                ? "Live server-side OpenAI API key detected. Prompts are processed using strict factual guards."
                : "Honest Demo AI Fallback is active. Generates realistic, tone-calibrated follow-ups without requiring third-party credentials."}
            </p>
          </div>

          {/* Resend Integration */}
          <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Email Delivery</h3>
                  <p className="text-[11px] text-slate-400">Resend API Provider</p>
                </div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  status?.resend?.configured
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                {status?.resend?.configured ? "Live Resend Active" : "Demo Mode Active"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {status?.resend?.configured
                ? `Live Resend key configured. Outgoing emails dispatch from ${status?.resend?.from}.`
                : "Safe Demo-Send flow enabled. Reminders simulate delivery and record events to the audit log without contacting real clients."}
            </p>
          </div>
        </div>

        {/* Business Profile Form */}
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">Freelancer / Agency Profile</h2>
              <p className="text-xs text-slate-400">These details appear on downloaded PDF invoices and email signatures</p>
            </div>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Settings Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Business / Studio Name
              </label>
              <input
                type="text"
                value={user.businessName || ""}
                onChange={(e) => setUser({ ...user, businessName: e.target.value })}
                className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-lime-400" />
                Contact Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                title="Demo account email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact Phone
              </label>
              <input
                type="text"
                value={user.phone || ""}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Address</label>
            <input
              type="text"
              value={user.businessAddress || ""}
              onChange={(e) => setUser({ ...user, businessAddress: e.target.value })}
              className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
            />
          </div>

          {/* Payment Credentials */}
          <div className="pt-3 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
              Payment Acceptance Credentials (INR)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-lime-400" />
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank"
                  value={user.upiId || ""}
                  onChange={(e) => setUser({ ...user, upiId: e.target.value })}
                  className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bank Account / IFSC Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank | A/C: 50100... | IFSC: HDFC0000128"
                  value={user.bankDetails || ""}
                  onChange={(e) => setUser({ ...user, bankDetails: e.target.value })}
                  className="w-full bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-lime-500 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-lg shadow-lime-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
