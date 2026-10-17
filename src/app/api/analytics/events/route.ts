import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_EVENTS = new Set([
  "landing_page_viewed",
  "signup_completed",
  "trial_started",
  "invoice_created",
  "ai_reminder_generated",
  "reminder_sent",
  "checkout_started",
  "subscription_activated",
  "subscription_cancelled",
  "feature_explored",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, distinctId, properties } = body;

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Invalid or unauthorized event name" }, { status: 400 });
    }

    // STRICT PRIVACY SANITIZATION:
    // Strip any sensitive fields like names, emails, raw amounts, descriptions, passwords
    const sanitizedProperties: Record<string, any> = {};
    if (properties && typeof properties === "object") {
      const allowedKeys = ["planId", "tone", "page", "source", "status", "stage", "referrer"];
      for (const key of allowedKeys) {
        if (properties[key] !== undefined) {
          sanitizedProperties[key] = String(properties[key]).slice(0, 100);
        }
      }
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        eventName,
        distinctId: String(distinctId || "anon").slice(0, 80),
        propertiesJson: JSON.stringify(sanitizedProperties),
      },
    });

    return NextResponse.json({ success: true, id: event.id });
  } catch (error: any) {
    console.error("Analytics event recording error:", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
