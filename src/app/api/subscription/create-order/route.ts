import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/subscriptions";
import { getAuthUserId } from "@/lib/auth";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const body = await req.json();
    const { planId } = body;

    if (!planId || !PLANS[planId]) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const plan = PLANS[planId];
    if (plan.priceInPaise <= 0) {
      return NextResponse.json({ error: "Free trial plan does not require checkout order" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const isConfigured = Boolean(keyId && keySecret && !keyId.startsWith("your_"));

    if (isConfigured) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId!,
          key_secret: keySecret!,
        });

        const receipt = `rcpt_${planId}_${Date.now()}`;
        const order = await razorpay.orders.create({
          amount: plan.priceInPaise,
          currency: "INR",
          receipt,
          notes: {
            planId: plan.id,
            planName: plan.name,
            userId,
          },
        });

        return NextResponse.json({
          orderId: order.id,
          amount: plan.priceInPaise,
          currency: "INR",
          planId: plan.id,
          planName: plan.name,
          keyId,
          isConfigured: true,
          mode: "RAZORPAY_LIVE_API",
        });
      } catch (rpError: any) {
        console.error("Razorpay order creation failed, falling back to simulated checkout:", rpError.message);
      }
    }

    // Fallback simulated test mode order (when Razorpay credentials are empty)
    const simulatedOrderId = `order_sim_${planId}_${Date.now()}`;
    return NextResponse.json({
      orderId: simulatedOrderId,
      amount: plan.priceInPaise,
      currency: "INR",
      planId: plan.id,
      planName: plan.name,
      keyId: "rzp_test_demo_mode",
      isConfigured: false,
      mode: "SIMULATED_TEST_MODE",
    });
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create subscription order" }, { status: 500 });
  }
}
