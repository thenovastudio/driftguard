"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  cloneElement,
  isValidElement,
  ReactElement,
  useDeferredValue,
} from "react";
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
  Clock,
  ArrowRight,
  Download,
  History as HistoryIcon,
  MessageCircle,
  Webhook,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/sidebar";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { FlowButton } from "@/components/ui/flow-button";
import { ExpandableTabs, TabItem } from "@/components/ui/expandable-tabs";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  service_type: string;
  name: string;
  description?: string;
  owner_id?: string;
  enabled: boolean;
  last_polled_at: string | null;
  api_key?: string;
  connected: boolean;
}

interface Change {
  id: number;
  user_id: string;
  service_instance_id: string;
  service_id: string;
  service: string;
  diff: string | Record<string, unknown>;
  severity: string;
  acknowledged: boolean;
  created_at: string;
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
  category: string;
  icon: React.ReactNode;
  docsUrl: string;
  permissions: string;
  steps: string[];
}

const SERVICE_CATALOG: (CatalogService & { category: string })[] = [
  {
    id: "stripe",
    name: "Stripe",
    category: "Finance",
    icon: <CreditCard className="h-4 w-4" />,
    docsUrl: "https://dashboard.stripe.com/apikeys",
    permissions: "Read-only config (no payment processing)",
    steps: [
      "Go to Stripe → Developers → API Keys",
      "Copy Secret key (sk_live_ or sk_test_)",
      "DriftGuard reads config only — cannot process payments",
    ],
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "Infrastructure",
    icon: <Globe className="h-4 w-4" />,
    docsUrl: "https://vercel.com/account/settings/tokens",
    permissions: "Read access to project settings",
    steps: [
      "Go to Account → Tokens → Create",
      'Name it "DriftGuard", set scope to your team',
      "Format for LIVE AUDITS: `TOKEN:PROJECT_NAME`",
      "Example: `v_123:my-awesome-app`",
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    category: "Marketing",
    icon: <Mail className="h-4 w-4" />,
    docsUrl: "https://app.sendgrid.com/settings/api_keys",
    permissions: "Restricted: Mail Settings + Tracking (read-only)",
    steps: [
      "Go to Settings → API Keys → Create",
      "Choose Restricted Access",
      "Enable Mail Settings → Read, Tracking → Read",
      "Copy key (starts with SG.)",
    ],
  },
  {
    id: "github",
    name: "GitHub",
    category: "Source Control",
    icon: <GitBranch className="h-4 w-4" />,
    docsUrl: "https://github.com/settings/tokens",
    permissions: "Read-only: repo, org settings, webhooks",
    steps: [
      "Go to Settings → Developer → Tokens (classic)",
      'Generate new token, name "DriftGuard", scopes: repo (read)',
      "Format for LIVE AUDITS: `TOKEN:OWNER/REPO`",
      "Example: `ghp_abc123:user/repo`",
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "Infrastructure",
    icon: <Cloud className="h-4 w-4" />,
    docsUrl: "https://dash.cloudflare.com/profile/api-tokens",
    permissions: "Read-only: Zone settings, SSL/TLS config",
    steps: [
      "Go to Profile → API Tokens → Create Token",
      "Use Custom token template",
      "Permissions: Zone Settings (Read), SSL/Certificates (Read)",
      "Select zones to monitor",
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "Communication",
    icon: <Phone className="h-4 w-4" />,
    docsUrl: "https://console.twilio.com",
    permissions: "Read-only account config",
    steps: [
      "Go to Twilio Console dashboard",
      "Copy Account SID and Auth Token",
      "DriftGuard reads config only",
    ],
  },
  {
    id: "datadog",
    name: "Datadog",
    category: "Monitoring",
    icon: <BarChart3 className="h-4 w-4" />,
    docsUrl: "https://app.datadoghq.com/organization-settings/api-keys",
    permissions: "Read-only dashboard & alert config",
    steps: [
      "Go to Organization Settings → API Keys",
      'Click New Key → name it "DriftGuard"',
      "Copy the 32-character key",
    ],
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    icon: <Hash className="h-4 w-4" />,
    docsUrl: "https://api.slack.com/apps",
    permissions: "Incoming Webhook (post alerts to channel)",
    steps: [
      "Go to Slack API → Your Apps → Create New App",
      "Go to Incoming Webhooks → enable",
      "Add Webhook to Workspace → select channel",
      "Copy Webhook URL",
    ],
  },
  {
    id: "aws",
    name: "AWS",
    category: "Infrastructure",
    icon: <Shield className="h-4 w-4" />,
    docsUrl: "https://console.aws.amazon.com/iam/home#/security_credentials",
    permissions: "IAM ReadOnly policy",
    steps: [
      'Go to IAM → Users → Create user "driftguard"',
      "Attach policy: ReadOnlyAccess",
      "Create access key → Application",
      "Copy Access Key ID + Secret",
    ],
  },
  {
    id: "gcp",
    name: "Google Cloud",
    category: "Infrastructure",
    icon: <Cloud className="h-4 w-4" />,
    docsUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    permissions: "Viewer role on project",
    steps: [
      "Go to IAM → Service Accounts → Create",
      "Name: driftguard, role: Viewer",
      "Create key → JSON",
      "Paste JSON key contents",
    ],
  },
  {
    id: "azure",
    name: "Azure",
    category: "Infrastructure",
    icon: <Cloud className="h-4 w-4" />,
    docsUrl: "https://portal.azure.com/",
    permissions: "Reader role on subscription",
    steps: [
      "Go to Azure AD → App registrations → New",
      "Create client secret",
      "Assign Reader role on target subscription",
      "Copy Tenant ID, Client ID, Client Secret",
    ],
  },
  {
    id: "okta",
    name: "Okta",
    category: "Identity",
    icon: <Lock className="h-4 w-4" />,
    docsUrl: "https://developer.okta.com/docs/guides/create-an-api-token",
    permissions: "Read-only Admin API token",
    steps: [
      "Go to Security → API → Tokens",
      'Create Token → name "DriftGuard"',
      "Role: Read-Only Administrator",
      "Copy token immediately",
    ],
  },
  {
    id: "auth0",
    name: "Auth0",
    category: "Identity",
    icon: <Lock className="h-4 w-4" />,
    docsUrl: "https://auth0.com/docs/",
    permissions: "read:* scopes on Management API",
    steps: [
      "Go to Applications → Machine to Machine",
      "Create app, authorize Management API",
      "Select read-only scopes",
      "Copy Client ID + Client Secret",
    ],
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "Database",
    icon: <Database className="h-4 w-4" />,
    docsUrl: "https://supabase.com/dashboard/project/_/settings/api",
    permissions: "Service role key (read-only usage)",
    steps: [
      "Go to Project Settings → API",
      "Copy the service_role key",
      "DriftGuard monitors project settings & auth config",
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    icon: <Users className="h-4 w-4" />,
    docsUrl: "https://developers.hubspot.com/",
    permissions: "Read-only private app",
    steps: [
      "Go to Settings → Integrations → Private Apps",
      'Create app → name "DriftGuard"',
      "Scopes: settings.read, account-info.read",
      "Copy access token",
    ],
  },
  {
    id: "linear",
    name: "Linear",
    category: "Productivity",
    icon: <Workflow className="h-4 w-4" />,
    docsUrl: "https://linear.app/settings/api",
    permissions: "Read-only API key",
    steps: [
      "Go to Settings → API → Personal API Keys",
      'Create key → label "DriftGuard"',
      "Copy the key",
    ],
  },
  {
    id: "notion",
    name: "Notion",
    category: "Productivity",
    icon: <FileText className="h-4 w-4" />,
    docsUrl: "https://www.notion.so/my-integrations",
    permissions: "Read content integration",
    steps: [
      "Go to My Integrations → New Integration",
      "Name: DriftGuard, select workspace",
      "Capabilities: Read content only",
      "Copy Internal Integration Token",
    ],
  },
  {
    id: "sentry",
    name: "Sentry",
    category: "Monitoring",
    icon: <Bug className="h-4 w-4" />,
    docsUrl: "https://docs.sentry.io/api/auth/",
    permissions: "org:read, project:read scopes",
    steps: [
      "Go to Settings → Auth Tokens",
      "Create new token",
      "Scopes: org:read, project:read, team:read",
      "Copy the token",
    ],
  },
];

// Build lookup maps from catalog
const SERVICE_ICONS: Record<string, React.ReactNode> = {};
const SERVICE_DOCS: Record<string, string> = {};
const SERVICE_SETUP_GUIDE: Record<
  string,
  { title: string; permissions: string; steps: string[] }
> = {};
SERVICE_CATALOG.forEach((s) => {
  SERVICE_ICONS[s.id] = s.icon;
  SERVICE_DOCS[s.id] = s.docsUrl;
  SERVICE_SETUP_GUIDE[s.id] = {
    title: `How to get your ${s.name} API key`,
    permissions: s.permissions,
    steps: s.steps,
  };
});

// ── Service Card ──────────────────────────────────────────────
function ServiceCard({
  service,
  status,
  changesCount,
  onPoll,
  onViewChanges,
  onUnlink,
  isFiltered,
}: {
  service: Service;
  status: "idle" | "polling" | "connected";
  changesCount: number;
  onPoll: (id: string) => void;
  onViewChanges: (id: string) => void;
  onUnlink: (id: string) => void;
  isFiltered: boolean;
}) {
  const owner = service.owner_id || "System_Node";

  return (
    <li className="min-h-[14rem] list-none relative">
      <GlowingEffect
        spread={40}
        glow
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={1.5}
      />
      <div
        className={cn(
          "group relative h-full rounded-2xl border border-white/5 bg-black/40 p-6 transition-all hover:border-primary/40 shadow-xl overflow-hidden",
          isFiltered && "ring-1 ring-primary",
        )}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Shield className="h-24 w-24 -mr-10 -mt-10" />
        </div>

        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-primary shadow-inner">
            {SERVICE_ICONS[service.service_type] || (
              <Activity className="h-6 w-6" />
            )}
          </div>
          <div className="flex flex-col items-end">
            <div
              className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] border",
                status === "polling"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              )}
            >
              {status === "polling" ? "Scanning_Active" : "Sync_Verified"}
            </div>
            {service.last_polled_at && (
              <span className="text-[9px] text-muted-foreground mt-1 font-mono opacity-50">
                T+{" "}
                {Math.floor(
                  (Date.now() - new Date(service.last_polled_at).getTime()) /
                    60000,
                )}
                m
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-1">
              {service.name}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                {owner.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Owner: {owner}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <InteractiveHoverButton
              text={status === "polling" ? "Running" : "Scan"}
              className="flex-1"
              onClick={() => onPoll(service.id)}
            />
            <button
              onClick={() => onViewChanges(service.id)}
              className={cn(
                "flex items-center justify-center gap-2 px-4 h-10 rounded-full border text-xs font-black uppercase tracking-widest transition-all",
                isFiltered
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              )}
            >
              {changesCount > 0 && (
                <span className="bg-destructive text-destructive-foreground px-1 py-0.5 rounded text-[8px]">
                  {changesCount}
                </span>
              )}
              Signals
            </button>
            <button
              onClick={() => onUnlink(service.id)}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-white/5 bg-white/5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all group/trash"
              title="Unlink Service"
            >
              <Trash2 className="h-4 w-4 transition-transform group-hover/trash:scale-110" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

// ── Change Row ────────────────────────────────────────────────
function ChangeRow({
  change,
  onAcknowledge,
}: {
  change: Change;
  onAcknowledge: (id: number) => void;
}) {
  let diffObj: any = {};
  try {
    diffObj =
      typeof change.diff === "string" ? JSON.parse(change.diff) : change.diff;
  } catch {
    diffObj = {};
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 uppercase tracking-widest shadow-inner">
              {change.service || change.service_id}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="h-3 w-3" />
              {new Date(change.created_at).toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] border",
                diffObj.severity === "high"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-primary/5 text-primary/60 border-primary/10",
              )}
            >
              {diffObj.severity || "LOW_SEVERITY"}
            </span>
            {!change.acknowledged ? (
              <button
                onClick={() => onAcknowledge(change.id)}
                className="group/btn relative text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1"
              >
                UNVERIFIED
                <CheckCircle2 className="h-2.5 w-2.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </button>
            ) : (
              <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-[0.2em] flex items-center gap-1">
                VERIFIED <CheckCircle2 className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        </div>

        {/* Visual Diff Block */}
        <div className="rounded-lg bg-black/40 border border-white/5 font-mono text-xs overflow-hidden mb-4">
          <div className="bg-white/5 px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-muted-foreground opacity-50 uppercase tracking-tighter">
              config_diff_stream
            </span>
            <span className="text-[10px] text-primary/40 uppercase">
              {diffObj.field}
            </span>
          </div>
          <div className="p-3 space-y-1">
            <div className="flex items-start gap-3 text-destructive/70 group-hover:text-destructive transition-colors">
              <span className="w-4 text-center opacity-30 select-none">-</span>
              <span className="line-through">{String(diffObj.old)}</span>
            </div>
            <div className="flex items-start gap-3 text-emerald-500/70 group-hover:text-emerald-400 transition-colors">
              <span className="w-4 text-center opacity-30 select-none">+</span>
              <span className="font-bold">{String(diffObj.new)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold opacity-40">
              Actor
            </p>
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] text-primary">
                A
              </div>
              <span className="truncate">
                {diffObj.actor || "Automated Scan"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold opacity-40">
              Protocol
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-primary/60 uppercase">
              {diffObj.detection || "SCAN_V1"}
            </div>
          </div>
        </div>
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
  onSave: (serviceId: string, apiKey: string) => Promise<string | null>;
}) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const linkedIds = useMemo(
    () =>
      new Set(
        linkedServices.filter((s) => s.connected).map((s) => s.service_type),
      ),
    [linkedServices],
  );

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(SERVICE_CATALOG.map((s) => s.category))),
    ],
    [],
  );

  useEffect(() => {
    if (open) {
      setSelectedService(null);
      setSearch("");
      setErrors({});
      setIsLinking(false);
    }
  }, [open]);

  const handleSave = async (serviceId: string) => { // handleSave start
    setIsLinking(true);
    setErrors((prev) => ({ ...prev, [serviceId]: null }));
    const error = await onSave(serviceId, keys[serviceId] || "");
    setIsLinking(false);

    if (error) {
      setErrors((prev) => ({ ...prev, [serviceId]: error }));
    } else {
      setKeys((prev) => ({ ...prev, [serviceId]: "" }));
      setSelectedService(null);
    }
  };

  const filtered = useMemo(() => {
    return SERVICE_CATALOG.filter((s) => {
      const matchesSearch = s.name
        .toLowerCase()
        .includes(deferredSearch.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [deferredSearch, activeCategory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Animated Background Blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]"
              />
              <motion.div
                animate={{
                  x: [0, -80, 0],
                  y: [0, 60, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]"
              />
            </div>
            {/* Dynamic Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 relative z-10 bg-black/20">
              <div className="flex items-center gap-4">
                {selectedService && (
                  <button
                    onClick={() => setSelectedService(null)}
                    className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">
                    {selectedService
                      ? `Link ${selectedService.name}`
                      : "Integration Hub"}
                  </h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono opacity-60 mt-1">
                    {selectedService
                      ? selectedService.permissions
                      : `${SERVICE_CATALOG.length} Nodes Available`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex relative">
              {/* Catalog View */}
              <AnimatePresence mode="popLayout">
                {!selectedService ? (
                  <motion.div
                    key="catalog"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Sidebar & Grid Container */}
                    <div className="flex-1 flex overflow-hidden">
                      {/* Categories Sidebar */}
                      <div className="w-48 border-r border-white/5 p-4 space-y-1 bg-white/[0.02]">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                              activeCategory === cat
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-white/5",
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Main Grid */}
                      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="mb-8 relative max-w-md">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Lookup service..."
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all focus:bg-white/10"
                          />
                        </div>

                        <motion.div
                          key={activeCategory} // Ensure grid re-animates on category change
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                          {filtered.map((svc) => (
                            <motion.button
                              key={svc.id}
                              layoutId={`service-${svc.id}`}
                              variants={itemVariants}
                              whileHover={{
                                y: -4,
                                transition: { duration: 0.2 },
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedService(svc)}
                              className="group relative flex items-center gap-4 p-5 rounded-[2rem] border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-primary/30 transition-all text-left overflow-hidden ring-1 ring-white/5 shadow-inner"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <motion.div
                                layoutId={`icon-${svc.id}`}
                                className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-2xl"
                              >
                                {svc.icon}
                              </motion.div>
                              <div className="flex-1 min-w-0 pointer-events-none">
                                <h4 className="font-black text-sm truncate uppercase tracking-tight text-foreground/90">
                                  {svc.name}
                                </h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono opacity-50">
                                  {svc.category}
                                </p>
                              </div>
                              {linkedIds.has(svc.id) && (
                                <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-500">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                              )}
                            </motion.button>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="config"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex"
                  >
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                      <div className="max-w-2xl mx-auto space-y-12">
                        <div className="flex items-center gap-8 pb-8 border-b border-white/5">
                          <div className="w-24 h-24 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center text-primary shadow-2xl">
                            {isValidElement(selectedService.icon) &&
                              cloneElement(
                                selectedService.icon as ReactElement<any>,
                                {
                                  className: "h-12 w-12",
                                },
                              )}
                          </div>
                          <div>
                            <div className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full w-fit mb-3">
                              Configuration Required
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter">
                              {selectedService.name}
                            </h3>
                            <p className="text-muted-foreground mt-2 font-medium">
                              {selectedService.permissions}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          {/* Steps */}
                          <div className="space-y-6">
                            <h5 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              Setup Steps
                            </h5>
                            <ul className="space-y-4">
                              {selectedService.steps.map((step, i) => (
                                <li
                                  key={i}
                                  className="flex gap-4 items-start group"
                                >
                                  <div className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-black shrink-0 transition-colors group-hover:border-primary group-hover:text-primary">
                                    {i + 1}
                                  </div>
                                  <span className="text-sm text-muted-foreground font-medium leading-relaxed group-hover:text-foreground transition-colors">
                                    {step}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <a
                              href={selectedService.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline mt-4"
                            >
                              Visit Documentation{" "}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          {/* Form */}
                          <div className="space-y-6">
                            <h5 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              Identity Token
                            </h5>
                            <div className="space-y-4">
                              <div className="relative group">
                                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-20 transition-opacity" />
                                <Key className="absolute left-4 top-4 h-5 w-5 text-muted-foreground z-10" />
                                <textarea
                                  value={keys[selectedService.id] || ""}
                                  onChange={(e) =>
                                    setKeys((p) => ({
                                      ...p,
                                      [selectedService.id]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Secure API Key / Token for ${selectedService.name}`}
                                  disabled={isLinking}
                                  className={cn(
                                    "w-full h-32 bg-white/5 border-2 rounded-2xl pl-12 pr-12 py-4 text-sm font-mono focus:outline-none transition-all relative z-10",
                                    errors[selectedService.id]
                                      ? "border-destructive/40 bg-destructive/5"
                                      : "border-white/5 focus:border-primary/40 focus:bg-white/10",
                                  )}
                                />
                                <button
                                  onClick={() =>
                                    setVisible((p) => ({
                                      ...p,
                                      [selectedService.id]:
                                        !p[selectedService.id],
                                    }))
                                  }
                                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10"
                                >
                                  {visible[selectedService.id] ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>

                              {errors[selectedService.id] && (
                                <div className="flex gap-3 bg-destructive/10 border border-destructive/20 p-4 rounded-2xl text-xs text-destructive font-bold uppercase tracking-wide">
                                  <AlertTriangle className="h-4 w-4 shrink-0" />
                                  {errors[selectedService.id]}
                                </div>
                              )}

                              <InteractiveHoverButton
                                text={
                                  isLinking
                                    ? "Verifying Token..."
                                    : "Secure Link"
                                }
                                className="w-full h-14"
                                onClick={() => handleSave(selectedService.id)}
                                disabled={
                                  isLinking || !keys[selectedService.id]
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
  userSettings,
  onSave,
  onSaveSettings,
  onCheckout,
}: {
  services: Service[];
  user: User;
  userSettings: {
    slack_webhook_url: string;
    discord_webhook_url: string;
    outbound_webhook_url: string;
    email_notifications_enabled: boolean;
  };
  onSave: (serviceId: string, apiKey: string) => Promise<string | null>;
  onSaveSettings: (settings: {
    slack_webhook_url: string;
    discord_webhook_url: string;
    outbound_webhook_url: string;
    email_notifications_enabled: boolean;
  }) => void;
  onCheckout: (priceId?: string) => void;
}) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("Billing & Plan");

  const [localSettings, setLocalSettings] = useState(userSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(userSettings);
  }, [userSettings]);

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
    {
      key: "plus",
      name: "Monitra Plus",
      price: "$4.99",
      period: "/mo",
      desc: "For essential monitoring",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID,
      features: [
        "3 services",
        "30-min polling",
        "7-day history",
        "Email alerts",
      ],
    },
    {
      key: "pro",
      name: "Pro",
      price: "$29",
      period: "/mo",
      desc: "For growing teams",
      popular: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
      features: [
        "15 services",
        "5-min polling",
        "90-day history",
        "Slack + email + webhook alerts",
        "5 team members",
        "Compliance exports",
      ],
    },
    {
      key: "business",
      name: "Business",
      price: "$79",
      period: "/mo",
      desc: "For compliance-heavy orgs",
      priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
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
  ];

  const tabs: TabItem[] = [
    { title: "Billing & Plan", icon: CreditCard },
    { type: "separator" },
    { title: "Linked Services", icon: Shield },
    { type: "separator" },
    { title: "Notifications", icon: Bell },
  ];

  const handleTabChange = (index: number | null) => {
    if (index === 0) setActiveTab("Billing & Plan");
    if (index === 2) setActiveTab("Linked Services");
    if (index === 4) setActiveTab("Notifications");
  };

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
          <ExpandableTabs
            tabs={tabs}
            activeColor="text-primary"
            defaultSelected={activeTab === "Billing & Plan" ? 0 : 2}
            onChange={handleTabChange}
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
                  <span className="font-semibold">
                    {user.plan_details.name} Plan
                  </span>
                  {user.plan === "trial" && (
                    <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-xs font-medium">
                      14-day trial
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.plan_details.maxServices === 999
                    ? "Unlimited"
                    : user.plan_details.maxServices}{" "}
                  services · {user.plan_details.pollIntervalMs / 60000}-min
                  polling · {user.plan_details.historyDays}-day history
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.plan_details.features.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md bg-muted/50 border border-border px-2.5 py-1 text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Plan comparison grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PLANS_LIST.map((plan) => {
              const isCurrent =
                user.plan === plan.key ||
                (user.plan === "trial" && plan.key === "pro");
              return (
                <div
                  key={plan.key}
                  className={cn(
                    "rounded-xl border p-5 transition-colors relative flex flex-col",
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-border/80",
                    plan.popular && !isCurrent && "border-primary/30",
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Most popular
                    </div>
                  )}
                  <h3 className="font-semibold mb-0.5">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {plan.desc}
                  </p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-1.5 mb-4 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />{" "}
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="text-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary mt-auto mt-4">
                      Current plan
                    </div>
                  ) : (
                    <div className="mt-auto pt-4 flex flex-col gap-2">
                      <button
                        className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        onClick={() => {
                          onCheckout(plan.priceId);
                        }}
                      >
                        {user.plan === "free" && plan.key === "plus"
                          ? `Start Monitra ${plan.name}` :
                         (user.plan === "free" || user.plan === "plus") && plan.key !== "free" && plan.key !== "plus"
                          ? `Start 14-day free trial`
                          : PLANS_LIST.findIndex(
                                (p) =>
                                  p.key === user.plan ||
                                  (user.plan === "trial" && p.key === "pro") ||
                                  (user.plan === "free" && p.key === "plus"),
                              ) >
                              PLANS_LIST.findIndex((p) => p.key === plan.key)
                            ? `Downgrade to ${plan.name}`
                            : `Upgrade to ${plan.name}`}
                      </button>
                      {(user.plan === "free" || user.plan === "plus") && plan.key !== "free" && plan.key !== "plus" && (
                        <p className="text-[10px] text-center text-muted-foreground leading-tight">
                          Requires credit card via Stripe.
                          <br />
                          Automatically billed when trial ends.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cancel subscription */}
          {(user.plan !== "free" && user.plan !== "plus") && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">
                    Cancel subscription
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll be downgraded to Monitra Plus at the end of
                    your billing cycle.
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
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/stripe/cancel", { method: "POST" });
                          const data = await res.json();
                          if (data.success) {
                            alert("Subscription successfully set to cancel at period end.");
                            window.location.reload();
                          } else {
                            alert(data.error || "Failed to cancel subscription");
                          }
                        } catch (e) {
                          alert("Failed to cancel subscription.");
                        }
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
                    Services:{" "}
                    <strong className="text-foreground">
                      {services.filter((s) => s.connected).length}
                    </strong>{" "}
                    /{" "}
                    {user.plan_details.maxServices === 999
                      ? "∞"
                      : user.plan_details.maxServices}
                  </span>
                  <span className="text-muted-foreground">
                    Poll interval:{" "}
                    <strong className="text-foreground">
                      {user.plan_details.pollIntervalMs / 60000}min
                    </strong>
                  </span>
                  <span className="text-muted-foreground">
                    History:{" "}
                    <strong className="text-foreground">
                      {user.plan_details.historyDays}d
                    </strong>
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

      {activeTab === "Notifications" && (
        <div className="fade-in-0 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Alert Channels
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Configure automated dispatch protocols for configuration drift
              </p>
            </div>
            <button
              onClick={() => {
                onSaveSettings(localSettings);
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2000);
              }}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
            >
              {settingsSaved ? "COMMITTED" : "SAVE PROTOCOL"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Slack Integration */}
            <div
              className={cn(
                "rounded-xl border p-6 flex flex-col gap-4 transition-all",
                user.plan === "free"
                  ? "opacity-50 cursor-not-allowed border-border bg-muted/20"
                  : "border-border bg-card hover:border-primary/20",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#4a154b]/10 flex items-center justify-center text-[#4a154b]">
                    <Hash className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-primary">
                      CHANNEL_SLACK
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Post drift signals to Slack via webhooks
                    </p>
                  </div>
                </div>
                {user.plan === "free" && (
                  <span className="text-[10px] font-black border border-border px-2 py-1 rounded bg-muted/30">
                    PRO_CLEARANCE
                  </span>
                )}
              </div>
              <input
                type="text"
                value={localSettings.slack_webhook_url}
                disabled={user.plan === "free"}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    slack_webhook_url: e.target.value,
                  })
                }
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
              />
            </div>

            {/* Discord Integration */}
            <div
              className={cn(
                "rounded-xl border p-6 flex flex-col gap-4 transition-all",
                user.plan === "free"
                  ? "opacity-50 cursor-not-allowed border-border bg-muted/20"
                  : "border-border bg-card hover:border-primary/20",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2]">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-primary">
                      CHANNEL_DISCORD
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Broadcast alerts to Discord guilds
                    </p>
                  </div>
                </div>
                {user.plan === "free" && (
                  <span className="text-[10px] font-black border border-border px-2 py-1 rounded bg-muted/30">
                    PRO_CLEARANCE
                  </span>
                )}
              </div>
              <input
                type="text"
                value={localSettings.discord_webhook_url}
                disabled={user.plan === "free"}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    discord_webhook_url: e.target.value,
                  })
                }
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
              />
            </div>

            {/* Outbound Webhook Integration */}
            <div
              className={cn(
                "rounded-xl border p-6 flex flex-col gap-4 transition-all",
                user.plan === "free"
                  ? "opacity-50 cursor-not-allowed border-border bg-muted/20"
                  : "border-border bg-card hover:border-primary/20",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Webhook className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-primary">
                      GENERIC_WEBHOOK
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Trigger your own internal API workflows
                    </p>
                  </div>
                </div>
                {user.plan === "free" && (
                  <span className="text-[10px] font-black border border-border px-2 py-1 rounded bg-muted/30">
                    PRO_CLEARANCE
                  </span>
                )}
              </div>
              <input
                type="text"
                value={localSettings.outbound_webhook_url}
                disabled={user.plan === "free"}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    outbound_webhook_url: e.target.value,
                  })
                }
                placeholder="https://api.yourdomain.com/webhooks/drift"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
              />
            </div>

            {/* Email Integration */}
            <div
              className={cn(
                "rounded-xl border p-6 flex items-center justify-between transition-all",
                user.plan === "free"
                  ? "opacity-50 cursor-not-allowed border-border bg-muted/20"
                  : "border-border bg-card hover:border-primary/20",
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">EMAIL_DISPATCH</h3>
                  <p className="text-xs text-muted-foreground">
                    Automated reports delivered to {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {user.plan === "free" && (
                  <span className="text-[10px] font-mono border border-border px-2 py-1 rounded">
                    PRO_REQUIRED
                  </span>
                )}
                <button
                  disabled={user.plan === "free"}
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      email_notifications_enabled:
                        !localSettings.email_notifications_enabled,
                    })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                    localSettings.email_notifications_enabled
                      ? "bg-primary"
                      : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      localSettings.email_notifications_enabled
                        ? "translate-x-6"
                        : "translate-x-1",
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground font-mono">
                Custom Webhooks & PagerDuty integrations pending Level 2
                Clearance
              </p>
            </div>
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
    method?: "live_api" | "simulation";
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userSettings, setUserSettings] = useState<{
    slack_webhook_url: string;
    discord_webhook_url: string;
    outbound_webhook_url: string;
    email_notifications_enabled: boolean;
  }>({
    slack_webhook_url: "",
    discord_webhook_url: "",
    outbound_webhook_url: "",
    email_notifications_enabled: false,
  });

  // Clerk handles auth via middleware — just wait for user to load
  useEffect(() => {
    if (isLoaded) setAuthChecked(true);
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && clerkUser && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");

      if (sessionId) {
        setIsVerifying(true);
        // Clean URL manually
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        // Call our secure manual verification backend
        fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
          .then(() => clerkUser.reload())
          .then(() => {
            setIsVerifying(false);
          })
          .catch(() => {
            setIsVerifying(false);
          });
      }
    }
  }, [isLoaded, clerkUser]);

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

  const handleAcknowledgeChange = async (changeId: number) => {
    try {
      await fetch(`/api/changes/${changeId}/acknowledge`, {
        method: "POST",
      });
      fetchChanges();
    } catch {
      // silent fail
    }
  };

  const handleUnlinkService = async (serviceId: string) => {
    if (
      !confirm(
        "Are you sure you want to unlink this service? This will stop monitoring and delete all related audit logs.",
      )
    )
      return;
    try {
      await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
      fetchServices();
      fetchChanges();
      if (filterService === serviceId) setFilterService(null);
    } catch {
      // silent fail
    }
  };

  const fetchUserSettings = useCallback(() => {
    fetch(`/api/user/settings?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setUserSettings({
            slack_webhook_url: data.slack_webhook_url || "",
            discord_webhook_url: data.discord_webhook_url || "",
            outbound_webhook_url: data.outbound_webhook_url || "",
            email_notifications_enabled: !!data.email_notifications_enabled,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchServices();
    fetchChanges();
    fetchUserSettings();
  }, [authChecked, fetchServices, fetchChanges, fetchUserSettings]);

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
      fetchChanges();
      setPollResult({
        service: serviceId,
        count: data.changesGenerated || 0,
        method: data.method,
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

  const handleLinkService = async (serviceId: string, apiKey: string) => {
    try {
      const res = await fetch(`/api/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type: serviceId, api_key: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Failed to link service";

      fetchServices();
      return null;
    } catch {
      return "Network error: check your connection and try again.";
    }
  };

  const handleSaveUserSettings = async (settings: {
    slack_webhook_url: string;
    discord_webhook_url: string;
    outbound_webhook_url: string;
    email_notifications_enabled: boolean;
  }) => {
    try {
      await fetch(`/api/user/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setUserSettings(settings);
    } catch {
      // silent fail
    }
  };

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const handleExportCSV = () => {
    if (changes.length === 0) return;

    const headers = [
      "Timestamp",
      "Service",
      "Field",
      "Old Value",
      "New Value",
      "Actor",
      "Protocol",
    ];
    const rows = (
      filterService
        ? changes.filter((c) => c.service_id === filterService)
        : changes
    ).map((change) => {
      const diff =
        typeof change.diff === "string" ? JSON.parse(change.diff) : change.diff;
      return [
        new Date(change.created_at).toISOString(),
        change.service || change.service_id,
        diff.field || "N/A",
        String(diff.old),
        String(diff.new),
        diff.actor || "Automated Scan",
        diff.detection || "SCAN_PROTOCOL_V1",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monitra-audit-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!authChecked || !clerkUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const handleCheckout = async (customPriceId?: string) => {
    try {
      setCheckoutLoading(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: customPriceId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      setCheckoutLoading(false);
    }
  };

  // Build user profile from Clerk
  const PLANS: Record<string, User["plan_details"]> = {
    plus: {
      name: "Monitra Plus",
      maxServices: 3,
      pollIntervalMs: 30 * 60 * 1000,
      historyDays: 7,
      features: [
        "3 services",
        "30-min polling",
        "7-day history",
        "Email alerts",
      ],
    },
    trial: {
      name: "Pro Trial",
      maxServices: 15,
      pollIntervalMs: 5 * 60 * 1000,
      historyDays: 14,
      features: [
        "15 services",
        "5-min polling",
        "14-day trial",
        "Slack + email + webhook alerts",
      ],
    },
    pro: {
      name: "Pro",
      maxServices: 15,
      pollIntervalMs: 5 * 60 * 1000,
      historyDays: 90,
      features: [
        "15 services",
        "5-min polling",
        "90-day history",
        "Slack + email + webhook alerts",
        "5 team members",
        "Compliance exports",
      ],
    },
    business: {
      name: "Business",
      maxServices: 999,
      pollIntervalMs: 60 * 1000,
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

  const subscriptionStatus = clerkUser.publicMetadata
    ?.stripeSubscriptionStatus as string | undefined;
  const requiresSubscription =
    !subscriptionStatus ||
    (subscriptionStatus !== "active" && subscriptionStatus !== "trialing");

  const userPlanKey = requiresSubscription
    ? "plus"
    : (clerkUser.publicMetadata?.stripePlanKey as string) === "free" ? "plus" : (clerkUser.publicMetadata?.stripePlanKey as string) || "trial";
  const user: User = clerkUser
    ? {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name:
          clerkUser.firstName ||
          clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
          "User",
        plan: userPlanKey,
        plan_details: PLANS[userPlanKey] || PLANS.plus,
      }
    : {
        email: "",
        name: "",
        plan: "plus",
        plan_details: PLANS.plus,
      };

  const linkedServices = services.filter((s) => s.connected);
  const acknowledgedCount = changes.filter((c) => c.acknowledged).length;
  const displayedChanges = filterService
    ? changes.filter((c) => c.service_instance_id === filterService)
    : changes;

  if (requiresSubscription || isVerifying) {
    return (
      <div className="flex h-screen bg-background/50 items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative max-w-md w-full border border-border bg-card p-10 rounded-2xl flex flex-col items-center text-center gap-4 shadow-2xl">
          {isVerifying ? (
            <>
              <RefreshCw className="h-12 w-12 text-primary mb-2 animate-spin" />
              <h2 className="text-3xl font-bold tracking-tight">Verifying</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Synchronizing your secure subscription payload... This will just
                take a brief moment.
              </p>
            </>
          ) : (
            <>
              <Shield className="h-12 w-12 text-primary mb-2" />
              <h2 className="text-3xl font-bold tracking-tight">
                Access Restricted
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                A valid subscription is required to access the Monitra terminal.
                You will not be charged during the 14-day trial period.
              </p>
              <button
                onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID)}
                disabled={checkoutLoading}
                className="w-full relative flex justify-center items-center bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-widest text-sm disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  "Authenticate Profile"
                )}
              </button>
              <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">
                Requires credit card verification via secure Stripe portal.
                <br />
                Automatically billed when trial ends. You can cancel anytime.
              </p>
              <button
                onClick={handleLogout}
                className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Abort Sequence
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <LayoutDashboard
          className={cn(
            "h-5 w-5 flex-shrink-0",
            page === "dashboard"
              ? "text-primary"
              : "text-neutral-700 dark:text-neutral-200",
          )}
        />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <Settings
          className={cn(
            "h-5 w-5 flex-shrink-0",
            page === "settings"
              ? "text-primary"
              : "text-neutral-700 dark:text-neutral-200",
          )}
        />
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-background/50 overflow-hidden p-2 gap-2">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 border border-border bg-card rounded-[1rem]">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            {sidebarOpen ? (
              <a
                href="/"
                className="font-normal flex space-x-2 items-center text-sm py-1 px-2 relative z-20"
              >
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-lg whitespace-pre"
                >
                  Monitra
                </motion.span>
              </a>
            ) : (
              <a
                href="/"
                className="font-normal flex items-center justify-center text-sm py-1 relative z-20 px-1"
              >
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
                    "rounded-[0.5rem] px-2 transition-colors",
                    (idx === 0 && page === "dashboard") ||
                      (idx === 1 && page === "settings")
                      ? "bg-muted text-foreground"
                      : "hover:bg-muted/50",
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
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: (
                  <LogOut className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
              className="rounded-[0.5rem] px-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleLogout();
              }}
            />
            {/* User avatar */}
            <SidebarLink
              link={{
                label: user.name || user.email,
                href: "/profile",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                ),
              }}
              className="px-2 hover:bg-muted/50 transition-colors rounded-[0.5rem]"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto border border-border bg-card rounded-[1rem]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {page === "settings" ? (
            <SettingsPage
              services={services}
              user={user}
              userSettings={userSettings}
              onSave={handleLinkService}
              onSaveSettings={handleSaveUserSettings}
              onCheckout={handleCheckout}
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
                        : "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {pollResult.count > 0 ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                    <span>
                      <strong className="capitalize">
                        {pollResult.service}
                      </strong>{" "}
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-black mr-2">
                        Live API Audit
                      </span>
                      {pollResult.count > 0
                        ? `${pollResult.count} change${pollResult.count > 1 ? "s" : ""} detected`
                        : pollResult.count === -1
                          ? "error polling — check if service keys are authorized"
                          : "no configuration drift detected"}
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
                    Link your SaaS accounts in Settings to start monitoring
                    their configuration for unexpected changes.
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
                        changes.filter(
                          (c) => c.service_instance_id === service.id,
                        ).length
                      }
                      isFiltered={filterService === service.id}
                      onPoll={handlePoll}
                      onViewChanges={handleViewChanges}
                      onUnlink={handleUnlinkService}
                    />
                  ))}
                </ul>
              )}

              {/* Stats & Global Health */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl border border-white/5 bg-black/40 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary/60 mb-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Linked_Nodes
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">
                      {linkedServices.length}
                    </span>
                    <span className="text-[10px] text-muted-foreground opacity-50 uppercase font-mono">
                      /{" "}
                      {user.plan_details.maxServices === 999
                        ? "MAX"
                        : user.plan_details.maxServices}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary/60 mb-2">
                    <Bell className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Active_Alerts
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">
                      {changes.filter((c) => !c.acknowledged).length}
                    </span>
                    <span className="text-[10px] text-amber-500 uppercase font-mono tracking-tighter">
                      UNVERIFIED
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary/60 mb-2">
                    <Gauge className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Drift_Velocity
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">
                      {changes.length > 0
                        ? (changes.length / 2).toFixed(1)
                        : "0.0"}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">
                      sigs/hr
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                    <Zap className="h-16 w-16 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 text-primary mb-2 relative z-10">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Blast_Radius
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-3xl font-black text-primary">
                      {changes.length > 0
                        ? (changes.length * 1.5 + 4).toFixed(1)
                        : "0"}
                      %
                    </span>
                    <span className="text-[10px] text-primary/60 uppercase font-mono tracking-tighter">
                      Impact Index
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Scanning Visualizer (Simulated Trend) */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-6 mb-12 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                      Global_Scan_Telemetry
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Real-time signal frequency across all monitored
                      infrastructure
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-primary uppercase">
                        Node_Active
                      </span>
                    </div>
                    <div className="text-muted-foreground opacity-30">|</div>
                    <div className="text-muted-foreground">LATENCY: 42ms</div>
                  </div>
                </div>

                <div className="h-16 flex items-end gap-1 px-2">
                  {[...Array(40)].map((_, i) => {
                    const height =
                      Math.floor(Math.random() * (i > 30 ? 60 : 30)) + 10;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 rounded-t-sm transition-all duration-1000",
                          i > 30 ? "bg-primary" : "bg-primary/20",
                        )}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Recent Changes Header */}
              <div id="changes" className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                      <HistoryIcon className="h-5 w-5 text-primary" />
                      {filterService
                        ? `${services.find((s) => s.id === filterService)?.name || filterService} Signals`
                        : "Audit Transmission Log"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      Real-time configuration drift signals detected by
                      monitoring nodes
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportCSV}
                      disabled={displayedChanges.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Download className="h-3 w-3" /> Export CSV
                    </button>
                    {filterService && (
                      <button
                        onClick={() => setFilterService(null)}
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Reset Filter ×
                      </button>
                    )}
                  </div>
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
                  <div className="flex flex-col gap-4">
                    {displayedChanges.map((change) => (
                      <ChangeRow
                        key={change.id}
                        change={change}
                        onAcknowledge={handleAcknowledgeChange}
                      />
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
          return await handleLinkService(serviceId, apiKey);
        }}
      />
    </div>
  );
}
