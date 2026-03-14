import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getServicesForUser } from "@/lib/polling";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json(getServicesForUser(auth.userId));
}
