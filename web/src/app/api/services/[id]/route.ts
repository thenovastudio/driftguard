import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { updateServiceApiKey } from "@/lib/polling";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.api_key !== undefined) {
    const updated = updateServiceApiKey(auth.userId, id, body.api_key);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "No changes" }, { status: 400 });
}
