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
  memo,
  useRef,
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
  FolderKanban,
  PanelLeftClose,
  PanelLeft,
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
  project_id?: string;
}

interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
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
    maxTeamMembers: number;
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
  onClick,
  projects = [],
}: {
  service: Service;
  status: "idle" | "polling" | "connected";
  changesCount: number;
  onPoll: (id: string) => void;
  onViewChanges: (id: string) => void;
  onUnlink: (id: string) => void;
  isFiltered: boolean;
  onClick?: () => void;
  projects?: Project[];
}) {
  const owner = service.owner_id || "System_Node";
  const project = projects.find((p) => p.id === service.project_id);

  return (
    <li className="min-h-[14rem] list-none relative">
      <div
        onClick={onClick}
        className={cn(
          "group relative h-full rounded-2xl border border-white/5 bg-black/40 p-6 transition-all hover:border-primary/40 shadow-xl overflow-hidden cursor-pointer",
          isFiltered && "ring-1 ring-primary",
        )}
      >
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={1.5}
        />
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
            {project && (
                <div className="mt-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[7px] font-bold text-primary uppercase tracking-tighter">
                    {project.name}
                </div>
            )}
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

interface ServiceIntegrationCardProps {
  service: Service;
  initialKey: string;
  onSave: (serviceId: string, apiKey: string) => Promise<string | null>;
  disabled?: boolean;
}

const ServiceIntegrationCard = memo(({ service, initialKey, onSave, disabled }: ServiceIntegrationCardProps) => {
  const [localKey, setLocalKey] = useState(initialKey);
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    setLocalKey(initialKey);
  }, [initialKey]);

  const catalogItem = SERVICE_CATALOG.find(s => s.id === service.id);

  const handleLink = async () => {
    if (disabled && !localKey) {
      alert("Plan Limit Reached: Please upgrade your subscription to link more nodes.");
      return;
    }
    setIsLinking(true);
    const error = await onSave(service.id, localKey);
    setIsLinking(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert(error);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center text-primary">
            {catalogItem?.icon || <Activity className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-tight">{service.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {service.connected ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                  <CheckCircle2 className="h-2.5 w-2.5" /> LINKED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">
                  <AlertTriangle className="h-2.5 w-2.5" /> DISCONNECTED
                </span>
              )}
            </div>
          </div>
        </div>
        {catalogItem?.docsUrl && (
          <a
            href={catalogItem.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
          >
            DOCS <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 group">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type={visible ? "text" : "password"}
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder={`Enter authorized token for ${service.name}...`}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-9 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={handleLink}
          disabled={isLinking || (disabled && !localKey)}
          className={cn(
            "rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
            saved 
              ? "bg-emerald-500 text-black" 
              : disabled && !localKey
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
          )}
        >
          {saved ? "VERIFIED" : disabled && !localKey ? "LIMIT REACHED" : "LINK NODE"}
        </button>
        {localKey && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Confirm disconnect sequence for ${service.name}?`)) {
                setLocalKey("");
                onSave(service.id, "");
              }
            }}
            className="rounded-lg border border-border px-3 py-2 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
});
ServiceIntegrationCard.displayName = "ServiceIntegrationCard";

const PLANS_LIST = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    desc: "Personal visibility and monitoring",
    priceId: undefined,
    features: [
      "1 service",
      "1-hour polling",
      "3-day history",
      "No alerts",
      "1 team member (owner)",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    price: "$4.99",
    period: "/mo",
    desc: "Standard visibility for growing projects",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID,
    features: [
      "3 services",
      "30-min polling",
      "7-day history",
      "Email alerts",
      "Visual diff engine",
      "1 team member (owner)",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$29",
    period: "/mo",
    desc: "Advanced operations for scaling teams",
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      "15 services",
      "5-min polling",
      "90-day history",
      "Slack + email + Discord alerts",
      "5 team members",
      "Compliance exports",
      "Priority audit queue",
    ],
  },
  {
    key: "business",
    name: "Business",
    price: "$79",
    period: "/mo",
    desc: "Absolute authority for compliance-heavy orgs",
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    features: [
      "Unlimited services",
      "1-min polling",
      "1-year history",
      "Total dispatch authority",
      "Unlimited team members",
      "SOC2 / HIPAA reports",
      "Priority support",
      "Dedicated engineer",
    ],
  },
];


const ProjectsPage = memo(({
    services,
    projects,
    onAddProject,
    onDeleteProject,
    onAssignProject,
  }: {
    services: Service[];
    projects: Project[];
    onAddProject: (name: string) => void;
    onDeleteProject: (id: string) => void;
    onAssignProject: (serviceId: string, projectId: string | null) => void;
  }) => {
    const [newProjectName, setNewProjectName] = useState("");
  
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-primary uppercase tracking-tighter">Project Clusters</h1>
          <p className="text-muted-foreground">
            Group your monitors into logical clusters for better command and control
          </p>
        </div>
  
        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
          <div className="relative flex-1">
            <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter cluster name... (e.g. Production Mesh)"
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAddProject(newProjectName)}
            />
          </div>
          <InteractiveHoverButton
            text="Launch Cluster"
            onClick={() => {
              onAddProject(newProjectName);
              setNewProjectName("");
            }}
            className="h-11"
          />
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="group relative rounded-2xl border border-white/5 bg-black/40 p-6 hover:border-primary/30 transition-all shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{project.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">
                       {services.filter(s => s.project_id === project.id).length} Monitors Assigned
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
  
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black opacity-40">Assign Resource</p>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => {
                    const isAssigned = service.project_id === project.id;
                    const isElsewhere = service.project_id && service.project_id !== project.id;
                    
                    if (isElsewhere) return null;
  
                    return (
                      <button
                        key={service.id}
                        onClick={() => onAssignProject(service.id, isAssigned ? null : project.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                          isAssigned 
                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" 
                            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                        )}
                      >
                        {service.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  });

const SettingsPage = memo(({
  services,
  user,
  userSettings,
  hasUsedTrial,
  onSave,
  onSaveSettings,
  onCheckout,
  onCancelSubscription,
  defaultTab = "Billing & Plan",
}: {
  services: Service[];
  user: User;
  userSettings: {
    slack_webhook_url: string;
    discord_webhook_url: string;
    outbound_webhook_url: string;
    email_notifications_enabled: boolean;
    appearance: "default" | "modern";
  };
  hasUsedTrial: boolean;
  onSave: (serviceId: string, apiKey: string) => Promise<string | null>;
  onSaveSettings: (settings: {
    slack_webhook_url: string;
    discord_webhook_url: string;
    outbound_webhook_url: string;
    email_notifications_enabled: boolean;
    appearance: "default" | "modern";
  }) => void;
  onCheckout: (priceId?: string) => void;
  onCancelSubscription: () => void;
  defaultTab?: string;
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [localSettings, setLocalSettings] = useState(userSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    setLocalSettings(userSettings);
  }, [userSettings]);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch (e) {
      console.error("Failed to fetch team members");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteEmail("");
        fetchTeamMembers();
      } else {
        alert(data.error || "Failed to invite member");
      }
    } catch (e) {
      alert("Failed to invite member");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      const res = await fetch(`/api/teams?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTeamMembers();
      }
    } catch (e) {
      alert("Failed to remove member");
    }
  };


  const handleCancelSubscription = async () => {
    await onCancelSubscription();
    setShowCancelConfirm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-primary uppercase tracking-tighter">
            {activeTab === "Billing & Plan" ? "Subscription Command" : 
             activeTab === "Linked Services" ? "Integration Hub" :
             activeTab === "Teams" ? "Personnel Mesh" : "Telemetry Alerts"}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "Billing & Plan" ? "Manage your operational tier and billing authority" : 
             activeTab === "Linked Services" ? "Authorize and sync your SaaS configuration nodes" :
             activeTab === "Teams" ? "Calibrate access for your technical staff" : "Configure drift response and notification signals"}
          </p>
        </div>
      </div>

      {activeTab === "Billing & Plan" && user && (
        <div className="mb-10 fade-in-0 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 uppercase tracking-tight">
            <CreditCard className="h-5 w-5 text-primary" /> Billing & Plan
          </h2>

          {/* Current plan card */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold uppercase tracking-widest text-xs">
                    {user.plan_details.name} Plan
                  </span>
                  {user.plan === "trial" && (
                    <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px] font-black uppercase">
                      14-day trial
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">
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
                  className="inline-flex items-center gap-1 rounded-md bg-muted/50 border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Plan comparison grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {PLANS_LIST.map((plan) => {
              const isCurrent = user.plan === plan.key || (user.plan === "trial" && plan.key === "pro");
              const isFree = plan.key === "free";
              const isPlus = plan.key === "plus";

              const currentIndex = PLANS_LIST.findIndex(p => p.key === user.plan || (user.plan === "trial" && p.key === "pro"));
              const planIndex = PLANS_LIST.findIndex(p => p.key === plan.key);
              const isUpgrade = planIndex > currentIndex;
              
              return (
                <div
                  key={plan.key}
                  className={cn(
                    "group relative flex flex-col rounded-[2.5rem] border p-8 transition-all overflow-hidden",
                    isCurrent
                      ? "border-primary/50 bg-primary/[0.03] shadow-[0_0_40px_-15px_rgba(var(--primary-rgb),0.3)]"
                      : "border-white/5 bg-black/20 hover:border-white/20",
                    plan.popular && !isCurrent && "border-primary/30",
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 p-5">
                      <div className="bg-primary text-primary-foreground text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                        Recommended
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className={cn(
                      "text-lg font-black uppercase tracking-widest mb-1",
                      isCurrent ? "text-primary" : "text-foreground"
                    )}>
                      {plan.name}
                    </h3>
                    <p className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest opacity-60">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="mb-10">
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "text-4xl font-black",
                        isCurrent ? "text-primary" : "text-foreground"
                      )}>
                        {plan.price}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground uppercase opacity-40">
                        {plan.period}
                      </span>
                    </div>
                    {!isFree && !isPlus && !isCurrent && (
                      <p className="text-[10px] font-mono text-amber-500 mt-2 uppercase tracking-widest font-bold flex items-center gap-2">
                        <Zap className="h-3 w-3 fill-amber-500" />
                        14-Day Trial Available
                      </p>
                    )}
                    {isFree && (
                      <p className="text-[10px] font-mono text-primary mt-2 uppercase tracking-widest font-bold">Standard Clearance</p>
                    )}
                    {isPlus && (
                      <p className="text-[10px] font-mono text-primary mt-2 uppercase tracking-widest font-bold">Value Tier</p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs font-mono">
                        <CheckCircle2 className={cn(
                          "h-4 w-4 shrink-0",
                          isCurrent ? "text-primary" : "text-emerald-500/50"
                        )} />
                        <span className={isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-white/5">
                      <div className="text-center rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-primary">
                        Active Subscription
                      </div>
                      {!isFree && (
                        <button
                          onClick={() => setShowCancelConfirm(true)}
                          className="w-full rounded-2xl border border-destructive/20 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all opacity-60 hover:opacity-100"
                        >
                          Terminate Subscription
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-auto pt-6 border-t border-white/5">
                      <button
                        className={cn(
                          "w-full rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest transition-all font-mono",
                          plan.popular 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" 
                            : "bg-white/5 text-foreground hover:bg-white/10 border border-white/10"
                        )}
                        onClick={() => {
                          if (isCurrent) {
                            alert(`You are already on the ${plan.name} plan.`);
                          } else if (isFree) {
                            setShowCancelConfirm(true);
                          } else {
                            onCheckout(plan.priceId);
                          }
                        }}
                      >
                        {isCurrent ? "Active Subscription" :
                         isFree ? "Return to Free" : 
                         (plan.key === "pro" || plan.key === "business") && user.plan === "free" && !hasUsedTrial
                          ? "Start 14 day trial"
                          : isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {activeTab === "Linked Services" && (
        <div className="fade-in-0 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-tight">
            <Shield className="h-5 w-5 text-primary" /> Service Configuration
          </h2>

          {/* Plan limits banner */}
          {user && (
            <div className="rounded-xl border border-border bg-muted/30 p-5 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Active_Nodes</span>
                    <span className="text-foreground text-sm">
                      {services.filter((s) => s.connected).length} / {user.plan_details.maxServices === 999 ? "MAX" : user.plan_details.maxServices}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Poll_Interval</span>
                    <span className="text-foreground text-sm">
                      {user.plan_details.pollIntervalMs / 60000}m
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Log_Retention</span>
                    <span className="text-foreground text-sm">
                      {user.plan_details.historyDays} Days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {useMemo(() => services.map((service) => {
              const connectedCount = services.filter(s => s.connected).length;
              const isOverLimit = user && !service.connected && connectedCount >= user.plan_details.maxServices;
              return (
                <ServiceIntegrationCard
                  key={service.id}
                  service={service}
                  initialKey={service.api_key || ""}
                  onSave={onSave}
                  disabled={!!isOverLimit}
                />
              );
            }), [services, user, onSave])}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-sm w-full bg-card border border-border p-8 rounded-3xl shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto mb-6">
                <Trash2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Downgrade to Free?</h3>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                You will be immediately downgraded to the **Free plan**. This will limit your monitoring capacity to 1 service and disable advanced alerts.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-colors"
                >
                  KEEP PLAN
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm hover:bg-destructive/90 transition-colors"
                >
                  YES, TERMINATE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === "Teams" && user && (
        <div className="mb-10 fade-in-0 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 uppercase tracking-tight">
            <Users className="h-5 w-5 text-primary" /> Team Management
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-primary mb-4">
                  INVITE_COLLEAGUE
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Add satellites to your command center. They will receive an automated dispatch to join this operation.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">Email Address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      disabled={user.plan_details.maxTeamMembers <= 1}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading || !inviteEmail || user.plan_details.maxTeamMembers <= 1}
                    className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviteLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    SEND_INVITE
                  </button>
                  {user.plan_details.maxTeamMembers <= 1 && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] font-mono text-amber-500/80">
                      PRO_REQUIRED: Single-user clearance detected. Upgrade to scale your team.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                  CAPACITY_STATUS
                </h3>
                <div className="flex items-end justify-between mb-2">
                   <span className="text-2xl font-black">{teamMembers.length + 1}</span>
                   <span className="text-xs font-mono text-muted-foreground">/ {user.plan_details.maxTeamMembers === 999 ? "∞" : user.plan_details.maxTeamMembers} seats</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min(100, ((teamMembers.length + 1) / user.plan_details.maxTeamMembers) * 100)}%` }}
                   />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Satellite</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorization</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{user.name} (You)</div>
                            <div className="text-[10px] font-mono text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] uppercase">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                          Owner
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] font-mono text-muted-foreground">Permanent</span>
                      </td>
                    </tr>
                    {teamMembers.map((member: any) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                              {member.user_email.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold">Satellite Candidate</div>
                              <div className="text-[10px] font-mono text-muted-foreground">{member.user_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] uppercase">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {teamMembers.length === 0 && (
                      <tr className="border-t-0">
                        <td colSpan={3} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <Users className="h-8 w-8 opacity-20" />
                            <p className="text-xs font-mono uppercase tracking-widest opacity-60">No additional satellites detected</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
                onSaveSettings(localSettings as any);
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
                                (user.plan === "free" || user.plan === "plus")
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
                {(user.plan === "free" || user.plan === "plus") && (
                  <span className="text-[10px] font-black border border-border px-2 py-1 rounded bg-muted/30">
                    PRO_CLEARANCE
                  </span>
                )}
              </div>
              <input
                type="text"
                value={localSettings.slack_webhook_url}
                disabled={user.plan === "free" || user.plan === "plus"}
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
                (user.plan === "free" || user.plan === "plus")
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
                {(user.plan === "free" || user.plan === "plus") && (
                  <span className="text-[10px] font-black border border-border px-2 py-1 rounded bg-muted/30">
                    PRO_CLEARANCE
                  </span>
                )}
              </div>
              <input
                type="text"
                value={localSettings.discord_webhook_url}
                disabled={user.plan === "free" || user.plan === "plus"}
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
                (user.plan === "free" || user.plan === "plus")
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
                {(user.plan === "free" || user.plan === "plus") && (
                  <span className="text-[10px] font-black border border-border px-2 py-1 rounded bg-muted/30">
                    PRO_CLEARANCE
                  </span>
                )}
              </div>
              <input
                type="text"
                value={localSettings.outbound_webhook_url}
                disabled={user.plan === "free" || user.plan === "plus"}
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
                    PLUS_REQUIRED
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

      {activeTab === "Appearance" && (
        <div className="fade-in-0 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> Appearance Configuration
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Calibrate the visual geometry and surfacing of your command center
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Default Monitra Card */}
            <button
               onClick={() => {
                 const newSettings = { ...localSettings, appearance: "default" as const };
                 setLocalSettings(newSettings);
                 onSaveSettings(newSettings);
               }}
               className={cn(
                 "group relative flex flex-col rounded-2xl border p-6 transition-all overflow-hidden text-left",
                 localSettings.appearance === "default"
                   ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                   : "border-white/5 bg-black/20 hover:border-white/10"
               )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                {localSettings.appearance === "default" && (
                   <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                )}
              </div>
              <h3 className="font-black text-sm uppercase tracking-widest mb-1">Default Monitra</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-mono leading-relaxed">The original Monitra interface with standard geometric curves and neutral surfacing.</p>
              
              <div className="mt-8 flex gap-2">
                 <div className="w-8 h-8 bg-white/10" />
                 <div className="w-16 h-8 bg-white/5" />
              </div>
            </button>

            {/* Modern Monitra Card */}
            <button
               onClick={() => {
                 const newSettings = { ...localSettings, appearance: "modern" as const };
                 setLocalSettings(newSettings);
                 onSaveSettings(newSettings);
               }}
               className={cn(
                 "group relative flex flex-col rounded-[2.5rem] border p-6 transition-all overflow-hidden text-left",
                 localSettings.appearance === "modern"
                   ? "border-primary bg-primary/5 shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)]"
                   : "border-white/5 bg-black/20 hover:border-white/10"
               )}
            >
              {/* Glow effect for modern */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                  <Zap className="h-6 w-6" />
                </div>
                {localSettings.appearance === "modern" && (
                   <span className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">Selected</span>
                )}
              </div>
              <h3 className="font-black text-sm uppercase tracking-widest mb-1">Modern Monitra</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-mono leading-relaxed">Fluid geometry with extreme curvature, deep glassmorphism, and localized luminescence.</p>
              
              <div className="mt-8 flex gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl" />
                 <div className="w-20 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/5" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
SettingsPage.displayName = "SettingsPage";

// ── Main Dashboard ────────────────────────────────────────────
// --- Plan & User Logic ---
const PLANS: Record<string, User["plan_details"]> = {
  free: {
    name: "Free",
    maxServices: 1,
    pollIntervalMs: 60 * 60 * 1000,
    historyDays: 3,
    maxTeamMembers: 1,
    features: [
      "1 service",
      "1-hour polling",
      "3-day history",
      "No alerts",
    ],
  },
  plus: {
    name: "Plus",
    maxServices: 3,
    pollIntervalMs: 30 * 60 * 1000,
    historyDays: 7,
    maxTeamMembers: 1,
    features: [
      "3 services",
      "30-min polling",
      "7-day history",
      "Email alerts",
      "Visual diff engine",
    ],
  },
  trial: {
    name: "Pro Trial",
    maxServices: 15,
    pollIntervalMs: 5 * 60 * 1000,
    historyDays: 14,
    maxTeamMembers: 5,
    features: [
      "15 services",
      "5-min polling",
      "14-day trial",
      "Slack + email + Discord alerts",
    ],
  },
  pro: {
    name: "Pro",
    maxServices: 15,
    pollIntervalMs: 5 * 60 * 1000,
    historyDays: 90,
    maxTeamMembers: 5,
    features: [
      "15 services",
      "5-min polling",
      "90-day history",
      "Slack + email + Discord alerts",
      "5 team members",
      "Compliance exports",
    ],
  },
  business: {
    name: "Business",
    maxServices: 999,
    pollIntervalMs: 60 * 1000,
    historyDays: 365,
    maxTeamMembers: 999,
    features: [
      "Unlimited services",
      "1-min polling",
      "1-year history",
      "Total dispatch authority",
      "Unlimited team members",
      "SOC2 / HIPAA reports",
      "Priority support",
    ],
  },
};

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  const userPlanKey = (clerkUser?.publicMetadata?.stripePlanKey as string) || "free";
  const user: User = useMemo(() => {
    if (!clerkUser) {
      return {
        email: "",
        name: "",
        plan: "free",
        plan_details: PLANS.free,
      };
    }
    return {
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      name:
        clerkUser.firstName ||
        clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        "User",
      plan: userPlanKey,
      plan_details: PLANS[userPlanKey] || PLANS.free,
    };
  }, [clerkUser, userPlanKey]);

  const [page, setPage] = useState<"dashboard" | "projects" | "teams" | "billing" | "integrations" | "notifications" | "appearance">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const deferredServices = useDeferredValue(services);
  
  // Decouple services from callbacks to kill lag
  const servicesRef = useRef(services);
  useEffect(() => { servicesRef.current = services; }, [services]);

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
    appearance: "default" | "modern";
  }>({
    slack_webhook_url: "",
    discord_webhook_url: "",
    outbound_webhook_url: "",
    email_notifications_enabled: false,
    appearance: "modern",
  });
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanAllResults, setScanAllResults] = useState<any[] | null>(null);

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

  useEffect(() => {
    if (filterService) {
      document.getElementById("changes")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filterService]);

  const fetchServices = useCallback(() => {
    fetch(`/api/services?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
            return data;
          });
          const states: Record<string, "idle" | "polling" | "connected"> = {};
          data.forEach((s: Service) => {
            states[s.id] = s.connected
              ? s.last_polled_at
                ? "connected"
                : "idle"
              : "idle";
          });
          setPollingStates((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(states)) return prev;
            return states;
          });
        }
      })
      .catch(() => {});
  }, []);

  const fetchProjects = useCallback(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch((err) => console.error("Fetch projects error:", err));
  }, []);

  useEffect(() => {
    fetchServices();
    fetchProjects();
  }, [fetchServices, fetchProjects]);

  const fetchChanges = useCallback(() => {
    fetch(`/api/changes?limit=20&t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const newData = Array.isArray(data) ? data : [];
        setChanges((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
          return newData;
        });
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
          const newSettings = {
            slack_webhook_url: data.slack_webhook_url || "",
            discord_webhook_url: data.discord_webhook_url || "",
            outbound_webhook_url: data.outbound_webhook_url || "",
            email_notifications_enabled: data.email_notifications_enabled || false,
            appearance: data.appearance || ("modern" as const),
          };
          setUserSettings(newSettings as any);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    // fetchServices(); // Removed as it's now in a separate useEffect with fetchProjects
    fetchChanges();
    fetchUserSettings();
  }, [authChecked, fetchChanges, fetchUserSettings]);

  const handlePoll = useCallback(async (serviceId: string) => {
    setPollingStates((prev) => ({ ...prev, [serviceId]: "polling" }));

    try {
      const res = await fetch(`/api/services/${serviceId}/poll`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
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
  }, [fetchServices, fetchChanges]);

  const handleViewChanges = useCallback((serviceId: string) => {
    setFilterService((prev) => (prev === serviceId ? null : serviceId));
  }, []);

  // --- Auto-Polling Logic ---
  const planInterval = user.plan_details.pollIntervalMs;
  useEffect(() => {
    if (!authChecked || page !== "dashboard" || servicesRef.current.length === 0) return;

    const intervalId = setInterval(() => {
      servicesRef.current.forEach((service: Service) => {
        if (!service.connected) return;
        
        const lastPolled = service.last_polled_at ? new Date(service.last_polled_at).getTime() : 0;
        const now = Date.now();

        if (now - lastPolled >= planInterval) {
          console.log(`[AUTO_POLL] Trigerring automated audit for node: ${service.name}`);
          handlePoll(service.id);
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [authChecked, page, planInterval, handlePoll]);

  const handleLinkService = useCallback(async (serviceId: string, apiKey: string) => {
    // Enforcement: Check if user is trying to LINK a new service
    const currentServices = servicesRef.current;
    const connectedCount = currentServices.filter((s: Service) => s.connected).length;
    const isNewLink = apiKey && !currentServices.find((s: Service) => s.id === serviceId)?.connected;

    if (isNewLink && connectedCount >= user.plan_details.maxServices) {
      return `Sequence Aborted: Your ${user.plan_details.name} plan is limited to ${user.plan_details.maxServices} nodes. Please upgrade to expand your monitoring mesh.`;
    }

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
  }, [fetchServices, user.plan_details]);

  const handleSaveUserSettings = useCallback(async (settings: {
    slack_webhook_url: string;
    discord_webhook_url: string;
    outbound_webhook_url: string;
    email_notifications_enabled: boolean;
    appearance: "default" | "modern";
  }) => {
    try {
      await fetch(`/api/user/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setUserSettings(settings as any);
    } catch {
      // silent fail
    }
  }, []);

  const handleScanAll = async () => {
    setIsScanningAll(true);
    setScanAllResults(null);
    try {
      const res = await fetch("/api/scan-all", { method: "POST" });
      const data = await res.json();
      setScanAllResults(data);
      fetchChanges();
      fetchServices();
      // Auto-hide results after 10s if no changes were found
      if (data.every((r: any) => r.changes === 0 && r.status === "success")) {
        setTimeout(() => setScanAllResults(null), 10000);
      }
    } catch {
      // silent fail
    } finally {
      setIsScanningAll(false);
    }
  };

  const handleAddProject = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        fetchProjects();
      } else {
        alert("Failed to add project.");
      }
    } catch (e) {
      alert("Failed to add project.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project cluster? All assigned monitors will be unassigned.")) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProjects();
        fetchServices(); 
      } else {
        alert("Failed to delete project.");
      }
    } catch (e) {
      alert("Failed to delete project.");
    }
  };

  const handleAssignProject = async (serviceId: string, projectId: string | null) => {
    try {
      const res = await fetch(`/api/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, project_id: projectId }),
      });
      if (res.ok) {
        fetchServices();
      } else {
        alert("Failed to assign project.");
      }
    } catch (e) {
      alert("Failed to assign project.");
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
        ? changes.filter((c) => c.service_instance_id === filterService)
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

  const handleCheckout = useCallback(async (customPriceId?: string) => {
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
  }, []);

  const handleCancelSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error || "Failed to cancel subscription");
      }
    } catch (e) {
      alert("Failed to cancel subscription.");
    }
  };

  if (!authChecked || !clerkUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const subscriptionStatus = clerkUser?.publicMetadata
    ?.stripeSubscriptionStatus as string | undefined;
  const requiresSubscription =
    !subscriptionStatus ||
    (subscriptionStatus !== "active" && subscriptionStatus !== "trialing");

  const linkedServices = services.filter((s) => s.connected);
  const acknowledgedCount = changes.filter((c) => c.acknowledged).length;
  const displayedChanges = filterService
    ? changes.filter((c) => c.service_instance_id === filterService)
    : changes;

  const isFreePlan = userPlanKey === "free";

  if ((requiresSubscription && !isFreePlan) || isVerifying) {
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
      label: "Projects",
      href: "#",
      icon: (
        <FolderKanban
          className={cn(
            "h-5 w-5 flex-shrink-0",
            page === "projects"
              ? "text-primary"
              : "text-neutral-700 dark:text-neutral-200",
          )}
        />
      ),
    },
    {
      label: "Teams",
      href: "#",
      icon: (
        <Users
          className={cn(
            "h-5 w-5 flex-shrink-0",
            page === "teams"
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
            page === "billing" || page === "integrations" || page === "notifications" || page === "appearance"
              ? "text-primary"
              : "text-neutral-700 dark:text-neutral-200",
          )}
        />
      ),
      subLinks: [
        {
          label: "Appearance",
          href: "#",
          icon: (
            <Palette
              className={cn(
                "h-5 w-5 flex-shrink-0",
                page === "appearance"
                  ? "text-primary"
                  : "text-neutral-700 dark:text-neutral-200",
              )}
            />
          ),
        },
        {
          label: "Billing",
          href: "#",
          icon: (
            <CreditCard
              className={cn(
                "h-5 w-5 flex-shrink-0",
                page === "billing"
                  ? "text-primary"
                  : "text-neutral-700 dark:text-neutral-200",
              )}
            />
          ),
        },
        {
          label: "Integrations",
          href: "#",
          icon: (
            <Shield
              className={cn(
                "h-5 w-5 flex-shrink-0",
                page === "integrations"
                  ? "text-primary"
                  : "text-neutral-700 dark:text-neutral-200",
              )}
            />
          ),
        },
        {
          label: "Notifications",
          href: "#",
          icon: (
            <Bell
              className={cn(
                "h-5 w-5 flex-shrink-0",
                page === "notifications"
                  ? "text-primary"
                  : "text-neutral-700 dark:text-neutral-200",
              )}
            />
          ),
        },
      ],
    },
  ];

  const isModern = userSettings.appearance === "modern";

  return (
    <div className={cn(
      "flex h-screen overflow-hidden p-2 gap-2",
      isModern ? "theme-modern" : "theme-default",
      "bg-background/50"
    )}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Modern Theme Geometry */
        .theme-modern .rounded-xl { border-radius: 2rem !important; }
        .theme-modern .rounded-2xl { border-radius: 2.5rem !important; }
        .theme-modern .rounded-3xl { border-radius: 3rem !important; }
        .theme-modern .rounded-[1rem] { border-radius: 2rem !important; }
        .theme-modern .rounded-[1.5rem] { border-radius: 2.5rem !important; }
        .theme-modern .sidebar-link, .theme-modern .rounded-lg { border-radius: 1.5rem !important; }
        .theme-modern .backdrop-blur-xl { backdrop-blur: 40px !important; }
        .theme-zinc { --primary: 142.1 70.6% 45.3%; --primary-rgb: 34, 197, 94; }
        .theme-midnight { --primary: 262.1 83.3% 57.8%; --primary-rgb: 147, 51, 234; --background: 222 47% 4%; }
        .theme-neon { --primary: 316.6 74.2% 47.3%; --primary-rgb: 219, 39, 119; --background: 0 0% 0%; }

      ` }} />
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 border border-white/5 bg-black/60 backdrop-blur-xl rounded-[1.5rem] shadow-2xl shadow-primary/5 mr-2">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo & Toggle Section */}
            <div className="px-2 mb-8 mt-4 flex items-center justify-between">
                {sidebarOpen ? (
                  <div className="flex items-center justify-between w-full pr-1">
                    <a
                      href="/"
                      className="font-normal flex space-x-3 items-center text-sm py-2 px-3 relative z-20 rounded-xl bg-white/5 border border-white/10 shadow-lg shadow-primary/10 transition-transform"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                          <img src="/logo.png" alt="Monitra Logo" className="h-5 w-5 object-contain" />
                      </div>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-black text-xl whitespace-pre tracking-tighter text-foreground"
                      >
                        MONITRA
                      </motion.span>
                    </a>
                    <button 
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all ml-2"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <a
                      href="/"
                      className="font-normal flex items-center justify-center text-sm py-2 relative z-20 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all w-12 h-12"
                    >
                      <img src="/logo.png" alt="Monitra Logo" className="h-6 w-6 object-contain flex-shrink-0" />
                    </a>
                    <button 
                      onClick={() => setSidebarOpen(true)}
                      className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </button>
                  </div>
                )}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex flex-col gap-1.5 px-2">
              {sidebarLinks.map((link, idx) => {
                const isParentActive = (link.label === "Dashboard" && page === "dashboard") ||
                                     (link.label === "Projects" && page === "projects") ||
                                     (link.label === "Teams" && page === "teams");
                
                const isSettingsActive = link.label === "Settings" && (page === "billing" || page === "integrations" || page === "notifications" || page === "appearance");
                const isActive = isParentActive || isSettingsActive;

                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="relative group">
                      {isActive && !isSettingsActive && (
                          <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md -z-10" />
                      )}
                      <SidebarLink
                        link={link}
                        className={cn(
                          "rounded-xl px-3 py-2.5 transition-all duration-300 relative overflow-hidden border border-transparent",
                          isActive
                            ? "bg-white/5 border-white/10 text-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                            : "hover:bg-white/[0.02] text-muted-foreground hover:text-foreground hover:border-white/5",
                        )}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          if (link.label === "Dashboard") setPage("dashboard");
                          if (link.label === "Projects") setPage("projects");
                          if (link.label === "Teams") setPage("teams");
                          if (link.label === "Settings") setPage("billing");
                        }}
                      />
                    </div>
                    {/* Render Sublinks for Settings when open */}
                    {link.subLinks && sidebarOpen && (
                        <div className="flex flex-col gap-1 ml-4 mt-1 border-l border-white/5 pl-2">
                            {link.subLinks.map((sub, sidx) => {
                                const isSubActive = (sub.label === "Billing" && page === "billing") ||
                                                  (sub.label === "Integrations" && page === "integrations") ||
                                                  (sub.label === "Notifications" && page === "notifications") ||
                                                  (sub.label === "Appearance" && page === "appearance");
                                return (
                                    <SidebarLink
                                        key={sidx}
                                        link={sub}
                                        className={cn(
                                            "rounded-lg px-3 py-1.5 text-xs transition-all border border-transparent",
                                            isSubActive 
                                                ? "bg-primary/20 text-primary border-primary/20" 
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                        )}
                                        onClick={(e: React.MouseEvent) => {
                                            e.preventDefault();
                                            if (sub.label === "Billing") setPage("billing");
                                            if (sub.label === "Integrations") setPage("integrations");
                                            if (sub.label === "Notifications") setPage("notifications");
                                            if (sub.label === "Appearance") setPage("appearance");
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col gap-2 p-2 border-t border-white/5 pt-6 mt-auto">
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: (
                  <LogOut className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-destructive transition-colors" />
                ),
              }}
              className="rounded-xl px-3 py-2.5 transition-all text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20"
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
                  <div className="h-8 w-8 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                ),
              }}
              className="px-3 py-2.5 hover:bg-white/5 transition-all rounded-xl border border-transparent hover:border-white/10"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto border border-border bg-card rounded-[1rem]">
        <div className="max-w-7xl mx-auto px-6 py-8">
           {page === "projects" ? (
            <ProjectsPage
                services={deferredServices}
                projects={projects}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
                onAssignProject={handleAssignProject}
            />
           ) : page === "teams" ? (
            <SettingsPage
              services={deferredServices}
              user={user}
              userSettings={userSettings}
              hasUsedTrial={clerkUser?.publicMetadata?.hasUsedTrial === true}
              onSave={handleLinkService}
              onSaveSettings={handleSaveUserSettings}
              onCheckout={handleCheckout}
              onCancelSubscription={handleCancelSubscription}
              defaultTab="Teams"
            />
           ) : page === "billing" || page === "integrations" || page === "notifications" || page === "appearance" ? (
            <SettingsPage
              services={deferredServices}
              user={user}
              userSettings={userSettings}
              hasUsedTrial={clerkUser?.publicMetadata?.hasUsedTrial === true}
              onSave={handleLinkService}
              onSaveSettings={handleSaveUserSettings}
              onCheckout={handleCheckout}
              onCancelSubscription={handleCancelSubscription}
              defaultTab={
                  page === "billing" ? "Billing & Plan" :
                  page === "integrations" ? "Linked Services" :
                  page === "appearance" ? "Appearance" :
                  "Notifications"
              }
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

              {/* Capacity Status */}
              {user && services.filter(s => s.connected).length > user.plan_details.maxServices && (
                <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 px-4 py-3 text-sm flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    <strong className="text-amber-500">Node Capacity Warning:</strong> You are currently monitoring {services.filter(s => s.connected).length} services, which exceeds your {user.plan_details.name} plan limit ({user.plan_details.maxServices}). Please upgrade or unlink nodes to restore full automation.
                  </span>
                </div>
              )}
              {/* Scan All Results */}
              {scanAllResults && (
                <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary animate-pulse" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-primary">Global Audit Report</h3>
                    </div>
                    <button onClick={() => setScanAllResults(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {scanAllResults.map((res) => (
                      <button 
                        key={res.id} 
                        onClick={() => setFilterService(res.id)}
                        className="group text-left rounded-xl border border-white/5 bg-black/20 p-4 hover:border-primary/50 hover:bg-primary/[0.05] transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase group-hover:text-primary transition-colors">{res.name}</span>
                          {res.status === "success" ? (
                             <span className={cn(
                               "text-[10px] font-black px-1.5 py-0.5 rounded",
                               res.changes > 0 ? "bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30" : "bg-muted text-muted-foreground"
                             )}>
                               {res.changes > 0 ? `+${res.changes} DRIFT` : "SECURE"}
                             </span>
                          ) : (
                             <span className="bg-destructive/10 text-destructive text-[10px] font-black px-1.5 py-0.5 rounded">ERROR</span>
                          )}
                        </div>
                        {res.status === "error" && (
                          <p className="text-[10px] text-destructive italic truncate">{res.error}</p>
                        )}
                        <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className={cn("h-full transition-all duration-1000", res.status === "success" ? "bg-primary" : "bg-destructive")} style={{ width: "100%" }} />
                        </div>
                      </button>
                    ))}
                  </div>
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
              </div>

              {/* Service Cards */}
              <div className="flex items-center justify-between mb-4 mt-2">
                 <div className="flex items-center gap-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Operational_Mesh</h2>
                    <div className="h-[1px] w-12 bg-border" />
                 </div>
                 <div className="flex items-center gap-3">
                    <FlowButton
                      text={isScanningAll ? "Auditing..." : "Scan All"}
                      onClick={handleScanAll}
                    />
                    <FlowButton
                      text="Add Node"
                      onClick={() => setLinkModalOpen(true)}
                    />
                 </div>
              </div>

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
                      projects={projects}
                      onClick={() => setFilterService(service.id)}
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
