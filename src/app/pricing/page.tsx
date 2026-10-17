"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  CreditCard,
  HelpCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscription");
      const json = await res.json();
      setSubData(json);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleSelectPlan = async (plan: any) => {
    if (plan.id === "trial") {
      alert("You are currently enrolled in the 3-day free trial!");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // 1. Create order on server
      const res = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to create checkout order");
      }

      // If official Razorpay credentials are configured, launch Razorpay Standard Checkout modal
      if (orderData.isConfigured && orderData.keyId) {
        if (!(window as any).Razorpay) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Razorpay checkout SDK"));
          });
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "InvoiceChaser",
          description: `${orderData.planName} Monthly Subscription`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            setProcessing(true);
            try {
              const verifyRes = await fetch("/api/subscription/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  planId: plan.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  isSimulated: false,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || "Payment verification failed");
              }
              alert(`🎉 Congratulations! You are now subscribed to ${verifyData.plan}!`);
              router.push("/billing");
            } catch (vErr: any) {
              setError(vErr.message);
            } finally {
              setProcessing(false);
            }
          },
          prefill: {
            name: subData?.user?.name,
            email: subData?.user?.email,
          },
          theme: {
            color: "#84cc16",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setError(`Payment failed: ${response.error?.description || "Transaction cancelled"}`);
        });
        rzp.open();
        return;
      }

      // Fallback: Test simulation mode modal
      setCheckoutPlan({ ...plan, order: orderData });
    } catch (err: any) {
      setError(err.message || "Failed to initiate plan checkout");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!checkoutPlan) return;
    try {
      setProcessing(true);
      setError(null);

      // Server verification and activation
      const res = await fetch("/api/subscription/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: checkoutPlan.id,
          razorpay_order_id: checkoutPlan.order.orderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: "simulated_valid_test_sig",
          isSimulated: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      alert(`🎉 Congratulations! You are now subscribed to ${data.plan}!`);
      setCheckoutPlan(null);
      router.push("/billing");
    } catch (err: any) {
      setError(err.message || "Failed to complete payment verification");
    } finally {
      setProcessing(false);
    }
  };

  const currentPlanId = subData?.user?.planId || "trial";
  const isPaidActive = subData?.user?.isPaidActive;
  const isTrialExpired = subData?.user?.isTrialExpired;

  const starterPlan = subData?.allPlans?.find((p: any) => p.id === "starter") || { priceInRupees: 199, name: "Starter Plan" };
  const proPlan = subData?.allPlans?.find((p: any) => p.id === "pro") || { priceInRupees: 399, name: "Pro Plan" };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-10 py-4">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" /> Launch Testing Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simple, Transparent Plans for Freelancers & Studios
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Start with our 3-day free trial. No credit card required upfront. Upgrade anytime to automate client invoice follow-ups and accelerate collections.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Free Trial */}
          <div className="rounded-2xl bg-[#0F1629] border border-slate-800 p-6 flex flex-col justify-between shadow-xl relative group">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Getting Started
                </span>
                {currentPlanId === "trial" && !isTrialExpired && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-500/20 text-lime-400 border border-lime-500/30">
                    Current
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">3-Day Free Trial</h3>
              <p className="text-xs text-slate-400 mt-1">Full test access to core features</p>

              <div className="mt-5 mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">₹0</span>
                <span className="text-xs text-slate-400 font-medium">/ 3 days</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Up to 5 active invoices</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>10 Smart AI reminder drafts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Professional PDF invoice downloads</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>UPI ID & Bank payment instructions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span className="font-semibold text-lime-400">No credit card required</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                disabled={true}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs cursor-default"
              >
                {currentPlanId === "trial" && !isTrialExpired
                  ? "Active Free Trial"
                  : isTrialExpired
                  ? "Trial Expired"
                  : "Completed"}
              </button>
            </div>
          </div>

          {/* Card 2: Starter Plan (Most Popular) */}
          <div className="rounded-2xl bg-gradient-to-b from-[#111A30] to-[#0E1526] border-2 border-lime-500/50 p-6 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-lime-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow">
              Most Popular
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
                  Freelancer Starter
                </span>
                {currentPlanId === "starter" && isPaidActive && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">Starter Plan</h3>
              <p className="text-xs text-slate-300 mt-1">For independent designers, developers & tutors</p>

              <div className="mt-5 mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-lime-400">₹{starterPlan.priceInRupees}</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Up to <strong>50 invoices</strong> per month</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span><strong>100 Smart AI reminder drafts</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Multi-stage cadence rules (-1d, 0d, +3d, +7d)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Verified email delivery integration</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Payment tracking & balance audit logs</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handleSelectPlan({ id: "starter", name: starterPlan.name, price: starterPlan.priceInRupees })}
                disabled={processing || (currentPlanId === "starter" && isPaidActive)}
                className="w-full py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-lg shadow-lime-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {currentPlanId === "starter" && isPaidActive ? "Current Plan" : `Subscribe for ₹${starterPlan.priceInRupees}/mo`}
              </button>
            </div>
          </div>

          {/* Card 3: Pro Plan */}
          <div className="rounded-2xl bg-[#0F1629] border border-slate-800 p-6 flex flex-col justify-between shadow-xl relative group">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Agencies & Studios
                </span>
                {currentPlanId === "pro" && isPaidActive && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">Pro Plan</h3>
              <p className="text-xs text-slate-400 mt-1">For growing creative agencies & high-volume consultancies</p>

              <div className="mt-5 mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">₹{proPlan.priceInRupees}</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span><strong>Unlimited</strong> invoices & clients</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span><strong>Unlimited</strong> Smart AI reminder drafts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Custom tone calibration & brand styling</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Priority email delivery & webhooks</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Export all historical business data anytime</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handleSelectPlan({ id: "pro", name: proPlan.name, price: proPlan.priceInRupees })}
                disabled={processing || (currentPlanId === "pro" && isPaidActive)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition active:scale-95 disabled:opacity-50"
              >
                {currentPlanId === "pro" && isPaidActive ? "Current Plan" : `Upgrade to Pro (₹${proPlan.priceInRupees}/mo)`}
              </button>
            </div>
          </div>
        </div>


        {/* Transparency & Security Disclosures */}
        <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800 text-xs space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            <span>Honest Billing & Subscription Policy</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
            <div className="space-y-1">
              <strong className="text-white block">No Auto-Charge on Trial</strong>
              <p className="text-[11px] text-slate-400">
                You will never be charged without explicit consent. When your 3-day trial ends, access simply pauses until you choose a paid plan.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-white block">Cancel Anytime</strong>
              <p className="text-[11px] text-slate-400">
                Cancel with one click from your Billing page. Your paid access stays active until the end of your 30-day billing cycle.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-white block">Your Data Stays Yours</strong>
              <p className="text-[11px] text-slate-400">
                We never delete or withhold your clients or invoices if a subscription expires. You can always view and download PDFs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test / Razorpay Checkout Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Subscribe to {checkoutPlan.name}</h3>
                  <p className="text-xs text-slate-400">Razorpay Subscriptions Test Mode</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutPlan(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  {error}
                </div>
              )}

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan:</span>
                  <span className="font-bold text-white">{checkoutPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Billing Interval:</span>
                  <span className="text-slate-200">Monthly (30 Days)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-mono text-lime-400 text-[11px]">
                    {checkoutPlan.order?.orderId}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                  <span className="text-white">Amount Due:</span>
                  <span className="text-lime-400 font-extrabold">₹{checkoutPlan.price}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200 block">Payment Authorization Note:</span>
                <p>
                  You are testing in <strong>Test / Simulation Mode</strong>. Clicking confirm will execute cryptographic server-side verification and activate your 30-day entitlements immediately.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutPlan(null)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={processing}
                  className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {processing ? "Verifying..." : `Authorize & Pay ₹${checkoutPlan.price}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
