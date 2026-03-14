import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { getUserPlan } from "@/lib/plans";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await queryOne(
    "SELECT id, email, name, plan, trial_ends_at, created_at FROM users WHERE id = ?",
    [auth.userId]
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const planInfo = getUserPlan(
    user.plan as string,
    user.trial_ends_at as string | null
  );

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      trial_ends_at: user.trial_ends_at,
      plan_details: planInfo,
    },
  });
}
