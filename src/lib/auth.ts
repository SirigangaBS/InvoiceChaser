import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const DEFAULT_DEMO_USER_ID = "demo-user-1";

/**
 * Resolves the authenticated user ID from cookies or headers.
 * Falls back to DEFAULT_DEMO_USER_ID for demo mode & local testing.
 */
export async function getAuthUserId(req?: NextRequest): Promise<string> {
  if (!req) return DEFAULT_DEMO_USER_ID;

  try {
    const sessionCookie = req.cookies.get("invoicechaser_session")?.value;
    if (sessionCookie) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ id: sessionCookie }, { email: sessionCookie }],
        },
        select: { id: true },
      });
      if (user) {
        return user.id;
      }
    }
  } catch (error) {
    console.warn("Could not resolve session from cookie, falling back to default:", error);
  }

  return DEFAULT_DEMO_USER_ID;
}

/**
 * Retrieves the current user record.
 */
export async function getAuthUser(req?: NextRequest) {
  const userId = await getAuthUserId(req);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscriptions: true },
  });

  if (user) return user;

  // Fallback to demo user if the resolved ID didn't match an existing record
  return prisma.user.findUnique({
    where: { id: DEFAULT_DEMO_USER_ID },
    include: { subscriptions: true },
  });
}
