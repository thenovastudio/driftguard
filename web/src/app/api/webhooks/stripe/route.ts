// Stripe webhook handler for subscription events
// Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars

import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  // In production, verify the webhook signature:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const sig = req.headers.get('stripe-signature')!;
  // const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  const body = await req.json();
  const db = getDb();

  switch (body.type) {
    case "checkout.session.completed": {
      const session = body.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const customerEmail = session.customer_details?.email;

      // Map Stripe price to plan
      const priceId = session.line_items?.data?.[0]?.price?.id;
      const planMap: Record<string, string> = {
        // SET YOUR STRIPE PRICE IDS HERE AFTER CREATING IN STRIPE DASHBOARD
        // price_1ProMonthlyId: "pro",
        // price_1BusinessMonthlyId: "business",
      };
      const plan = priceId ? planMap[priceId] || "pro" : "pro";

      if (customerEmail) {
        db.prepare(
          `UPDATE users SET plan = ?, stripe_customer_id = ?, stripe_subscription_id = ?
           WHERE email = ?`
        ).run(plan, customerId, subscriptionId, customerEmail);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = body.data.object;
      const customerId = sub.customer;
      const status = sub.status;

      if (status === "canceled" || status === "unpaid") {
        db.prepare(
          `UPDATE users SET plan = 'free', stripe_subscription_id = NULL
           WHERE stripe_customer_id = ?`
        ).run(customerId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = body.data.object;
      db.prepare(
        `UPDATE users SET plan = 'free', stripe_subscription_id = NULL
         WHERE stripe_customer_id = ?`
      ).run(sub.customer);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
