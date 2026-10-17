import { prisma } from "./prisma";
import crypto from "crypto";

export interface PlanConfig {
  id: string;
  name: string;
  priceInPaise: number;
  priceInRupees: number;
  billingInterval: string;
  invoiceLimit: number; // -1 for unlimited
  aiReminderLimit: number; // -1 for unlimited
  features: string[];
}

// Configurable launch-test prices (server-side, never trusted from client)
const STARTER_PRICE_INR = parseInt(process.env.STARTER_PRICE_INR || "199", 10);
const PRO_PRICE_INR = parseInt(process.env.PRO_PRICE_INR || "399", 10);

export const PLANS: Record<string, PlanConfig> = {
  trial: {
    id: "trial",
    name: "Free Trial (3 Days)",
    priceInPaise: 0,
    priceInRupees: 0,
    billingInterval: "3-day trial",
    invoiceLimit: 5,
    aiReminderLimit: 10,
    features: [
      "3-day full access to core invoice & AI features",
      "Up to 5 active invoices",
      "10 Smart AI reminder drafts",
      "Professional PDF generation with UPI details",
      "No credit card required upfront",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter Plan",
    priceInPaise: STARTER_PRICE_INR * 100,
    priceInRupees: STARTER_PRICE_INR,
    billingInterval: "monthly",
    invoiceLimit: 50,
    aiReminderLimit: 100,
    features: [
      "Up to 50 active invoices per month",
      "100 Smart AI reminder drafts per month",
      "Multi-stage cadence scheduler (-1d, 0d, +3d, +7d)",
      "Verified Resend email delivery",
      "Unlimited PDF invoice downloads",
      "Payment logging & balance updates",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    priceInPaise: PRO_PRICE_INR * 100,
    priceInRupees: PRO_PRICE_INR,
    billingInterval: "monthly",
    invoiceLimit: -1, // Unlimited
    aiReminderLimit: -1, // Unlimited
    features: [
      "Unlimited invoices & clients",
      "Unlimited Smart AI reminder drafts",
      "Custom tone calibration & brand styling",
      "Priority email delivery & webhook sync",
      "Full analytics & cash-flow tracking",
      "Export all business data anytime",
    ],
  },
};

export async function getUserSubscription(userId: string = "demo-user-1") {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      subscriptionPayments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  // If user has no trialEndsAt, initialize a strict 3-day window from creation
  if (!user.trialEndsAt) {
    const startedAt = user.trialStartedAt ? new Date(user.trialStartedAt) : now;
    const computedEnd = new Date(startedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        trialStartedAt: startedAt,
        trialEndsAt: computedEnd,
      },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        subscriptionPayments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const isTrial = user.planId === "trial" || user.subscriptionStatus === "TRIAL";
  const isTrialExpired = isTrial && trialEndsAt ? now.getTime() > trialEndsAt.getTime() : false;
  
  let remainingHours = 0;
  let remainingDays = 0;
  if (trialEndsAt && !isTrialExpired) {
    const diffMs = trialEndsAt.getTime() - now.getTime();
    remainingHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
    remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const activeSub = user.subscriptions[0] || null;

  // Grace period evaluation for past due accounts
  let isInGracePeriod = false;
  let gracePeriodExpired = false;
  let gracePeriodRemainingDays = 0;

  if (user.subscriptionStatus === "PAST_DUE" && activeSub?.gracePeriodEnd) {
    const graceEnd = new Date(activeSub.gracePeriodEnd);
    if (now.getTime() <= graceEnd.getTime()) {
      isInGracePeriod = true;
      gracePeriodRemainingDays = Math.max(0, Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      gracePeriodExpired = true;
    }
  }

  const isPaidActive =
    ((user.subscriptionStatus === "ACTIVE" || activeSub?.status === "ACTIVE") || isInGracePeriod) &&
    user.planId !== "trial" &&
    !gracePeriodExpired;

  const currentPlanId = user.planId || "trial";
  const planConfig = PLANS[currentPlanId] || PLANS.trial;

  // Usage in current cycle:
  // Count active non-cancelled invoices
  const invoiceCount = await prisma.invoice.count({
    where: {
      userId,
      status: { not: "CANCELLED" },
    },
  });

  // Count reminders created
  const reminderCount = await prisma.reminder.count({
    where: {
      invoice: { userId },
    },
  });

  // Entitlement evaluation
  let canCreateInvoice = true;
  let canGenerateAiReminder = true;
  let canSendReminder = true;
  let reasonIfBlocked: string | null = null;

  if (gracePeriodExpired) {
    canCreateInvoice = false;
    canGenerateAiReminder = false;
    canSendReminder = false;
    reasonIfBlocked = "Grace period has expired following a failed subscription renewal. Please renew your subscription to restore full access.";
  } else if (isTrialExpired && !isPaidActive) {
    canCreateInvoice = false;
    canGenerateAiReminder = false;
    canSendReminder = false;
    reasonIfBlocked = "Your 3-day free trial has expired. Upgrade to Starter or Pro to continue creating invoices and using the AI assistant.";
  } else if (user.subscriptionStatus === "CANCELLED" && !isPaidActive) {
    canCreateInvoice = false;
    canGenerateAiReminder = false;
    canSendReminder = false;
    reasonIfBlocked = "Your subscription has ended. Choose a plan to resume full access.";
  } else if (!isPaidActive && isTrial) {
    // Check trial limits
    if (planConfig.invoiceLimit !== -1 && invoiceCount >= planConfig.invoiceLimit) {
      canCreateInvoice = false;
      reasonIfBlocked = `Trial invoice limit reached (${planConfig.invoiceLimit} invoices). Upgrade to Starter or Pro for more.`;
    }
    if (planConfig.aiReminderLimit !== -1 && reminderCount >= planConfig.aiReminderLimit) {
      canGenerateAiReminder = false;
      reasonIfBlocked = `Trial AI limit reached (${planConfig.aiReminderLimit} reminders). Upgrade to Starter or Pro for more.`;
    }
  } else if (isPaidActive && planConfig.invoiceLimit !== -1 && invoiceCount >= planConfig.invoiceLimit) {
    canCreateInvoice = false;
    reasonIfBlocked = `Plan invoice limit reached (${planConfig.invoiceLimit} invoices). Upgrade to Pro for unlimited.`;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      subscriptionStatus: gracePeriodExpired ? "EXPIRED" : isTrialExpired && !isPaidActive ? "EXPIRED" : user.subscriptionStatus,
      planId: currentPlanId,
      trialStartedAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt,
      isTrial,
      isTrialExpired,
      remainingHours,
      remainingDays,
      isPaidActive,
      isInGracePeriod,
      gracePeriodEnd: activeSub?.gracePeriodEnd || null,
      gracePeriodRemainingDays,
    },
    plan: planConfig,
    activeSubscription: activeSub,
    recentPayments: user.subscriptionPayments,
    usage: {
      invoiceCount,
      invoiceLimit: planConfig.invoiceLimit,
      reminderCount,
      aiReminderLimit: planConfig.aiReminderLimit,
    },
    entitlements: {
      canCreateInvoice,
      canGenerateAiReminder,
      canSendReminder,
      reasonIfBlocked,
    },
  };
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) return false;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
