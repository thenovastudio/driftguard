import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getChangesForUser } from "@/lib/polling";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const serviceId = searchParams.get("service") || undefined;

  const changes = await getChangesForUser(auth.userId, limit, serviceId);
  return NextResponse.json(changes);
}
