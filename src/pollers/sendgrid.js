import { logger } from '../logger.js';

export async function pollSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn('SENDGRID_API_KEY not set, skipping');
    return { skipped: true };
  }
  
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  
  try {
    // Fetch mail settings
    const [mailSettings, trackingSettings, senders, parseWebhook] = await Promise.all([
      fetch('https://api.sendgrid.com/v3/mail/settings', { headers }).then(r => r.json()),
      fetch('https://api.sendgrid.com/v3/tracking_settings', { headers }).then(r => r.json()),
      fetch('https://api.sendgrid.com/v3/verified_senders', { headers }).then(r => r.json()),
      fetch('https://api.sendgrid.com/v3/user/webhooks/parse/settings', { headers }).then(r => r.json()),
    ]);
    
    return {
      mail_settings: {
        bcc: mailSettings.result?.bcc,
        bypass_list_management: mailSettings.result?.bypass_list_management,
        footer: mailSettings.result?.footer,
        forwarding: mailSettings.result?.forwarding,
        spam_check: mailSettings.result?.spam_check,
        template: mailSettings.result?.template,
        address_whitelist: mailSettings.result?.address_whitelist,
      },
      tracking_settings: {
        click_tracking: trackingSettings.result?.click_tracking,
        open_tracking: trackingSettings.result?.open_tracking,
        subscription_tracking: trackingSettings.result?.subscription_tracking,
        google_analytics: trackingSettings.result?.google_analytics,
      },
      verified_senders: (senders.results || []).map(s => ({
        id: s.id,
        from_email: s.from_email,
        from_name: s.from_name,
        verified: s.verified,
      })),
      parse_webhook: parseWebhook.result || [],
    };
  } catch (error) {
    logger.error(`SendGrid poll failed: ${error.message}`);
    throw error;
  }
}
