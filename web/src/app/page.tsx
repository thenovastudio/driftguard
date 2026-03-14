"use client";

import { useState } from "react";
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
import { GlowingEffect } from "@/components/ui/glowing-effect";
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
      "Full REST API. Webhook notifications to your own systems. Integrate DriftGuard into your existing incident response workflow.",
    highlight: false,
  },
  {
    icon: Lock,
    title: "Compliance-ready",
    description:
      "SOC2, HIPAA, and ISO 27001 require config change tracking. DriftGuard produces the audit evidence your auditor needs. One-click export.",
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
      "Paste an API key. DriftGuard takes a baseline snapshot of your current config. Takes 30 seconds per service.",
  },
  {
    step: "2",
    title: "We monitor continuously",
    description:
      "DriftGuard polls your services on a schedule. Every config state is compared against the last known good snapshot.",
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
function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">DriftGuard</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Integrations
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <ThemeToggle />
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-4">
          <a href="#features" className="block text-sm text-muted-foreground">Features</a>
          <a href="#how-it-works" className="block text-sm text-muted-foreground">How it works</a>
          <a href="#integrations" className="block text-sm text-muted-foreground">Integrations</a>
          <a href="#pricing" className="block text-sm text-muted-foreground">Pricing</a>
          <a href="/dashboard" className="block text-sm text-primary font-medium">Open Dashboard →</a>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl text-center relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground mb-8">
          <Zap className="h-3 w-3 text-primary" />
          Catch SaaS config changes before they cause outages
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          Your SaaS configs are{" "}
          <span className="text-primary">drifting right now</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Someone changed a webhook. Someone toggled a setting. Someone broke
          something — and you won't find out until users complain. DriftGuard
          watches your SaaS configs 24/7 so you always know what changed.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start monitoring free <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium hover:bg-muted transition-colors"
          >
            See how it works
          </a>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-12 border-t border-border">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PainPointsSection() {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The problems nobody talks about
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            IaC tools like Terraform cover your infrastructure. But what about
            the 20+ SaaS services configured through their own dashboards?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PAIN_POINTS.map((point, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-6 flex gap-4"
            >
              <div className="w-fit rounded-lg bg-destructive/10 p-2 h-fit">
                <point.icon className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
    <section id="features" className="py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to stay in control
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not just monitoring — a full config intelligence platform for your
            entire SaaS stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border border-border p-6 transition-colors",
                feature.highlight
                  ? "bg-card border-primary/20"
                  : "bg-card hover:border-border"
              )}
            >
              <div
                className={cn(
                  "w-fit rounded-lg p-2 mb-4",
                  feature.highlight ? "bg-primary/10" : "bg-muted"
                )}
              >
                <feature.icon
                  className={cn(
                    "h-5 w-5",
                    feature.highlight ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
    <section id="how-it-works" className="py-20 px-6 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Set up in minutes, not days
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No agents. No infrastructure. Just paste an API key and we handle
            the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {item.step}
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight className="hidden md:block h-5 w-5 text-muted-foreground absolute left-[3.5rem] top-3" />
                )}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
    <section id="integrations" className="py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Connect your entire stack
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            8 integrations and growing. Each one monitors the specific config
            settings that matter.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INTEGRATIONS.map((integration, i) => (
            <div
              key={i}
              className="group rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-3 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${integration.color}15` }}
              >
                <integration.icon
                  className="h-6 w-6"
                  style={{ color: integration.color }}
                />
              </div>
              <span className="font-medium text-sm">{integration.name}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Ready to connect
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          More integrations coming soon: AWS, GCP, Azure, Okta, Datadog,
          PagerDuty, and 20+ more.
        </p>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-6 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="font-semibold text-lg mb-1">Free</h3>
            <p className="text-sm text-muted-foreground mb-4">
              For side projects & testing
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Up to 3 services",
                "Poll every 30 minutes",
                "7-day change history",
                "Email alerts",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/dashboard"
              className="block text-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Get started free
            </a>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-primary bg-card p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
              Most popular
            </div>
            <h3 className="font-semibold text-lg mb-1">Pro</h3>
            <p className="text-sm text-muted-foreground mb-4">
              For growing teams
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Up to 15 services",
                "Poll every 5 minutes",
                "90-day change history",
                "Slack + email + webhook alerts",
                "Team members (5)",
                "Compliance exports",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/dashboard"
              className="block text-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start 14-day trial
            </a>
          </div>

          {/* Business */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="font-semibold text-lg mb-1">Business</h3>
            <p className="text-sm text-muted-foreground mb-4">
              For compliance-heavy orgs
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$79</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited services",
                "Poll every 1 minute",
                "1-year change history",
                "All alert channels",
                "Unlimited team members",
                "SOC2 / HIPAA reports",
                "Priority support",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/dashboard"
              className="block text-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <div className="rounded-2xl border border-border bg-card p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="relative">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Start watching your configs today
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Free to start. No credit card. Connect your first service in under
              a minute.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">DriftGuard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Catch SaaS config changes before they cause outages.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#integrations" className="hover:text-foreground transition-colors">Integrations</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © 2026 DriftGuard. Built by{" "}
          <a
            href="https://github.com/thenovastudio"
            className="text-primary hover:underline"
          >
            The Nova Studio
          </a>
        </div>
      </div>
    </footer>
  );
}

// ── Main Landing Page ────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <HeroSection />
      <PainPointsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <IntegrationsSection />
      <PricingSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
