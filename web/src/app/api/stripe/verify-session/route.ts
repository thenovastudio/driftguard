import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid" || session.status === "complete") {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            stripeSubscriptionId: session.subscription as string,
            stripeSubscriptionStatus: "trialing", 
            stripePlanKey: "pro" 
          }
        });
        return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ success: true, verified: false });
  } catch (error: any) {
    console.error("Manual verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
