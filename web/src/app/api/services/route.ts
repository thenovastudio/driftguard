import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServicesForUser, ensureUserServices } from "@/lib/polling";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  await ensureUserServices(userId);
  const services = await getServicesForUser(userId);
  return NextResponse.json(services);
}
