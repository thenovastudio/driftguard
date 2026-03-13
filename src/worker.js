import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { pollStripe } from './pollers/stripe.js';
import { pollVercel } from './pollers/vercel.js';
import { pollSendGrid } from './pollers/sendgrid.js';
import { detectChanges } from './diff.js';
import { sendSlackAlert } from './alerts/slack.js';
import { saveSnapshot, getLatestSnapshot } from './db/snapshots.js';
import { logger } from './logger.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

// Poll queue
export const pollQueue = new Queue('poll', { connection });

// Schedule recurring polls
async function schedulePolls() {
  const interval = process.env.POLL_INTERVAL || '0 */6 * * *';
  
  await pollQueue.add('poll-stripe', { service: 'stripe' }, {
    repeat: { pattern: interval },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
  
  await pollQueue.add('poll-vercel', { service: 'vercel' }, {
    repeat: { pattern: interval },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
  
  await pollQueue.add('poll-sendgrid', { service: 'sendgrid' }, {
    repeat: { pattern: interval },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
  
  logger.info(`Polling scheduled: ${interval}`);
}

// Process jobs
const processor = new Worker('poll', async (job) => {
  const { service } = job.data;
  logger.info(`Polling ${service}...`);
  
  let config;
  switch (service) {
    case 'stripe':
      config = await pollStripe();
      break;
    case 'vercel':
      config = await pollVercel();
      break;
    case 'sendgrid':
      config = await pollSendGrid();
      break;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
  
  // Get previous snapshot
  const previous = await getLatestSnapshot(service);
  
  // Save new snapshot
  const snapshot = await saveSnapshot(service, config);
  
  // Detect changes
  if (previous) {
    const changes = detectChanges(previous.config, config);
    
    if (changes.length > 0) {
      logger.info(`${service}: ${changes.length} changes detected`);
      
      // Send Slack alert
      await sendSlackAlert(service, changes);
      
      return { changes: changes.length };
    }
  }
  
  logger.info(`${service}: no changes`);
  return { changes: 0 };
}, { connection });

processor.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed: ${JSON.stringify(result)}`);
});

processor.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
});

// Start
schedulePolls().catch(err => {
  logger.error(`Failed to schedule polls: ${err.message}`);
});

logger.info('DriftGuard worker started');
