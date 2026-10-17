import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "toggle" } = body;

    const user = await prisma.user.findUnique({
      where: { id: "demo-user-1" },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const isCurrentlyExpired =
      user.subscriptionStatus === "EXPIRED" ||
      (user.trialEndsAt && new Date(user.trialEndsAt).getTime() < now.getTime());

    let willExpire = action === "expire" || (action === "toggle" && !isCurrentlyExpired);

    if (willExpire) {
      // Set to 1 day in the past
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: "demo-user-1" },
        data: {
          trialEndsAt: yesterday,
          subscriptionStatus: "EXPIRED",
          planId: "trial",
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: "demo-user-1",
          action: "DEMO_TRIAL_EXPIRED",
          details: "Simulated 3-day trial expiration for presentation testing.",
        },
      });

      return NextResponse.json({
        success: true,
        isExpired: true,
        message: "Trial simulated as EXPIRED. Access controls are now active.",
      });
    } else {
      // Restore 3-day active trial
      const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: "demo-user-1" },
        data: {
          trialStartedAt: now,
          trialEndsAt: inThreeDays,
          subscriptionStatus: "TRIAL",
          planId: "trial",
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: "demo-user-1",
          action: "DEMO_TRIAL_RESTORED",
          details: "Restored fresh 3-day active free trial.",
        },
      });

      return NextResponse.json({
        success: true,
        isExpired: false,
        message: "Restored active 3-day trial. Full core features unlocked.",
      });
    }
  } catch (error: any) {
    console.error("Set trial expired error:", error);
    return NextResponse.json({ error: "Failed to toggle trial status" }, { status: 500 });
  }
}
