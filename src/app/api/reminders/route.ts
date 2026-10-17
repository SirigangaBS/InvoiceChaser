import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDaysOverdue, getEffectiveStatus } from "@/lib/utils";

export async function GET() {
  try {
    // 1. Fetch reminder history
    const history = await prisma.reminder.findMany({
      include: {
        invoice: {
          include: { client: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 2. Compute due reminder suggestions:
    // Suggest reminders for unpaid invoices:
    // - 1 day before due date (daysOverdue === -1)
    // - On due date (daysOverdue === 0)
    // - 3 days overdue (daysOverdue >= 3 && daysOverdue < 7)
    // - 7+ days overdue (daysOverdue >= 7)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        userId: "demo-user-1",
        status: { notIn: ["PAID", "CANCELLED"] },
      },
      include: {
        client: true,
        reminders: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const suggestions = [];

    for (const inv of unpaidInvoices) {
      const effective = getEffectiveStatus(inv);
      if (effective === "PAID" || effective === "CANCELLED") continue;

      const overdueDays = getDaysOverdue(inv.dueDate);
      let scheduleStage = "";
      let recommendedTone = "Professional";

      if (overdueDays >= 7) {
        scheduleStage = "7+ Days Overdue (Stage 4)";
        recommendedTone = "Firm";
      } else if (overdueDays >= 3) {
        scheduleStage = "3 Days Overdue (Stage 3)";
        recommendedTone = "Professional";
      } else if (overdueDays === 0) {
        scheduleStage = "Due Today (Stage 2)";
        recommendedTone = "Friendly";
      } else if (overdueDays === -1) {
        scheduleStage = "1 Day Before Due Date (Stage 1)";
        recommendedTone = "Friendly";
      } else if (overdueDays > 0) {
        scheduleStage = `${overdueDays} Days Overdue`;
        recommendedTone = "Professional";
      }

      if (scheduleStage) {
        suggestions.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client.name,
          clientEmail: inv.client.email,
          totalPaise: inv.totalPaise,
          paidPaise: inv.paidPaise,
          dueDate: inv.dueDate,
          overdueDays,
          scheduleStage,
          recommendedTone,
          lastReminderSentAt: inv.reminders[0]?.createdAt || null,
        });
      }
    }

    return NextResponse.json({
      history,
      suggestions,
    });
  } catch (error) {
    console.error("Reminders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}
