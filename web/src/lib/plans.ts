// Plan configuration
export interface Plan {
  id: string;
  name: string;
  price: number; // cents per month
  priceId: string; // Stripe price ID (set after creating in Stripe Dashboard)
  maxServices: number;
  pollIntervalMs: number;
  historyDays: number;
  features: string[];
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceId: "", // No Stripe needed for free
    maxServices: 3,
    pollIntervalMs: 30 * 60 * 1000, // 30 minutes
    historyDays: 7,
    features: ["3 services", "30-min polling", "7-day history", "Email alerts"],
  },
  trial: {
    id: "trial",
    name: "Trial",
    price: 0,
    priceId: "",
    maxServices: 15,
    pollIntervalMs: 5 * 60 * 1000, // 5 minutes
    historyDays: 14,
    features: [
      "15 services",
      "5-min polling",
      "14-day history",
      "All alert channels",
      "14-day trial",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 2900, // $29/mo
    priceId: "", // SET AFTER CREATING STRIPE PRICE
    maxServices: 15,
    pollIntervalMs: 5 * 60 * 1000,
    historyDays: 90,
    features: [
      "15 services",
      "5-min polling",
      "90-day history",
      "Slack + email + webhooks",
      "5 team members",
      "Compliance exports",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: 7900, // $79/mo
    priceId: "", // SET AFTER CREATING STRIPE PRICE
    maxServices: 999,
    pollIntervalMs: 60 * 1000, // 1 minute
    historyDays: 365,
    features: [
      "Unlimited services",
      "1-min polling",
      "1-year history",
      "All alert channels",
      "Unlimited team members",
      "SOC2 / HIPAA reports",
      "Priority support",
    ],
  },
};

export function getUserPlan(
  plan: string,
  trialEndsAt: string | null
): Plan {
  if (plan === "trial" && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd > new Date()) {
      return PLANS.trial;
    }
    // Trial expired, fall back to free
    return PLANS.free;
  }
  return PLANS[plan] || PLANS.free;
}

export function canAddService(
  currentCount: number,
  plan: string,
  trialEndsAt: string | null
): boolean {
  const userPlan = getUserPlan(plan, trialEndsAt);
  return currentCount < userPlan.maxServices;
}

export function getPollInterval(
  plan: string,
  trialEndsAt: string | null
): number {
  return getUserPlan(plan, trialEndsAt).pollIntervalMs;
}
