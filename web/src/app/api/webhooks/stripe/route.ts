// Stripe webhook handler for subscription events
import { NextRequest, NextResponse } from "next/server";
import { run, queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();

  switch (body.type) {
    case "checkout.session.completed": {
      const session = body.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const customerEmail = session.customer_details?.email;

      const priceId = session.line_items?.data?.[0]?.price?.id;
      const planMap: Record<string, string> = {
        // SET YOUR STRIPE PRICE IDS HERE
        // price_xxx: "pro",
        // price_yyy: "business",
      };
      const plan = priceId ? planMap[priceId] || "pro" : "pro";

      if (customerEmail) {
        await run(
          `UPDATE users SET plan = ?, stripe_customer_id = ?, stripe_subscription_id = ?
           WHERE email = ?`,
          [plan, customerId, subscriptionId, customerEmail]
        );
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = body.data.object;
      const customerId = sub.customer;
      const status = sub.status;

      if (status === "canceled" || status === "unpaid") {
        await run(
          `UPDATE users SET plan = 'free', stripe_subscription_id = NULL
           WHERE stripe_customer_id = ?`,
          [customerId]
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = body.data.object;
      await run(
        `UPDATE users SET plan = 'free', stripe_subscription_id = NULL
         WHERE stripe_customer_id = ?`,
        [sub.customer]
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
