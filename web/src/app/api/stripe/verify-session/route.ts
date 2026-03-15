import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2025-02-24.acacia" as any,
});

export const dynamic = "force-dynamic";

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
        let planKey = "plus";
        try {
          if (session.subscription) {
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
              const priceId = subscription.items.data[0]?.price.id;
              
              if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) planKey = "pro";
              else if (priceId === process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID) planKey = "business";
          }
        } catch (e) {
          console.error("Failed to fetch subscription for price ID in verify:", e);
        }

        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            stripeSubscriptionId: session.subscription as string,
            stripeSubscriptionStatus: "trialing", 
            stripePlanKey: planKey 
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
