import { Queue } from 'bullmq';
import logger from '../utils/logger.js';

let isRedisAvailable = false;
let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let connection;

try {
  const parsed = new URL(redisUrl);
  connection = {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '6379', 10),
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    maxRetriesPerRequest: null,
  };
} catch {
  connection = { host: 'localhost', port: 6379, maxRetriesPerRequest: null };
}

// Fallback in-memory queue when Redis is unavailable in local dev
class MockQueue {
  constructor(name) {
    this.name = name;
    this.jobs = [];
  }
  async add(name, data, opts) {
    this.jobs.push({ id: opts?.jobId || Date.now().toString(), name, data, opts, addedAt: new Date() });
    return this.jobs[this.jobs.length - 1];
  }
  async close() {
    return true;
  }
}

function createSafeQueue(name) {
  // If explicitly disabled or in dev fallback without redis
  if (process.env.REDIS_ENABLED === 'false') {
    return new MockQueue(name);
  }
  try {
    const q = new Queue(name, { connection });
    q.on('error', (err) => {
      logger.warn(`Queue [${name}] Redis connection error: ${err.message}. Operating in fallback mode.`);
    });
    return q;
  } catch (err) {
    logger.warn(`Failed to initialize queue [${name}], using in-memory mock: ${err.message}`);
    return new MockQueue(name);
  }
}

// ─── Queue Definitions ───────────────────────────────────────
export const remindersQueue    = createSafeQueue('reminders');
export const certificatesQueue = createSafeQueue('certificates');
export const emailsQueue       = createSafeQueue('emails');
export const aiIndexingQueue   = createSafeQueue('ai-indexing');
export const analyticsQueue    = createSafeQueue('analytics');

// ─── Register Scheduled Jobs ─────────────────────────────────
export async function registerScheduledJobs() {
  try {
    // Hourly deadline reminder check
    await remindersQueue.add(
      'check-deadlines',
      { lookAheadHours: 24 },
      {
        repeat: { pattern: '0 * * * *' },
        jobId: 'scheduled-deadline-check',
      }
    );

    // Nightly analytics aggregation
    await analyticsQueue.add(
      'aggregate-platform-stats',
      {},
      {
        repeat: { pattern: '0 2 * * *' },
        jobId: 'scheduled-analytics-aggregate',
      }
    );

    logger.info('Scheduled jobs registered');
  } catch (err) {
    logger.warn('Could not register scheduled repeatable jobs:', { error: err.message });
  }
}

// ─── Graceful shutdown ────────────────────────────────────────
export async function closeQueues() {
  try {
    await Promise.allSettled([
      remindersQueue.close(),
      certificatesQueue.close(),
      emailsQueue.close(),
      aiIndexingQueue.close(),
      analyticsQueue.close(),
    ]);
    logger.info('BullMQ queues closed');
  } catch (err) {
    logger.warn('Error closing BullMQ queues:', { error: err.message });
  }
}
