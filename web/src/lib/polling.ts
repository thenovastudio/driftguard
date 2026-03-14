// Polling simulation with SQLite persistence
import getDb from "@/lib/db";

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

export function simulatePoll(userId: number, serviceId: string): {
  service: string;
  changesGenerated: number;
} {
  const db = getDb();

  // Update last_polled_at
  db.prepare("UPDATE services SET last_polled_at = datetime('now') WHERE id = ? AND user_id = ?")
    .run(serviceId, userId);

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

  const diff = { [field.key]: { old: oldValue, new: newValue } };

  db.prepare(
    "INSERT INTO changes (user_id, service_id, diff) VALUES (?, ?, ?)"
  ).run(userId, serviceId, JSON.stringify(diff));

  return { service: serviceId, changesGenerated: 1 };
}

export function getServicesForUser(userId: number) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM services WHERE user_id = ? ORDER BY created_at")
    .all(userId);
}

export function getChangesForUser(userId: number, limit = 20, serviceId?: string) {
  const db = getDb();
  if (serviceId) {
    return db
      .prepare(
        "SELECT * FROM changes WHERE user_id = ? AND service_id = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(userId, serviceId, limit);
  }
  return db
    .prepare(
      "SELECT * FROM changes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .all(userId, limit);
}

export function updateServiceApiKey(userId: number, serviceId: string, apiKey: string) {
  const db = getDb();
  const connected = apiKey.length > 0 ? 1 : 0;
  db.prepare(
    "UPDATE services SET api_key = ?, connected = ? WHERE id = ? AND user_id = ?"
  ).run(apiKey, connected, serviceId, userId);
  return db
    .prepare("SELECT * FROM services WHERE id = ? AND user_id = ?")
    .get(serviceId, userId);
}
