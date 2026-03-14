import { NextRequest, NextResponse } from "next/server";
import { simulatePoll } from "@/lib/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = simulatePoll(id);
    return NextResponse.json({
      message: "Poll completed",
      service: id,
      changesGenerated: result.changesGenerated,
    });
  } catch {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
}
