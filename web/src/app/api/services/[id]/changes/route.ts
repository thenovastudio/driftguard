import { NextRequest, NextResponse } from "next/server";
import { changes } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  const filtered = changes.filter((c) => c.service === id).slice(0, limit);
  return NextResponse.json(filtered);
}
