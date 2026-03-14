import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  await getSupabase()
    .from("changes")
    .update({ acknowledged: true })
    .eq("id", id)
    .eq("user_id", userId);

  return NextResponse.json({ message: "Acknowledged" });
}
