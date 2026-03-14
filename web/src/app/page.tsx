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
  Bell,
  Settings,
  HelpCircle,
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
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

// ── Service Card ──────────────────────────────────────────────
function ServiceCard({
  service,
  status,
  onPoll,
  onViewChanges,
}: {
  service: Service;
  status: "idle" | "polling" | "connected";
  onPoll: (id: string) => void;
  onViewChanges: (id: string) => void;
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
              <InteractiveHoverButton
                text="Changes"
                className="w-32"
                onClick={() => onViewChanges(service.id)}
              />
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
  const [activeTab, setActiveTab] = useState<number | null>(0);
  const [services, setServices] = useState<Service[]>([]);
  const [pollingStates, setPollingStates] = useState<
    Record<string, "idle" | "polling" | "connected">
  >({});
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterService, setFilterService] = useState<string | null>(null);

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
      await fetch(`/api/services/${serviceId}/poll`, { method: "POST" });
      setPollingStates((prev) => ({ ...prev, [serviceId]: "connected" }));
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

  const connectedCount = services.filter((s) => s.connected).length;
  const acknowledgedCount = changes.filter((c) => c.acknowledged).length;
  const displayedChanges = filterService
    ? changes.filter((c) => c.service === filterService)
    : changes;

  const tabs = [
    { title: "Dashboard", icon: LayoutDashboard },
    { title: "Alerts", icon: Bell },
    { type: "separator" as const },
    { title: "Settings", icon: Settings },
    { title: "Help", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">DriftGuard</span>
            <span className="text-sm text-muted-foreground">
              SaaS Config Monitor
            </span>
          </div>
          <ExpandableTabs
            tabs={tabs}
            className="border-border"
            onChange={(index) => {
              if (index === null) return;
              const tab = tabs[index];
              if (tab.type === "separator") return;
              const title = (tab as { title: string }).title;
              if (title === "Settings") setActiveTab(3);
              else if (title === "Dashboard" || title === "Alerts" || title === "Help") setActiveTab(0);
            }}
          />
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === 3 /* Settings */ ? (
          <SettingsPage services={services} onSave={handleSaveApiKey} />
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor your SaaS configuration for unexpected changes
              </p>
            </div>

            {/* Service Cards — only show linked services */}
            {connectedCount === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center mb-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">No services linked yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Link your SaaS accounts in Settings to start monitoring their configuration for unexpected changes.
                </p>
                <button
                  onClick={() => setActiveTab(3)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Go to Settings
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6 mb-12">
                {services
                  .filter((s) => s.connected)
                  .map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      status={pollingStates[service.id] || "idle"}
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
                <span className="text-2xl font-bold">{connectedCount}</span>
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
                  {connectedCount > 0
                    ? `${acknowledgedCount}/${changes.length}`
                    : "—"}
                </span>
              </div>
            </div>

            {/* Recent Changes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {filterService
                    ? `${services.find((s) => s.id === filterService)?.name || filterService} Changes`
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
