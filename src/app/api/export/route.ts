import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveStatus } from "@/lib/utils";

export async function GET(req: NextRequest) {

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    // Fetch user and all clients and invoices
    const user = await prisma.user.findUnique({
      where: { id: "demo-user-1" },
    });

    const clients = await prisma.client.findMany({
      where: { userId: "demo-user-1" },
      orderBy: { createdAt: "desc" },
    });

    const invoices = await prisma.invoice.findMany({
      where: { userId: "demo-user-1" },
      include: {
        client: true,
        payments: true,
        reminders: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const data = {
      exportTimestamp: new Date().toISOString(),
      user: {
        name: user?.name,
        businessName: user?.businessName,
        email: user?.email,
      },
      clientsCount: clients.length,
      invoicesCount: invoices.length,
      clients,
      invoices: invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client.name,
        clientEmail: inv.client.email,
        description: inv.description,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        subtotalPaise: inv.subtotalPaise,
        taxPaise: inv.taxPaise,
        totalPaise: inv.totalPaise,
        paidPaise: inv.paidPaise,
        effectiveStatus: getEffectiveStatus(inv),
        items: inv.itemsJson ? JSON.parse(inv.itemsJson) : [],
        payments: inv.payments,
        remindersSent: inv.reminders.length,
      })),
    };

    if (format === "csv") {
      // Build clean CSV string
      const headers = [
        "Invoice Number",
        "Client",
        "Client Email",
        "Description",
        "Issue Date",
        "Due Date",
        "Total (INR)",
        "Paid (INR)",
        "Status",
      ];
      const rows = data.invoices.map((inv) => [
        `"${inv.invoiceNumber}"`,
        `"${inv.clientName.replace(/"/g, '""')}"`,
        `"${inv.clientEmail}"`,
        `"${inv.description.replace(/"/g, '""')}"`,
        `"${new Date(inv.issueDate).toISOString().split("T")[0]}"`,
        `"${new Date(inv.dueDate).toISOString().split("T")[0]}"`,
        (inv.totalPaise / 100).toFixed(2),
        (inv.paidPaise / 100).toFixed(2),
        `"${inv.effectiveStatus}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="InvoiceChaser_Export_${Date.now()}.csv"`,
        },
      });
    }

    // Default JSON export
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="InvoiceChaser_Export_${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
