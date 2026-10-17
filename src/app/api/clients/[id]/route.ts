import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Client GET error:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, businessName, address, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        businessName: businessName ? businessName.trim() : null,
        address: address ? address.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Client PUT error:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Safety check: ensure client doesn't have active unpaid invoices
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const hasUnpaidInvoices = client.invoices.some(
      (inv) => inv.status !== "CANCELLED" && inv.paidPaise < inv.totalPaise
    );

    if (hasUnpaidInvoices) {
      return NextResponse.json(
        {
          error:
            "Cannot delete client with active unpaid invoices. Please settle or cancel invoices first.",
        },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId: "demo-user-1",
        action: "CLIENT_DELETED",
        details: `Deleted client: ${client.name}`,
      },
    });

    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("Client DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
