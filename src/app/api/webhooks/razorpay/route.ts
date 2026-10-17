import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature, PLANS } from "@/lib/subscriptions";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET not configured. Webhook rejected.");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing x-razorpay-signature header" }, { status: 400 });
    }

    // Cryptographic signature verification
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid Razorpay webhook signature detected!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || event.id || req.headers.get("x-razorpay-event-id");

    if (!eventId) {
      return NextResponse.json({ error: "Missing event identifier" }, { status: 400 });
    }

    // IDEMPOTENCY CHECK: Check if this event was already processed
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      console.log(`Webhook event ${eventId} already processed (idempotent skip).`);
      return NextResponse.json({ received: true, message: "Event already processed" });
    }

    // Record the webhook event for audit and idempotency
    await prisma.webhookEvent.create({
      data: {
        eventId,
        eventType: event.event || "unknown",
        payload: rawBody,
        status: "PROCESSED",
      },
    });

    const eventType = event.event;
    console.log(`Processing Razorpay webhook event: ${eventType} (${eventId})`);

    const payload = event.payload || {};

    // 1. Payment Captured / Order Paid / Subscription Charged (Renewal)
    if (eventType === "payment.captured" || eventType === "order.paid" || eventType === "subscription.charged") {
      const paymentEntity = payload.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const planId = notes.planId || "starter";
      const plan = PLANS[planId] || PLANS.starter;

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: "demo-user-1" },
        data: {
          subscriptionStatus: "ACTIVE",
          planId: plan.id,
        },
      });

      // Update existing active subscription or create new
      const existingSub = await prisma.subscription.findFirst({
        where: { userId: "demo-user-1", status: { in: ["ACTIVE", "PAST_DUE", "PAUSED"] } },
        orderBy: { createdAt: "desc" },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            status: "ACTIVE",
            planId: plan.id,
            currentPeriodEnd: periodEnd,
            gracePeriodEnd: null,
            razorpayPaymentId: paymentEntity?.id || eventId,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: "demo-user-1",
            planId: plan.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            razorpaySubscriptionId: `sub_wh_${Date.now()}`,
            razorpayPaymentId: paymentEntity?.id || eventId,
          },
        });
      }

      await prisma.subscriptionPayment.create({
        data: {
          userId: "demo-user-1",
          planId: plan.id,
          amountPaise: paymentEntity?.amount || plan.priceInPaise,
          currency: paymentEntity?.currency || "INR",
          status: "PAID",
          razorpayPaymentId: paymentEntity?.id || eventId,
          razorpayOrderId: paymentEntity?.order_id || null,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: "demo-user-1",
          action: eventType === "subscription.charged" ? "SUBSCRIPTION_RENEWED" : "WEBHOOK_PAYMENT_CAPTURED",
          details: `Webhook verified payment of ₹${(paymentEntity?.amount ? paymentEntity.amount / 100 : plan.priceInRupees)} for ${plan.name} (${eventType}).`,
        },
      });
    }

    // 2. Subscription Activated
    else if (eventType === "subscription.activated") {
      const subEntity = payload.subscription?.entity;
      await prisma.user.update({
        where: { id: "demo-user-1" },
        data: { subscriptionStatus: "ACTIVE" },
      });
      console.log(`Subscription activated: ${subEntity?.id}`);
    }

    // 3. Payment Failed (Apply 3-day grace period)
    else if (eventType === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      const gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: "demo-user-1" },
        data: { subscriptionStatus: "PAST_DUE" },
      });

      // Update gracePeriodEnd on active subscription
      const latestSub = await prisma.subscription.findFirst({
        where: { userId: "demo-user-1" },
        orderBy: { createdAt: "desc" },
      });

      if (latestSub) {
        await prisma.subscription.update({
          where: { id: latestSub.id },
          data: {
            status: "PAST_DUE",
            gracePeriodEnd,
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          userId: "demo-user-1",
          action: "PAYMENT_FAILED",
          details: `Payment renewal failed for ${paymentEntity?.id || "subscription"}. 3-day grace period granted until ${gracePeriodEnd.toLocaleDateString("en-IN")}.`,
        },
      });
    }

    // 4. Subscription Paused
    else if (eventType === "subscription.paused") {
      await prisma.user.update({
        where: { id: "demo-user-1" },
        data: { subscriptionStatus: "PAUSED" },
      });

      await prisma.activityLog.create({
        data: {
          userId: "demo-user-1",
          action: "SUBSCRIPTION_PAUSED",
          details: "Subscription paused via provider webhook.",
        },
      });
    }

    // 5. Subscription Resumed
    else if (eventType === "subscription.resumed") {
      await prisma.user.update({
        where: { id: "demo-user-1" },
        data: { subscriptionStatus: "ACTIVE" },
      });

      await prisma.activityLog.create({
        data: {
          userId: "demo-user-1",
          action: "SUBSCRIPTION_RESUMED",
          details: "Subscription resumed via provider webhook.",
        },
      });
    }

    // 6. Subscription Cancelled or Halted
    else if (eventType === "subscription.cancelled" || eventType === "subscription.halted") {
      await prisma.user.update({
        where: { id: "demo-user-1" },
        data: { subscriptionStatus: "CANCELLED" },
      });

      await prisma.activityLog.create({
        data: {
          userId: "demo-user-1",
          action: "SUBSCRIPTION_HALTED",
          details: `Subscription cancelled via provider webhook (${eventType}).`,
        },
      });
    }

    return NextResponse.json({ success: true, eventId, eventType });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook internal processing error" }, { status: 500 });
  }
}
