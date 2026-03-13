"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Globe,
  Mail,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  status: "connected" | "disconnected" | "polling";
  lastPolled: string | null;
}

interface Change {
  id: number;
  service: string;
  diff: Record<string, unknown>;
  created_at: string;
  acknowledged: boolean;
}

function ServiceCard({
  service,
  onPoll,
}: {
  service: Service;
  onPoll: (id: string) => void;
}) {
  return (
    <li className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                {service.icon}
              </div>
              <div className="flex items-center gap-2">
                {service.status === "connected" ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                ) : service.status === "polling" ? (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Polling
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    No data
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance">
                {service.name}
              </h3>
              <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {service.lastPolled
                  ? `Last polled ${new Date(service.lastPolled).toLocaleTimeString()}`
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
        </div>
        <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 overflow-auto max-h-32">
          {JSON.stringify(change.diff, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>([
    {
      id: "stripe",
      name: "Stripe",
      icon: <CreditCard className="h-4 w-4" />,
      color: "#635bff",
      status: "disconnected",
      lastPolled: null,
    },
    {
      id: "vercel",
      name: "Vercel",
      icon: <Globe className="h-4 w-4" />,
      color: "#000",
      status: "disconnected",
      lastPolled: null,
    },
    {
      id: "sendgrid",
      name: "SendGrid",
      icon: <Mail className="h-4 w-4" />,
      color: "#1a82e2",
      status: "disconnected",
      lastPolled: null,
    },
  ]);

  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changes?limit=20")
      .then((r) => r.json())
      .then((data) => {
        setChanges(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePoll = async (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, status: "polling" as const } : s
      )
    );

    try {
      await fetch(`/api/services/${serviceId}/poll`, { method: "POST" });
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? { ...s, status: "connected" as const, lastPolled: new Date().toISOString() }
            : s
        )
      );
    } catch {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId ? { ...s, status: "disconnected" as const } : s
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">DriftGuard</span>
          <span className="text-sm text-muted-foreground">SaaS Config Monitor</span>
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

        {/* Service Cards with Glowing Effect */}
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6 mb-12">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
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
              {changes.filter((c) => c.acknowledged).length}/{changes.length}
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
