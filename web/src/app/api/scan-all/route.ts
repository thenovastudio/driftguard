import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { performPoll, getServicesForUser } from "@/lib/polling";

export async function POST() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user?.emailAddresses[0]?.emailAddress;
  const services = await getServicesForUser(userId, email);
  const connectedServices = services.filter((s: any) => s.connected);

  const results = [];
  for (const service of connectedServices) {
    try {
      // We poll using the ACTUAL owner's user_id so changes are attributed correctly to the team
      const result = await performPoll(service.id, service.user_id);
      results.push({
        id: service.id,
        name: service.name,
        type: service.service_type,
        status: "success",
        changes: result.changesGenerated || 0,
      });
    } catch (e: any) {
      results.push({
        id: service.id,
        name: service.name,
        type: service.service_type,
        status: "error",
        error: e.message,
      });
    }
  }

  return NextResponse.json(results);
}
