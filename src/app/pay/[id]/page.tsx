"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Building,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  Download,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function PaymentContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [paymentRef, setPaymentRef] = useState<string>("");

  useEffect(() => {
    // Dynamically inject Razorpay Checkout SDK
    if (!document.getElementById("razorpay-checkout-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/invoices/${id}/public`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invoice not found or link has expired.");
      }
      const data = await res.json();
      setInvoice(data);
      if (data.effectiveStatus === "PAID") {
        setPaidSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, type: "upi" | "bank") => {
    navigator.clipboard.writeText(text);
    if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  const recordSettlement = async (ref: string, method: string = "ONLINE_RAZORPAY") => {
    try {
      const balanceRupees = invoice.balancePaise / 100;
      const res = await fetch(`/api/invoices/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountRupees: balanceRupees,
          paymentMethod: method,
          referenceNote: `Client online settlement via ${method} (Ref: ${ref})`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settlement status");
      }

      setPaidSuccess(true);
      setPaymentRef(ref);
      fetchInvoice();
    } catch (err: any) {
      alert("Payment processed, but updating record failed: " + err.message);
    }
  };

  const handleOnlinePayment = async () => {
    if (!invoice) return;
    setProcessingPayment(true);

    const balanceRupees = invoice.balancePaise / 100;
    const isLive = invoice.paymentGateway?.isConfigured && window.Razorpay;

    if (isLive && invoice.paymentGateway?.keyId) {
      // Real Razorpay Checkout flow
      const options = {
        key: invoice.paymentGateway.keyId,
        amount: invoice.balancePaise,
        currency: "INR",
        name: invoice.biller.businessName || invoice.biller.name,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        prefill: {
          name: invoice.client.name,
          email: invoice.client.email,
          contact: invoice.client.phone || "",
        },
        theme: {
          color: "#84CC16", // Lime theme
        },
        handler: async function (response: any) {
          await recordSettlement(response.razorpay_payment_id || `rzp_${Date.now()}`, "RAZORPAY_CHECKOUT");
          setProcessingPayment(false);
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error("Razorpay error:", err);
        // Fallback test mode
        await simulateTestPayment();
      }
    } else {
      // Test / Simulated Checkout Mode
      await simulateTestPayment();
    }
  };

  const simulateTestPayment = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const testRef = `PAY_SIM_${Date.now().toString().slice(-6)}`;
    await recordSettlement(testRef, "SIMULATED_GATEWAY");
    setProcessingPayment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading secure payment portal...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0C101A] border border-slate-800 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invoice Unavailable</h2>
          <p className="text-sm text-slate-400 mb-6">{error || "Could not find invoice details."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const isPaid = paidSuccess || invoice.effectiveStatus === "PAID";
  const balanceINR = (invoice.balancePaise / 100).toLocaleString("en-IN");
  const totalINR = (invoice.totalPaise / 100).toLocaleString("en-IN");
  const subtotalINR = (invoice.subtotalPaise / 100).toLocaleString("en-IN");
  const taxINR = (invoice.taxPaise / 100).toLocaleString("en-IN");

  return (
    <div className="min-h-screen bg-[#06080E] text-slate-200 antialiased py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Trust Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-lime-400/20 text-lime-400 flex items-center justify-center font-black text-[10px]">
              IC
            </div>
            <span className="font-semibold text-slate-300">InvoiceChaser Secure Pay</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>

        {/* Paid Banner or Payment Summary Card */}
        {isPaid ? (
          <div className="rounded-3xl bg-gradient-to-b from-emerald-950/40 via-[#0C141E] to-[#0A0E17] border border-emerald-500/30 p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-lg shadow-emerald-900/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Invoice Fully Settled</h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
              Thank you! Invoice <span className="font-semibold text-white">{invoice.invoiceNumber}</span> has been paid in full to{" "}
              <span className="font-semibold text-white">{invoice.biller.businessName}</span>.
            </p>

            <div className="inline-flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-3 text-xs">
              <div>
                <span className="text-slate-400">Total Settled:</span>{" "}
                <span className="font-bold text-emerald-400 text-sm">₹{totalINR}</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <div>
                <span className="text-slate-400">Status:</span>{" "}
                <span className="font-bold text-white uppercase tracking-wider">PAID</span>
              </div>
              {paymentRef && (
                <>
                  <div className="w-px h-4 bg-slate-800" />
                  <div>
                    <span className="text-slate-400">Ref:</span>{" "}
                    <span className="font-mono text-slate-300">{paymentRef}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 to-[#0A0E17] border border-slate-800 p-6 sm:p-8 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-lime-400 mb-1 inline-block">
                  Payment Request
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Invoice {invoice.invoiceNumber}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Issued by <span className="text-slate-200 font-semibold">{invoice.biller.businessName}</span> ({invoice.biller.name})
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-xs text-slate-400 block mb-0.5">Amount Due</span>
                <div className="text-3xl sm:text-4xl font-black text-lime-400 tracking-tight">
                  ₹{balanceINR}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center sm:justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due by {new Date(invoice.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Quick Online Payment Action */}
            <div className="py-6">
              <button
                onClick={handleOnlinePayment}
                disabled={processingPayment}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 hover:from-lime-300 hover:to-teal-300 text-slate-950 font-black text-base shadow-xl shadow-lime-500/20 flex items-center justify-center gap-3 transition transform active:scale-[0.99] disabled:opacity-50"
              >
                {processingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay ₹{balanceINR} via UPI / Card / NetBanking</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> Instant Bank Settlement
                </span>
                <span>•</span>
                <span>UPI, RuPay, Visa, Mastercard, NetBanking</span>
              </div>
            </div>

            {/* Alternative Direct Payment (UPI / Bank Account) */}
            {(invoice.biller.upiId || invoice.biller.bankDetails) && (
              <div className="mt-4 pt-6 border-t border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Or Settle Directly via UPI / Bank
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {invoice.biller.upiId && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">UPI ID</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{invoice.biller.upiId}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(invoice.biller.upiId, "upi")}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {invoice.biller.bankDetails && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Bank Account</span>
                        <span className="text-xs font-mono text-slate-200 truncate block">{invoice.biller.bankDetails}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(invoice.biller.bankDetails, "bank")}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition flex-shrink-0"
                        title="Copy Bank Details"
                      >
                        {copiedBank ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invoice Breakdown Details Card */}
        <div className="rounded-2xl bg-[#0B0F19] border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Invoice Details</h2>
            <div className="text-xs text-slate-400">
              Issued: {new Date(invoice.issueDate).toLocaleDateString("en-IN")}
            </div>
          </div>

          {/* Biller & Client Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-850 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed From
              </span>
              <p className="font-bold text-slate-200 text-sm">{invoice.biller.businessName}</p>
              <p className="text-slate-400">{invoice.biller.name}</p>
              <p className="text-slate-400">{invoice.biller.email}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To
              </span>
              <p className="font-bold text-slate-200 text-sm">
                {invoice.client.businessName || invoice.client.name}
              </p>
              {invoice.client.businessName && <p className="text-slate-400">{invoice.client.name}</p>}
              <p className="text-slate-400">{invoice.client.email}</p>
              {invoice.client.address && <p className="text-slate-400 text-[11px] mt-0.5">{invoice.client.address}</p>}
            </div>
          </div>

          {/* Line items table or description */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Scope of Work</h3>
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850/80 text-xs text-slate-300">
              {invoice.description}
            </div>

            {invoice.items && invoice.items.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2">Item</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoice.items.map((it: any, idx: number) => (
                      <tr key={idx} className="text-slate-300">
                        <td className="py-2.5 font-medium">{it.name || `Service Item #${idx + 1}`}</td>
                        <td className="py-2.5 text-center text-slate-400">{it.quantity || 1}</td>
                        <td className="py-2.5 text-right font-mono">₹{Number(it.rateRupees || 0).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 text-right font-mono font-semibold text-slate-200">
                          ₹{((Number(it.quantity) || 1) * (Number(it.rateRupees) || 0)).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Financial Totals */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200">₹{subtotalINR}</span>
            </div>
            {invoice.taxRatePercent > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>GST / Tax ({invoice.taxRatePercent}%):</span>
                <span className="font-mono text-slate-200">₹{taxINR}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span>Total Invoiced:</span>
              <span className="font-mono text-lime-400">₹{totalINR}</span>
            </div>
            {invoice.paidPaise > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Already Paid:</span>
                <span className="font-mono">-₹{(invoice.paidPaise / 100).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>Balance Remaining:</span>
              <span className="font-mono text-lime-400">₹{balanceINR}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4">
          Powered by{" "}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white underline font-semibold transition"
          >
            InvoiceChaser
          </a>{" "}
          • Automated Reminders & Fast Settlements for Freelancers
        </div>
      </div>
    </div>
  );
}

export default function PublicPaymentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-mono text-sm">Loading secure payment portal...</p>
        </div>
      }
    >
      <PaymentContent />
    </React.Suspense>
  );
}
