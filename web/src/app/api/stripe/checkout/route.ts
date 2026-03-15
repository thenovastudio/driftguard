import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any, // fallback to any if type is older, Stripe npm is huge
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const priceId = body.priceId || process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID; 

    if (!process.env.STRIPE_SECRET_KEY) {
      // Simulate success if no stripe key is set yet (to avoid crashing before setup)
      return NextResponse.json({ 
        url: "/dashboard?simulated_checkout=true",
        simulated: true
      });
    }

    if (!priceId) {
      return NextResponse.json({ error: "Missing price API ID" }, { status: 400 });
    }

    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
      client_reference_id: userId,
      subscription_data: {
        trial_period_days: 14,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
