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
