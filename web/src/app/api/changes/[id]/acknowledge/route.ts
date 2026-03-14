import { NextRequest, NextResponse } from "next/server";
import { changes } from "@/lib/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const change = changes.find((c) => c.id === parseInt(id));

  if (!change) {
    return NextResponse.json({ error: "Change not found" }, { status: 404 });
  }

  change.acknowledged = true;
  return NextResponse.json({ message: "Acknowledged" });
}
