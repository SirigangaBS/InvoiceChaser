import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amountRupees, paymentMethod = "MANUAL", referenceNote } = body;

    const amount = Number(amountRupees);
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot record payment on a cancelled invoice" }, { status: 400 });
    }

    const amountPaise = Math.round(amount * 100);
    const newPaidPaise = invoice.paidPaise + amountPaise;
    const isFullyPaid = newPaidPaise >= invoice.totalPaise;

    // Create Payment Record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amountPaise,
        paymentMethod: paymentMethod || "MANUAL",
        referenceNote: referenceNote ? referenceNote.trim() : `Manual Demo Payment of ₹${amount.toLocaleString("en-IN")}`,
      },
    });

    // Update Invoice balance and status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        paidPaise: newPaidPaise,
        status: isFullyPaid ? "PAID" : invoice.status,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: "demo-user-1",
        action: "PAYMENT_RECEIVED",
        details: `Recorded payment of ₹${amount.toLocaleString("en-IN")} (${paymentMethod}) for ${invoice.invoiceNumber}${isFullyPaid ? " (Fully Settled)" : ""}`,
      },
    });

    return NextResponse.json({
      success: true,
      payment,
      invoice: updatedInvoice,
      isFullyPaid,
    });
  } catch (error) {
    console.error("Payment POST error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
