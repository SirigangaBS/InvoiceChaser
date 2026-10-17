import { NextResponse } from "next/server";
import { getUserSubscription, PLANS } from "@/lib/subscriptions";

export async function GET() {
  try {
    const data = await getUserSubscription("demo-user-1");
    const hasRazorpayKeys = Boolean(
      process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET &&
        !process.env.RAZORPAY_KEY_ID.startsWith("your_")
    );

    return NextResponse.json({
      ...data,
      allPlans: Object.values(PLANS),
      paymentProvider: {
        provider: "Razorpay Subscriptions",
        isConfigured: hasRazorpayKeys,
        mode: hasRazorpayKeys ? "Live Razorpay Test/Prod API" : "Simulated Test Checkout (Demo Mode)",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
      },
    });
  } catch (error: any) {
    console.error("Subscription GET error:", error);
    return NextResponse.json({ error: "Failed to load subscription status" }, { status: 500 });
  }
}
