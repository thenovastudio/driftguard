import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { simulatePoll } from "@/lib/polling";
import { getUserPlan } from "@/lib/plans";
import { queryOne } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const service = await queryOne(
    "SELECT * FROM services WHERE id = ? AND user_id = ?",
    [id, auth.userId]
  );

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  if (!service.connected) {
    return NextResponse.json(
      { error: "Service not linked — add an API key in Settings first", changesGenerated: 0 },
      { status: 400 }
    );
  }

  const user = await queryOne("SELECT plan, trial_ends_at FROM users WHERE id = ?", [auth.userId]);
  const plan = getUserPlan(user?.plan as string, (user?.trial_ends_at as string) || null);

  if (service.last_polled_at) {
    const lastPoll = new Date(service.last_polled_at as string);
    const minInterval = plan.pollIntervalMs;
    const timeSince = Date.now() - lastPoll.getTime();
    if (timeSince < minInterval) {
      const waitSec = Math.ceil((minInterval - timeSince) / 1000);
      return NextResponse.json(
        {
          error: `Rate limited — your ${plan.name} plan allows polling every ${plan.pollIntervalMs / 60000} minutes. Try again in ${waitSec}s.`,
          changesGenerated: 0,
        },
        { status: 429 }
      );
    }
  }

  const result = await simulatePoll(auth.userId, id);
  return NextResponse.json({
    message: "Poll completed",
    ...result,
  });
}
