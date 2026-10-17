import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d"; // 7d, 30d, all

    // SERVER-SIDE AUTHORIZATION CHECK:
    // Verify admin role or authorization token
    const adminKey = req.headers.get("x-admin-key") || searchParams.get("key");
    const configuredAdminKey = process.env.ADMIN_SECRET_KEY || "admin_hackathon_demo_key";

    // Also allow demo-user-1 if role is ADMIN in database
    const user = await prisma.user.findUnique({
      where: { id: "demo-user-1" },
      select: { role: true, email: true },
    });

    const isAuthorized = user?.role === "ADMIN" || adminKey === configuredAdminKey;
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized. Administrator privileges required." }, { status: 403 });
    }

    // Determine date boundary
    let dateFilter: Date | undefined;
    const now = new Date();
    if (range === "7d") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const eventWhere = dateFilter ? { createdAt: { gte: dateFilter } } : {};
    const paymentWhere = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    // 1. Analytics Events (Visitors & Funnel)
    const allEvents = await prisma.analyticsEvent.findMany({
      where: eventWhere,
      select: { eventName: true, distinctId: true, createdAt: true },
    });

    const uniqueVisitors = new Set(allEvents.map((e) => e.distinctId)).size;
    const pageViews = allEvents.filter((e) => e.eventName === "landing_page_viewed").length;
    const trialStartedEvents = allEvents.filter((e) => e.eventName === "trial_started").length;
    const checkoutStartedEvents = allEvents.filter((e) => e.eventName === "checkout_started").length;
    const subActivatedEvents = allEvents.filter((e) => e.eventName === "subscription_activated").length;

    // 2. Real Database Business Metrics
    const totalUsers = await prisma.user.count();
    const activeTrials = await prisma.user.count({
      where: { subscriptionStatus: "TRIAL" },
    });
    const activeSubscribers = await prisma.user.count({
      where: { subscriptionStatus: "ACTIVE", planId: { not: "trial" } },
    });
    const cancelledUsers = await prisma.user.count({
      where: { subscriptionStatus: "CANCELLED" },
    });

    // 3. Financial MRR & Collections (Paise to INR)
    const paidSubscriptions = await prisma.subscriptionPayment.findMany({
      where: {
        ...paymentWhere,
        status: "PAID",
      },
      select: { amountPaise: true, planId: true, createdAt: true },
    });

    const totalRevenuePaise = paidSubscriptions.reduce((sum, p) => sum + p.amountPaise, 0);
    const mrrRupees = Math.round(totalRevenuePaise / 100);

    const failedPaymentsCount = await prisma.subscriptionPayment.count({
      where: { ...paymentWhere, status: "FAILED" },
    });

    // 4. Product Feature Usage Metrics
    const invoicesCreated = await prisma.invoice.count();
    const remindersCreated = await prisma.reminder.count();
    const totalInvoicedPaise = await prisma.invoice.aggregate({
      _sum: { totalPaise: true, paidPaise: true },
    });

    // 5. Conversion Rates
    const trialToPaidConversion =
      activeTrials + activeSubscribers > 0
        ? Math.round((activeSubscribers / (activeTrials + activeSubscribers)) * 100)
        : 0;

    // 6. Recent Audit & Webhook Activity
    const recentAuditLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    const recentWebhooks = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return NextResponse.json({
      range,
      overview: {
        uniqueVisitors,
        pageViews,
        totalUsers,
        activeTrials,
        activeSubscribers,
        cancelledUsers,
        mrrRupees,
        totalInvoicedRupees: Math.round((totalInvoicedPaise._sum.totalPaise || 0) / 100),
        totalCollectedRupees: Math.round((totalInvoicedPaise._sum.paidPaise || 0) / 100),
        failedPaymentsCount,
        trialToPaidConversion,
      },
      funnel: [
        { stage: "Landing Visitors", count: uniqueVisitors, dropoffPercent: 0 },
        { stage: "Trials / Signups", count: totalUsers, dropoffPercent: uniqueVisitors > 0 ? Math.max(0, 100 - Math.round((totalUsers / uniqueVisitors) * 100)) : 0 },
        { stage: "Invoices Created", count: invoicesCreated, dropoffPercent: totalUsers > 0 ? Math.max(0, 100 - Math.round((invoicesCreated / (totalUsers * 2)) * 100)) : 0 },
        { stage: "Paid Subscribers", count: activeSubscribers, dropoffPercent: totalUsers > 0 ? Math.max(0, 100 - Math.round((activeSubscribers / totalUsers) * 100)) : 0 },
      ],
      usage: {
        invoicesCreated,
        remindersCreated,
      },
      recentAuditLogs,
      recentWebhooks,
    });
  } catch (error: any) {
    console.error("Admin metrics GET error:", error);
    return NextResponse.json({ error: "Failed to load admin metrics" }, { status: 500 });
  }
}
