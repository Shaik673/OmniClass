import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, json, colorize, simple, errors } = winston.format;

const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'omniclass-api' },
  transports: [
    new winston.transports.Console({
      format: config.env === 'development'
        ? combine(colorize(), simple())
        : combine(timestamp(), json()),
    }),
  ],
});

export default logger;
