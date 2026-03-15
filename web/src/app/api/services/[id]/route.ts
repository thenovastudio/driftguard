import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { unlinkService, getSupabase } from "@/lib/polling";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await unlinkService(userId, id);
    return NextResponse.json({ message: "Service unlinked successfully" });
  } catch (err: any) {
    console.error("Unlink error:", err);
    return NextResponse.json({ error: "Failed to unlink service" }, { status: 500 });
  }
}

// Keep PATCH for minor updates if needed, but linking is now POST
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const { data, error } = await getSupabase()
    .from("services")
    .update(body)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
