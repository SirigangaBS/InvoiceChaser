"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  CreditCard,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
  Lock,
  Download,
  AlertCircle,
  HelpCircle,
  QrCode,
  DollarSign,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [legalModal, setLegalModal] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("landing_page_viewed", { page: "home", referrer: document.referrer || "direct" });
  }, []);

  const faqs = [
    {
      q: "Do I need a credit card to start the 3-day free trial?",
      a: "No! You can start your 3-day trial immediately with zero payment details required upfront. No hidden recurring charges will occur unless you explicitly choose to subscribe to a paid plan.",
    },
    {
      q: "How does the Smart AI Payment Reminder work?",
      a: "InvoiceChaser retrieves factual invoice details (due date, invoice number, amount due in INR) and uses OpenAI GPT-4o-mini to draft courteous, polite follow-ups in Friendly, Professional, or Firm tones. You have complete control to edit and approve every draft before it is dispatched.",
    },
    {
      q: "Can clients pay me directly via UPI and Bank Transfer?",
      a: "Yes! Your UPI ID (e.g. yourname@okhdfcbank) and bank account details are embedded directly on PDF invoice downloads and reminder email bodies so clients can settle instantly via Google Pay, PhonePe, Paytm, or IMPS/NEFT.",
    },
    {
      q: "What happens to my invoices if my trial or plan expires?",
      a: "We never delete, withhold, or hold your business data hostage. You can always view historical invoices and export all clients and invoices as CSV or JSON files even if paid feature access expires.",
    },
    {
      q: "How does cancellation and subscription billing work?",
      a: "Payments are processed securely via Razorpay Subscriptions. You can cancel auto-renewal with one click from your Billing page. If cancelled, your access continues until the end of your prepaid 30-day billing cycle.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-lime-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0C1222]/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lime-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-lime-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                Invoice<span className="text-lime-400">Chaser</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
                AI SaaS
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-lime-400 transition">
              Features
            </a>
            <a href="#workflow" className="hover:text-lime-400 transition">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-lime-400 transition">
              Pricing & Plans
            </a>
            <a href="#faq" className="hover:text-lime-400 transition">
              FAQ
            </a>
            <Link href="/timeline" className="hover:text-lime-400 transition">
              Timeline
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/80 transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              onClick={() => trackEvent("trial_started", { source: "navbar_cta" })}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition active:scale-95"
            >
              <span>Try 3-Day Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-8 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-lime-500/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F1629] border border-lime-500/30 text-lime-400 text-xs font-semibold shadow-sm animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            <span>AI-Powered Invoicing & Polite Follow-Up Automation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Get Paid Faster. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-300">
              Chase Less.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Designed for Indian freelancers, tutors, designers, and small agencies. Create GST invoices once, and let InvoiceChaser draft polite, factual follow-up reminders until settled.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              onClick={() => trackEvent("trial_started", { source: "hero_primary" })}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-lime-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Start Your Free 3-Day Trial</span>
            </Link>

            <a
              href="#features"
              onClick={() => trackEvent("feature_explored", { source: "hero_secondary" })}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-800 transition flex items-center justify-center gap-2"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-lime-400" />
              No credit card required upfront
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-lime-400" />
              Embedded UPI & Bank Transfer details
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-lime-400" />
              Export data anytime
            </span>
          </div>
        </div>

        {/* High-Fidelity Interactive Dashboard Preview Mockup */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto relative z-10">
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-3 sm:p-5 shadow-2xl shadow-black/80">
            {/* Mockup Window Chrome */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-2 font-mono text-[11px] text-slate-500">app.invoicechaser.dev</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-500/15 text-lime-400 border border-lime-500/30">
                Live Fintech Dashboard Preview
              </span>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stat 1 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding Receivables</span>
                <div className="text-xl sm:text-2xl font-black text-white">₹1,84,500</div>
                <span className="text-[10px] text-blue-400 font-medium">2 client invoices pending</span>
              </div>

              {/* Stat 2 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-950/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-300">Overdue (Follow-Up Due)</span>
                <div className="text-xl sm:text-2xl font-black text-rose-400">₹42,000</div>
                <span className="text-[10px] text-rose-400/80 font-medium">PixelCrafters Media (14d overdue)</span>
              </div>

              {/* Stat 3 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Collected This Month</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">₹3,26,000</div>
                <span className="text-[10px] text-emerald-400/80 font-medium">86% Collection Rate (+14%)</span>
              </div>
            </div>

            {/* AI Reminder Preview Mock */}
            <div className="mt-4 p-4 rounded-xl bg-[#0A0E1A] border border-lime-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                  <strong className="text-white">AI Reminder Agent Draft Ready</strong>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime-500/20 text-lime-300">Tone: Friendly</span>
                </div>
                <p className="text-slate-300 text-[11px] font-mono line-clamp-1">
                  "Hi Kavita, gentle check-in regarding INV-2026-001 (₹42,000). For quick settlement: aaravsharma@okhdfcbank..."
                </p>
              </div>

              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shrink-0 shadow transition"
              >
                Launch Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 px-4 sm:px-8 border-t border-slate-800/80 bg-[#0C1222]/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">
              Complete Monetization & Invoicing Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything You Need to Run Client Invoicing
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Eliminate awkward payment conversations with courteous, automated follow-ups backed by strict factual safeguards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 hover:border-slate-700 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-500/15 text-lime-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Reminder AI Agent</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Drafts polite, customized payment reminders in Friendly, Professional, or Firm tones strictly using real invoice figures. No prompt injection or invented numbers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 hover:border-slate-700 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Stage Cadence Schedule</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated multi-stage follow-up cadence at -1d (friendly heads up), 0d (due today), +3d (professional escalation), and +7d (firm overdue settlement). Ceases automatically once paid.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 hover:border-slate-700 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">UPI & Indian Bank Integration</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Embed your VPA (UPI ID) and IFSC bank credentials directly into downloaded PDF invoices and reminder emails. Clients pay in seconds using their preferred UPI app.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 hover:border-slate-700 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Paise-Precision Accounting</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                All monetary figures are calculated and stored in integer paise. Zero floating-point rounding errors on GST taxes or partial payments.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 hover:border-slate-700 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">PDF Invoice Generator</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generate clean, branded PDF invoices with GST rates, line items, and payment instructions. Downloadable in a single click.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 hover:border-slate-700 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Data Export Guarantee</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your data is yours forever. Export all invoices and client details to CSV or JSON anytime, even if your subscription has expired.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section id="pricing" className="py-20 px-4 sm:px-8 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">
              Simple, Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Start with 3 Days Free. Upgrade Anytime.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Fair, affordable launch testing pricing for independent freelancers and studios across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Trial */}
            <div className="rounded-2xl bg-[#0F1629] border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Getting Started</span>
                <h3 className="text-xl font-bold text-white mt-1">3-Day Free Trial</h3>
                <div className="mt-4 mb-5 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹0</span>
                  <span className="text-xs text-slate-400">/ 3 days</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>Up to 5 active invoices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>10 Smart AI reminder drafts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>PDF invoice generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>No credit card required upfront</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href="/dashboard"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition"
                >
                  Start 3-Day Trial
                </Link>
              </div>
            </div>

            {/* Starter Plan */}
            <div className="rounded-2xl bg-gradient-to-b from-[#111A30] to-[#0E1526] border-2 border-lime-500/60 p-6 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-lime-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow">
                Most Popular
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-lime-400">Freelancer Starter</span>
                <h3 className="text-xl font-bold text-white mt-1">Starter Plan</h3>
                <div className="mt-4 mb-5 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-lime-400">₹199</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>Up to <strong>50 invoices</strong> / month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span><strong>100 Smart AI reminder drafts</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>Multi-stage cadence scheduler</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>Verified email delivery integration</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href="/pricing"
                  className="w-full py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg shadow-lime-500/20 transition"
                >
                  Choose Starter (₹199/mo)
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="rounded-2xl bg-[#0F1629] border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Agencies & Studios</span>
                <h3 className="text-xl font-bold text-white mt-1">Pro Plan</h3>
                <div className="mt-4 mb-5 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹399</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span><strong>Unlimited</strong> invoices & clients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span><strong>Unlimited</strong> Smart AI reminders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>Custom tone & brand styling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>Priority email delivery & webhooks</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href="/pricing"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition"
                >
                  Upgrade to Pro (₹399/mo)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-8 border-t border-slate-800/80 bg-[#0C1222]/40">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear, honest answers about trials, billing, and data ownership.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-[#0F1629] border border-slate-800 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-white hover:text-lime-400 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-lime-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 sm:px-8 border-t border-slate-800/80 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Automate Your Receivables?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Join Indian freelancers and agencies reclaiming unpaid hours. Start your 3-day test trial now.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-lime-500/25 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Free Trial Now</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070A12] py-12 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-extrabold text-base text-white">
              Invoice<span className="text-lime-400">Chaser</span>
            </div>
            <p className="text-[11px] text-slate-500">
              © 2026 InvoiceChaser SaaS. Built for Indian Freelancers & Small Agencies.
            </p>
          </div>

          {/* Legal / Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <button
              onClick={() => setLegalModal("privacy")}
              className="hover:text-white transition underline"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setLegalModal("terms")}
              className="hover:text-white transition underline"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setLegalModal("refund")}
              className="hover:text-white transition underline"
            >
              Cancellation & Refund Policy
            </button>
            <button
              onClick={() => setLegalModal("contact")}
              className="hover:text-white transition underline"
            >
              Contact Support
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Policy & Legal Modals */}
      {legalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <h3 className="text-sm font-bold text-white capitalize">
                {legalModal === "privacy" && "Privacy Policy & Data Security"}
                {legalModal === "terms" && "Terms of Service"}
                {legalModal === "refund" && "Subscription Cancellation & Refund Terms"}
                {legalModal === "contact" && "Contact Customer Support"}
              </h3>
              <button
                onClick={() => setLegalModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-300 space-y-3 leading-relaxed">
              {legalModal === "privacy" && (
                <>
                  <p>
                    <strong>1. Strict Data Privacy:</strong> InvoiceChaser does not sell or share client names, invoice amounts, bank credentials, or invoice descriptions with third parties.
                  </p>
                  <p>
                    <strong>2. Telemetry Safeguards:</strong> Analytics events only record non-sensitive product telemetry (such as feature usage counts) and never include financial amounts or customer personal identities.
                  </p>
                  <p>
                    <strong>3. Data Ownership:</strong> You retain complete ownership of all invoices and client data. Export your full records anytime via CSV or JSON.
                  </p>
                </>
              )}

              {legalModal === "terms" && (
                <>
                  <p>
                    <strong>1. Acceptance:</strong> By accessing InvoiceChaser, you agree to these transparent terms.
                  </p>
                  <p>
                    <strong>2. Payment Authorization:</strong> Paid plans (Starter at ₹199/mo, Pro at ₹399/mo) are billed on a 30-day recurring interval via Razorpay Subscriptions.
                  </p>
                  <p>
                    <strong>3. Acceptable Use:</strong> Users must send courteous, legitimate payment reminders strictly for verified services provided.
                  </p>
                </>
              )}

              {legalModal === "refund" && (
                <>
                  <p>
                    <strong>1. 3-Day Free Trial:</strong> No payment details are captured for trials. No charge occurs upon trial expiry unless you manually authorize a plan.
                  </p>
                  <p>
                    <strong>2. Cancellation:</strong> You can cancel your subscription at any time with one click from the Billing page. Paid feature access continues through the end of your prepaid 30-day cycle.
                  </p>
                  <p>
                    <strong>3. Renewal Grace Period:</strong> If a recurring payment fails, a 3-day grace period is granted before feature access is paused.
                  </p>
                </>
              )}

              {legalModal === "contact" && (
                <div className="space-y-3">
                  <p>We are here to assist with onboarding, billing questions, or feedback.</p>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Developer & Support Contact:</span>
                    <span className="font-semibold text-white">support@invoicechaser.dev</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Bengaluru Office:</span>
                    <span className="font-semibold text-white">Indiranagar 100ft Road, Bengaluru, Karnataka 560038</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/60">
              <button
                onClick={() => setLegalModal(null)}
                className="px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
