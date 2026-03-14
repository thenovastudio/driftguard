import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { simulatePoll } from "@/lib/polling";

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
    const result = await simulatePoll(userId, id);
    return NextResponse.json({
      message: "Poll completed",
      ...result,
    });
  } catch {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
}
