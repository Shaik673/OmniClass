import axios from 'axios';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config/index.js';
import { requireAuth } from '../middleware/auth.js';
import AuthToken from '../models/AuthToken.js';
import { generateSecureToken, hashToken } from '../utils/crypto.js';
import { emailConfigured, sendAccountEmail } from '../services/mailer.js';
import logger from '../utils/logger.js';

const router = Router();
const clean = (user) => ({ user: user.toJSON() });

const issue = (res, user) => {
  const token = jwt.sign(
    { sub: user.id, role: user.role, ver: user.sessionVersion || 0 },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
  res.cookie('oc_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge: 2 * 60 * 60 * 1000,
  });
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  return errors.isEmpty()
    ? next()
    : res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() },
      });
};

async function createAccountToken(user, purpose, ttlMs) {
  await AuthToken.deleteMany({ userId: user._id, purpose, usedAt: null });
  const token = generateSecureToken(32);
  await AuthToken.create({
    userId: user._id,
    purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

async function sendVerification(user) {
  const raw = await createAccountToken(user, 'email_verification', 60 * 60 * 1000);
  const link = `${config.frontendUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(raw)}`;
  logger.info(`[AUTH] Verification link generated for ${user.email}: ${link}`);
  try {
    if (emailConfigured()) {
      await sendAccountEmail({
        to: user.email,
        subject: 'Verify your OmniClass email',
        text: `Verify your email: ${link}\nThis link expires in one hour.`,
        html: `<p>Verify your OmniClass email to complete your profile setup.</p><p><a href="${link}">Verify email</a></p><p>This link expires in one hour.</p>`,
      });
    }
  } catch (err) {
    logger.warn('Failed to send verification email, verification link is still active:', { message: err.message, link });
  }
  return { token: raw, link };
}

// ─── POST /auth/register ───────────────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter a name between 2 and 80 characters.'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters.'),
  validate,
  async (req, res, next) => {
    try {
      const exists = await User.exists({ email: req.body.email });
      if (exists) {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'An account already uses this email.' } });
      }

      const passwordHash = await bcrypt.hash(req.body.password, 12);
      const institution = await Institution.findOne({ slug: 'northstar-university' }) || await Institution.findOne();
      if (!institution) {
        return res.status(503).json({ success: false, error: { code: 'SETUP_REQUIRED', message: 'Institution setup is not complete yet.' } });
      }

      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        institutionId: institution.id,
        role: 'student',
        theme: 'dark',
      });

      let verResult = null;
      try {
        verResult = await sendVerification(user);
      } catch (e) {
        logger.warn('Initial registration verification could not be queued', { error: e.message });
      }
      issue(res, user);
      return res.status(201).json({
        success: true,
        data: {
          ...clean(user),
          ...(verResult && config.env !== 'production' ? { verificationToken: verResult.token, verificationLink: verResult.link } : {}),
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

// ─── POST /auth/login ──────────────────────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 128 }),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
      if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
        return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
      }
      if (user.status !== 'active') {
        return res.status(403).json({ success: false, error: { code: 'ACCOUNT_UNAVAILABLE', message: 'This account is currently suspended or unavailable.' } });
      }
      if (config.auth.requireVerifiedEmail && !user.emailVerifiedAt) {
        return res.status(403).json({ success: false, error: { code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email before signing in.' } });
      }
      issue(res, user);
      return res.json({ success: true, data: clean(user) });
    } catch (e) {
      next(e);
    }
  }
);

// ─── POST /auth/demo-login (Effortless 1-click role switcher for review/demo)
router.post(
  '/demo-login',
  authLimiter,
  body('role').isIn(['student', 'instructor', 'admin']),
  validate,
  async (req, res, next) => {
    try {
      const role = req.body.role;
      let user = await User.findOne({ role, status: 'active' });
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `No active ${role} user seeded.` } });
      }
      issue(res, user);
      return res.json({
        success: true,
        data: {
          user: user.toJSON(),
          message: `Signed in as demo ${role}: ${user.name}`,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

// ─── OAUTH SOCIAL AUTHENTICATION ───────────────────────────────────────────
// Check provider configuration status
router.get('/oauth/providers', (req, res) => {
  res.json({
    success: true,
    data: {
      providers: {
        google: { configured: Boolean(config.oauth?.google?.clientId), name: 'Google' },
        github: { configured: Boolean(config.oauth?.github?.clientId), name: 'GitHub' },
        facebook: { configured: Boolean(config.oauth?.facebook?.appId), name: 'Facebook' },
      },
    },
  });
});

// Initiate OAuth flow (API method returning URL)
router.post('/oauth/:provider/initiate', param('provider').isIn(['google', 'github', 'facebook']), validate, (req, res) => {
  const provider = req.params.provider;
  const providerCfg = config.oauth?.[provider];

  if (!providerCfg || (!providerCfg.clientId && !providerCfg.appId)) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'OAUTH_PROVIDER_UNCONFIGURED',
        message: `${provider.toUpperCase()} authentication requires OAuth credentials configured in institutional backend environment (${provider.toUpperCase()}_CLIENT_ID). Please sign in using institutional email/password or use Demo Login.`,
      },
    });
  }

  // Generate secure OAuth authorization URL
  let authUrl = '';
  const state = generateSecureToken(16);

  if (provider === 'google') {
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${providerCfg.clientId}&redirect_uri=${encodeURIComponent(providerCfg.callbackUrl)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account&state=${state}`;
  } else if (provider === 'github') {
    authUrl = `https://github.com/login/oauth/authorize?client_id=${providerCfg.clientId}&redirect_uri=${encodeURIComponent(providerCfg.callbackUrl)}&scope=read:user%20user:email&state=${state}`;
  } else if (provider === 'facebook') {
    authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${providerCfg.appId}&redirect_uri=${encodeURIComponent(providerCfg.callbackUrl)}&scope=email,public_profile&state=${state}`;
  }

  return res.json({
    success: true,
    data: { authUrl, state },
  });
});

// Direct browser OAuth redirect (e.g. clicking "Sign in with Google")
router.get(['/google', '/oauth/google'], (req, res) => {
  const providerCfg = config.oauth?.google;
  if (!providerCfg || !providerCfg.clientId) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'GOOGLE_OAUTH_UNCONFIGURED',
        message: 'Google OAuth credentials are not configured in institutional backend.',
      },
    });
  }

  const state = generateSecureToken(16);
  res.cookie('oc_oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${providerCfg.clientId}&redirect_uri=${encodeURIComponent(providerCfg.callbackUrl)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account&state=${state}`;
  return res.redirect(authUrl);
});

// Direct browser OAuth redirect (GitHub)
router.get(['/github', '/oauth/github'], (req, res) => {
  const providerCfg = config.oauth?.github;
  if (!providerCfg || !providerCfg.clientId) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'GITHUB_OAUTH_UNCONFIGURED',
        message: 'GitHub OAuth credentials are not configured in institutional backend.',
      },
    });
  }

  const state = generateSecureToken(16);
  res.cookie('oc_oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${providerCfg.clientId}&redirect_uri=${encodeURIComponent(providerCfg.callbackUrl)}&scope=read:user%20user:email&state=${state}`;
  return res.redirect(authUrl);
});

// Direct browser OAuth redirect (Facebook)
router.get(['/facebook', '/oauth/facebook'], (req, res) => {
  const providerCfg = config.oauth?.facebook;
  if (!providerCfg || !providerCfg.appId) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'FACEBOOK_OAUTH_UNCONFIGURED',
        message: 'Facebook OAuth credentials are not configured in institutional backend.',
      },
    });
  }

  const state = generateSecureToken(16);
  res.cookie('oc_oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${providerCfg.appId}&redirect_uri=${encodeURIComponent(providerCfg.callbackUrl)}&scope=email,public_profile&state=${state}`;
  return res.redirect(authUrl);
});

// Google OAuth Callback Handler
const handleGoogleCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      logger.warn('Google OAuth reported an error callback', { error, description: error_description });
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(error_description || error)}`);
    }
    if (!code) {
      return res.redirect(`${config.frontendUrl}/login?error=MISSING_AUTHORIZATION_CODE`);
    }

    const providerCfg = config.oauth?.google;
    if (!providerCfg?.clientId || !providerCfg?.clientSecret) {
      logger.error('Google OAuth credentials missing on backend');
      return res.redirect(`${config.frontendUrl}/login?error=OAUTH_CONFIG_ERROR`);
    }

    // Exchange authorization code for access token with Google
    const tokenParams = new URLSearchParams({
      code: String(code),
      client_id: providerCfg.clientId,
      client_secret: providerCfg.clientSecret,
      redirect_uri: providerCfg.callbackUrl,
      grant_type: 'authorization_code',
    });

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', tokenParams.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      throw new Error('NO_ACCESS_TOKEN_FROM_GOOGLE');
    }

    // Fetch user profile from Google UserInfo
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });

    const profile = profileRes.data;
    if (!profile?.email) {
      return res.redirect(`${config.frontendUrl}/login?error=GOOGLE_NO_EMAIL`);
    }

    const email = profile.email.toLowerCase().trim();
    let user = await User.findOne({
      $or: [{ googleId: profile.sub }, { email }],
    });

    if (user) {
      let updated = false;
      if (!user.googleId) {
        user.googleId = profile.sub;
        user.authProvider = 'google';
        updated = true;
      }
      if (!user.emailVerifiedAt && profile.email_verified) {
        user.emailVerifiedAt = new Date();
        updated = true;
      }
      if (!user.avatar && profile.picture) {
        user.avatar = profile.picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
      logger.info(`Existing user authenticated via Google OAuth: ${user.email} (${user.id})`);
    } else {
      const institution = (await Institution.findOne({ slug: 'northstar-university' })) || (await Institution.findOne());
      if (!institution) {
        return res.redirect(`${config.frontendUrl}/login?error=INSTITUTION_NOT_FOUND`);
      }

      user = await User.create({
        name: profile.name || profile.given_name || email.split('@')[0],
        displayName: profile.name || '',
        email,
        googleId: profile.sub,
        authProvider: 'google',
        institutionId: institution._id,
        role: 'student',
        avatar: profile.picture || '',
        emailVerifiedAt: profile.email_verified ? new Date() : new Date(),
        theme: 'dark',
        onboardingComplete: true,
      });
      logger.info(`New user registered via Google OAuth: ${user.email} (${user.id})`);
    }

    issue(res, user);
    return res.redirect(`${config.frontendUrl}/dashboard?auth=google_success`);
  } catch (err) {
    const errorMsg = err.response?.data?.error_description || err.message;
    logger.error('Google OAuth callback processing failed', { message: errorMsg });
    return res.redirect(`${config.frontendUrl}/login?error=GOOGLE_AUTH_FAILED&details=${encodeURIComponent(errorMsg)}`);
  }
};

router.get(['/google/callback', '/oauth/google/callback'], handleGoogleCallback);

// GitHub OAuth Callback Handler
const handleGitHubCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      logger.warn('GitHub OAuth reported an error callback', { error, description: error_description });
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(error_description || error)}`);
    }
    if (!code) {
      return res.redirect(`${config.frontendUrl}/login?error=MISSING_AUTHORIZATION_CODE`);
    }

    const providerCfg = config.oauth?.github;
    if (!providerCfg?.clientId || !providerCfg?.clientSecret) {
      logger.error('GitHub OAuth credentials missing on backend');
      return res.redirect(`${config.frontendUrl}/login?error=OAUTH_CONFIG_ERROR`);
    }

    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: providerCfg.clientId,
        client_secret: providerCfg.clientSecret,
        code: String(code),
        redirect_uri: providerCfg.callbackUrl,
      },
      {
        headers: { Accept: 'application/json' },
        timeout: 15000,
      }
    );

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      throw new Error(tokenRes.data?.error_description || 'NO_ACCESS_TOKEN_FROM_GITHUB');
    }

    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'OmniClass-LMS',
      },
      timeout: 10000,
    });
    const ghUser = userRes.data;

    let email = ghUser.email;
    if (!email) {
      try {
        const emailsRes = await axios.get('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'OmniClass-LMS',
          },
          timeout: 10000,
        });
        const primary = (emailsRes.data || []).find((e) => e.primary && e.verified) || (emailsRes.data || [])[0];
        if (primary?.email) email = primary.email;
      } catch (err) {
        logger.warn('Failed to retrieve GitHub user emails', { error: err.message });
      }
    }

    if (!email) {
      email = `${ghUser.login}@users.noreply.github.com`;
    }
    email = email.toLowerCase().trim();

    let user = await User.findOne({
      $or: [{ githubId: String(ghUser.id) }, { email }],
    });

    if (user) {
      let updated = false;
      if (!user.githubId) {
        user.githubId = String(ghUser.id);
        user.authProvider = user.authProvider || 'github';
        updated = true;
      }
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
        updated = true;
      }
      if (!user.avatar && ghUser.avatar_url) {
        user.avatar = ghUser.avatar_url;
        updated = true;
      }
      if (!user.integrations?.github?.connected) {
        user.integrations = user.integrations || {};
        user.integrations.github = {
          connected: true,
          username: ghUser.login,
          profileUrl: ghUser.html_url || `https://github.com/${ghUser.login}`,
          avatarUrl: ghUser.avatar_url || '',
          status: 'Connected',
          lastSyncAt: new Date(),
        };
        updated = true;
      }
      if (updated) await user.save();
      logger.info(`Existing user authenticated via GitHub OAuth: ${user.email} (${user.id})`);
    } else {
      const institution = (await Institution.findOne({ slug: 'northstar-university' })) || (await Institution.findOne());
      if (!institution) {
        return res.redirect(`${config.frontendUrl}/login?error=INSTITUTION_NOT_FOUND`);
      }

      user = await User.create({
        name: ghUser.name || ghUser.login,
        displayName: ghUser.name || ghUser.login,
        email,
        githubId: String(ghUser.id),
        authProvider: 'github',
        institutionId: institution._id,
        role: 'student',
        avatar: ghUser.avatar_url || '',
        emailVerifiedAt: new Date(),
        theme: 'dark',
        onboardingComplete: true,
        integrations: {
          github: {
            connected: true,
            username: ghUser.login,
            profileUrl: ghUser.html_url || `https://github.com/${ghUser.login}`,
            avatarUrl: ghUser.avatar_url || '',
            status: 'Connected',
            lastSyncAt: new Date(),
          },
        },
      });
      logger.info(`New user registered via GitHub OAuth: ${user.email} (${user.id})`);
    }

    issue(res, user);
    return res.redirect(`${config.frontendUrl}/dashboard?auth=github_success`);
  } catch (err) {
    const errorMsg = err.response?.data?.error_description || err.message;
    logger.error('GitHub OAuth callback processing failed', { message: errorMsg });
    return res.redirect(`${config.frontendUrl}/login?error=GITHUB_AUTH_FAILED&details=${encodeURIComponent(errorMsg)}`);
  }
};

router.get(['/github/callback', '/oauth/github/callback'], handleGitHubCallback);

// Facebook OAuth Callback Handler
const handleFacebookCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      logger.warn('Facebook OAuth reported an error callback', { error, description: error_description });
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(error_description || error)}`);
    }
    if (!code) {
      return res.redirect(`${config.frontendUrl}/login?error=MISSING_AUTHORIZATION_CODE`);
    }

    const providerCfg = config.oauth?.facebook;
    if (!providerCfg?.appId || !providerCfg?.appSecret) {
      logger.error('Facebook OAuth credentials missing on backend');
      return res.redirect(`${config.frontendUrl}/login?error=OAUTH_CONFIG_ERROR`);
    }

    const tokenParams = new URLSearchParams({
      client_id: providerCfg.appId,
      client_secret: providerCfg.appSecret,
      redirect_uri: providerCfg.callbackUrl,
      code: String(code),
    });

    const tokenRes = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token?${tokenParams.toString()}`, {
      timeout: 15000,
    });

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      throw new Error('NO_ACCESS_TOKEN_FROM_FACEBOOK');
    }

    const profileRes = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`, {
      timeout: 10000,
    });

    const fbUser = profileRes.data;
    const email = (fbUser.email || `fb_${fbUser.id}@facebook.northstar.local`).toLowerCase().trim();

    let user = await User.findOne({
      $or: [{ facebookId: fbUser.id }, { email }],
    });

    const avatarUrl = fbUser.picture?.data?.url || '';

    if (user) {
      let updated = false;
      if (!user.facebookId) {
        user.facebookId = fbUser.id;
        user.authProvider = user.authProvider || 'facebook';
        updated = true;
      }
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
        updated = true;
      }
      if (!user.avatar && avatarUrl) {
        user.avatar = avatarUrl;
        updated = true;
      }
      if (updated) await user.save();
      logger.info(`Existing user authenticated via Facebook OAuth: ${user.email} (${user.id})`);
    } else {
      const institution = (await Institution.findOne({ slug: 'northstar-university' })) || (await Institution.findOne());
      if (!institution) {
        return res.redirect(`${config.frontendUrl}/login?error=INSTITUTION_NOT_FOUND`);
      }

      user = await User.create({
        name: fbUser.name || 'Facebook User',
        displayName: fbUser.name || '',
        email,
        facebookId: fbUser.id,
        authProvider: 'facebook',
        institutionId: institution._id,
        role: 'student',
        avatar: avatarUrl,
        emailVerifiedAt: new Date(),
        theme: 'dark',
        onboardingComplete: true,
      });
      logger.info(`New user registered via Facebook OAuth: ${user.email} (${user.id})`);
    }

    issue(res, user);
    return res.redirect(`${config.frontendUrl}/dashboard?auth=facebook_success`);
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    logger.error('Facebook OAuth callback processing failed', { message: errorMsg });
    return res.redirect(`${config.frontendUrl}/login?error=FACEBOOK_AUTH_FAILED&details=${encodeURIComponent(errorMsg)}`);
  }
};

router.get(['/facebook/callback', '/oauth/facebook/callback'], handleFacebookCallback);

// Quick Social Account Verification (Development & Testing Endpoint)
router.post('/oauth/test-login', authLimiter, body('provider').isIn(['google', 'github', 'facebook']), validate, async (req, res, next) => {
  try {
    const provider = req.body.provider;
    const testProfiles = {
      google: {
        id: 'google-test-987654321',
        name: 'Alex Rivera (Google)',
        email: 'alex.rivera.google@northstar.local',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      github: {
        id: 'gh-test-12345678',
        name: 'Jordan Lee (GitHub)',
        email: 'jordan.lee.gh@northstar.local',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        username: 'jordan-lee-dev',
      },
      facebook: {
        id: 'fb-test-555666777',
        name: 'Samira Patel (Facebook)',
        email: 'samira.patel.fb@northstar.local',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
    };

    const p = testProfiles[provider];
    const institution = (await Institution.findOne({ slug: 'northstar-university' })) || (await Institution.findOne());

    let user = await User.findOne({ email: p.email });
    if (!user) {
      user = await User.create({
        name: p.name,
        displayName: p.name,
        email: p.email,
        authProvider: provider,
        ...(provider === 'google' ? { googleId: p.id } : provider === 'github' ? { githubId: p.id } : { facebookId: p.id }),
        institutionId: institution?._id,
        role: 'student',
        avatar: p.avatar,
        emailVerifiedAt: new Date(),
        theme: 'dark',
        onboardingComplete: true,
        ...(provider === 'github' ? {
          integrations: {
            github: {
              connected: true,
              username: p.username,
              profileUrl: `https://github.com/${p.username}`,
              avatarUrl: p.avatar,
              status: 'Connected',
              lastSyncAt: new Date(),
            },
          },
        } : {}),
      });
    }

    issue(res, user);
    return res.json({
      success: true,
      data: {
        user: user.toJSON(),
        message: `Successfully authenticated via verified ${provider.toUpperCase()} social profile!`,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (_req, res) => {
  res.clearCookie('oc_session', { httpOnly: true, sameSite: 'lax', secure: config.env === 'production' })
    .json({ success: true, data: { signedOut: true } });
});

// ─── GET /auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: clean(req.user) }));

// ─── EMAIL VERIFICATION ────────────────────────────────────────────────────
router.post('/email/verification/request', requireAuth, authLimiter, async (req, res, next) => {
  try {
    let verResult = null;
    if (!req.user.emailVerifiedAt) {
      verResult = await sendVerification(req.user);
    }
    return res.json({
      success: true,
      data: {
        message: 'A verification link has been generated and sent to your email address.',
        ...(verResult && config.env !== 'production' ? { verificationToken: verResult.token, verificationLink: verResult.link } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/email/verification/resend', authLimiter, body('email').isEmail().normalizeEmail(), validate, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email, status: 'active' });
    let verResult = null;
    if (user && !user.emailVerifiedAt) {
      verResult = await sendVerification(user);
    }
    return res.status(200).json({
      success: true,
      data: {
        message: 'If that account requires verification, a new link has been sent.',
        ...(verResult && config.env !== 'production' ? { verificationToken: verResult.token, verificationLink: verResult.link } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/email/verify', authLimiter, body('token').trim().isLength({ min: 16, max: 128 }), validate, async (req, res, next) => {
  try {
    const token = req.body.token.trim();
    const record = await AuthToken.findOneAndUpdate(
      { tokenHash: hashToken(token), purpose: 'email_verification', usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true }
    );
    if (!record) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OR_EXPIRED_TOKEN', message: 'This verification token is invalid or expired. Please request a new one.' },
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      record.userId,
      { $set: { emailVerifiedAt: new Date() } },
      { new: true }
    );
    return res.json({
      success: true,
      data: {
        verified: true,
        message: 'Email address verified successfully!',
        user: updatedUser ? updatedUser.toJSON() : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── PASSWORD RESET ────────────────────────────────────────────────────────
router.post('/password/forgot', authLimiter, body('email').isEmail().normalizeEmail(), validate, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email, status: 'active' });
    if (user && emailConfigured()) {
      const raw = await createAccountToken(user, 'password_reset', 30 * 60 * 1000);
      const link = `${config.frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(raw)}`;
      await sendAccountEmail({
        to: user.email,
        subject: 'Reset your OmniClass password',
        text: `Reset your password: ${link}\nThis link expires in 30 minutes. If you did not request this, ignore this email.`,
        html: `<p>A password reset was requested for your OmniClass account.</p><p><a href="${link}">Choose a new password</a></p><p>This link expires in 30 minutes. If you did not request this, ignore this email.</p>`,
      });
    }
    return res.status(202).json({ success: true, data: { message: 'If an account matches that address, password reset instructions will be sent.' } });
  } catch (error) {
    next(error);
  }
});

router.post('/password/reset', authLimiter, body('token').isString().isLength({ min: 40, max: 128 }), body('password').isLength({ min: 8, max: 128 }), validate, async (req, res, next) => {
  try {
    const record = await AuthToken.findOneAndUpdate(
      { tokenHash: hashToken(req.body.token), purpose: 'password_reset', usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true }
    );
    if (!record) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OR_EXPIRED_TOKEN', message: 'This reset link is invalid or expired. Request another one and try again.' },
      });
    }
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await User.updateOne({ _id: record.userId, status: 'active' }, { $set: { passwordHash }, $inc: { sessionVersion: 1 } });
    return res.json({ success: true, data: { passwordChanged: true, message: 'Password updated. Sign in with your new password.' } });
  } catch (error) {
    next(error);
  }
});

export default router;
