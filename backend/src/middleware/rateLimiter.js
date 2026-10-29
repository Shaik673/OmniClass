import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

const createLimiter = (options) =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
        requestId: req.requestId,
      });
    },
    ...options,
  });

// General API limiter
export const apiLimiter = createLimiter({
  max: config.rateLimit.maxRequests,
});

// Strict limiter for auth endpoints
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many authentication attempts',
});

// Per-user AI feature limiter
export const aiLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.rateLimit.aiMax,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});
