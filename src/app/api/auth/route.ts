import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("invoicechaser_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: sessionCookie }, { email: sessionCookie }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        role: true,
        subscriptionStatus: true,
        planId: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
      response.cookies.delete("invoicechaser_session");
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, name, businessName } = body;

    // Logout Action
    if (action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out successfully" });
      response.cookies.delete("invoicechaser_session");
      return response;
    }

    // 1. SIGN IN ACTION
    if (action === "signin") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return NextResponse.json(
          {
            error:
              "No account found with this email. Use 1-Click Demo Login or click 'Create Account' to start your free trial.",
          },
          { status: 401 }
        );
      }

      // Check password
      if (user.password && user.password !== password) {
        return NextResponse.json(
          { error: "Incorrect password. (For demo accounts, use password 'demo123456' or 'admin123456')" },
          { status: 401 }
        );
      }

      const response = NextResponse.json({
        success: true,
        message: "Signed in successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          businessName: user.businessName,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
          planId: user.planId,
        },
      });

      // Set session cookie
      response.cookies.set("invoicechaser_session", user.id, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // 2. SIGN UP / REGISTRATION ACTION
    if (action === "signup") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 400 }
        );
      }

      const now = new Date();
      const trialEnds = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const newUserId = `user-${Date.now()}`;

      const newUser = await prisma.user.create({
        data: {
          id: newUserId,
          email: normalizedEmail,
          password: password,
          name: name ? name.trim() : "Freelancer",
          businessName: businessName ? businessName.trim() : `${name || "My"} Studio`,
          trialStartedAt: now,
          trialEndsAt: trialEnds,
          subscriptionStatus: "TRIAL",
          planId: "trial",
          role: "USER",
        },
      });

      // Create initial trial subscription record
      await prisma.subscription.create({
        data: {
          userId: newUser.id,
          planId: "trial",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: trialEnds,
        },
      });

      // Create welcome notification
      await prisma.notification.create({
        data: {
          userId: newUser.id,
          type: "SYSTEM",
          title: "Welcome to InvoiceChaser! 🚀",
          message: "Your 3-day full-feature free trial is now active. Create your first client and GST invoice.",
          linkUrl: "/invoices?action=new",
        },
      });

      const response = NextResponse.json({
        success: true,
        message: "Account created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          businessName: newUser.businessName,
          role: newUser.role,
          subscriptionStatus: newUser.subscriptionStatus,
          planId: newUser.planId,
        },
      });

      response.cookies.set("invoicechaser_session", newUser.id, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth POST error:", error);
    return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("invoicechaser_session");
  return response;
}
