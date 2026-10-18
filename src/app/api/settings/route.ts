import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    const resendKey = process.env.RESEND_API_KEY?.trim();

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        upiId: user.upiId,
        bankDetails: user.bankDetails,
        phone: user.phone,
      },
      status: {
        openai: {
          configured: Boolean(openAiKey && openAiKey.length > 5 && !openAiKey.startsWith("your_")),
          model: "gpt-4o-mini",
          mode: openAiKey ? "Live AI Integration" : "Simulated AI Assistant (Demo Mode)",
        },
        resend: {
          configured: Boolean(resendKey && resendKey.length > 5 && !resendKey.startsWith("your_")),
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          mode: resendKey ? "Live Email Delivery" : "Safe Simulated Send (Demo Mode)",
        },
      },
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const body = await req.json();
    const { name, businessName, businessAddress, upiId, bankDetails, phone } = body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name ? name.trim() : undefined,
        businessName: businessName ? businessName.trim() : undefined,
        businessAddress: businessAddress ? businessAddress.trim() : undefined,
        upiId: upiId ? upiId.trim() : undefined,
        bankDetails: bankDetails ? bankDetails.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "SETTINGS_UPDATED",
        details: "Updated business profile and payment details",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
