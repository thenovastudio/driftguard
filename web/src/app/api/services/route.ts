import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServicesForUser, ensureUserServices, linkServiceInstance } from "@/lib/polling";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  await ensureUserServices(userId);
  const services = await getServicesForUser(userId);
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { service_type, api_key } = await req.json();
    const service = await linkServiceInstance(userId, service_type, api_key);
    return NextResponse.json(service);
  } catch (err: any) {
    console.error("Link error:", err);
    return NextResponse.json({ error: err.message || "Failed to link service" }, { status: 400 });
  }
}
