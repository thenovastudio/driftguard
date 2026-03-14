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
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";

interface Service {
  id: string;
  name: string;
  enabled: boolean;
  last_polled_at: string | null;
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
};

function ServiceCard({
  service,
  status,
  onPoll,
}: {
  service: Service;
  status: "idle" | "polling" | "connected";
  onPoll: (id: string) => void;
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

            <div className="pt-2">
              <InteractiveHoverButton
                text="Poll"
                className="w-28"
                onClick={() => onPoll(service.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function ChangeRow({ change }: { change: Change }) {
  return (
    <div className="flex items-start justify-between rounded-xl border-[0.75px] border-border bg-card p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm capitalize">{change.service}</span>
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

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [pollingStates, setPollingStates] = useState<
    Record<string, "idle" | "polling" | "connected">
  >({});
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Refresh data
      fetchServices();
      fetchChanges();
    } catch {
      setPollingStates((prev) => ({ ...prev, [serviceId]: "idle" }));
    }
  };

  const connectedCount = services.filter(
    (s) => s.last_polled_at !== null
  ).length;
  const acknowledgedCount = changes.filter((c) => c.acknowledged).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">DriftGuard</span>
            <span className="text-sm text-muted-foreground">SaaS Config Monitor</span>
          </div>
          <ExpandableTabs
            tabs={[
              { title: "Dashboard", icon: LayoutDashboard },
              { title: "Alerts", icon: Bell },
              { type: "separator" },
              { title: "Settings", icon: Settings },
              { title: "Help", icon: HelpCircle },
            ]}
            className="border-border"
          />
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your SaaS configuration for unexpected changes
          </p>
        </div>

        {/* Service Cards */}
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6 mb-12">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              status={pollingStates[service.id] || "idle"}
              onPoll={handlePoll}
            />
          ))}
        </ul>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Services</span>
            </div>
            <span className="text-2xl font-bold">{services.length}</span>
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
                : `${connectedCount}/${services.length}`}
            </span>
          </div>
        </div>

        {/* Recent Changes */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Changes</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : changes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-muted-foreground">
                No configuration changes detected yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Poll your services to start monitoring.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => (
                <ChangeRow key={change.id} change={change} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
