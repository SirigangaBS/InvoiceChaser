import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["DRAFT", "SENT", "REMINDER_SENT", "OVERDUE", "PAID", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status provided" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
    });

    await prisma.activityLog.create({
      data: {
        userId: "demo-user-1",
        action: "STATUS_UPDATED",
        details: `Updated ${invoice.invoiceNumber} status to ${status}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Status PATCH error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
