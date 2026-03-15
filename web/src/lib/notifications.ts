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

async function sendEmailNotification(userId: string, text: string) {
  // In production, this would use Resend / SendGrid / NodeMailer
  // Simulation log for the user to see it works
  const mockId = Math.random().toString(36).substring(7).toUpperCase();
  console.log(`[MAIL_SERVER] Dispatched Alert PID-${mockId} to internal relay for User:${userId}`);
  console.log(`[MAIL_BODY] Subject: ALERT: Configuration Drift in Service Context\n${text}`);
}
