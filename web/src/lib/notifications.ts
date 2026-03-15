import { getSupabase } from "@/lib/supabase";

export async function dispatchNotifications(userId: string, serviceId: string, diff: any) {
  const { data: settings } = await getSupabase()
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!settings) return;

  const { 
    slack_webhook_url, 
    discord_webhook_url,
    outbound_webhook_url,
    email_notifications_enabled 
  } = settings;

  const plainMessage = `[${serviceId.toUpperCase()}] Drift Detected: ${diff.field} changed from "${diff.old}" to "${diff.new}" by ${diff.actor}. Protocol: ${diff.detection}`;

  const slackPayload = {
    text: `🚨 *Drift Detected* on *${serviceId.toUpperCase()}*\n` +
          `• Field: \`${diff.field}\`\n` +
          `• Change: \`${diff.old}\` → \`${diff.new}\`\n` +
          `• Actor: ${diff.actor}\n` +
          `• Protocol: ${diff.detection}`
  };

  const genericPayload = {
    id: Date.now(),
    event: "config.drift_detected",
    timestamp: new Date().toISOString(),
    service: serviceId,
    details: diff,
    meta: { user_id: userId }
  };

  const promises = [];

  if (slack_webhook_url) {
    promises.push(sendWebhook(slack_webhook_url, slackPayload));
  }

  if (discord_webhook_url) {
    promises.push(sendWebhook(discord_webhook_url, { content: plainMessage }));
  }

  if (outbound_webhook_url) {
    promises.push(sendWebhook(outbound_webhook_url, genericPayload));
  }

  if (email_notifications_enabled) {
    promises.push(sendEmailNotification(userId, plainMessage));
  }

  await Promise.allSettled(promises);
}

async function sendWebhook(url: string, body: any) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`Webhook dispatch failed to ${url}:`, err);
  }
}

import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmailNotification(userId: string, text: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[MAIL_SERVER] Missing RESEND_API_KEY, falling back to mock");
    return;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      console.warn(`[MAIL_SERVER] No email found for user ${userId}`);
      return;
    }

    await resend.emails.send({
      from: 'DriftGuard <onboarding@resend.dev>',
      to: email,
      subject: '🚨 DRIFT_DETECTED: Configuration Change Protocol',
      text: text,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444;">Drift Detected</h2>
        <p>${text.replace(/\n/g, '<br>')}</p>
        <hr />
        <p style="font-size: 12px; color: #666;">This is an automated security protocol from DriftGuard.</p>
      </div>`
    });

    console.log(`[MAIL_SERVER] Successfully dispatched Resend Alert to ${email}`);
  } catch (err) {
    console.error("[MAIL_SERVER] Resend dispatch failed:", err);
  }
}
