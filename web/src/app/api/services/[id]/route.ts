import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateServiceApiKey } from "@/lib/polling";

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

  if (body.api_key !== undefined) {
    const updated = await updateServiceApiKey(userId, id, body.api_key);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "No changes" }, { status: 400 });
}
