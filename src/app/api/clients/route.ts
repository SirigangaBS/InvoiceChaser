import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        invoices: {
          select: {
            id: true,
            totalPaise: true,
            paidPaise: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = clients.map((c) => {
      let totalBilledPaise = 0;
      let totalPaidPaise = 0;
      let unpaidCount = 0;

      for (const inv of c.invoices) {
        if (inv.status !== "CANCELLED") {
          totalBilledPaise += inv.totalPaise;
          totalPaidPaise += inv.paidPaise;
          if (inv.paidPaise < inv.totalPaise) {
            unpaidCount++;
          }
        }
      }

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        businessName: c.businessName,
        address: c.address,
        notes: c.notes,
        createdAt: c.createdAt,
        invoicesCount: c.invoices.length,
        unpaidCount,
        totalBilledPaise,
        outstandingPaise: Math.max(0, totalBilledPaise - totalPaidPaise),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Clients GET error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, businessName, address, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const userId = await getAuthUserId(req);

    const client = await prisma.client.create({
      data: {
        userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        businessName: businessName ? businessName.trim() : null,
        address: address ? address.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "CLIENT_CREATED",
        details: `Added new client: ${client.name} (${client.businessName || "Individual"})`,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Client POST error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
