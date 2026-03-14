// Shared in-memory store for DriftGuard API routes

export interface Service {
  id: string;
  name: string;
  enabled: boolean;
  last_polled_at: string | null;
  created_at: string;
  api_key?: string;
  connected: boolean;
}

export interface Change {
  id: number;
  service: string;
  diff: Record<string, unknown>;
  acknowledged: boolean;
  created_at: string;
}

export const services: Service[] = [
  {
    id: "stripe",
    name: "Stripe",
    enabled: true,
    last_polled_at: null,
    created_at: new Date().toISOString(),
    api_key: "",
    connected: false,
  },
  {
    id: "vercel",
    name: "Vercel",
    enabled: true,
    last_polled_at: null,
    created_at: new Date().toISOString(),
    api_key: "",
    connected: false,
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    enabled: true,
    last_polled_at: null,
    created_at: new Date().toISOString(),
    api_key: "",
    connected: false,
  },
  {
    id: "github",
    name: "GitHub",
    enabled: true,
    last_polled_at: null,
    created_at: new Date().toISOString(),
    api_key: "",
    connected: false,
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    enabled: true,
    last_polled_at: null,
    created_at: new Date().toISOString(),
    api_key: "",
    connected: false,
  },
  {
    id: "twilio",
    name: "Twilio",
    enabled: true,
    last_polled_at: null,
    created_at: new Date().toISOString(),
    api_key: "",
    connected: false,
  },
  {
    id: "datadog",
    name: "Datadog",
    enabled: true,
    last_polled_at: null,
    created_at: new Date().toISOString(),
    api_key: "",
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    enabled: true,
    last_polled_at: null,
    created_at: new Date().toISOString(),
    api_key: "",
    connected: false,
  },
];

export const changes: Change[] = [];
let changeIdCounter = 1;

export function getNextChangeId(): number {
  return changeIdCounter++;
}

// Polling simulation — generates realistic config diffs
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

export function simulatePoll(serviceId: string): { service: string; changesGenerated: number } {
  const svc = services.find((s) => s.id === serviceId);
  if (!svc) throw new Error("Service not found");

  svc.last_polled_at = new Date().toISOString();

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

  if (newValue === oldValue) return { service: serviceId, changesGenerated: 0 };

  baseline[field.key] = newValue;

  const change: Change = {
    id: getNextChangeId(),
    service: serviceId,
    diff: {
      [field.key]: { old: oldValue, new: newValue },
    },
    acknowledged: false,
    created_at: new Date().toISOString(),
  };

  changes.unshift(change);

  return { service: serviceId, changesGenerated: 1 };
}
