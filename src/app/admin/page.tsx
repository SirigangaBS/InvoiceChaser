"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  ShieldAlert,
  Users,
  Eye,
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Lock,
  ArrowRight,
  Zap,
  BarChart3,
  Activity,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<string>("30d");

  const fetchMetrics = async (selectedRange = range) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/metrics?range=${selectedRange}`, {
        headers: {
          "x-admin-key": "admin_hackathon_demo_key",
        },
      });

      if (res.status === 403) {
        throw new Error("Unauthorized access. Administrator role is required to view SaaS telemetry.");
      }

      if (!res.ok) {
        throw new Error("Failed to load admin metrics");
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(range);
  }, [range]);

  const overview = data?.overview;
  const funnel = data?.funnel || [];
  const recentWebhooks = data?.recentWebhooks || [];
  const recentLogs = data?.recentAuditLogs || [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Owner-Only Route
              </span>
              <span className="text-xs text-slate-500">Strict Server-Enforced RBAC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5 mt-1">
              <ShieldAlert className="w-7 h-7 text-lime-400" />
              SaaS Business Analytics & Health
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real telemetry, subscriber funnel, verified monthly recurring revenue, and webhook audits
            </p>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 bg-[#0F1629] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {["7d", "30d", "all"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  range === r
                    ? "bg-lime-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <Lock className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="block font-semibold">Access Restriction:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-lime-400" />
            <span>Calculating live business telemetry...</span>
          </div>
        ) : overview ? (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: MRR */}
              <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Monthly Recurring Rev (MRR)</span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white">
                  ₹{overview.mrrRupees.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-slate-500">
                  Calculated solely from verified subscription payments
                </p>
              </div>

              {/* Card 2: Active Subscribers */}
              <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Paying Subscribers</span>
                  <div className="p-1.5 rounded-lg bg-lime-500/15 text-lime-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-lime-400">
                  {overview.activeSubscribers}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>{overview.activeTrials} active trials in progress</span>
                </div>
              </div>

              {/* Card 3: Unique Visitors */}
              <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Unique Website Visitors</span>
                  <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {overview.uniqueVisitors}
                </div>
                <p className="text-[11px] text-slate-500">
                  {overview.pageViews} landing page views logged
                </p>
              </div>

              {/* Card 4: Trial-to-Paid Conversion */}
              <div className="p-5 rounded-2xl bg-[#0F1629] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Trial Conversion Rate</span>
                  <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-purple-300">
                  {overview.trialToPaidConversion}%
                </div>
                <p className="text-[11px] text-slate-500">
                  {overview.failedPaymentsCount} payment renewal failures
                </p>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-lime-400" />
                    Customer Acquisition & Conversion Funnel
                  </h2>
                  <p className="text-xs text-slate-400">
                    Step-by-step funnel from anonymous visits to active paid subscriptions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {funnel.map((step: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 relative">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Stage {i + 1}
                    </span>
                    <h3 className="text-xs font-bold text-slate-200">{step.stage}</h3>
                    <div className="text-xl font-extrabold text-lime-400">{step.count}</div>
                    {i > 0 && (
                      <div className="text-[10px] text-slate-500">
                        {step.dropoffPercent}% dropoff from previous
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Webhook Audit Log & Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Webhooks */}
              <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-lime-400" />
                    Recent Razorpay Webhook Audits
                  </h2>
                  <span className="text-[10px] text-slate-500 font-mono">Idempotent</span>
                </div>

                {recentWebhooks.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No webhook events received yet. Real provider calls will show here.
                  </div>
                ) : (
                  <div className="space-y-2 overflow-x-auto">
                    {recentWebhooks.map((wh: any) => (
                      <div
                        key={wh.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="font-mono text-lime-400 font-bold">{wh.eventType}</div>
                          <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                            {wh.eventId}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          {wh.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Application Activity */}
              <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Application Audit Trail
                  </h2>
                  <span className="text-[10px] text-slate-500">Verified Database Events</span>
                </div>

                {recentLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No application activity logs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {recentLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200">{log.action}</span>
                          <span className="text-[10px] text-slate-500">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">{log.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
