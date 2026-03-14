"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Globe,
  Mail,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LayoutDashboard,
  Settings,
  Key,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  GitBranch,
  Cloud,
  Phone,
  BarChart3,
  Hash,
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  enabled: boolean;
  last_polled_at: string | null;
  api_key?: string;
  connected: boolean;
}

interface Change {
  id: number;
  service: string;
  diff: Record<string, unknown>;
  created_at: string;
  acknowledged: boolean;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  stripe: <CreditCard className="h-4 w-4" />,
  vercel: <Globe className="h-4 w-4" />,
  sendgrid: <Mail className="h-4 w-4" />,
  github: <GitBranch className="h-4 w-4" />,
  cloudflare: <Cloud className="h-4 w-4" />,
  twilio: <Phone className="h-4 w-4" />,
  datadog: <BarChart3 className="h-4 w-4" />,
  slack: <Hash className="h-4 w-4" />,
};

const SERVICE_DOCS: Record<string, string> = {
  stripe: "https://dashboard.stripe.com/apikeys",
  vercel: "https://vercel.com/account/settings/tokens",
  sendgrid: "https://app.sendgrid.com/settings/api_keys",
  github: "https://github.com/settings/tokens",
  cloudflare: "https://dash.cloudflare.com/profile/api-tokens",
  twilio: "https://console.twilio.com/account/voice/settings",
  datadog: "https://app.datadoghq.com/organization-settings/api-keys",
  slack: "https://api.slack.com/apps",
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  stripe: "Monitor payment config, webhooks, and billing settings",
  vercel: "Monitor deployment settings, regions, and build config",
  sendgrid: "Monitor email templates, sender config, and tracking",
  github: "Monitor branch protection, review settings, and access",
  cloudflare: "Monitor SSL/TLS, cache rules, and DNS config",
  twilio: "Monitor voice/SMS webhooks and recording settings",
  datadog: "Monitor retention, alert channels, and sampling rates",
  slack: "Monitor webhook URLs, channels, and bot settings",
};

const SERVICE_SETUP_GUIDE: Record<string, { title: string; steps: string[] }> = {
  stripe: {
    title: "How to get your Stripe API key",
    steps: [
      'Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" class="text-primary hover:underline">Stripe Dashboard → API Keys</a>',
      'Under "Standard keys", click "Reveal" next to the <strong>Secret key</strong> (starts with <code class="bg-muted px-1 rounded text-xs">sk_live_</code> or <code class="bg-muted px-1 rounded text-xs">sk_test_</code>)',
      "Copy the key and paste it below",
    ],
  },
  vercel: {
    title: "How to get your Vercel API token",
    steps: [
      'Go to <a href="https://vercel.com/account/settings/tokens" target="_blank" class="text-primary hover:underline">Vercel → Settings → Tokens</a>',
      "Click <strong>Create</strong> and give it a name like &ldquo;DriftGuard&rdquo;",
      "Set scope to your team/account and leave expiration as needed",
      "Copy the token immediately (it won't be shown again)",
    ],
  },
  sendgrid: {
    title: "How to get your SendGrid API key",
    steps: [
      'Go to <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" class="text-primary hover:underline">SendGrid → Settings → API Keys</a>',
      "Click <strong>Create API Key</strong>",
      "Choose <strong>Restricted Access</strong> and enable at least <strong>Mail Send</strong> and <strong>Email Activity</strong> read permissions",
      "Copy the key (starts with <code class=\"bg-muted px-1 rounded text-xs\">SG.</code>)",
    ],
  },
  github: {
    title: "How to get your GitHub Personal Access Token",
    steps: [
      'Go to <a href="https://github.com/settings/tokens" target="_blank" class="text-primary hover:underline">GitHub → Settings → Developer settings → Personal access tokens</a>',
      "Click <strong>Generate new token (classic)</strong>",
      "Give it a note like &ldquo;DriftGuard&rdquo;",
      "Select scopes: <code class=\"bg-muted px-1 rounded text-xs\">repo</code> (for private repos) or <code class=\"bg-muted px-1 rounded text-xs\">public_repo</code> (public only), plus <code class=\"bg-muted px-1 rounded text-xs\">admin:org</code> for org settings",
      "Copy the token (starts with <code class=\"bg-muted px-1 rounded text-xs\">ghp_</code>)",
    ],
  },
  cloudflare: {
    title: "How to get your Cloudflare API token",
    steps: [
      'Go to <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" class="text-primary hover:underline">Cloudflare → Profile → API Tokens</a>',
      "Click <strong>Create Token</strong>",
      "Use the <strong>Edit zone DNS</strong> template or create a custom token with <strong>Zone Settings:Edit</strong> permissions",
      "Select the zones you want to monitor",
      "Copy the token after creation",
    ],
  },
  twilio: {
    title: "How to get your Twilio API credentials",
    steps: [
      'Go to <a href="https://console.twilio.com" target="_blank" class="text-primary hover:underline">Twilio Console</a>',
      "Your <strong>Account SID</strong> and <strong>Auth Token</strong> are on the main dashboard",
      "Copy the Auth Token (you may need to click to reveal it)",
      "For a more restricted key, go to <strong>API Keys & Tokens</strong> and create a new Standard API Key",
    ],
  },
  datadog: {
    title: "How to get your Datadog API key",
    steps: [
      'Go to <a href="https://app.datadoghq.com/organization-settings/api-keys" target="_blank" class="text-primary hover:underline">Datadog → Organization Settings → API Keys</a>',
      "Click <strong>New Key</strong>",
      "Give it a name like &ldquo;DriftGuard&rdquo;",
      "Copy the key (32-character hex string)",
    ],
  },
  slack: {
    title: "How to set up your Slack app",
    steps: [
      'Go to <a href="https://api.slack.com/apps" target="_blank" class="text-primary hover:underline">Slack API → Your Apps</a>',
      "Click <strong>Create New App</strong> → From scratch",
      "Add the <strong>Incoming Webhooks</strong> feature and activate it",
      "Click <strong>Add New Webhook to Workspace</strong> and select your channel",
      "Copy the Webhook URL (starts with <code class=\"bg-muted px-1 rounded text-xs\">https://hooks.slack.com/</code>)",
    ],
  },
};

// ── Service Card ──────────────────────────────────────────────
function ServiceCard({
  service,
  status,
  changesCount,
  onPoll,
  onViewChanges,
  isFiltered,
}: {
  service: Service;
  status: "idle" | "polling" | "connected";
  changesCount: number;
  onPoll: (id: string) => void;
  onViewChanges: (id: string) => void;
  isFiltered: boolean;
}) {
  return (
    <li className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-2xl">
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={1.5}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="relative flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                {SERVICE_ICONS[service.id] || <Activity className="h-4 w-4" />}
              </div>
              <div className="flex items-center gap-2">
                {status === "connected" ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                ) : status === "polling" ? (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Polling
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    {service.last_polled_at ? "Stale" : "No data"}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance">
                {service.name}
              </h3>
              <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {service.last_polled_at
                  ? `Last polled ${new Date(service.last_polled_at).toLocaleTimeString()}`
                  : "Not polled yet — click below to start"}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <InteractiveHoverButton
                text="Poll"
                className="w-28"
                onClick={() => onPoll(service.id)}
              />
              <button
                onClick={() => onViewChanges(service.id)}
                className={`group relative w-32 cursor-pointer overflow-hidden rounded-full border p-2 text-center font-semibold transition-colors ${
                  isFiltered
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <span className="inline-block">Changes</span>
                {changesCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs w-5 h-5">
                    {changesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

// ── Change Row ────────────────────────────────────────────────
function ChangeRow({ change }: { change: Change }) {
  return (
    <div className="flex items-start justify-between rounded-xl border-[0.75px] border-border bg-card p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm capitalize">
            {change.service}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(change.created_at).toLocaleString()}
          </span>
          {!change.acknowledged && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
        <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 overflow-auto max-h-32">
          {JSON.stringify(change.diff, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────
function SettingsPage({
  services,
  onSave,
}: {
  services: Service[];
  onSave: (serviceId: string, apiKey: string) => void;
}) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    services.forEach((s) => {
      initial[s.id] = s.api_key || "";
    });
    setKeys(initial);
  }, [services]);

  const handleSave = (serviceId: string) => {
    onSave(serviceId, keys[serviceId] || "");
    setSaved((prev) => ({ ...prev, [serviceId]: true }));
    setTimeout(() => {
      setSaved((prev) => ({ ...prev, [serviceId]: false }));
    }, 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Connect your SaaS accounts to start monitoring configuration changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="space-y-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                  {SERVICE_ICONS[service.id] || (
                    <Activity className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {service.connected ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Linked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        Not linked
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <a
                href={SERVICE_DOCS[service.id]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Get API key <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {SERVICE_DESCRIPTIONS[service.id]}
            </p>

            {/* Setup guide banner */}
            {SERVICE_SETUP_GUIDE[service.id] && (
              <div className="rounded-lg bg-muted/50 border border-border p-4 mb-4">
                <p className="text-sm font-medium mb-2">
                  {SERVICE_SETUP_GUIDE[service.id].title}
                </p>
                <ol className="space-y-1.5">
                  {SERVICE_SETUP_GUIDE[service.id].steps.map((step, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex gap-2"
                    >
                      <span className="text-primary font-medium shrink-0">
                        {i + 1}.
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: step }} />
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={visible[service.id] ? "text" : "password"}
                  value={keys[service.id] || ""}
                  onChange={(e) =>
                    setKeys((prev) => ({
                      ...prev,
                      [service.id]: e.target.value,
                    }))
                  }
                  placeholder={`Enter ${service.name} API key`}
                  className="w-full rounded-lg border border-border bg-background pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    setVisible((prev) => ({
                      ...prev,
                      [service.id]: !prev[service.id],
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {visible[service.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleSave(service.id)}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                {saved[service.id] ? "Saved!" : "Save"}
              </button>
              {keys[service.id] && (
                <button
                  type="button"
                  onClick={() => {
                    setKeys((prev) => ({ ...prev, [service.id]: "" }));
                    onSave(service.id, "");
                  }}
                  className="rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const [page, setPage] = useState<"dashboard" | "settings">("dashboard");
  const [services, setServices] = useState<Service[]>([]);
  const [pollingStates, setPollingStates] = useState<
    Record<string, "idle" | "polling" | "connected">
  >({});
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterService, setFilterService] = useState<string | null>(null);
  const [pollResult, setPollResult] = useState<{
    service: string;
    count: number;
  } | null>(null);

  const fetchServices = useCallback(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data);
          const states: Record<string, "idle" | "polling" | "connected"> = {};
          data.forEach((s: Service) => {
            states[s.id] = s.last_polled_at ? "connected" : "idle";
          });
          setPollingStates(states);
        }
      })
      .catch(() => {});
  }, []);

  const fetchChanges = useCallback(() => {
    fetch("/api/changes?limit=20")
      .then((r) => r.json())
      .then((data) => {
        setChanges(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchServices();
    fetchChanges();
  }, [fetchServices, fetchChanges]);

  const handlePoll = async (serviceId: string) => {
    setPollingStates((prev) => ({ ...prev, [serviceId]: "polling" }));

    try {
      const res = await fetch(`/api/services/${serviceId}/poll`, {
        method: "POST",
      });
      const data = await res.json();
      setPollingStates((prev) => ({ ...prev, [serviceId]: "connected" }));
      setPollResult({
        service: serviceId,
        count: data.changesGenerated || 0,
      });
      setTimeout(() => setPollResult(null), 5000);
      // Auto-filter changes to show this service's results
      setFilterService(serviceId);
      fetchServices();
      fetchChanges();
    } catch {
      setPollingStates((prev) => ({ ...prev, [serviceId]: "idle" }));
    }
  };

  const handleViewChanges = (serviceId: string) => {
    setFilterService((prev) => (prev === serviceId ? null : serviceId));
  };

  const handleSaveApiKey = async (serviceId: string, apiKey: string) => {
    try {
      await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      fetchServices();
    } catch {
      // silent fail
    }
  };

  const linkedServices = services.filter((s) => s.connected);
  const acknowledgedCount = changes.filter((c) => c.acknowledged).length;
  const displayedChanges = filterService
    ? changes.filter((c) => c.service === filterService)
    : changes;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">DriftGuard</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage("dashboard")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                page === "dashboard"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setPage("settings")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                page === "settings"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {page === "settings" ? (
          <SettingsPage services={services} onSave={handleSaveApiKey} />
        ) : (
          <>
            {/* Poll result toast */}
            {pollResult && (
              <div
                className={cn(
                  "mb-6 rounded-lg border px-4 py-3 text-sm flex items-center justify-between gap-2",
                  pollResult.count > 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-muted/50 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  {pollResult.count > 0 ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    <strong className="capitalize">{pollResult.service}</strong>{" "}
                    polled —{" "}
                    {pollResult.count > 0
                      ? `${pollResult.count} change${pollResult.count > 1 ? "s" : ""} detected`
                      : "no changes detected (poll again — results are randomized for demo)"}
                  </span>
                </div>
                {pollResult.count > 0 && (
                  <a
                    href="#changes"
                    className="text-xs underline hover:no-underline shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("changes")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    View changes ↓
                  </a>
                )}
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor your SaaS configuration for unexpected changes
              </p>
            </div>

            {/* Service Cards — only show linked services */}
            {linkedServices.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center mb-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">
                  No services linked yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Link your SaaS accounts in Settings to start monitoring their
                  configuration for unexpected changes.
                </p>
                <button
                  onClick={() => setPage("settings")}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Go to Settings
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6 mb-12">
                {linkedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    status={pollingStates[service.id] || "idle"}
                    changesCount={changes.filter((c) => c.service === service.id).length}
                    isFiltered={filterService === service.id}
                    onPoll={handlePoll}
                    onViewChanges={handleViewChanges}
                  />
                ))}
              </ul>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs">Linked</span>
                </div>
                <span className="text-2xl font-bold">
                  {linkedServices.length}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Changes (24h)</span>
                </div>
                <span className="text-2xl font-bold">{changes.length}</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">Healthy</span>
                </div>
                <span className="text-2xl font-bold text-emerald-400">
                  {changes.length > 0
                    ? `${acknowledgedCount}/${changes.length}`
                    : "—"}
                </span>
              </div>
            </div>

            {/* Recent Changes */}
            <div id="changes">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {filterService
                    ? `${
                        services.find((s) => s.id === filterService)?.name ||
                        filterService
                      } Changes`
                    : "Recent Changes"}
                </h2>
                {filterService && (
                  <button
                    onClick={() => setFilterService(null)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Show all ×
                  </button>
                )}
              </div>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : displayedChanges.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {filterService
                      ? "No changes for this service yet."
                      : "No configuration changes detected yet."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Poll your services to start monitoring.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedChanges.map((change) => (
                    <ChangeRow key={change.id} change={change} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
