"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
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
  LogOut,
  Crown,
  Plus,
  X,
  Database,
  Lock,
  Boxes,
  Bug,
  Search,
  Palette,
  Bell,
  MessageSquare,
  FileText,
  Cpu,
  Zap,
  Gauge,
  HelpCircle,
  Server,
  Workflow,
  Users,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FlowButton } from "@/components/ui/flow-button";
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
  service_id: string;
  service: string;
  diff: string | Record<string, unknown>;
  created_at: string;
  acknowledged: number;
}

interface User {
  email: string;
  name: string;
  plan: string;
  plan_details: {
    name: string;
    maxServices: number;
    pollIntervalMs: number;
    historyDays: number;
    features: string[];
  };
}

// ── Service Catalog (25 services) ────────────────────────────
interface CatalogService {
  id: string;
  name: string;
  icon: React.ReactNode;
  docsUrl: string;
  permissions: string;
  steps: string[];
}

const SERVICE_CATALOG: CatalogService[] = [
  { id: "stripe", name: "Stripe", icon: <CreditCard className="h-4 w-4" />, docsUrl: "https://dashboard.stripe.com/apikeys", permissions: "Read-only config (no payment processing)", steps: ["Go to Stripe → Developers → API Keys", "Copy Secret key (sk_live_ or sk_test_)", "DriftGuard reads config only — cannot process payments"] },
  { id: "vercel", name: "Vercel", icon: <Globe className="h-4 w-4" />, docsUrl: "https://vercel.com/account/settings/tokens", permissions: "Read access to project & deployment settings", steps: ["Go to Account → Tokens → Create", "Name it \"DriftGuard\", set scope to your team", "Copy immediately — not shown again"] },
  { id: "sendgrid", name: "SendGrid", icon: <Mail className="h-4 w-4" />, docsUrl: "https://app.sendgrid.com/settings/api_keys", permissions: "Restricted: Mail Settings + Tracking (read-only)", steps: ["Go to Settings → API Keys → Create", "Choose Restricted Access", "Enable Mail Settings → Read, Tracking → Read", "Copy key (starts with SG.)"] },
  { id: "github", name: "GitHub", icon: <GitBranch className="h-4 w-4" />, docsUrl: "https://github.com/settings/tokens", permissions: "Read-only: repo, org settings, webhooks", steps: ["Go to Settings → Developer → Tokens (classic)", "Generate new token, name \"DriftGuard\"", "Scopes: repo (read), admin:org (read), admin:repo_hook (read)", "Copy token (starts with ghp_)"] },
  { id: "cloudflare", name: "Cloudflare", icon: <Cloud className="h-4 w-4" />, docsUrl: "https://dash.cloudflare.com/profile/api-tokens", permissions: "Read-only: Zone settings, SSL/TLS config", steps: ["Go to Profile → API Tokens → Create Token", "Use Custom token template", "Permissions: Zone Settings (Read), SSL/Certificates (Read)", "Select zones to monitor"] },
  { id: "twilio", name: "Twilio", icon: <Phone className="h-4 w-4" />, docsUrl: "https://console.twilio.com", permissions: "Read-only account config (no SMS/call access)", steps: ["Go to Twilio Console dashboard", "Copy Account SID and Auth Token", "Or create Restricted API Key: Accounts (Read), Voice (Read), Messaging (Read)"] },
  { id: "datadog", name: "Datadog", icon: <BarChart3 className="h-4 w-4" />, docsUrl: "https://app.datadoghq.com/organization-settings/api-keys", permissions: "Read-only dashboard & alert config", steps: ["Go to Organization Settings → API Keys", "Click New Key → name it \"DriftGuard\"", "Copy the 32-character key"] },
  { id: "slack", name: "Slack", icon: <Hash className="h-4 w-4" />, docsUrl: "https://api.slack.com/apps", permissions: "Incoming Webhook (post alerts to channel)", steps: ["Go to Slack API → Your Apps → Create New App", "Go to Incoming Webhooks → enable", "Add Webhook to Workspace → select channel", "Copy Webhook URL"] },
  { id: "aws", name: "AWS", icon: <Server className="h-4 w-4" />, docsUrl: "https://console.aws.amazon.com/iam/home#/security_credentials", permissions: "IAM ReadOnly policy", steps: ["Go to IAM → Users → Create user \"driftguard\"", "Attach policy: ReadOnlyAccess (or custom)", "Create access key → Application", "Copy Access Key ID + Secret"] },
  { id: "gcp", name: "Google Cloud", icon: <Cloud className="h-4 w-4" />, docsUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts", permissions: "Viewer role on project", steps: ["Go to IAM → Service Accounts → Create", "Name: driftguard, role: Viewer", "Create key → JSON", "Upload JSON key file or paste contents"] },
  { id: "azure", name: "Azure", icon: <Cloud className="h-4 w-4" />, docsUrl: "https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps", permissions: "Reader role on subscription", steps: ["Go to Azure AD → App registrations → New", "Create client secret", "Assign Reader role on target subscription", "Copy Tenant ID, Client ID, Client Secret"] },
  { id: "okta", name: "Okta", icon: <ShieldCheck className="h-4 w-4" />, docsUrl: "https://developer.okta.com/docs/guides/create-an-api-token", permissions: "Read-only Admin API token", steps: ["Go to Security → API → Tokens", "Create Token → name \"DriftGuard\"", "Role: Read-Only Administrator", "Copy token immediately"] },
  { id: "pagerduty", name: "PagerDuty", icon: <Bell className="h-4 w-4" />, docsUrl: "https://support.pagerduty.com/main/docs/api-access-keys", permissions: "Read-only API v2 key", steps: ["Go to Integrations → API Access Keys", "Create new API Key (v2)", "Set to Read-only access", "Copy the key"] },
  { id: "jira", name: "Jira", icon: <Boxes className="h-4 w-4" />, docsUrl: "https://id.atlassian.com/manage-profile/security/api-tokens", permissions: "Read project & workflow config", steps: ["Go to Atlassian Account → Security → API tokens", "Create token → name \"DriftGuard\"", "Use with your email as username", "DriftGuard reads project configs only"] },
  { id: "mongodb", name: "MongoDB Atlas", icon: <Database className="h-4 w-4" />, docsUrl: "https://www.mongodb.com/docs/atlas/configure-api-access/", permissions: "Organization Read Only role", steps: ["Go to Access Manager → API Keys → Create", "Role: Organization Read Only", "Add your server IP to access list", "Copy Public + Private key"] },
  { id: "auth0", name: "Auth0", icon: <Lock className="h-4 w-4" />, docsUrl: "https://auth0.com/docs/secure/tokens/access-tokens/management-api-access-tokens", permissions: "read:* scopes on Management API", steps: ["Go to Applications → Machine to Machine", "Create app, authorize Management API", "Select read-only scopes (read:clients, read:connections, etc.)", "Copy Client ID + Client Secret"] },
  { id: "supabase", name: "Supabase", icon: <Database className="h-4 w-4" />, docsUrl: "https://supabase.com/dashboard/project/_/settings/api", permissions: "Service role key (read-only usage)", steps: ["Go to Project Settings → API", "Copy the service_role key", "Or use anon key for public config only", "DriftGuard monitors project settings & auth config"] },
  { id: "firebase", name: "Firebase", icon: <Zap className="h-4 w-4" />, docsUrl: "https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk", permissions: "Firebase Admin SDK (read-only usage)", steps: ["Go to Project Settings → Service Accounts", "Generate new private key (JSON)", "DriftGuard reads Firestore rules, auth config, hosting settings", "Upload or paste JSON key"] },
  { id: "hubspot", name: "HubSpot", icon: <Users className="h-4 w-4" />, docsUrl: "https://developers.hubspot.com/docs/api/private-apps", permissions: "Read-only private app", steps: ["Go to Settings → Integrations → Private Apps", "Create app → name \"DriftGuard\"", "Scopes: settings.read, account-info.read", "Copy access token"] },
  { id: "zendesk", name: "Zendesk", icon: <MessageSquare className="h-4 w-4" />, docsUrl: "https://developer.zendesk.com/api-reference/introduction/security-and-auth/", permissions: "Read-only API token", steps: ["Go to Admin → Channels → API", "Enable Token Access → Add API Token", "Name: DriftGuard", "Use {email}/token:{api_token} for auth"] },
  { id: "intercom", name: "Intercom", icon: <MessageSquare className="h-4 w-4" />, docsUrl: "https://developers.intercom.com/docs/build-an-integration/getting-started/", permissions: "Read admins, read company config", steps: ["Go to Settings → Integrations → Developer Hub", "Create new app → name \"DriftGuard\"", "Permissions: Read admins, Read companies", "Copy Access Token"] },
  { id: "linear", name: "Linear", icon: <Workflow className="h-4 w-4" />, docsUrl: "https://linear.app/settings/api", permissions: "Read-only personal API key or OAuth", steps: ["Go to Settings → API → Personal API Keys", "Create key → label \"DriftGuard\"", "Or use OAuth app with read scopes", "Copy the key"] },
  { id: "notion", name: "Notion", icon: <FileText className="h-4 w-4" />, docsUrl: "https://www.notion.so/my-integrations", permissions: "Read content integration", steps: ["Go to My Integrations → New Integration", "Name: DriftGuard, select workspace", "Capabilities: Read content only", "Copy Internal Integration Token"] },
  { id: "sentry", name: "Sentry", icon: <Bug className="h-4 w-4" />, docsUrl: "https://docs.sentry.io/api/auth/", permissions: "org:read, project:read scopes", steps: ["Go to Settings → Auth Tokens", "Create new token", "Scopes: org:read, project:read, team:read", "Copy the token"] },
  { id: "newrelic", name: "New Relic", icon: <Gauge className="h-4 w-4" />, docsUrl: "https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/", permissions: "User API key (read-only usage)", steps: ["Go to API Keys page", "Create User key type", "DriftGuard reads alert policies & dashboard configs", "Copy the key (starts with NRAK-)"] },
  { id: "launchdarkly", name: "LaunchDarkly", icon: <Cpu className="h-4 w-4" />, docsUrl: "https://docs.launchdarkly.com/home/account/api", permissions: "Reader role API access token", steps: ["Go to Account Settings → Authorization", "Create token → Role: Reader", "DraftGuard monitors feature flag configs", "Copy the token"] },
  { id: "algolia", name: "Algolia", icon: <Search className="h-4 w-4" />, docsUrl: "https://www.algolia.com/account/api-keys/all", permissions: "Search-only or Admin API key (read usage)", steps: ["Go to Settings → API Keys", "Use Admin key or create restricted key", "ACL: listIndexes, settings, logs", "Copy Application ID + API Key"] },
  { id: "mixpanel", name: "Mixpanel", icon: <Palette className="h-4 w-4" />, docsUrl: "https://developer.mixpanel.com/reference/authentication", permissions: "Service Account (read-only)", steps: ["Go to Project Settings → Service Accounts", "Create account → role: Consumer/Viewer", "Copy Username + Secret", "DriftGuard reads project settings & saved reports"] },
];

// Build lookup maps from catalog
const SERVICE_ICONS: Record<string, React.ReactNode> = {};
const SERVICE_DOCS: Record<string, string> = {};
const SERVICE_SETUP_GUIDE: Record<string, { title: string; permissions: string; steps: string[] }> = {};
SERVICE_CATALOG.forEach((s) => {
  SERVICE_ICONS[s.id] = s.icon;
  SERVICE_DOCS[s.id] = s.docsUrl;
  SERVICE_SETUP_GUIDE[s.id] = { title: `How to get your ${s.name} API key`, permissions: s.permissions, steps: s.steps };
});

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
              <h3 className="pt-0.5 text-xl font-semibold tracking-[-0.04em] md:text-2xl text-balance">
                {service.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {service.last_polled_at
                  ? `Last polled ${new Date(service.last_polled_at).toLocaleTimeString()}`
                  : "Not polled yet"}
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
  let diffObj: Record<string, unknown> = {};
  try {
    diffObj =
      typeof change.diff === "string" ? JSON.parse(change.diff) : change.diff;
  } catch {
    diffObj = {};
  }

  return (
    <div className="flex items-start justify-between rounded-xl border-[0.75px] border-border bg-card p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm capitalize">
            {change.service || change.service_id}
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
          {JSON.stringify(diffObj, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ── Link Service Modal ────────────────────────────────────────
function LinkServiceModal({
  linkedServices,
  open,
  onClose,
  onSave,
}: {
  linkedServices: Service[];
  open: boolean;
  onClose: () => void;
  onSave: (serviceId: string, apiKey: string) => void;
}) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const linkedIds = new Set(linkedServices.filter((s) => s.connected).map((s) => s.id));

  useEffect(() => {
    if (open) {
      setExpandedService(null);
      setSearch("");
    }
  }, [open]);

  const handleSave = (serviceId: string) => {
    onSave(serviceId, keys[serviceId] || "");
    setSaved((prev) => ({ ...prev, [serviceId]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [serviceId]: false })), 2000);
  };

  const filtered = SERVICE_CATALOG.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Link a Service</h2>
                <p className="text-sm text-muted-foreground">
                  {SERVICE_CATALOG.length} services available · {linkedIds.size} linked
                </p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  autoComplete="off"
                  name="service-search"
                  className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Service list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filtered.map((svc) => (
                <div
                  key={svc.id}
                  className={cn(
                    "rounded-xl border transition-colors",
                    expandedService === svc.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:border-border/80"
                  )}
                >
                  <button
                    className="w-full flex items-center justify-between p-3.5 cursor-pointer"
                    onClick={() => setExpandedService(expandedService === svc.id ? null : svc.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                        {svc.icon}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-sm">{svc.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {linkedIds.has(svc.id) ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Linked
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{svc.permissions}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Plus className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", expandedService === svc.id && "rotate-45")} />
                  </button>

                  <AnimatePresence>
                    {expandedService === svc.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3.5 pb-3.5 space-y-3">
                          {/* API Help toggle */}
                          <button
                            onClick={() => setShowHelp((h) => ({ ...h, [svc.id]: !h[svc.id] }))}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            {showHelp[svc.id] ? "Hide API Help" : "API Help"}
                          </button>

                          {showHelp[svc.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              transition={{ duration: 0.15 }}
                              className="rounded-lg bg-muted/50 border border-border p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-foreground">
                                  {SERVICE_SETUP_GUIDE[svc.id].title}
                                </p>
                                <a
                                  href={svc.docsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                                >
                                  Open docs <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                <strong>Required permissions:</strong> {svc.permissions}
                              </p>
                              <ol className="space-y-1">
                                {svc.steps.map((step, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                    <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </motion.div>
                          )}

                          {/* Key input */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <input
                                type={visible[svc.id] ? "text" : "password"}
                                value={keys[svc.id] || ""}
                                onChange={(e) => setKeys((p) => ({ ...p, [svc.id]: e.target.value }))}
                                placeholder={`Paste ${svc.name} API key`}
                                autoComplete="off"
                                name={`link-key-${svc.id}`}
                                className="w-full rounded-lg border border-border bg-background pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setVisible((p) => ({ ...p, [svc.id]: !p[svc.id] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {visible[svc.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSave(svc.id)}
                              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                            >
                              {saved[svc.id] ? "Saved!" : "Save"}
                            </button>
                            {keys[svc.id] && (
                              <button
                                type="button"
                                onClick={() => { setKeys((p) => ({ ...p, [svc.id]: "" })); onSave(svc.id, ""); }}
                                className="rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No services match &ldquo;{search}&rdquo;</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { MenuBar } from "@/components/ui/glow-menu";

// ── Settings Page ─────────────────────────────────────────────
function SettingsPage({
  services,
  user,
  onSave,
}: {
  services: Service[];
  user: User | null;
  onSave: (serviceId: string, apiKey: string) => void;
}) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("Billing & Plan");

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

  const PLANS_LIST = [
    { key: "free", name: "Free", price: "$0", period: "/mo", desc: "For side projects & testing", features: ["3 services", "30-min polling", "7-day history", "Email alerts"] },
    { key: "pro", name: "Pro", price: "$29", period: "/mo", desc: "For growing teams", popular: true, features: ["15 services", "5-min polling", "90-day history", "Slack + email + webhook alerts", "5 team members", "Compliance exports"] },
    { key: "business", name: "Business", price: "$79", period: "/mo", desc: "For compliance-heavy orgs", features: ["Unlimited services", "1-min polling", "1-year history", "All alert channels", "Unlimited team members", "SOC2 / HIPAA reports", "Priority support"] },
  ];

  const menuItems = [
    {
      icon: CreditCard,
      label: "Billing & Plan",
      href: "#",
      gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
      iconColor: "text-blue-500",
    },
    {
      icon: Shield,
      label: "Linked Services",
      href: "#",
      gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
      iconColor: "text-green-500",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your plan, billing, and service connections
          </p>
        </div>
        <div className="flex items-center gap-4">
          <MenuBar
            items={menuItems}
            activeItem={activeTab}
            onItemClick={setActiveTab}
          />
        </div>
      </div>

      {activeTab === "Billing & Plan" && user && (
        <div className="mb-10 fade-in-0 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Billing & Plan
          </h2>

          {/* Current plan card */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold">{user.plan_details.name} Plan</span>
                  {user.plan === "trial" && (
                    <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-xs font-medium">14-day trial</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.plan_details.maxServices === 999 ? "Unlimited" : user.plan_details.maxServices} services · {user.plan_details.pollIntervalMs / 60000}-min polling · {user.plan_details.historyDays}-day history
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.plan_details.features.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted/50 border border-border px-2.5 py-1 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Plan comparison grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PLANS_LIST.map((plan) => {
              const isCurrent = user.plan === plan.key || (user.plan === "trial" && plan.key === "pro");
              return (
                <div
                  key={plan.key}
                  className={cn(
                    "rounded-xl border p-5 transition-colors relative",
                    isCurrent ? "border-primary bg-primary/5" : "border-border bg-card hover:border-border/80",
                    plan.popular && !isCurrent && "border-primary/30"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Most popular
                    </div>
                  )}
                  <h3 className="font-semibold mb-0.5">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="text-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                      Current plan
                    </div>
                  ) : (
                    <button
                      className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      onClick={() => {
                        // TODO: Redirect to Stripe checkout
                        alert(`Stripe checkout for ${plan.name} plan would open here. Integration pending.`);
                      }}
                    >
                      {PLANS_LIST.findIndex((p) => p.key === user.plan || (user.plan === "trial" && p.key === "pro")) > PLANS_LIST.findIndex((p) => p.key === plan.key)
                        ? "Downgrade"
                        : "Upgrade"}{" "}
                      to {plan.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cancel subscription */}
          {user.plan !== "free" && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">Cancel subscription</h3>
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll be downgraded to the Free plan at the end of your billing cycle.
                  </p>
                </div>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="rounded-lg border border-destructive/30 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Cancel plan
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // TODO: Call Stripe cancel subscription API
                        alert("Subscription cancellation would be processed via Stripe. Integration pending.");
                        setShowCancelConfirm(false);
                      }}
                      className="rounded-lg bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      Yes, cancel
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Keep plan
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Linked Services" && (
        <div className="fade-in-0 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" /> Linked Services
          </h2>

          {/* Plan limits banner */}
          {user && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Services: <strong className="text-foreground">{services.filter(s => s.connected).length}</strong> / {user.plan_details.maxServices === 999 ? "∞" : user.plan_details.maxServices}
                  </span>
                  <span className="text-muted-foreground">
                    Poll interval: <strong className="text-foreground">{user.plan_details.pollIntervalMs / 60000}min</strong>
                  </span>
                  <span className="text-muted-foreground">
                    History: <strong className="text-foreground">{user.plan_details.historyDays}d</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                      {SERVICE_ICONS[service.id] || <Activity className="h-4 w-4" />}
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

                {/* API key input */}
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
                      autoComplete="off"
                      name={`api-key-${service.id}`}
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
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const [page, setPage] = useState<"dashboard" | "settings">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
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
  const [authChecked, setAuthChecked] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  // Clerk handles auth via middleware — just wait for user to load
  useEffect(() => {
    if (isLoaded) setAuthChecked(true);
  }, [isLoaded]);

  const fetchServices = useCallback(() => {
    fetch(`/api/services?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data);
          const states: Record<string, "idle" | "polling" | "connected"> = {};
          data.forEach((s: Service) => {
            states[s.id] = s.connected
              ? s.last_polled_at
                ? "connected"
                : "idle"
              : "idle";
          });
          setPollingStates(states);
        }
      })
      .catch(() => {});
  }, []);

  const fetchChanges = useCallback(() => {
    fetch(`/api/changes?limit=20&t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setChanges(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchServices();
    fetchChanges();
  }, [authChecked, fetchServices, fetchChanges]);

  const handlePoll = async (serviceId: string) => {
    setPollingStates((prev) => ({ ...prev, [serviceId]: "polling" }));

    try {
      const res = await fetch(`/api/services/${serviceId}/poll`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        // Show error (rate limit, not linked, etc.)
        setPollResult({ service: serviceId, count: -1 });
        setTimeout(() => setPollResult(null), 5000);
        setPollingStates((prev) => ({ ...prev, [serviceId]: "connected" }));
        return;
      }

      setPollingStates((prev) => ({ ...prev, [serviceId]: "connected" }));
      setPollResult({
        service: serviceId,
        count: data.changesGenerated || 0,
      });
      setTimeout(() => setPollResult(null), 5000);
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

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  // Build user profile from Clerk
  const PLANS: Record<string, User["plan_details"]> = {
    free: { name: "Free", maxServices: 3, pollIntervalMs: 30 * 60 * 1000, historyDays: 7, features: ["3 services", "30-min polling", "7-day history", "Email alerts"] },
    trial: { name: "Pro Trial", maxServices: 15, pollIntervalMs: 5 * 60 * 1000, historyDays: 14, features: ["15 services", "5-min polling", "14-day trial", "Slack + email + webhook alerts"] },
    pro: { name: "Pro", maxServices: 15, pollIntervalMs: 5 * 60 * 1000, historyDays: 90, features: ["15 services", "5-min polling", "90-day history", "Slack + email + webhook alerts", "5 team members", "Compliance exports"] },
    business: { name: "Business", maxServices: 999, pollIntervalMs: 60 * 1000, historyDays: 365, features: ["Unlimited services", "1-min polling", "1-year history", "All alert channels", "Unlimited team members", "SOC2 / HIPAA reports", "Priority support"] },
  };

  const userPlanKey = "trial"; // TODO: Read from Stripe subscription via metadata
  const user: User = clerkUser ? {
    email: clerkUser.emailAddresses[0]?.emailAddress || "",
    name: clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || "User",
    plan: userPlanKey,
    plan_details: PLANS[userPlanKey] || PLANS.free,
  } : {
    email: "", name: "", plan: "free",
    plan_details: PLANS.free,
  };

  const linkedServices = services.filter((s) => s.connected);
  const acknowledgedCount = changes.filter(
    (c) => c.acknowledged === 1
  ).length;
  const displayedChanges = filterService
    ? changes.filter((c) => c.service_id === filterService)
    : changes;

  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <LayoutDashboard className={cn("h-5 w-5 flex-shrink-0", page === "dashboard" ? "text-primary" : "text-neutral-700 dark:text-neutral-200")} />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <Settings className={cn("h-5 w-5 flex-shrink-0", page === "settings" ? "text-primary" : "text-neutral-700 dark:text-neutral-200")} />
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 border-r border-border bg-card dark:bg-neutral-900">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            {sidebarOpen ? (
              <a href="/" className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-lg whitespace-pre"
                >
                  DriftGuard
                </motion.span>
              </a>
            ) : (
              <a href="/" className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
              </a>
            )}

            {/* Navigation */}
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={cn(
                    "rounded-lg px-2 transition-colors",
                    (idx === 0 && page === "dashboard") || (idx === 1 && page === "settings")
                      ? "bg-muted text-foreground"
                      : "hover:bg-muted/50"
                  )}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    setPage(idx === 0 ? "dashboard" : "settings");
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col gap-2">
            <div className="px-2">
              <ThemeToggle />
            </div>
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: <LogOut className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
              }}
              className="rounded-lg px-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleLogout();
              }}
            />
            {/* User avatar */}
            <SidebarLink
              link={{
                label: user.name || user.email,
                href: "#",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                ),
              }}
              className="px-2"
              onClick={(e: React.MouseEvent) => e.preventDefault()}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {page === "settings" ? (
            <SettingsPage
              services={services}
              user={user}
              onSave={handleSaveApiKey}
            />
          ) : (
            <>
              {/* Poll result toast */}
              {pollResult && (
                <div
                  className={cn(
                    "mb-6 rounded-lg border px-4 py-3 text-sm flex items-center justify-between gap-2",
                    pollResult.count > 0
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : pollResult.count === -1
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
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
                        : pollResult.count === -1
                        ? "error polling — check if service is linked"
                        : "no changes detected (poll again — randomized for demo)"}
                    </span>
                  </div>
                  {pollResult.count > 0 && (
                    <a
                      href="#changes"
                      className="text-xs underline hover:no-underline shrink-0"
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById("changes")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      View changes ↓
                    </a>
                  )}
                </div>
              )}

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
                    <p className="text-muted-foreground">
                      Monitor your SaaS configuration for unexpected changes
                    </p>
                  </div>
                  {user && (
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span className="font-medium">
                          {user.plan_details.name}
                        </span>
                        {user.plan === "trial" && (
                          <span className="text-xs text-muted-foreground">
                            (14-day trial)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {linkedServices.length}/
                        {user.plan_details.maxServices === 999
                          ? "∞"
                          : user.plan_details.maxServices}{" "}
                        services • {user.plan_details.pollIntervalMs / 60000}
                        min polling
                      </p>
                    </div>
                  )}
                </div>
                <FlowButton
                  text="Link"
                  onClick={() => setLinkModalOpen(true)}
                />
              </div>

              {/* Service Cards */}
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
                  <div className="flex justify-center">
                    <FlowButton
                      text="Link"
                      onClick={() => setLinkModalOpen(true)}
                    />
                  </div>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6 mb-12">
                  {linkedServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      status={pollingStates[service.id] || "idle"}
                      changesCount={
                        changes.filter((c) => c.service_id === service.id).length
                      }
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
        </div>
      </main>

      {/* Link Service Modal */}
      <LinkServiceModal
        linkedServices={services}
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onSave={async (serviceId, apiKey) => {
          await handleSaveApiKey(serviceId, apiKey);
          fetchServices();
        }}
      />
    </div>
  );
}
