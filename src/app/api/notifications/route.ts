import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDaysOverdue, formatINR, formatDate } from "@/lib/utils";

export async function GET() {
  try {
    const userId = "demo-user-1";

    // 1. Check for automated real-time triggers to keep notifications fresh
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: { notIn: ["PAID", "CANCELLED"] },
      },
      include: { client: true },
    });

    const now = new Date();

    for (const inv of unpaidInvoices) {
      const daysOverdue = getDaysOverdue(inv.dueDate);
      const amount = formatINR(inv.totalPaise - inv.paidPaise);

      if (daysOverdue > 0) {
        // Check if overdue notification already exists for this invoice
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            type: "OVERDUE",
            title: { contains: inv.invoiceNumber },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              type: "OVERDUE",
              title: `Invoice ${inv.invoiceNumber} is ${daysOverdue} days overdue`,
              message: `${inv.client.name} has not settled ${amount} due on ${formatDate(inv.dueDate)}. Review recommended AI follow-up tone.`,
              linkUrl: `/assistant?invoiceId=${inv.id}`,
            },
          });
        }
      } else if (daysOverdue === 0) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            type: "INVOICE_DUE",
            title: { contains: inv.invoiceNumber },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              type: "INVOICE_DUE",
              title: `Invoice ${inv.invoiceNumber} is due today`,
              message: `${amount} from ${inv.client.name} is due for payment settlement today.`,
              linkUrl: `/invoices/${inv.id}`,
            },
          });
        }
      }
    }

    // 2. Fetch existing notifications sorted by creation date
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = "demo-user-1";
    const body = await req.json().catch(() => ({}));
    const { id, markAll = false } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Missing notification id or markAll flag" }, { status: 400 });
  } catch (error: any) {
    console.error("Notifications PUT error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
