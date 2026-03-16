import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getChangesForUser } from "@/lib/polling";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = user?.emailAddresses[0]?.emailAddress;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const serviceInstanceId = searchParams.get("service") || undefined;

  const changes = await getChangesForUser(userId, limit, serviceInstanceId, email);
  return NextResponse.json(changes);
}
