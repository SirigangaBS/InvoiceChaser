"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  Calendar,
  XCircle,
  Download,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscription");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel renewal? You will retain all paid features until the end of your current 30-day billing cycle."
      )
    )
      return;

    try {
      setCancelling(true);
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to cancel");
      alert(json.message);
      fetchSubscription();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-2 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-lime-400" />
          <span className="text-xs">Loading billing details...</span>
        </div>
      </AppLayout>
    );
  }

  const user = data?.user;
  const plan = data?.plan;
  const activeSub = data?.activeSubscription;
  const recentPayments = data?.recentPayments || [];
  const usage = data?.usage;

  const isTrial = user?.isTrial;
  const isTrialExpired = user?.isTrialExpired;
  const isPaid = user?.isPaidActive;
  const isCancelled = activeSub?.cancelAtPeriodEnd;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-7 h-7 text-lime-400" />
              Billing & Subscriptions
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your subscription plan, review payment receipts, and monitor usage limits
            </p>
          </div>

          <Link
            href="/pricing"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition active:scale-95 self-start sm:self-auto"
          >
            <Zap className="w-4 h-4" />
            <span>Change Plan</span>
          </Link>
        </div>

        {/* Current Plan Overview Card */}
        <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">{plan?.name}</h2>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    user?.isInGracePeriod
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : isPaid
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : isTrialExpired
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      : "bg-lime-500/20 text-lime-400 border-lime-500/30"
                  }`}
                >
                  {user?.isInGracePeriod
                    ? `Grace Period Active (${user?.gracePeriodRemainingDays}d left)`
                    : isPaid
                    ? "Active Subscription"
                    : isTrialExpired
                    ? "Trial Expired"
                    : "Free Trial Active"}
                </span>
                {isCancelled && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Cancels at end of cycle
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {plan?.priceInRupees === 0
                  ? "₹0 / 3 days (No credit card required)"
                  : `₹${plan?.priceInRupees} / month`}
              </p>

              {user?.isInGracePeriod && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Payment Renewal Unsuccessful — Grace Period Active</strong>
                    <span>
                      A 3-day grace period has been granted until {user.gracePeriodEnd ? formatDate(user.gracePeriodEnd) : "soon"}. Your account features remain active. Please renew your plan to prevent service interruption.
                    </span>
                  </div>
                </div>
              )}

            </div>

            <div className="text-right">
              {activeSub?.currentPeriodEnd && (
                <div className="text-xs text-slate-400">
                  <span>{isCancelled ? "Access Ends: " : "Next Renewal Date: "}</span>
                  <span className="font-semibold text-white">
                    {formatDate(activeSub.currentPeriodEnd)}
                  </span>
                </div>
              )}
              {isTrial && !isTrialExpired && (
                <div className="text-xs text-lime-400 font-semibold flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{user?.remainingHours} hours remaining in trial</span>
                </div>
              )}
            </div>
          </div>

          {/* Usage Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Active Invoices Used:</span>
                <span className="font-bold text-white">
                  {usage?.invoiceCount} / {usage?.invoiceLimit === -1 ? "Unlimited" : usage?.invoiceLimit}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-lime-500 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      usage?.invoiceLimit === -1
                        ? Math.min(100, usage?.invoiceCount * 5)
                        : Math.min(100, (usage?.invoiceCount / usage?.invoiceLimit) * 100)
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">AI Reminder Drafts Used:</span>
                <span className="font-bold text-white">
                  {usage?.reminderCount} / {usage?.aiReminderLimit === -1 ? "Unlimited" : usage?.aiReminderLimit}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      usage?.aiReminderLimit === -1
                        ? Math.min(100, usage?.reminderCount * 5)
                        : Math.min(100, (usage?.reminderCount / usage?.aiReminderLimit) * 100)
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Export Business Data Guarantee & Cancellation */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />
                <span>
                  <strong>Data Export Guarantee:</strong> Your invoice and client records are never locked or deleted. Download anytime:
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <a
                  href="/api/export?format=csv"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  title="Export all invoices and clients as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-lime-400" />
                  <span>Export CSV</span>
                </a>
                <a
                  href="/api/export?format=json"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  title="Export all invoices and clients as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-lime-400" />
                  <span>Export JSON</span>
                </a>
              </div>
            </div>

            {isPaid && !isCancelled && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline"
                >
                  {cancelling ? "Processing..." : "Cancel Subscription Renewal"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Table */}
        <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white">Subscription Payment History</h2>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p>No billing charges recorded yet. You are currently on the Free Trial.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Plan Description</th>
                    <th className="pb-3 font-semibold">Amount (INR)</th>
                    <th className="pb-3 font-semibold">Transaction ID</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="py-3 text-slate-300">{formatDate(p.createdAt)}</td>
                      <td className="py-3 font-medium text-white">
                        {p.planId.toUpperCase()} Monthly Subscription
                      </td>
                      <td className="py-3 font-bold text-white">{formatINR(p.amountPaise)}</td>
                      <td className="py-3 font-mono text-[11px] text-slate-400">
                        {p.razorpayPaymentId || "pay_verified"}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled
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
