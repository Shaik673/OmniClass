import 'dotenv/config';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiVersion: process.env.API_VERSION || 'v1',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/omniclass',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'local-development-secret-change-before-deploy',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '2h',
    privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH || './keys/jwt-private.pem',
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || './keys/jwt-public.pem',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  auth: {
    requireVerifiedEmail: process.env.AUTH_REQUIRE_VERIFIED_EMAIL === 'true',
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL,
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackUrl: process.env.LINKEDIN_CALLBACK_URL,
      apiEnabled: process.env.LINKEDIN_API_ENABLED === 'true',
    },
    tokenEncryptionKey: process.env.OAUTH_TOKEN_ENCRYPTION_KEY,
  },

  leetcode: {
    session: process.env.LEETCODE_SESSION,
    csrfToken: process.env.LEETCODE_CSRF_TOKEN,
    apiUrl: process.env.LEETCODE_API_URL || 'https://leetcode.com/graphql',
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3',
    aws: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET_NAME,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    minio: {
      endpoint: process.env.MINIO_ENDPOINT,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      bucket: process.env.MINIO_BUCKET,
    },
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    smtpHost: process.env.SMTP_HOST || process.env.BREVO_SMTP_SERVER || process.env.BREVO_SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || process.env.BREVO_SMTP_PORT || '587', 10),
    smtpSecure: (process.env.SMTP_SECURE === 'true') || (process.env.BREVO_SMTP_PORT === '465'),
    smtpUser: process.env.SMTP_USER || process.env.BREVO_SMTP_LOGIN || process.env.BREVO_SMTP_USER,
    smtpPass: process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS,
    from: (process.env.EMAIL_FROM || process.env.SENDER_EMAIL || 'noreply@omniclass.app').replace(/['"]/g, ''),
    fromName: (process.env.EMAIL_FROM_NAME || process.env.SENDER_NAME || 'OmniClass').replace(/['"]/g, ''),
  },

  ai: {
    fastApiUrl: process.env.FASTAPI_URL || 'http://localhost:8000',
    internalSecret: process.env.FASTAPI_INTERNAL_SECRET,
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    aiMax: parseInt(process.env.RATE_LIMIT_AI_MAX || '30', 10),
  },

  cookieSecret: process.env.COOKIE_SECRET || 'dev-cookie-secret',
  logLevel: process.env.LOG_LEVEL || 'info',
};
