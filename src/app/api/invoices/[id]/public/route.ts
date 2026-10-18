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
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
            address: true,
            phone: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            businessName: true,
            upiId: true,
            bankDetails: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or link has expired" }, { status: 404 });
    }

    const effectiveStatus = getEffectiveStatus(invoice);
    const hasRazorpay = Boolean(
      process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET &&
        !process.env.RAZORPAY_KEY_ID.startsWith("your_")
    );

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      description: invoice.description,
      items: invoice.itemsJson ? JSON.parse(invoice.itemsJson) : [],
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotalPaise: invoice.subtotalPaise,
      taxRatePercent: invoice.taxRatePercent,
      taxPaise: invoice.taxPaise,
      totalPaise: invoice.totalPaise,
      paidPaise: invoice.paidPaise,
      balancePaise: Math.max(0, invoice.totalPaise - invoice.paidPaise),
      status: invoice.status,
      effectiveStatus,
      client: invoice.client,
      biller: {
        name: invoice.user.name,
        email: invoice.user.email,
        businessName: invoice.user.businessName || invoice.user.name,
        upiId: invoice.user.upiId,
        bankDetails: invoice.user.bankDetails,
      },
      payments: invoice.payments,
      paymentGateway: {
        isConfigured: hasRazorpay,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
      },
    });
  } catch (error: any) {
    console.error("Public invoice GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve invoice" }, { status: 500 });
  }
}
