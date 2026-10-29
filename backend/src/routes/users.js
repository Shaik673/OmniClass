import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, param, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Submission from '../models/Submission.js';
import Certificate from '../certificates/Certificate.js';

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

// ─── GET /users/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const userJson = req.user.toJSON();
  res.json({ success: true, user: userJson, data: { user: userJson } });
});

// ─── GET /users/me/profile (Comprehensive 7-part profile) ───────────────────
router.get('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('savedCourseIds', 'title category level coverImage');

    const [enrollments, certificates, submissions] = await Promise.all([
      Enrollment.find({ userId: req.user.id, institutionId: req.user.institutionId })
        .populate('courseId', 'title category level duration')
        .sort({ updatedAt: -1 })
        .lean(),
      Certificate.find({ studentId: req.user.id, institutionId: req.user.institutionId, status: 'valid' })
        .sort({ issuedAt: -1 })
        .lean(),
      Submission.find({ studentId: req.user.id, status: 'published' })
        .populate('assignmentId', 'title maxMarks')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const activeEnrollments = enrollments.filter((e) => ['active', 'pending'].includes(e.status));
    const completedEnrollments = enrollments.filter((e) => e.status === 'completed');

    // Calculate profile completion percentage
    let completedFields = 0;
    const checks = [
      user.name,
      user.headline,
      user.bio,
      user.location,
      user.avatar,
      user.academic?.department,
      user.academic?.degree,
      user.professional?.careerObjective,
      user.professional?.skills?.length > 0,
      user.interests?.length > 0,
    ];
    for (const c of checks) if (c) completedFields++;
    const profileCompletion = Math.round((completedFields / checks.length) * 100);

    return res.json({
      success: true,
      data: {
        user: user.toJSON(),
        profileCompletion,
        stats: {
          activeCoursesCount: activeEnrollments.length,
          completedCoursesCount: completedEnrollments.length,
          certificatesCount: certificates.length,
          gradedSubmissionsCount: submissions.length,
          streakDays: user.gamification?.streakDays || 3,
          points: user.gamification?.points || 240,
        },
        activeEnrollments,
        completedEnrollments,
        certificates,
        recentGrades: submissions.map((s) => ({
          assignmentTitle: s.assignmentId?.title || 'Assignment',
          score: s.score,
          maxMarks: s.assignmentId?.maxMarks || 100,
          submittedAt: s.submittedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /users/me/profile (Update full profile) ──────────────────────────
router.patch(
  '/me/profile',
  requireAuth,
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('displayName').optional().trim().isLength({ max: 80 }),
  body('headline').optional().trim().isLength({ max: 140 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('avatar').optional().trim(),
  body('banner').optional().trim(),
  body('visibility').optional().isIn(['public', 'private']),
  body('language').optional().isString(),
  body('timezone').optional().isString(),
  body('interests').optional().isArray(),
  body('academic').optional().isObject(),
  body('professional').optional().isObject(),
  body('preferences').optional().isObject(),
  body('theme').optional().isIn(['dark', 'light', 'system']),
  validate,
  async (req, res, next) => {
    try {
      const u = req.user;
      const b = req.body;

      if (b.name) u.name = b.name;
      if (b.displayName !== undefined) u.displayName = b.displayName;
      if (b.headline !== undefined) u.headline = b.headline;
      if (b.bio !== undefined) u.bio = b.bio;
      if (b.location !== undefined) u.location = b.location;
      if (b.phone !== undefined) u.phone = b.phone;
      if (b.avatar !== undefined) u.avatar = b.avatar;
      if (b.banner !== undefined) u.banner = b.banner;
      if (b.visibility !== undefined) u.visibility = b.visibility;
      if (b.language !== undefined) u.language = b.language;
      if (b.timezone !== undefined) u.timezone = b.timezone;
      if (b.interests !== undefined) u.interests = b.interests;
      if (b.theme !== undefined) u.theme = b.theme;

      if (b.academic) u.academic = { ...u.academic, ...b.academic };
      if (b.professional) u.professional = { ...u.professional, ...b.professional };
      if (b.preferences) u.preferences = { ...u.preferences, ...b.preferences };

      await u.save();

      return res.json({
        success: true,
        user: u.toJSON(),
        data: { user: u.toJSON(), message: 'Profile updated successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /users/me/onboarding (Onboarding flow completion) ─────────────────
router.post(
  '/me/onboarding',
  requireAuth,
  body('department').optional().trim(),
  body('degree').optional().trim(),
  body('interests').optional().isArray(),
  body('careerObjective').optional().trim(),
  body('theme').optional().isIn(['dark', 'light', 'system']),
  validate,
  async (req, res, next) => {
    try {
      const u = req.user;
      if (req.body.department) u.academic.department = req.body.department;
      if (req.body.degree) u.academic.degree = req.body.degree;
      if (req.body.careerObjective) u.professional.careerObjective = req.body.careerObjective;
      if (req.body.interests) u.interests = req.body.interests;
      if (req.body.theme) u.theme = req.body.theme;

      u.onboardingComplete = true;
      await u.save();

      return res.json({
        success: true,
        data: { user: u.toJSON(), message: 'Welcome to OmniClass! Onboarding complete.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /users/me/change-password ────────────────────────────────────────
router.post(
  '/me/change-password',
  requireAuth,
  body('currentPassword').isString().isLength({ min: 1 }),
  body('newPassword').isLength({ min: 8, max: 128 }).withMessage('New password must be at least 8 characters.'),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select('+passwordHash');
      const isMatch = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'Current password does not match.' },
        });
      }

      user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
      user.sessionVersion = (user.sessionVersion || 0) + 1;
      await user.save();

      return res.json({
        success: true,
        data: { message: 'Password changed successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /users/me/export-data ────────────────────────────────────────────
router.post('/me/export-data', requireAuth, async (req, res, next) => {
  try {
    const [enrollments, certificates, submissions] = await Promise.all([
      Enrollment.find({ userId: req.user.id }).populate('courseId', 'title category').lean(),
      Certificate.find({ studentId: req.user.id }).lean(),
      Submission.find({ studentId: req.user.id }).populate('assignmentId', 'title maxMarks').lean(),
    ]);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      userProfile: req.user.toJSON(),
      enrollments,
      certificates,
      submissions,
    };

    return res.json({
      success: true,
      data: { exportData: exportBundle },
    });
  } catch (error) {
    next(error);
  }
});

// ─── SAVED COURSES ─────────────────────────────────────────────────────────
router.get('/me/saved-courses', requireAuth, async (req, res, next) => {
  try {
    const user = await req.user.populate({
      path: 'savedCourseIds',
      match: { institutionId: req.user.institutionId, status: 'published' },
      select: '-institutionId -instructorId -modules.lessons.content',
    });
    return res.json({ success: true, data: { courses: user.savedCourseIds || [] } });
  } catch (error) {
    next(error);
  }
});

router.post('/me/saved-courses/:courseId', requireAuth, param('courseId').isMongoId(), validate, async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.courseId,
      institutionId: req.user.institutionId,
      status: 'published',
    }).select('-institutionId -instructorId -modules.lessons.content');

    if (!course) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    }

    req.user.savedCourseIds = req.user.savedCourseIds || [];
    if (!req.user.savedCourseIds.some((id) => String(id) === String(course._id))) {
      req.user.savedCourseIds.push(course._id);
      await req.user.save();
    }
    return res.json({ success: true, data: { course, saved: true } });
  } catch (error) {
    next(error);
  }
});

router.delete('/me/saved-courses/:courseId', requireAuth, param('courseId').isMongoId(), validate, async (req, res, next) => {
  try {
    req.user.savedCourseIds = (req.user.savedCourseIds || []).filter((id) => String(id) !== String(req.params.courseId));
    await req.user.save();
    return res.json({ success: true, data: { saved: false } });
  } catch (error) {
    next(error);
  }
});

// Backward-compatible patch
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const allowed = ['name', 'displayName', 'bio', 'headline', 'location', 'interests', 'theme'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) req.user[key] = req.body[key];
    }
    await req.user.save();
    return res.json({ success: true, data: { user: req.user.toJSON() } });
  } catch (error) {
    next(error);
  }
});

export default router;
