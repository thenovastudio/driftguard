import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2025-02-24.acacia" as any, 
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const priceId = body.priceId; 

    if (!priceId) {
      return NextResponse.json({ error: "Missing price API ID" }, { status: 400 });
    }

    // Trial restriction logic
    const isPlus = priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
    const hasUsedTrial = user.publicMetadata?.hasUsedTrial === true;
    const shouldIncludeTrial = !isPlus && !hasUsedTrial;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        url: "/dashboard?simulated_checkout=true",
        simulated: true
      });
    }

    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
      client_reference_id: userId,
    };

    if (shouldIncludeTrial) {
      sessionOptions.subscription_data = {
        trial_period_days: 14,
      };
      sessionOptions.metadata = { is_trial: "true" };
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
