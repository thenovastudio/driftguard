import { NextRequest, NextResponse } from "next/server";
import { changes } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  return NextResponse.json(changes.slice(0, limit));
}
