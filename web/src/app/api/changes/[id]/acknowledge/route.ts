import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { run, queryOne } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  await run(
    "UPDATE changes SET acknowledged = 1 WHERE id = ? AND user_id = ?",
    [parseInt(id), auth.userId]
  );

  return NextResponse.json({ message: "Acknowledged" });
}
