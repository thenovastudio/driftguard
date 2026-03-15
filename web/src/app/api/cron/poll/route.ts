import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { performPoll } from "@/lib/polling";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { data: services, error } = await getSupabase()
      .from("services")
      .select("*")
      .eq("connected", true);

    if (error) throw error;

    const results = [];
    const client = await clerkClient();

    for (const service of services) {
      try {
        const user = await client.users.getUser(service.user_id);
        const planKey = (user.publicMetadata?.stripePlanKey as string) || "free";
        
        // Define intervals (must match page.tsx)
        const INTERVALS: Record<string, number> = {
          free: 60 * 60 * 1000,
          plus: 30 * 60 * 1000,
          pro: 5 * 60 * 1000,
          trial: 5 * 60 * 1000,
          business: 60 * 1000,
        };

        const interval = INTERVALS[planKey] || INTERVALS.free;
        const lastPolled = service.last_polled_at ? new Date(service.last_polled_at).getTime() : 0;
        const now = Date.now();

        if (now - lastPolled >= interval) {
          console.log(`[CRON] Polling service ${service.id} for user ${service.user_id}`);
          const res = await performPoll(service.id, service.user_id);
          results.push({ id: service.id, status: "polled", ...res });
        }
      } catch (err) {
        console.error(`[CRON] Failed to poll service ${service.id}:`, err);
        results.push({ id: service.id, status: "failed", error: String(err) });
      }
    }

    return NextResponse.json({ processed: services.length, results });
  } catch (err: any) {
    console.error("[CRON] Fatal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
