import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: "demo-user-1" },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const activeSub = user.subscriptions[0];
    if (!activeSub) {
      return NextResponse.json({ error: "No active subscription found to cancel" }, { status: 400 });
    }

    // Flag subscription to not renew, but keep active until period end
    await prisma.subscription.update({
      where: { id: activeSub.id },
      data: { cancelAtPeriodEnd: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: "demo-user-1",
        action: "SUBSCRIPTION_CANCELLED",
        details: `Cancellation scheduled for ${activeSub.planId.toUpperCase()} plan. Access continues until ${new Date(activeSub.currentPeriodEnd).toLocaleDateString("en-IN")}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cancellation requested. Your subscription remains active until ${new Date(activeSub.currentPeriodEnd).toLocaleDateString("en-IN")}. No further charges will occur.`,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: activeSub.currentPeriodEnd,
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
