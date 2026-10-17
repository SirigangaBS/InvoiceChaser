"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Sparkles,
  BellRing,
  Settings,
  Plus,
  RefreshCw,
  Menu,
  X,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  onNewInvoiceClick?: () => void;
}

function AppLayoutInner({ children, onNewInvoiceClick }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [subData, setSubData] = useState<any>(null);
  const [togglingTrial, setTogglingTrial] = useState(false);

  // Notification Center State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "AI Assistant", href: "/assistant", icon: Sparkles, badge: "AI" },
    { name: "Reminders", href: "/reminders", icon: BellRing },
    { name: "Timeline", href: "/timeline", icon: Clock },
    { name: "Pricing & Plans", href: "/pricing", icon: Zap, badge: "Plans" },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Admin Metrics", href: "/admin", icon: ShieldAlert, badge: "Admin" },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const fetchSubscription = () => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => setSubData(data))
      .catch(console.error);
  };

  const fetchNotifications = () => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSubscription();
    fetchNotifications();
  }, [pathname]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };


  const handleResetDemo = async () => {
    if (!confirm("Reset all invoices, clients, subscription, and reminder activity to default demo data?")) return;
    try {
      setResetting(true);
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Reset failed");
      }
    } catch {
      alert("Error resetting demo data");
    } finally {
      setResetting(false);
    }
  };

  const handleToggleTrialExpiry = async () => {
    try {
      setTogglingTrial(true);
      const res = await fetch("/api/demo/set-trial-expired", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchSubscription();
        window.location.reload();
      } else {
        alert("Failed to toggle trial: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setTogglingTrial(false);
    }
  };

  const userSub = subData?.user;
  const isTrial = userSub?.isTrial;
  const isTrialExpired = userSub?.isTrialExpired;
  const isPaid = userSub?.isPaidActive;

  return (
    <div className="flex h-screen w-full bg-[#090D16] text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-[#0C1222] shrink-0 select-none">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-lime-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              Invoice<span className="text-lime-400">Chaser</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">AI Payment Automation</p>
          </div>
        </div>

        {/* Demo User Info & Subscription Plan Badge */}
        <div className="px-4 py-3 mx-4 my-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                isPaid
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : isTrialExpired
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-lime-500/20 text-lime-400 border border-lime-500/30"
              }`}
            >
              {isPaid
                ? `${userSub?.planId?.toUpperCase()} PLAN`
                : isTrialExpired
                ? "TRIAL EXPIRED"
                : "3-DAY TRIAL"}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isPaid ? "bg-emerald-400" : isTrialExpired ? "bg-rose-400" : "bg-lime-400 animate-pulse"
              }`}
            ></span>
          </div>
          <div className="font-semibold text-slate-200">Aarav Sharma</div>
          <div className="text-[11px] text-slate-400 truncate">
            {isPaid ? (
              <span className="text-emerald-400 font-medium">Verified Active Subscription</span>
            ) : isTrialExpired ? (
              <span className="text-rose-400 font-medium">Expired • Upgrade Required</span>
            ) : (
              <span className="text-lime-400 font-medium">
                {userSub?.remainingHours || 72} hours remaining
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-lime-500/15 text-lime-400 border border-lime-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-lime-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer & Test Toggles */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          {/* Quick Trial Expiry Simulator Button for Hackathon Judging */}
          <button
            onClick={handleToggleTrialExpiry}
            disabled={togglingTrial}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition ${
              isTrialExpired
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
            }`}
            title="Toggle trial expiry to test server-side access control"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isTrialExpired ? "Restore 3-Day Trial" : "Simulate Trial Expiry"}</span>
          </button>

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
            title="Reset data back to pristine demo state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            {resetting ? "Resetting..." : "Reset Demo Data"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Trial Status Global Notification Banner */}
        {isTrialExpired ? (
          <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-800 px-4 py-2 text-xs flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-2 text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong className="font-bold text-white">Your 3-Day Free Trial Has Ended.</strong> Core features are restricted. Upgrade to continue creating invoices and AI drafts.
              </span>
            </div>
            <Link
              href="/pricing"
              className="px-3 py-1 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-md text-xs shadow transition shrink-0 flex items-center gap-1"
            >
              <span>View Plans (From ₹199)</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : isTrial ? (
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-lime-500/30 px-4 py-1.5 text-xs flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-lime-400 shrink-0" />
              <span>
                <strong className="font-semibold text-lime-400">3-Day Free Trial Active:</strong> {userSub?.remainingHours || 72} hours remaining. No credit card required.
              </span>
            </div>
            <Link
              href="/pricing"
              className="text-[11px] font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1 hover:underline"
            >
              <span>Upgrade Plan</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : null}

        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0C1222]/80 backdrop-blur px-4 sm:px-8 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="md:hidden flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Invoice<span className="text-lime-400">Chaser</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                INR (₹) Currency
              </span>
              <span>•</span>
              <span className="text-lime-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isPaid ? "Razorpay Subscriptions Ready" : "Test Mode Ready"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* View Landing Page Link */}
            <Link
              href="/"
              className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
              title="View Public Landing Page"
            >
              <span>Landing Page</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>

            {/* Notification Center Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative transition"
                title="Notification Center"
              >
                <BellRing className="w-4 h-4 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                    <div className="flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-lime-400" />
                      <span className="font-bold text-xs text-white">Notifications ({unreadCount} unread)</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-lime-400 hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications right now. Everything is settled!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 space-y-1 hover:bg-slate-900/60 transition ${
                            !n.read ? "bg-slate-900/30" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-200">{n.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                          {n.linkUrl && (
                            <div className="pt-1">
                              <Link
                                href={n.linkUrl}
                                onClick={() => setNotifOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] text-lime-400 hover:underline font-semibold"
                              >
                                <span>Take Action</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/billing"
              className="hidden lg:flex items-center gap-2 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-lime-400" />
              <span>Billing</span>
            </Link>

            <Link
              href="/invoices?action=new"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0C1222] border-b border-slate-800 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? "bg-lime-500/20 text-lime-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={handleToggleTrialExpiry}
                className="text-xs text-amber-400 hover:underline py-1"
              >
                Toggle Trial Expiry
              </button>
              <button
                onClick={handleResetDemo}
                className="text-xs text-slate-400 hover:text-slate-200 py-1"
              >
                Reset Demo
              </button>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#090D16]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children, onNewInvoiceClick }: AppLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full bg-[#090D16] text-slate-100 overflow-hidden font-sans">
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#090D16]">
            {children}
          </main>
        </div>
      }
    >
      <AppLayoutInner onNewInvoiceClick={onNewInvoiceClick}>{children}</AppLayoutInner>
    </Suspense>
  );
}
