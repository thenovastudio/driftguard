"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Shield,
  Eye,
  Bell,
  History,
  GitCompare,
  Users,
  FileCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Webhook,
  BarChart3,
  Lock,
  ChevronRight,
  Github,
  CreditCard,
  Globe,
  Mail,
  Cloud,
  Phone,
  Hash,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// ── Data ─────────────────────────────────────────────────────
const PAIN_POINTS = [
  {
    icon: AlertTriangle,
    title: "Silent config drift",
    description:
      "Someone changes a webhook URL in Stripe's dashboard. Nobody notices until payments fail at 2 AM.",
  },
  {
    icon: Users,
    title: "No accountability",
    description:
      "Five people have admin access. A config changed. Who did it? When? Why? There's no trail.",
  },
  {
    icon: Clock,
    title: "Slow incident response",
    description:
      "An outage starts. You spend 45 minutes checking IaC, then discover the real cause was a SaaS setting someone toggled last week.",
  },
  {
    icon: FileCheck,
    title: "Compliance gaps",
    description:
      "SOC2 and HIPAA require tracking all configuration changes. Your SaaS dashboards don't produce audit logs your auditor can use.",
  },
];

const FEATURES = [
  {
    icon: Eye,
    title: "Real-time drift detection",
    description:
      "Polls your connected SaaS services every few minutes. Compares current config against your last known good state. Catches changes before they become incidents.",
    highlight: true,
  },
  {
    icon: GitCompare,
    title: "Visual diff view",
    description:
      "See exactly what changed — old value → new value. No more guessing what's different. Like git diff for your SaaS config.",
    highlight: true,
  },
  {
    icon: Bell,
    title: "Multi-channel alerting",
    description:
      "Get notified on Slack, email, PagerDuty, or Discord the moment a change is detected. Configurable severity levels and routing rules.",
    highlight: false,
  },
  {
    icon: History,
    title: "Full audit trail",
    description:
      "Every change logged with timestamp, who-made-it context, and before/after values. Export to CSV for compliance reports.",
    highlight: true,
  },
  {
    icon: Users,
    title: "Team accountability",
    description:
      "See who last accessed each service's config. Assign owners. Require approval for sensitive changes.",
    highlight: false,
  },
  {
    icon: BarChart3,
    title: "Change analytics",
    description:
      "Trends over time: which services drift most, change frequency, blast radius correlation with incidents.",
    highlight: false,
  },
  {
    icon: Webhook,
    title: "API & webhooks",
    description:
      "Full REST API. Webhook notifications to your own systems. Integrate Monitra into your existing incident response workflow.",
    highlight: false,
  },
  {
    icon: Lock,
    title: "Compliance-ready",
    description:
      "SOC2, HIPAA, and ISO 27001 require config change tracking. Monitra produces the audit evidence your auditor needs. One-click export.",
    highlight: true,
  },
];

const INTEGRATIONS = [
  { name: "Stripe", icon: CreditCard, color: "#635bff" },
  { name: "Vercel", icon: Globe, color: "#000" },
  { name: "SendGrid", icon: Mail, color: "#1a82e2" },
  { name: "GitHub", icon: Github, color: "#24292f" },
  { name: "Cloudflare", icon: Cloud, color: "#f38020" },
  { name: "Twilio", icon: Phone, color: "#f22f46" },
  { name: "Datadog", icon: BarChart3, color: "#632ca6" },
  { name: "Slack", icon: Hash, color: "#4a154b" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Connect your SaaS",
    description:
      "Paste an API key. Monitra takes a baseline snapshot of your current config. Takes 30 seconds per service.",
  },
  {
    step: "2",
    title: "We monitor continuously",
    description:
      "Monitra polls your services on a schedule. Every config state is compared against the last known good snapshot.",
  },
  {
    step: "3",
    title: "Get alerted on drift",
    description:
      "The moment something changes — webhook URL, SSL setting, billing config — you get notified with a visual diff showing exactly what changed.",
  },
  {
    step: "4",
    title: "Review & respond",
    description:
      "Acknowledge changes, roll back if needed, export audit logs. Everything tracked, nothing lost.",
  },
];

const STATS = [
  { value: "73%", label: "of outages involve a config change" },
  { value: "4.2h", label: "average time to detect silent drift" },
  { value: "8+", label: "SaaS integrations supported" },
  { value: "100%", label: "audit coverage for compliance" },
];

// ── Components ───────────────────────────────────────────────
function Nav({ isSignedIn }: { isSignedIn: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-12 py-6">
        <a href="/" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center bg-primary border-none">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter">Monitra</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Protocols
          </a>
          <a href="#how-it-works" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Architecture
          </a>
          <a href="#integrations" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Nodes
          </a>
          <a href="#pricing" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Clearance
          </a>
          <ThemeToggle />
          <a
            href={isSignedIn ? "/dashboard" : "/register"}
            className="inline-flex items-center gap-2 bg-destructive px-6 py-3 text-xs font-mono font-bold tracking-widest text-destructive-foreground hover:bg-destructive/90 transition-colors uppercase"
          >
            {isSignedIn ? "ACCESS TERMINAL" : "AUTHENTICATE"} <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-3 border border-border bg-card"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5 text-primary" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-12 py-8 space-y-8">
          <a href="#features" className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">Protocols</a>
          <a href="#how-it-works" className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">Architecture</a>
          <a href="#integrations" className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">Nodes</a>
          <a href="#pricing" className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">Clearance</a>
          <a href={isSignedIn ? "/dashboard" : "/login"} className="block text-xs font-mono uppercase tracking-widest text-destructive font-bold">{isSignedIn ? "ACCESS TERMINAL →" : "AUTHENTICATE →"}</a>
        </div>
      )}
    </nav>
  );
}

function HeroSection({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className="relative pt-48 pb-32 px-12 overflow-hidden border-b border-border">
      <div className="mx-auto max-w-7xl relative">
        <div className="inline-flex items-center gap-3 border border-border bg-card px-6 py-2 mb-12">
          <Zap className="h-4 w-4 text-secondary-foreground" />
          <span className="text-xs font-mono tracking-widest uppercase text-secondary-foreground">System Status: Monitoring 8 Nodes</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-10 leading-[1.0] max-w-[15ch]">
          YOUR CONFIGS ARE <span className="text-primary block mt-2">DRIFTING SILENTLY.</span>
        </h1>

        <p className="text-lg md:text-xl text-foreground font-medium max-w-2xl mb-16 leading-relaxed">
          Someone changed a webhook. Someone toggled a setting. Someone broke
          something — and you won't find out until users complain. Monitra
          watches your exact configurations 24/7.
        </p>

        <div className="flex items-center gap-6 flex-wrap">
          <a href={isSignedIn ? "/dashboard" : "/register"} className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-8 py-4 text-xs font-mono font-bold tracking-widest uppercase hover:bg-destructive/90 transition-colors">
            {isSignedIn ? "ACCESS TERMINAL" : "INITIALIZE SCAN"} <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-3 border border-border px-8 py-4 text-xs font-mono font-bold tracking-widest text-foreground hover:bg-muted transition-colors uppercase"
          >
            VIEW SCHEMATICS
          </a>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mt-32 border-t border-l border-border bg-card">
          {STATS.map((stat, i) => (
            <div key={i} className="p-10 border-r border-b border-border text-left hover:bg-muted transition-colors">
              <div className="text-4xl md:text-5xl font-black text-primary mb-4 font-mono">
                {stat.value}
              </div>
              <div className="text-xs font-mono text-muted-foreground tracking-widest uppercase leading-loose">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PainPointsSection() {
  return (
    <section className="py-32 px-12 border-b border-border bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-foreground">
            The vulnerabilities <br className="hidden md:block" />nobody talks about
          </h2>
          <p className="text-lg font-mono text-muted-foreground">
            IaC tools like Terraform map your infrastructure. But what about
            the 20+ SaaS nodes configured through web dashboards?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l border-border bg-card">
          {PAIN_POINTS.map((point, i) => (
            <div
              key={i}
              className="border-r border-b border-border p-12 hover:bg-muted transition-colors flex flex-col gap-6"
            >
              <div className="w-12 h-12 border border-destructive flex items-center justify-center bg-transparent">
                <point.icon className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 tracking-tighter uppercase text-foreground">{point.title}</h3>
                <p className="text-base text-muted-foreground leading-loose">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-12 border-b border-border">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-foreground">
            Absolute Control Parameters
          </h2>
          <p className="text-lg font-mono text-muted-foreground">
            Not just monitoring — a full intelligence terminal for your
            entire infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-border bg-card">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "border-r border-b border-border p-10 transition-colors flex flex-col",
                feature.highlight
                  ? "bg-secondary"
                  : "bg-transparent hover:bg-muted"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 flex items-center justify-center border mb-8",
                  feature.highlight ? "border-primary text-primary" : "border-border text-muted-foreground"
                )}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight uppercase mb-4 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-loose">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 px-12 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-foreground">
            Initialization Sequence
          </h2>
          <p className="text-lg font-mono text-muted-foreground">
            No agents. No infrastructure. Instant protocol connection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-t border-l border-border bg-card">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} className="relative border-r border-b border-border p-10 hover:bg-muted transition-colors">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 border border-primary flex items-center justify-center text-primary font-black text-xl font-mono">
                  {item.step}
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight className="hidden md:block h-6 w-6 text-muted-foreground absolute left-[4.5rem] top-13" />
                )}
              </div>
              <h3 className="text-xl font-bold tracking-tight uppercase mb-4 text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-loose">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrationsSection() {
  return (
    <section id="integrations" className="py-32 px-12 border-b border-border bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-foreground">
            Supported Nodes
          </h2>
          <p className="text-lg font-mono text-muted-foreground">
            8 integrations online. Constant expansion protocol active.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-l border-border bg-card">
          {INTEGRATIONS.map((integration, i) => (
            <div
              key={i}
              className="group border-r border-b border-border p-10 flex flex-col items-center gap-6 hover:bg-secondary transition-colors cursor-pointer"
            >
              <div
                className="w-16 h-16 border flex items-center justify-center bg-background group-hover:bg-primary/10 transition-colors"
                style={{ borderColor: integration.color }}
              >
                <integration.icon
                  className="h-8 w-8"
                  style={{ color: integration.color }}
                />
              </div>
              <span className="font-bold text-base tracking-widest uppercase">{integration.name}</span>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary-foreground" />
                ONLINE
              </span>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm font-mono text-muted-foreground border-l-2 border-primary pl-4">
          PENDING NODES: AWS, GCP, AZURE, OKTA, DATADOG, PAGERDUTY
        </p>
      </div>
    </section>
  );
}

function PricingSection({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section id="pricing" className="py-32 px-12 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-foreground">
            Clearance Levels
          </h2>
          <p className="text-lg font-mono text-muted-foreground">
            Select your operational capacity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-border bg-card">
          {/* Plus */}
          <div className="border-r border-b border-border p-12 hover:bg-muted transition-colors">
            <h3 className="text-xl font-bold tracking-widest uppercase mb-2">Level 1: Plus</h3>
            <p className="text-xs font-mono text-muted-foreground mb-8 uppercase tracking-widest">
              Standard Access
            </p>
            <div className="mb-10 font-mono">
              <span className="text-6xl font-black text-foreground">$4.99</span>
            </div>
            <ul className="space-y-4 mb-12">
              {[
                "3 Nodes max",
                "30-min scan polling",
                "7-day retention log",
                "Email dispatches",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-mono">
                  <span className="w-1.5 h-1.5 bg-primary rounded-none shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={isSignedIn ? "/dashboard" : "/register"}
              className="block text-center border border-border px-6 py-4 text-xs font-mono font-bold tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              {isSignedIn ? "ACCESS TERMINAL" : "ACQUIRE KEY"}
            </a>
          </div>

          {/* Pro */}
          <div className="border-r border-b border-primary bg-secondary p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1">
              Recommended
            </div>
            <h3 className="text-xl font-bold tracking-widest uppercase mb-2 text-primary">Level 2: Pro</h3>
            <p className="text-xs font-mono text-muted-foreground mb-8 uppercase tracking-widest">
              Advanced Operations
            </p>
            <div className="mb-10 font-mono">
              <span className="text-6xl font-black text-primary">$29</span>
            </div>
            <ul className="space-y-4 mb-12">
              {[
                "15 Nodes max",
                "5-min scan polling",
                "90-day retention log",
                "Multi-channel dispatches",
                "5 Agents allowed",
                "Compliance export protocol",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-mono">
                  <span className="w-1.5 h-1.5 bg-primary rounded-none shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={isSignedIn ? "/dashboard" : "/register"}
              className="block text-center bg-primary text-primary-foreground px-6 py-4 text-xs font-mono font-bold tracking-widest uppercase hover:bg-primary/90 transition-colors"
            >
              {isSignedIn ? "ACCESS TERMINAL" : "ACQUIRE KEY"}
            </a>
          </div>

          {/* Business */}
          <div className="border-r border-b border-border p-12 hover:bg-muted transition-colors">
            <h3 className="text-xl font-bold tracking-widest uppercase mb-2">Level 3: Business</h3>
            <p className="text-xs font-mono text-muted-foreground mb-8 uppercase tracking-widest">
              Absolute Authority
            </p>
            <div className="mb-10 font-mono">
              <span className="text-6xl font-black text-foreground">$79</span>
            </div>
            <ul className="space-y-4 mb-12">
              {[
                "Infinite Nodes",
                "1-min scan polling",
                "1-year retention log",
                "Total dispatch authority",
                "Infinite Agents",
                "SOC2 / HIPAA compliance",
                "Priority comms channel",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-mono">
                  <span className="w-1.5 h-1.5 bg-primary rounded-none shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={isSignedIn ? "/dashboard" : "/register"}
              className="block text-center border border-border px-6 py-4 text-xs font-mono font-bold tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              {isSignedIn ? "ACCESS TERMINAL" : "CONTACT COMMAND"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className="py-32 px-12 bg-background border-b border-border">
      <div className="mx-auto max-w-4xl text-left border border-border bg-card p-16">
        <Shield className="h-16 w-16 text-primary mb-8" />
        <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-foreground max-w-2xl">
          INITIATE MONITORING PROTOCOL
        </h2>
        <p className="text-lg font-mono text-muted-foreground mb-12 max-w-xl leading-loose">
          Clearance Level 1 is free forever. No credentials required.
          Secure your first node in 60 seconds.
        </p>
        <a
          href={isSignedIn ? "/dashboard" : "/register"}
          className="inline-flex items-center gap-3 bg-destructive text-destructive-foreground px-8 py-5 text-sm font-mono font-bold tracking-widest uppercase hover:bg-destructive/90 transition-colors"
        >
          {isSignedIn ? "ACCESS TERMINAL" : "INITIALIZE SCAN"} <ArrowRight className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-12 py-20 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-black uppercase tracking-tighter">Monitra</span>
            </div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest leading-loose">
              Absolute configuration intelligence for the modern infrastructure.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-widest uppercase mb-6 text-foreground">Architecture</h4>
            <ul className="space-y-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
              <li><a href="#features" className="hover:text-primary transition-colors">Protocols</a></li>
              <li><a href="#integrations" className="hover:text-primary transition-colors">Nodes</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Clearance</a></li>
              <li><a href="/login" className="hover:text-primary transition-colors">Terminal Access</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-widest uppercase mb-6 text-foreground">Data Storage</h4>
            <ul className="space-y-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
              <li><a href="#" className="hover:text-primary transition-colors">Schematics</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Transmission Log</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">System Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-widest uppercase mb-6 text-foreground">Command</h4>
            <ul className="space-y-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
              <li><a href="#" className="hover:text-primary transition-colors">Personnel</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Signal Comm</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Protocol</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">TOS</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-12 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
          <span>© 2026 MONITRA PROTOCOL.</span>
          <span>BUILT BY <a href="https://thenovastudio.be" className="text-primary hover:text-foreground transition-colors ml-1">THE NOVA STUDIO</a></span>
        </div>
      </div>
    </footer>
  );
}

// ── Main Landing Page ────────────────────────────────────────
export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const signedIn = !!isSignedIn;

  return (
    <div className="min-h-screen bg-background">
      <Nav isSignedIn={signedIn} />
      <HeroSection isSignedIn={signedIn} />
      <PainPointsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <IntegrationsSection />
      <PricingSection isSignedIn={signedIn} />
      <FinalCTASection isSignedIn={signedIn} />
      <Footer />
    </div>
  );
}
