# DriftGuard — Setup Guide

## Quick Start (Free, Local)

No external services needed. SQLite database, JWT auth, all free.

```bash
cd driftguard/web
cp .env.example .env
# Edit .env — change JWT_SECRET to something random
npm run dev
```

Open http://localhost:3000/register to create an account. Done.

---

## Database (SQLite — Free)

DriftGuard uses **SQLite** via `better-sqlite3`. No setup needed.

- Database file: `driftguard.db` (created automatically in project root)
- Zero config — no Postgres, no Redis, no Docker
- WAL mode enabled for good concurrent read performance
- Good for up to ~100K changes (years of monitoring data)

### Tables (auto-created on first run)

| Table | Purpose |
|-------|---------|
| `users` | Accounts, plans, Stripe IDs |
| `services` | Per-user SaaS service configs + API keys |
| `snapshots` | Config state snapshots for diffing |
| `changes` | Detected config changes with diffs |

---

## Authentication (Free)

JWT-based email/password auth. No external auth service needed.

- Passwords hashed with bcrypt (12 rounds)
- Tokens stored in httpOnly cookies (30-day expiry)
- 14-day Pro trial on registration

---

## Stripe Setup (for Paid Plans)

### 1. Create a Stripe account
Go to https://dashboard.stripe.com/register (free)

### 2. Get API keys
Go to Developers → API Keys:
- Copy **Secret key** → `STRIPE_SECRET_KEY` in `.env`
- Use `sk_test_` keys for development

### 3. Create Products
Go to Products → Add Product:

**Pro Plan:**
- Name: DriftGuard Pro
- Price: $29/month recurring
- Copy the Price ID (starts with `price_`)

**Business Plan:**
- Name: DriftGuard Business
- Price: $79/month recurring
- Copy the Price ID

### 4. Update plans config
Edit `src/lib/plans.ts`:
```typescript
pro: {
  priceId: "price_yourProPriceId",  // ← paste here
  // ...
},
business: {
  priceId: "price_yourBusinessPriceId",  // ← paste here
  // ...
},
```

### 5. Set up Webhooks
Go to Developers → Webhooks → Add endpoint:
- Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
- Events to send:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the signing secret → `STRIPE_WEBHOOK_SECRET` in `.env`

### 6. Create Checkout Session (implement in your app)
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer_email: user.email,
  line_items: [{ price: "price_xxx", quantity: 1 }],
  success_url: `${origin}/dashboard?upgraded=true`,
  cancel_url: `${origin}/dashboard`,
});
// Redirect to session.url
```

---

## Plan Limits

| Feature | Free | Trial (14d) | Pro ($29/mo) | Business ($79/mo) |
|---------|------|-------------|-------------|-------------------|
| Services | 3 | 15 | 15 | Unlimited |
| Poll interval | 30 min | 5 min | 5 min | 1 min |
| History | 7 days | 14 days | 90 days | 1 year |
| Team members | 1 | 1 | 5 | Unlimited |
| Alerts | Email | All | All | All + priority |
| Compliance | — | — | Exports | SOC2/HIPAA |

---

## Polling System

- Polls run on-demand (click Poll button) — rate limited by plan
- Simulated changes: ~40% chance per poll (for demo purposes)
- Each poll: fetches current config → compares to last snapshot → generates diff if changed
- Changes show: field name, old value → new value, timestamp

---

## Project Structure

```
driftguard/web/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Marketing landing page (/)
│   │   ├── login/page.tsx        # Login page
│   │   ├── register/page.tsx     # Registration (starts 14-day trial)
│   │   ├── dashboard/page.tsx    # Main app (requires auth)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/     # POST — create account
│   │       │   ├── login/        # POST — sign in
│   │       │   ├── logout/       # POST — sign out
│   │       │   └── me/           # GET — current user
│   │       ├── services/         # GET — list services
│   │       │   ├── [id]/         # PATCH — update API key
│   │       │   ├── [id]/poll/    # POST — trigger poll
│   │       │   └── [id]/changes/ # GET — service changes
│   │       ├── changes/          # GET — all changes
│   │       └── webhooks/stripe/  # POST — Stripe webhook
│   ├── lib/
│   │   ├── auth.ts               # JWT + bcrypt + cookies
│   │   ├── db/index.ts           # SQLite connection + migrations
│   │   ├── plans.ts              # Plan definitions & limits
│   │   └── polling.ts            # Poll simulation + DB queries
│   └── components/ui/            # shadcn components
├── .env.example                  # Environment template
└── driftguard.db                 # SQLite DB (created on first run)
```
