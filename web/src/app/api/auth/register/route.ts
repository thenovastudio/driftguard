import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if user exists
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create user with 14-day trial
    const passwordHash = await hashPassword(password);
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const result = db
      .prepare(
        `INSERT INTO users (email, password_hash, name, plan, trial_ends_at)
         VALUES (?, ?, ?, 'trial', ?)`
      )
      .run(email, passwordHash, name, trialEnds);

    const userId = result.lastInsertRowid as number;

    // Create default services for the user
    const defaultServices = [
      { id: "stripe", name: "Stripe" },
      { id: "vercel", name: "Vercel" },
      { id: "sendgrid", name: "SendGrid" },
      { id: "github", name: "GitHub" },
      { id: "cloudflare", name: "Cloudflare" },
      { id: "twilio", name: "Twilio" },
      { id: "datadog", name: "Datadog" },
      { id: "slack", name: "Slack" },
    ];

    const insertService = db.prepare(
      "INSERT INTO services (id, user_id, name) VALUES (?, ?, ?)"
    );

    for (const svc of defaultServices) {
      insertService.run(svc.id, userId, svc.name);
    }

    // Sign token and set cookie
    const token = signToken({ userId, email, plan: "trial" });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: userId, email, name, plan: "trial", trial_ends_at: trialEnds },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
