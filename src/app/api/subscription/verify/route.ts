import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/subscriptions";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      isSimulated,
    } = body;

    if (!planId || !PLANS[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS[planId];
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const isConfigured = Boolean(keySecret && !keySecret.startsWith("your_"));

    // Production & Configuration Security Guard
    if (process.env.NODE_ENV === "production" && isSimulated) {
      return NextResponse.json(
        { error: "Simulated test payments are strictly forbidden in production mode." },
        { status: 403 }
      );
    }

    if (isConfigured && isSimulated) {
      return NextResponse.json(
        { error: "Simulated test checkout is disabled when official Razorpay API credentials are configured." },
        { status: 403 }
      );
    }

    // Cryptographic signature verification for live Razorpay payments
    if (isConfigured) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { error: "Missing required payment verification parameters (order_id, payment_id, signature)" },
          { status: 400 }
        );
      }

      const generatedSignature = crypto
        .createHmac("sha256", keySecret!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      let isMatch = false;
      try {
        isMatch = crypto.timingSafeEqual(
          Buffer.from(generatedSignature, "utf-8"),
          Buffer.from(razorpay_signature, "utf-8")
        );
      } catch {
        isMatch = false;
      }

      if (!isMatch) {
        return NextResponse.json(
          { error: "Payment verification failed. Invalid cryptographic signature from provider." },
          { status: 400 }
        );
      }
    }


    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day billing cycle

    const paymentId = razorpay_payment_id || `pay_sim_${Date.now()}`;
    const orderId = razorpay_order_id || `ord_sim_${Date.now()}`;

    // Update User subscription
    await prisma.user.update({
      where: { id: "demo-user-1" },
      data: {
        subscriptionStatus: "ACTIVE",
        planId: plan.id,
      },
    });

    // Create Subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId: "demo-user-1",
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        razorpaySubscriptionId: `sub_${plan.id}_${Date.now()}`,
        razorpayPaymentId: paymentId,
      },
    });

    // Create Payment record
    const payment = await prisma.subscriptionPayment.create({
      data: {
        userId: "demo-user-1",
        planId: plan.id,
        amountPaise: plan.priceInPaise,
        currency: "INR",
        status: "PAID",
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: razorpay_signature || "simulated_test_sig",
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: "demo-user-1",
        action: "SUBSCRIPTION_ACTIVATED",
        details: `Subscribed to ${plan.name} (₹${plan.priceInRupees}/mo) via ${isConfigured && !isSimulated ? "Razorpay" : "Test Checkout"}. Active through ${periodEnd.toLocaleDateString("en-IN")}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully activated ${plan.name}!`,
      plan: plan.name,
      periodEnd,
      paymentId,
    });
  } catch (error: any) {
    console.error("Subscription verify error:", error);
    return NextResponse.json({ error: "Failed to verify payment and activate plan" }, { status: 500 });
  }
}
