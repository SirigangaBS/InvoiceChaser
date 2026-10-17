import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate, getDaysOverdue, getEffectiveStatus } from "@/lib/utils";
import { getUserSubscription } from "@/lib/subscriptions";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    // Server-side entitlement & trial verification
    const subInfo = await getUserSubscription("demo-user-1");
    if (!subInfo.entitlements.canGenerateAiReminder) {
      return NextResponse.json(
        {
          error: subInfo.entitlements.reasonIfBlocked || "AI reminder usage limit reached. Please upgrade to continue.",
          requiresUpgrade: true,
          isTrialExpired: subInfo.user.isTrialExpired,
          plan: subInfo.user.planId,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { invoiceId, tone = "Professional", customNote } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    // Server-side retrieval of trusted invoice facts
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        user: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const effectiveStatus = getEffectiveStatus(invoice);

    // CRITICAL SECURITY RULE: Do not allow reminders for paid or cancelled invoices
    if (effectiveStatus === "PAID" || effectiveStatus === "CANCELLED") {
      return NextResponse.json(
        {
          error: `Cannot generate payment reminder for an invoice with status "${effectiveStatus}".`,
        },
        { status: 400 }
      );
    }

    const daysOverdue = getDaysOverdue(invoice.dueDate);
    const amountRupeesFormatted = formatINR(invoice.totalPaise - invoice.paidPaise);
    const dueDateFormatted = formatDate(invoice.dueDate);
    const clientName = invoice.client.name;
    const clientCompany = invoice.client.businessName || "";
    const senderName = invoice.user.name;
    const businessName = invoice.user.businessName || senderName;
    const upiId = invoice.user.upiId || "";
    const bankDetails = invoice.user.bankDetails || "";

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const isApiKeyConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.startsWith("your_"));

    let subject = "";
    let reminderText = "";

    if (isApiKeyConfigured) {
      try {
        const openai = new OpenAI({ apiKey });

        const systemPrompt = `You are a professional invoice follow-up assistant. Write a short, respectful payment reminder using only the supplied invoice facts. Do not invent amounts, dates, discounts, fees, payment links, legal threats, or promises. Do not assume the client has not paid if payment status is uncertain. Use the selected tone (${tone}) and make the message concise, polite, and easy to understand. Output a clean subject line on the first line prefixed with 'Subject: ', followed by two newlines and the email body.`;

        const userPrompt = `
Invoice Number: ${invoice.invoiceNumber}
Client Name: ${clientName}
Client Company: ${clientCompany}
Amount Due: ${amountRupeesFormatted}
Due Date: ${dueDateFormatted}
Days Overdue: ${daysOverdue > 0 ? `${daysOverdue} days overdue` : "Due soon"}
Tone: ${tone}
Sender Name: ${senderName}
Sender Business: ${businessName}
UPI Payment ID: ${upiId}
Bank Details: ${bankDetails}
Optional Note from Sender: ${customNote ? String(customNote).slice(0, 200) : "None"}
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 450,
        });

        const content = completion.choices[0]?.message?.content || "";
        const lines = content.split("\n");
        if (lines[0]?.toLowerCase().startsWith("subject:")) {
          subject = lines[0].replace(/^subject:\s*/i, "").trim();
          reminderText = lines.slice(1).join("\n").trim();
        } else {
          subject = `Payment Reminder: Invoice ${invoice.invoiceNumber} - ${businessName}`;
          reminderText = content.trim();
        }
      } catch (aiError: any) {
        console.error("OpenAI API call failed, falling back to simulated generation:", aiError?.message);
        // Fall back gracefully with clear message
      }
    }

    // Fallback template generator if API key is omitted or error occurs
    if (!reminderText) {
      const overduePhrase =
        daysOverdue > 0
          ? `which was due on ${dueDateFormatted} (${daysOverdue} days ago)`
          : `which is due on ${dueDateFormatted}`;

      if (tone.toLowerCase() === "friendly") {
        subject = `Quick note regarding Invoice ${invoice.invoiceNumber} for ${clientCompany || clientName}`;
        reminderText = `Hi ${clientName},

Hope you're having a wonderful and productive week!

I'm checking in on invoice ${invoice.invoiceNumber} for ${amountRupeesFormatted}, ${overduePhrase}.

I understand things can get busy, so I wanted to share a gentle reminder. For your convenience, here are the payment details:
- UPI ID: ${upiId || "Available upon request"}
- Bank: ${bankDetails || "Available on invoice"}

Please let me know if you have any questions or need me to resend the invoice copy.

Warm regards,
${senderName}
${businessName}`;
      } else if (tone.toLowerCase() === "firm") {
        subject = `Urgent Follow-Up: Overdue Invoice ${invoice.invoiceNumber} - ${amountRupeesFormatted}`;
        reminderText = `Dear ${clientName},

This is an important reminder regarding invoice ${invoice.invoiceNumber} for ${amountRupeesFormatted}, which was due on ${dueDateFormatted} and is now ${Math.max(1, daysOverdue)} days overdue.

To keep your account current and avoid any disruption to ongoing projects, please arrange the settlement today using the details below:
- Amount Due: ${amountRupeesFormatted}
- UPI ID: ${upiId || "Available upon request"}
- Bank Details: ${bankDetails || "Available on invoice"}

If this invoice has already been processed in your recent banking batch, please reply with the payment reference details so I can update my records.

Sincerely,
${senderName}
${businessName}`;
      } else {
        // Professional default
        subject = `Payment Follow-up: Invoice ${invoice.invoiceNumber} (${amountRupeesFormatted})`;
        reminderText = `Dear ${clientName},

I hope this email finds you well.

This is a courteous follow-up regarding invoice ${invoice.invoiceNumber} in the amount of ${amountRupeesFormatted}, ${overduePhrase}.

Kindly let me know the scheduled payment date, or process the transfer using the information below:
- Amount: ${amountRupeesFormatted}
- UPI ID: ${upiId || "Available on invoice"}
- Bank Transfer: ${bankDetails || "Available on invoice"}

If you have already sent this payment, please disregard this note and accept my thanks.

Best regards,
${senderName}
${businessName}`;
      }
    }

    return NextResponse.json({
      success: true,
      subject,
      body: reminderText,
      tone,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientEmail: invoice.client.email,
      clientName: invoice.client.name,
      amountRupeesFormatted,
      dueDateFormatted,
      daysOverdue,
      isSimulated: !isApiKeyConfigured,
      apiKeyConfigured: isApiKeyConfigured,
    });
  } catch (error) {
    console.error("AI Reminder generation error:", error);
    return NextResponse.json({ error: "Failed to generate reminder" }, { status: 500 });
  }
}
