import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getServicesForUser, ensureUserServices, linkServiceInstance } from "@/lib/polling";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = user?.emailAddresses[0]?.emailAddress;
  await ensureUserServices(userId);
  const services = await getServicesForUser(userId, email);
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

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { serviceId, project_id } = await req.json();
    const { data, error } = await getSupabase()
      .from("services")
      .update({ project_id: project_id || null })
      .eq("id", serviceId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update service" }, { status: 400 });
  }
}
