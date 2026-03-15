import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabase()
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 is 'no rows found'
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { slack_webhook_url: "", email_notifications_enabled: false });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { 
    slack_webhook_url, 
    discord_webhook_url, 
    outbound_webhook_url, 
    email_notifications_enabled 
  } = body;

  const { error } = await getSupabase()
    .from("user_settings")
    .upsert({
      user_id: userId,
      slack_webhook_url,
      discord_webhook_url,
      outbound_webhook_url,
      email_notifications_enabled,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
