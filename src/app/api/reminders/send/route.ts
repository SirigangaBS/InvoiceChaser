import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveStatus } from "@/lib/utils";
import { getUserSubscription } from "@/lib/subscriptions";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    // Server-side entitlement & trial verification
    const subInfo = await getUserSubscription("demo-user-1");
    if (!subInfo.entitlements.canSendReminder) {
      return NextResponse.json(
        {
          error: subInfo.entitlements.reasonIfBlocked || "Subscription required to send automated reminders.",
          requiresUpgrade: true,
          isTrialExpired: subInfo.user.isTrialExpired,
          plan: subInfo.user.planId,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      invoiceId,
      recipientEmail,
      subject,
      body: emailBody,
      tone = "Professional",
    } = body;

    if (!invoiceId || !recipientEmail || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Missing required fields (invoiceId, recipientEmail, subject, body)" },
        { status: 400 }
      );
    }

    // Verify invoice status
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, user: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const effectiveStatus = getEffectiveStatus(invoice);
    if (effectiveStatus === "PAID" || effectiveStatus === "CANCELLED") {
      return NextResponse.json(
        { error: `Cannot send reminders for an invoice marked as "${effectiveStatus}".` },
        { status: 400 }
      );
    }

    // Duplicate protection: prevent repeated clicks within last 20 seconds
    const twentySecondsAgo = new Date(Date.now() - 20000);
    const recentReminder = await prisma.reminder.findFirst({
      where: {
        invoiceId,
        createdAt: { gte: twentySecondsAgo },
      },
    });

    if (recentReminder) {
      return NextResponse.json(
        { error: "A reminder was sent just moments ago. Duplicate request blocked." },
        { status: 429 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const isEmailConfigured = Boolean(
      resendApiKey && resendApiKey.length > 5 && !resendApiKey.startsWith("your_")
    );

    let provider = "DEMO_SIMULATED";
    let providerId = `demo_sim_${Date.now()}`;
    let isRealSend = false;

    if (isEmailConfigured) {
      try {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.EMAIL_FROM || "InvoiceChaser <onboarding@resend.dev>";

        const sendResult = await resend.emails.send({
          from: fromEmail,
          to: recipientEmail,
          subject: subject,
          text: emailBody,
        });

        if (sendResult.error) {
          throw new Error(sendResult.error.message || "Email provider rejected send request");
        }

        provider = "RESEND";
        providerId = sendResult.data?.id || `resend_${Date.now()}`;
        isRealSend = true;
      } catch (sendError: any) {
        console.error("Resend API error:", sendError);
        return NextResponse.json(
          {
            error: `Failed to deliver email through provider: ${sendError?.message || "Unknown error"}`,
            isConfigured: true,
          },
          { status: 502 }
        );
      }
    }

    // Record Reminder in Database
    const reminderRecord = await prisma.reminder.create({
      data: {
        invoiceId,
        tone,
        recipientEmail,
        subject,
        body: emailBody,
        status: "SENT",
        provider,
        providerId,
        sentAt: new Date(),
      },
    });

    // Update invoice status to REMINDER_SENT if not already OVERDUE or keep overdue
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "REMINDER_SENT",
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: "demo-user-1",
        action: "REMINDER_SENT",
        details: `${isRealSend ? "Real email" : "Demo simulation"} sent to ${recipientEmail} for invoice ${invoice.invoiceNumber} (${tone} tone)`,
      },
    });

    return NextResponse.json({
      success: true,
      message: isRealSend
        ? "Payment reminder sent successfully via Resend!"
        : "Demo Reminder simulated successfully! Recorded in reminder history.",
      reminder: reminderRecord,
      isRealSend,
      provider,
    });
  } catch (error) {
    console.error("Reminder send error:", error);
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
  }
}
