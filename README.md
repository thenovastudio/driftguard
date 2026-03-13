# DriftGuard - SaaS Configuration Drift Monitor

Catch SaaS config changes before they cause outages.

## What It Does

DriftGuard monitors your SaaS dashboard settings (Stripe, Vercel, SendGrid) and alerts you when configuration changes happen — with full diffs.

**The Problem:** Teams edit SaaS settings through UI clicks with no version history. A wrong toggle in Stripe billing or Vercel env vars can cause production outages, and nobody knows what changed.

**The Solution:** Polling every 6 hours → diff against last known state → Slack alert on changes.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  BullMQ     │────▶│  Pollers     │────▶│  Snapshots  │
│  (Redis)    │     │  (Stripe,    │     │  (Postgres) │
│  Scheduler  │     │   Vercel,    │     │             │
│             │     │   SendGrid)  │     └──────┬──────┘
└─────────────┘     └──────────────┘            │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Slack      │◀────│  Diff Engine │◀────│  Change     │
│  Webhooks   │     │              │     │  Detection  │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/thenovastudio/driftguard.git
cd driftguard
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your API keys

# 3. Set up database
npm run db:migrate

# 4. Start the API server (port 3000)
npm run dev

# 5. Start the worker (polls services)
npm run worker

# 6. Start the web dashboard (port 3001)
cd web
npm install
npm run dev
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/driftguard

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# Services to monitor
STRIPE_API_KEY=sk_live_...
VERCEL_API_TOKEN=...
SENDGRID_API_KEY=SG...

# Slack alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Monitored Settings

### Stripe
- Account settings
- Payment methods enabled
- Webhook endpoints
- Billing portal configuration
- Tax settings

### Vercel
- Project environment variables
- Build & development settings
- Domains and redirects
- Deployment protection

### SendGrid
- Sender authentication
- Mail settings (click tracking, open tracking)
- Inbound parse settings
- API key scopes

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List connected services |
| GET | `/api/services/:id/snapshots` | Get snapshot history |
| GET | `/api/services/:id/diff` | Compare last two snapshots |
| POST | `/api/services/:id/poll` | Trigger manual poll |
| GET | `/api/changes` | Recent changes across all services |

## Development

```bash
# Run with hot reload
npm run dev

# Run worker with hot reload  
npm run worker

# Run tests
npm test
```

## Tech Stack

- **Runtime:** Node.js 20+
- **API:** Express
- **Queue:** BullMQ + Redis
- **Database:** PostgreSQL
- **Frontend:** Next.js (separate app)
- **Alerts:** Slack Webhooks

## License

MIT
