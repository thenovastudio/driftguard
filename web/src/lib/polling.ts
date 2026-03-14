import { getSupabase } from "@/lib/supabase";

// Polling simulation
const configBaselines: Record<string, Record<string, unknown>> = {
  stripe: { webhook_url: "https://app.example.com/stripe", currency: "usd", statement_descriptor: "DRIFTGUARD" },
  vercel: { framework: "nextjs", region: "iad1", build_command: "next build" },
  sendgrid: { sender: "noreply@example.com", template_id: "d-abc123", click_tracking: true },
  github: { branch_protection: true, required_reviews: 2, dismiss_stale: true },
  cloudflare: { ssl_mode: "strict", min_tls: "1.2", cache_level: "aggressive" },
  twilio: { webhook_url: "https://app.example.com/twilio", status_callback: true, recording: false },
  datadog: { retention_days: 30, alert_channels: ["slack", "email"], sampling_rate: 100 },
  slack: { webhook_url: "https://hooks.slack.com/services/T00/B00/xxx", channel: "#alerts", username: "DriftGuard" },
};

const pollableFields: Record<string, Array<{ key: string; values: unknown[] }>> = {
  stripe: [
    { key: "webhook_url", values: ["https://app.example.com/stripe", "https://old.example.com/stripe", "https://new.example.com/stripe"] },
    { key: "currency", values: ["usd", "eur", "gbp"] },
    { key: "statement_descriptor", values: ["DRIFTGUARD", "DG APP", "DRIFT GUARD"] },
  ],
  vercel: [
    { key: "framework", values: ["nextjs", "remix", "sveltekit"] },
    { key: "region", values: ["iad1", "sfo1", "fra1"] },
    { key: "build_command", values: ["next build", "turbo build", "npm run build"] },
  ],
  sendgrid: [
    { key: "sender", values: ["noreply@example.com", "hello@example.com", "support@example.com"] },
    { key: "template_id", values: ["d-abc123", "d-xyz789", "d-qrs456"] },
    { key: "click_tracking", values: [true, false] },
  ],
  github: [
    { key: "branch_protection", values: [true, false] },
    { key: "required_reviews", values: [1, 2, 3] },
    { key: "dismiss_stale", values: [true, false] },
  ],
  cloudflare: [
    { key: "ssl_mode", values: ["strict", "flexible", "full"] },
    { key: "min_tls", values: ["1.0", "1.2", "1.3"] },
    { key: "cache_level", values: ["aggressive", "standard", "bypass"] },
  ],
  twilio: [
    { key: "webhook_url", values: ["https://app.example.com/twilio", "https://new.example.com/twilio"] },
    { key: "status_callback", values: [true, false] },
    { key: "recording", values: [true, false] },
  ],
  datadog: [
    { key: "retention_days", values: [7, 15, 30, 90] },
    { key: "alert_channels", values: [["slack", "email"], ["slack"], ["email", "pagerduty"]] },
    { key: "sampling_rate", values: [50, 100, 200] },
  ],
  slack: [
    { key: "webhook_url", values: ["https://hooks.slack.com/services/T00/B00/xxx", "https://hooks.slack.com/services/T00/B00/yyy"] },
    { key: "channel", values: ["#alerts", "#monitoring", "#ops"] },
    { key: "username", values: ["DriftGuard", "DriftBot", "ConfigBot"] },
  ],
};

export async function simulatePoll(userId: string, serviceId: string) {
  // Update last_polled_at
  await getSupabase()
    .from("services")
    .update({ last_polled_at: new Date().toISOString() })
    .eq("id", serviceId)
    .eq("user_id", userId);

  // ~40% chance of generating a change
  if (Math.random() > 0.4) {
    return { service: serviceId, changesGenerated: 0 };
  }

  const fields = pollableFields[serviceId];
  if (!fields) return { service: serviceId, changesGenerated: 0 };

  const field = fields[Math.floor(Math.random() * fields.length)];
  const baseline = { ...configBaselines[serviceId] };
  const newValue = field.values[Math.floor(Math.random() * field.values.length)];
  const oldValue = baseline[field.key];

  if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
    return { service: serviceId, changesGenerated: 0 };
  }

  const diff = { [field.key]: { old: oldValue, new: newValue } };

  await getSupabase().from("changes").insert({
    user_id: userId,
    service_id: serviceId,
    diff: JSON.stringify(diff),
  });

  return { service: serviceId, changesGenerated: 1 };
}

export async function getServicesForUser(userId: string) {
  const { data } = await getSupabase()
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  return data || [];
}

export async function getChangesForUser(userId: string, limit = 20, serviceId?: string) {
  let query = getSupabase()
    .from("changes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (serviceId) {
    query = query.eq("service_id", serviceId);
  }

  const { data } = await query;
  return data || [];
}

// Service name lookup for creating new service rows
const SERVICE_NAMES: Record<string, string> = {
  stripe: "Stripe", vercel: "Vercel", sendgrid: "SendGrid", github: "GitHub",
  cloudflare: "Cloudflare", twilio: "Twilio", datadog: "Datadog", slack: "Slack",
  aws: "AWS", gcp: "Google Cloud", azure: "Azure", okta: "Okta",
  pagerduty: "PagerDuty", jira: "Jira", mongodb: "MongoDB Atlas", auth0: "Auth0",
  supabase: "Supabase", firebase: "Firebase", hubspot: "HubSpot", zendesk: "Zendesk",
  intercom: "Intercom", linear: "Linear", notion: "Notion", sentry: "Sentry",
  newrelic: "New Relic", launchdarkly: "LaunchDarkly", algolia: "Algolia", mixpanel: "Mixpanel",
};

export async function updateServiceApiKey(userId: string, serviceId: string, apiKey: string) {
  const connected = apiKey.length > 0;

  // Check if service row exists for this user
  const { data: existing } = await getSupabase()
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("user_id", userId)
    .single();

  if (!existing) {
    // Create the service row first
    await getSupabase().from("services").insert({
      id: serviceId,
      user_id: userId,
      name: SERVICE_NAMES[serviceId] || serviceId,
      api_key: apiKey,
      connected,
    });
  } else {
    // Update existing
    await getSupabase()
      .from("services")
      .update({ api_key: apiKey, connected })
      .eq("id", serviceId)
      .eq("user_id", userId);
  }

  const { data } = await getSupabase()
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function ensureUserServices(userId: string) {
  // Check if user already has services
  const { data: existing } = await getSupabase()
    .from("services")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existing && existing.length > 0) return;

  // Create default services
  const defaultServices = [
    { id: "stripe", name: "Stripe" },
    { id: "vercel", name: "Vercel" },
    { id: "sendgrid", name: "SendGrid" },
    { id: "github", name: "GitHub" },
    { id: "cloudflare", name: "Cloudflare" },
    { id: "twilio", name: "Twilio" },
    { id: "datadog", name: "Datadog" },
    { id: "slack", name: "Slack" },
  ];

  await getSupabase().from("services").insert(
    defaultServices.map((s) => ({
      id: s.id,
      user_id: userId,
      name: s.name,
    }))
  );
}
