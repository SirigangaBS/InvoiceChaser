import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const seedPath = path.join(process.cwd(), "prisma", "seed.js");
    await execAsync(`node "${seedPath}"`);
    return NextResponse.json({ success: true, message: "Demo database reset to initial pristine state" });
  } catch (error: any) {
    console.error("Demo reset error:", error);
    return NextResponse.json({ error: "Failed to reset demo: " + error?.message }, { status: 500 });
  }
}
