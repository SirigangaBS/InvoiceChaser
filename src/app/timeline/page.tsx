"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BellRing,
  CreditCard,
  Zap,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function TimelinePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/timeline");
      const json = await res.json();
      setItems(json.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleRunScanner = async () => {
    try {
      setScanning(true);
      setScanMessage(null);
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan-cadence" }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanMessage(data.message);
        fetchTimeline();
      } else {
        alert(data.error || "Scanner failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = filterCategory === "ALL" || item.category === filterCategory;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case "INVOICE":
        return "bg-lime-500/20 text-lime-400 border-lime-500/30";
      case "REMINDER":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "PAYMENT":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "BILLING":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "INVOICE":
        return <FileText className="w-4 h-4 text-lime-400" />;
      case "REMINDER":
        return <BellRing className="w-4 h-4 text-amber-400" />;
      case "PAYMENT":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "BILLING":
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Clock className="w-7 h-7 text-lime-400" />
              Activity & Follow-Up Timeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Audit trail of invoice milestones, AI reminders, payments, and subscription events
            </p>
          </div>

          {/* Manual Cadence Trigger */}
          <button
            onClick={handleRunScanner}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition active:scale-95 disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
            <span>{scanning ? "Scanning Invoices..." : "Run Cadence Scanner"}</span>
          </button>
        </div>

        {/* Honest Disclosure Banner */}
        <div className="p-4 rounded-xl bg-[#0F1629] border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white block">Cadence Scheduler Transparency</span>
            <p className="text-[11px] text-slate-400">
              In this local demo environment, automatic background cron scheduling runs via manual scanner. In production, this connects to a managed cron worker to dispatch reminders based on due dates. Duplicate reminders are blocked by strict 20-second and status protection guards.
            </p>
            {scanMessage && (
              <p className="text-xs text-lime-400 font-semibold pt-1">
                ✓ {scanMessage}
              </p>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F1629] p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "INVOICE", "REMINDER", "PAYMENT", "BILLING"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === cat
                    ? "bg-lime-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {cat === "ALL" ? "All Activity" : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-lime-500"
            />
          </div>
        </div>

        {/* Timeline Event Feed */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-lime-400" />
            <span>Loading activity timeline...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0F1629] border border-slate-800 text-center space-y-3">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No timeline events found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create an invoice, generate an AI reminder, or record a payment to see real-time timeline records.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="relative group">
                {/* Dot */}
                <div className="absolute -left-6 top-3 w-5 h-5 rounded-full bg-[#090D16] border-2 border-lime-400 flex items-center justify-center shadow">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-400"></div>
                </div>

                {/* Card */}
                <div className="p-4 rounded-xl bg-[#0F1629] border border-slate-800/80 hover:border-slate-700 transition space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      {getIcon(item.category)}
                      <span className="font-bold text-white">{item.title}</span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getBadgeStyle(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={item.actionLink}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-lime-400 hover:text-lime-300 hover:underline"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
