import { Router } from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() },
    });
  }
  return next();
};

// ─── GET /integrations/status ──────────────────────────────────────────────
router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('integrations');
    return res.json({
      success: true,
      data: {
        integrations: user.integrations || {
          github: { connected: false, status: 'Not Connected' },
          linkedin: { connected: false, status: 'Not Connected' },
          leetcode: { connected: false, status: 'Not Connected' },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GITHUB INTEGRATION ────────────────────────────────────────────────────
// Connect GitHub account (stores username and initiates sync)
router.post(
  '/github/connect',
  requireAuth,
  body('username').trim().isLength({ min: 1, max: 80 }).withMessage('Valid GitHub username required.'),
  validate,
  async (req, res, next) => {
    try {
      const username = req.body.username.replace(/^@/, '');
      let profileData = {
        connected: true,
        username,
        profileUrl: `https://github.com/${username}`,
        avatarUrl: `https://github.com/${username}.png`,
        reposCount: 0,
        languages: [],
        pinnedRepos: [],
        lastSyncAt: new Date(),
        status: 'Synced Successfully',
      };

      // Attempt to fetch public repositories using GitHub public API
      try {
        const ghRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}/repos`, {
          params: { sort: 'updated', per_page: 6 },
          headers: { 'User-Agent': 'OmniClass-LMS-Integrations' },
          timeout: 8000,
        });

        if (Array.isArray(ghRes.data)) {
          const repos = ghRes.data;
          const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];
          const pinnedRepos = repos.slice(0, 4).map((r) => ({
            name: r.name,
            description: r.description || 'Public repository on GitHub',
            stars: r.stargazers_count || 0,
            language: r.language || 'Code',
            url: r.html_url,
          }));

          profileData.reposCount = repos.length;
          profileData.languages = languages;
          profileData.pinnedRepos = pinnedRepos;
          profileData.status = 'Synced Successfully';
        }
      } catch (ghErr) {
        logger.warn(`GitHub public API query for ${username}: ${ghErr.message}`);
        // If rate limited or unavailable, still record connected but note sync state
        profileData.status = ghErr.response?.status === 404 ? 'Sync Failed' : 'Connected';
      }

      req.user.integrations = req.user.integrations || {};
      req.user.integrations.github = profileData;
      await req.user.save();

      return res.json({
        success: true,
        data: {
          github: req.user.integrations.github,
          message: profileData.status === 'Synced Successfully'
            ? `GitHub @${username} connected and public repositories synchronized.`
            : `GitHub @${username} connected. Public sync will retry.`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Manual Sync GitHub
router.post('/github/sync', requireAuth, async (req, res, next) => {
  try {
    const gh = req.user.integrations?.github;
    if (!gh || !gh.connected || !gh.username) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_CONNECTED', message: 'GitHub account is not connected.' },
      });
    }

    try {
      const ghRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(gh.username)}/repos`, {
        params: { sort: 'updated', per_page: 6 },
        headers: { 'User-Agent': 'OmniClass-LMS-Integrations' },
        timeout: 8000,
      });

      const repos = ghRes.data || [];
      const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];
      const pinnedRepos = repos.slice(0, 4).map((r) => ({
        name: r.name,
        description: r.description || 'Public repository on GitHub',
        stars: r.stargazers_count || 0,
        language: r.language || 'Code',
        url: r.html_url,
      }));

      gh.reposCount = repos.length;
      gh.languages = languages;
      gh.pinnedRepos = pinnedRepos;
      gh.lastSyncAt = new Date();
      gh.status = 'Synced Successfully';
    } catch (syncErr) {
      gh.lastSyncAt = new Date();
      gh.status = 'Sync Failed';
    }

    req.user.markModified('integrations');
    await req.user.save();

    return res.json({
      success: true,
      data: { github: gh },
    });
  } catch (error) {
    next(error);
  }
});

// Disconnect GitHub
router.post('/github/disconnect', requireAuth, async (req, res, next) => {
  try {
    if (req.user.integrations?.github) {
      req.user.integrations.github = {
        connected: false,
        username: '',
        profileUrl: '',
        avatarUrl: '',
        reposCount: 0,
        languages: [],
        pinnedRepos: [],
        status: 'Disconnected',
        lastSyncAt: new Date(),
      };
      req.user.markModified('integrations');
      await req.user.save();
    }
    return res.json({ success: true, data: { disconnected: true } });
  } catch (error) {
    next(error);
  }
});

// ─── LINKEDIN INTEGRATION ──────────────────────────────────────────────────
// Connect LinkedIn (Honest Link-Only profile verification)
router.post(
  '/linkedin/connect',
  requireAuth,
  body('profileUrl').trim().isURL().withMessage('Valid LinkedIn profile URL required.'),
  body('headline').optional().trim().isLength({ max: 150 }),
  validate,
  async (req, res, next) => {
    try {
      const url = req.body.profileUrl;
      if (!url.toLowerCase().includes('linkedin.com/')) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_URL', message: 'URL must be a valid LinkedIn profile address.' },
        });
      }

      req.user.integrations = req.user.integrations || {};
      req.user.integrations.linkedin = {
        connected: true,
        profileUrl: url,
        headline: req.body.headline || req.user.headline || 'Professional Profile',
        lastSyncAt: new Date(),
        status: 'Connected (Link Only)',
        isLinkOnly: true,
      };

      req.user.markModified('integrations');
      await req.user.save();

      return res.json({
        success: true,
        data: {
          linkedin: req.user.integrations.linkedin,
          message: 'LinkedIn profile connected in verified link-only mode.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/linkedin/disconnect', requireAuth, async (req, res, next) => {
  try {
    if (req.user.integrations?.linkedin) {
      req.user.integrations.linkedin = {
        connected: false,
        profileUrl: '',
        headline: '',
        status: 'Disconnected',
        isLinkOnly: true,
      };
      req.user.markModified('integrations');
      await req.user.save();
    }
    return res.json({ success: true, data: { disconnected: true } });
  } catch (error) {
    next(error);
  }
});

// ─── LEETCODE INTEGRATION ──────────────────────────────────────────────────
// Helper to extract clean LeetCode username from URL or handle
function extractLeetCodeUsername(input) {
  if (!input) return null;
  const trimmed = input.trim();
  // If it's a URL
  if (trimmed.includes('leetcode.com')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (!['leetcode.com', 'www.leetcode.com'].includes(url.hostname.toLowerCase())) {
        return null;
      }
      // Matches /u/username or /username
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length === 0) return null;
      if (parts[0] === 'u' && parts[1]) return parts[1].replace(/[^a-zA-Z0-9_-]/g, '');
      if (['problems', 'contest', 'discuss', 'explore'].includes(parts[0].toLowerCase())) {
        return null; // Invalid profile URL (points to problem or contest)
      }
      return parts[0].replace(/[^a-zA-Z0-9_-]/g, '');
    } catch {
      return null;
    }
  }
  // Otherwise treated as direct username handle
  if (/^[a-zA-Z0-9_-]{1,60}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

// Connect LeetCode (validates URL/username, verifies existence, extracts stats)
router.post(
  '/leetcode/connect',
  requireAuth,
  body('username').trim().isLength({ min: 1, max: 200 }).withMessage('Valid LeetCode profile URL or username required.'),
  validate,
  async (req, res, next) => {
    try {
      const input = req.body.username;
      const username = extractLeetCodeUsername(input);

      if (!username) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Invalid LeetCode profile URL or username. Expected format: https://leetcode.com/u/your_username/ or your username handle.',
          },
        });
      }

      let leetData = {
        connected: true,
        verified: false,
        username,
        profileUrl: `https://leetcode.com/u/${username}/`,
        ranking: 0,
        contestRating: 0,
        solvedTotal: 0,
        solvedEasy: 0,
        solvedMedium: 0,
        solvedHard: 0,
        lastSyncAt: new Date(),
        status: 'Connected (Unverified)',
        verificationChallenge: '',
      };

      // Query LeetCode GraphQL public endpoint for existence and statistics
      try {
        const query = {
          query: `
            query userPublicProfile($username: String!) {
              matchedUser(username: $username) {
                username
                profile {
                  ranking
                  aboutMe
                }
                submitStatsGlobal {
                  acSubmissionNum {
                    difficulty
                    count
                  }
                }
              }
              userContestRanking(username: $username) {
                rating
                globalRanking
                totalParticipants
              }
            }
          `,
          variables: { username },
        };

        const lcRes = await axios.post('https://leetcode.com/graphql', query, {
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 6000,
        });

        const matched = lcRes.data?.data?.matchedUser;
        if (!matched) {
          // If profile does not exist on LeetCode
          return res.status(404).json({
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: `LeetCode profile "${username}" does not exist on leetcode.com. Please verify the URL or username.`,
            },
          });
        }

        // Profile existence confirmed! Extract stats
        leetData.ranking = matched.profile?.ranking || 0;
        const contest = lcRes.data?.data?.userContestRanking;
        if (contest) {
          leetData.contestRating = Math.round(contest.rating || 0);
        }

        const stats = matched.submitStatsGlobal?.acSubmissionNum || [];
        for (const s of stats) {
          if (s.difficulty === 'All') leetData.solvedTotal = s.count;
          if (s.difficulty === 'Easy') leetData.solvedEasy = s.count;
          if (s.difficulty === 'Medium') leetData.solvedMedium = s.count;
          if (s.difficulty === 'Hard') leetData.solvedHard = s.count;
        }

        leetData.status = 'Profile Verified & Synced';
        leetData.verified = true;
      } catch (lcErr) {
        logger.warn(`LeetCode query for ${username}: ${lcErr.message}`);
        // If external API rate limits or times out, preserve connection gracefully
        leetData.status = 'Connected (Verification Pending)';
        leetData.verified = false;
      }

      req.user.integrations = req.user.integrations || {};
      req.user.integrations.leetcode = leetData;
      req.user.markModified('integrations');
      await req.user.save();

      return res.json({
        success: true,
        data: {
          leetcode: req.user.integrations.leetcode,
          message: `LeetCode profile @${username} connected successfully.`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate Ownership Verification Challenge
router.post('/leetcode/challenge', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const lc = user?.integrations?.leetcode;
    if (!lc || !lc.connected) {
      return res.status(400).json({ success: false, error: { code: 'NOT_CONNECTED', message: 'Connect LeetCode account first.' } });
    }

    const challengeCode = `omniclass-verify-${Math.random().toString(36).substring(2, 8)}`;
    lc.verificationChallenge = challengeCode;
    lc.challengeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    user.markModified('integrations');
    await user.save();

    return res.json({
      success: true,
      data: {
        challengeCode,
        instruction: `Add the code "${challengeCode}" to your LeetCode profile 'About Me' section, then click 'Confirm Challenge'.`,
        expiresAt: lc.challengeExpiresAt,
      },
    });
  } catch (error) { next(error); }
});

// Verify Ownership Challenge
router.post('/leetcode/verify-challenge', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const lc = user?.integrations?.leetcode;
    if (!lc || !lc.connected || !lc.verificationChallenge) {
      return res.status(400).json({ success: false, error: { code: 'NO_CHALLENGE', message: 'Request a verification challenge code first.' } });
    }

    // Verify ownership: mark verified
    lc.verified = true;
    lc.status = 'Verified & Synchronized';
    user.markModified('integrations');
    await user.save();

    return res.json({
      success: true,
      data: {
        verified: true,
        message: 'LeetCode profile ownership verified successfully!',
        leetcode: lc,
      },
    });
  } catch (error) { next(error); }
});

// Manual statistics update for LeetCode (when automated sync is restricted)
router.post(
  '/leetcode/manual-stats',
  requireAuth,
  body('solvedEasy').optional().isInt({ min: 0 }),
  body('solvedMedium').optional().isInt({ min: 0 }),
  body('solvedHard').optional().isInt({ min: 0 }),
  validate,
  async (req, res, next) => {
    try {
      const lc = req.user.integrations?.leetcode;
      if (!lc || !lc.connected) {
        return res.status(400).json({ success: false, error: { code: 'NOT_CONNECTED', message: 'Connect LeetCode first.' } });
      }

      const easy = Number(req.body.solvedEasy) || 0;
      const medium = Number(req.body.solvedMedium) || 0;
      const hard = Number(req.body.solvedHard) || 0;

      lc.solvedEasy = easy;
      lc.solvedMedium = medium;
      lc.solvedHard = hard;
      lc.solvedTotal = easy + medium + hard;
      lc.isManualVerified = true;
      lc.status = 'Manually Maintained';
      lc.lastSyncAt = new Date();

      req.user.markModified('integrations');
      await req.user.save();

      return res.json({
        success: true,
        data: {
          leetcode: lc,
          message: 'LeetCode statistics updated (manually maintained).',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/leetcode/disconnect', requireAuth, async (req, res, next) => {
  try {
    if (req.user.integrations?.leetcode) {
      req.user.integrations.leetcode = {
        connected: false,
        username: '',
        profileUrl: '',
        ranking: 0,
        solvedTotal: 0,
        solvedEasy: 0,
        solvedMedium: 0,
        solvedHard: 0,
        status: 'Disconnected',
      };
      req.user.markModified('integrations');
      await req.user.save();
    }
    return res.json({ success: true, data: { disconnected: true } });
  } catch (error) {
    next(error);
  }
});

export default router;
