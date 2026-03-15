import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getChangesForUser } from "@/lib/polling";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const serviceInstanceId = searchParams.get("service") || undefined;

  const changes = await getChangesForUser(userId, limit, serviceInstanceId);
  return NextResponse.json(changes);
}
