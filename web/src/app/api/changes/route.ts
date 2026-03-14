import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getChangesForUser } from "@/lib/polling";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const serviceId = searchParams.get("service") || undefined;

  const changes = await getChangesForUser(userId, limit, serviceId);
  return NextResponse.json(changes);
}
