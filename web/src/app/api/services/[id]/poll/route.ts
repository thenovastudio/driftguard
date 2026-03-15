import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { performPoll } from "@/lib/polling";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await performPoll(id, userId);
    return NextResponse.json({
      message: "Poll completed",
      ...result,
    });
  } catch (err: any) {
    console.error("Polling error:", err);
    return NextResponse.json({ error: err.message || "Failed to poll service" }, { status: 500 });
  }
}
