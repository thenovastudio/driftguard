import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svc = services.find((s) => s.id === id);

  if (!svc) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const body = await req.json();

  if (body.api_key !== undefined) {
    svc.api_key = body.api_key;
    svc.connected = body.api_key.length > 0;
  }

  if (body.enabled !== undefined) {
    svc.enabled = body.enabled;
  }

  return NextResponse.json(svc);
}
