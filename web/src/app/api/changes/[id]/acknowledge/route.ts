import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import getDb from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const result = db
    .prepare("UPDATE changes SET acknowledged = 1 WHERE id = ? AND user_id = ?")
    .run(id, auth.userId);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Change not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Acknowledged" });
}
