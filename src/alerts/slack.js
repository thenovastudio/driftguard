import { formatChanges } from '../diff.js';
import { logger } from '../logger.js';

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function sendSlackAlert(service, changes) {
  if (!WEBHOOK_URL) {
    logger.warn('SLACK_WEBHOOK_URL not set, skipping alert');
    return { skipped: true };
  }
  
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 Config Change Detected: ${service}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: formatChanges(service, changes),
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `DriftGuard · ${new Date().toISOString()} · <https://driftguard.app|View Dashboard>`,
          },
        ],
      },
    ],
  };
  
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    
    if (!res.ok) {
      throw new Error(`Slack returned ${res.status}`);
    }
    
    logger.info(`Slack alert sent for ${service}`);
    return { sent: true };
  } catch (error) {
    logger.error(`Slack alert failed: ${error.message}`);
    throw error;
  }
}
