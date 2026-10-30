import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import { config } from './config/index.js';
import { connectDB } from './config/database.js';
import { redis } from './config/redis.js';
import { registerScheduledJobs, closeQueues } from './jobs/queues.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

// ─── API route modules ──────────────────────────────────────
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import coursesRouter from './routes/courses.js';
import notificationsRouter from './routes/notifications.js';
import aiRouter from './routes/ai.js';
import assignmentsRouter from './routes/assignments.js';
import quizzesRouter from './routes/quizzes.js';
import plannerRouter from './routes/planner.js';
import discussionsRouter from './routes/discussions.js';
import certificatesRouter from './routes/certificates.js';
import adminRouter from './routes/admin.js';
import integrationsRouter from './routes/integrations.js';
import calendarRouter from './routes/calendar.js';
import Institution from './models/Institution.js';
import User from './models/User.js';

const app = express();

// ─── Trust proxy (for correct IP behind Nginx) ───────────────
app.set('trust proxy', 1);

// ─── Security & Parsing Middleware ───────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanFrontend = (config.frontendUrl || '').replace(/\/$/, '');
    const allowed = [cleanFrontend, 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (allowed.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app') || cleanOrigin.endsWith('.onrender.com') || cleanOrigin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookieSecret));

// ─── Request ID & Logging ────────────────────────────────────
app.use(requestId);
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.path === '/health',
}));

// ─── Rate Limiting ───────────────────────────────────────────
app.use(`/api/${config.apiVersion}`, apiLimiter);

// ─── Routes ─────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use(`/api/${config.apiVersion}/auth`, authRouter);
app.use(`/api/${config.apiVersion}/users`, usersRouter);
app.use(`/api/${config.apiVersion}/courses`, coursesRouter);
app.use(`/api/${config.apiVersion}/notifications`, notificationsRouter);
app.use(`/api/${config.apiVersion}/ai`, aiRouter);
app.use(`/api/${config.apiVersion}/assignments`, assignmentsRouter);
app.use(`/api/${config.apiVersion}/quizzes`, quizzesRouter);
app.use(`/api/${config.apiVersion}/planner`, plannerRouter);
app.use(`/api/${config.apiVersion}/discussions`, discussionsRouter);
app.use(`/api/${config.apiVersion}/certificates`, certificatesRouter);
app.use(`/api/${config.apiVersion}/admin`, adminRouter);
app.use(`/api/${config.apiVersion}/integrations`, integrationsRouter);
app.use(`/api/${config.apiVersion}/calendar`, calendarRouter);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
    requestId: req.requestId,
  });
});

// ─── Centralized Error Handler ───────────────────────────────
app.use(errorHandler);

// ─── Bootstrap ───────────────────────────────────────────────
async function bootstrap() {
  await connectDB();
  await Institution.updateOne(
    { slug: 'northstar-university' },
    {
      $setOnInsert: {
        name: 'Northstar University',
        slug: 'northstar-university',
        tagline: 'Empowering curious minds through intentional learning & AI innovation',
      },
    },
    { upsert: true }
  );

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    logger.info('Database empty on startup; seeding complete institutional development dataset...');
    const { seedDatabase } = await import('./utils/seed.js');
    await seedDatabase();
    logger.info('Development seed data initialized successfully.');
  }

  try {
    if (process.env.REDIS_ENABLED !== 'false') {
      await redis.connect();
      await registerScheduledJobs();
      logger.info('Redis connected and scheduled jobs registered');
    }
  } catch (redisErr) {
    logger.warn('Redis unavailable; running in memory/local fallback mode', { error: redisErr.message });
  }

  const server = app.listen(config.port, () => {
    logger.info(`OmniClass API running on port ${config.port} [${config.env}]`);
  });

  // Secondary OAuth callback listener if callback port differs from primary port (e.g. port 4000)
  let secondaryServer = null;
  const oauthCallbackUrl = config.oauth?.google?.callbackUrl || config.oauth?.github?.callbackUrl || config.oauth?.facebook?.callbackUrl;
  if (oauthCallbackUrl) {
    try {
      const parsedUrl = new URL(oauthCallbackUrl);
      const callbackPort = parseInt(parsedUrl.port, 10);
      if (callbackPort && callbackPort !== config.port) {
        secondaryServer = app.listen(callbackPort, () => {
          logger.info(`OmniClass secondary OAuth listener active on port ${callbackPort}`);
        });
        secondaryServer.on('error', (err) => {
          logger.warn(`Secondary OAuth listener on port ${callbackPort}: ${err.message}`);
        });
      }
    } catch (e) {
      logger.warn('Could not parse OAuth callback URL for secondary listener', { error: e.message });
    }
  }

  // ─── Graceful Shutdown ────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      if (secondaryServer) {
        try {
          secondaryServer.close();
        } catch {
          // ignore
        }
      }
      try {
        await closeQueues();
        if (redis.status === 'ready' || redis.status === 'connecting') {
          await redis.quit();
        }
      } catch (err) {
        logger.warn('Error during shutdown cleanup:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });
}

bootstrap();

export default app;
