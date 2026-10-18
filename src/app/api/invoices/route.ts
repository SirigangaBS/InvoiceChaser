import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveStatus } from "@/lib/utils";
import { getUserSubscription } from "@/lib/subscriptions";
import { getAuthUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status")?.toUpperCase();
    const clientId = searchParams.get("clientId");

    const where: any = { userId };

    if (clientId) {
      where.clientId = clientId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        payments: true,
        reminders: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let results = invoices.map((inv) => ({
      ...inv,
      effectiveStatus: getEffectiveStatus(inv),
      items: inv.itemsJson ? JSON.parse(inv.itemsJson) : [],
    }));

    // Filter by status if specified
    if (status && status !== "ALL") {
      results = results.filter((inv) => inv.effectiveStatus === status);
    }

    // Search by invoiceNumber, client name, or description
    if (search) {
      results = results.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(search) ||
          inv.client.name.toLowerCase().includes(search) ||
          inv.description.toLowerCase().includes(search) ||
          (inv.client.businessName && inv.client.businessName.toLowerCase().includes(search))
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    // Server-side entitlement & trial verification
    const subInfo = await getUserSubscription(userId);
    if (!subInfo.entitlements.canCreateInvoice) {
      return NextResponse.json(
        {
          error: subInfo.entitlements.reasonIfBlocked || "Invoice creation is restricted. Please upgrade to continue.",
          requiresUpgrade: true,
          isTrialExpired: subInfo.user.isTrialExpired,
          plan: subInfo.user.planId,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      clientId,
      description,
      issueDate,
      dueDate,
      items,
      subtotalRupees,
      taxRatePercent = 0,
      paymentLink,
      notes,
      status = "SENT",
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client is required" }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: "Invoice description is required" }, { status: 400 });
    }

    if (!issueDate || !dueDate) {
      return NextResponse.json({ error: "Issue date and due date are required" }, { status: 400 });
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Selected client does not exist" }, { status: 400 });
    }

    // Calculate subtotal from items if present, or from subtotalRupees
    let calculatedSubtotalRupees = 0;
    if (Array.isArray(items) && items.length > 0) {
      calculatedSubtotalRupees = items.reduce(
        (sum: number, it: any) => sum + (Number(it.rate) || 0) * (Number(it.quantity) || 1),
        0
      );
    } else {
      calculatedSubtotalRupees = Number(subtotalRupees) || 0;
    }

    if (calculatedSubtotalRupees <= 0) {
      return NextResponse.json({ error: "Total amount must be greater than zero" }, { status: 400 });
    }

    const subtotalPaise = Math.round(calculatedSubtotalRupees * 100);
    const taxRate = Math.max(0, Number(taxRatePercent) || 0);
    const taxPaise = Math.round(subtotalPaise * (taxRate / 100));
    const totalPaise = subtotalPaise + taxPaise;

    // Generate unique invoice number
    const count = await prisma.invoice.count();
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, "0")}`;

    const newInvoice = await prisma.invoice.create({
      data: {
        userId,
        clientId,
        invoiceNumber,
        description: description.trim(),
        itemsJson: items ? JSON.stringify(items) : null,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        currency: "INR",
        subtotalPaise,
        taxRatePercent: taxRate,
        taxPaise,
        totalPaise,
        paidPaise: 0,
        paymentLink: paymentLink ? paymentLink.trim() : null,
        notes: notes ? notes.trim() : null,
        status: status === "DRAFT" ? "DRAFT" : "SENT",
      },
      include: {
        client: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "INVOICE_CREATED",
        details: `Created invoice ${newInvoice.invoiceNumber} (₹${Math.round(totalPaise / 100).toLocaleString("en-IN")}) for ${client.name}`,
      },
    });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error("Invoice POST error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
