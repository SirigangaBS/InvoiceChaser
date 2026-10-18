import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDaysOverdue, formatINR, formatDate, getEffectiveStatus } from "@/lib/utils";
import { getAuthUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    // 1. Fetch activity logs
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 2. Fetch reminders
    const reminders = await prisma.reminder.findMany({
      where: { invoice: { userId } },
      include: {
        invoice: {
          include: { client: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // 3. Fetch invoice payments
    const payments = await prisma.payment.findMany({
      where: { invoice: { userId } },
      include: {
        invoice: {
          include: { client: true },
        },
      },
      orderBy: { paymentDate: "desc" },
      take: 30,
    });

    // 4. Combine into structured timeline items
    const timelineItems: any[] = [];

    // Map activity logs
    for (const log of logs) {
      let category = "SYSTEM";
      let badgeColor = "blue";
      let actionLabel = "View Details";
      let actionLink = "/invoices";

      if (log.action.includes("INVOICE")) {
        category = "INVOICE";
        badgeColor = "lime";
        actionLink = "/invoices";
        actionLabel = "View Invoices";
      } else if (log.action.includes("REMINDER")) {
        category = "REMINDER";
        badgeColor = "amber";
        actionLink = "/reminders";
        actionLabel = "View Reminders";
      } else if (log.action.includes("PAYMENT")) {
        category = "PAYMENT";
        badgeColor = "emerald";
        actionLink = "/invoices";
        actionLabel = "Review Balance";
      } else if (log.action.includes("SUBSCRIPTION") || log.action.includes("TRIAL")) {
        category = "BILLING";
        badgeColor = "purple";
        actionLink = "/billing";
        actionLabel = "Manage Plan";
      }

      timelineItems.push({
        id: log.id,
        timestamp: log.createdAt,
        type: log.action,
        category,
        title: log.action.replace(/_/g, " "),
        description: log.details,
        badgeColor,
        actionLabel,
        actionLink,
      });
    }

    // Sort all timeline items chronologically
    timelineItems.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      items: timelineItems,
      totalCount: timelineItems.length,
      schedulerConfigured: false,
      schedulerNotice: "Automatic cron scheduler is not enabled in local demo mode. Use the manual 'Check Due Cadence' button to run the scanner.",
    });
  } catch (error: any) {
    console.error("Timeline GET error:", error);
    return NextResponse.json({ error: "Failed to load timeline events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const body = await req.json().catch(() => ({}));
    const { action = "scan-cadence" } = body;

    if (action === "scan-cadence") {
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          userId,
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        include: { client: true },
      });

      let checkedCount = 0;
      let flaggedCount = 0;

      for (const inv of unpaidInvoices) {
        checkedCount++;
        const effective = getEffectiveStatus(inv);
        if (effective === "PAID" || effective === "CANCELLED") continue;

        const overdueDays = getDaysOverdue(inv.dueDate);
        if (overdueDays > 0) {
          flaggedCount++;
        }
      }

      await prisma.activityLog.create({
        data: {
          userId,
          action: "CADENCE_SCANNER_RUN",
          details: `Manual cadence scan completed. Checked ${checkedCount} invoices, identified ${flaggedCount} overdue invoices eligible for follow-up.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Cadence scanner completed. Scanned ${checkedCount} active invoices; ${flaggedCount} overdue.`,
        checkedCount,
        flaggedCount,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Timeline action error:", error);
    return NextResponse.json({ error: "Failed to run timeline action" }, { status: 500 });
  }
}
