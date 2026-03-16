import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { data, error } = await getSupabase()
    .from("team_members")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const plan = (user.publicMetadata?.stripePlanKey as string) || "free";
  const maxMembers = plan === "business" ? 999 : (plan === "pro" || plan === "trial") ? 5 : 1;

  if (maxMembers <= 1) {
    return NextResponse.json({ error: "Team members are only available on Pro and Business plans." }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  // Check current count
  const { count } = await getSupabase()
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId);

  if ((count || 0) >= maxMembers - 1) { // -1 because owner is not in the table
    return NextResponse.json({ error: `Invite limit reached for ${plan} plan (${maxMembers-1} satellites allowed).` }, { status: 403 });
  }
  
  const { data, error } = await getSupabase()
    .from("team_members")
    .insert({ owner_id: userId, user_email: email })
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  
  const { error } = await getSupabase()
    .from("team_members")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
