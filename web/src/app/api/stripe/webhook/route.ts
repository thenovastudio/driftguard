import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any, // latest stable version fallback
});

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("Stripe-Signature");
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "No Webhook Secret" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature!,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const session = event.data.object as any;

    // Handle checkout session completion
    if (event.type === "checkout.session.completed") {
      const userId = session.client_reference_id as string;
      const subscriptionId = session.subscription as string;

      if (userId) {
        // Stripe subscriptions start as 'trialing' if trial_period_days is configured
        // We give them Pro tier immediately upon checkout session success
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            stripeSubscriptionId: subscriptionId,
            stripeSubscriptionStatus: "trialing", 
            stripePlanKey: "pro" 
          }
        });
      }
    }

    // You can handle customer.subscription.updated / deleted here to downgrade them back to 'free' later

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
