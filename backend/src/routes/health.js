import { Router } from 'express';
import mongoose from 'mongoose';
import { redis } from '../config/redis.js';
import { config } from '../config/index.js';
import axios from 'axios';

const router = Router();

router.get('/', async (req, res) => {
  const checks = {
    api: 'ok',
    mongodb: 'unknown',
    redis: 'unknown',
    aiService: 'unknown',
  };

  // MongoDB
  try {
    checks.mongodb = mongoose.connection.readyState === 1 ? 'ok' : 'degraded';
  } catch {
    checks.mongodb = 'error';
  }

  // Redis
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  // FastAPI AI service
  try {
    await axios.get(`${config.ai.fastApiUrl}/ai/health`, { timeout: 3000 });
    checks.aiService = 'ok';
  } catch {
    checks.aiService = 'degraded';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  const status = allOk ? 200 : 207;

  res.status(status).json({
    success: allOk,
    data: {
      status: allOk ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
    requestId: req.requestId,
  });
});

export default router;
