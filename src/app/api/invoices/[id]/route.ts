import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveStatus } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
        reminders: {
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            name: true,
            businessName: true,
            businessAddress: true,
            email: true,
            phone: true,
            upiId: true,
            bankDetails: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...invoice,
      effectiveStatus: getEffectiveStatus(invoice),
      items: invoice.itemsJson ? JSON.parse(invoice.itemsJson) : [],
    });
  } catch (error) {
    console.error("Invoice GET error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const {
      description,
      dueDate,
      items,
      subtotalRupees,
      taxRatePercent = 0,
      paymentLink,
      notes,
      status,
    } = body;

    let subtotalPaise = existing.subtotalPaise;
    let taxPaise = existing.taxPaise;
    let totalPaise = existing.totalPaise;
    let itemsJson = existing.itemsJson;

    if (items !== undefined) {
      itemsJson = JSON.stringify(items);
      const calculatedSubtotal = items.reduce(
        (sum: number, it: any) => sum + (Number(it.rate) || 0) * (Number(it.quantity) || 1),
        0
      );
      subtotalPaise = Math.round(calculatedSubtotal * 100);
      const taxRate = Math.max(0, Number(taxRatePercent) || 0);
      taxPaise = Math.round(subtotalPaise * (taxRate / 100));
      totalPaise = subtotalPaise + taxPaise;
    } else if (subtotalRupees !== undefined) {
      subtotalPaise = Math.round(Number(subtotalRupees) * 100);
      const taxRate = Math.max(0, Number(taxRatePercent) || 0);
      taxPaise = Math.round(subtotalPaise * (taxRate / 100));
      totalPaise = subtotalPaise + taxPaise;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        description: description ? description.trim() : existing.description,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        itemsJson,
        subtotalPaise,
        taxRatePercent: taxRatePercent !== undefined ? Number(taxRatePercent) : existing.taxRatePercent,
        taxPaise,
        totalPaise,
        paymentLink: paymentLink !== undefined ? paymentLink : existing.paymentLink,
        notes: notes !== undefined ? notes : existing.notes,
        status: status || existing.status,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Invoice PUT error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.invoice.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Cancel instead of hard delete to preserve financial trail, unless draft
    if (existing.status === "DRAFT") {
      await prisma.invoice.delete({ where: { id } });
    } else {
      await prisma.invoice.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: "demo-user-1",
        action: existing.status === "DRAFT" ? "INVOICE_DELETED" : "INVOICE_CANCELLED",
        details: `${existing.status === "DRAFT" ? "Deleted" : "Cancelled"} invoice ${existing.invoiceNumber}`,
      },
    });

    return NextResponse.json({ success: true, message: "Invoice updated successfully" });
  } catch (error) {
    console.error("Invoice DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete/cancel invoice" }, { status: 500 });
  }
}
