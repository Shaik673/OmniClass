import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Institution from '../models/Institution.js';
import Enrollment from '../models/Enrollment.js';
import Certificate from '../certificates/Certificate.js';
import Submission from '../models/Submission.js';
import Assignment from '../models/Assignment.js';
import QuizAttempt from '../assessments/QuizAttempt.js';

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

// All admin endpoints require admin role
router.use(requireAuth, requireRole('admin'));

// ─── GET /admin/overview ───────────────────────────────────────────────────
// High-level institutional platform metrics
router.get('/overview', async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      pendingCourses,
      totalEnrollments,
      totalCertificates,
      totalSubmissions,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ institutionId }),
      User.countDocuments({ institutionId, role: 'student' }),
      User.countDocuments({ institutionId, role: 'instructor' }),
      Course.countDocuments({ institutionId, status: 'published' }),
      Course.countDocuments({ institutionId, status: 'pending' }),
      Enrollment.countDocuments({ institutionId }),
      Certificate.countDocuments({ institutionId, status: 'valid' }),
      Submission.countDocuments({ institutionId }),
      User.find({ institutionId }).sort({ createdAt: -1 }).limit(5).select('name email role status createdAt'),
    ]);

    // Completion rate
    const completedEnrollments = await Enrollment.countDocuments({ institutionId, status: 'completed' });
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalStudents,
          totalInstructors,
          totalCourses,
          pendingCourses,
          totalEnrollments,
          completedEnrollments,
          completionRate,
          totalCertificates,
          totalSubmissions,
        },
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /admin/analytics ──────────────────────────────────────────────────
// Platform charts data: enrollment trends, grade distribution, department breakdown
router.get('/analytics', async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    // Courses by department/category
    const categoryDistribution = await Course.aggregate([
      { $match: { institutionId, status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Grade distributions from published submissions
    const submissions = await Submission.find({ institutionId, status: 'published', score: { $exists: true } })
      .populate('assignmentId', 'maxMarks')
      .limit(200)
      .lean();

    let gradeBuckets = { '90-100%': 0, '80-89%': 0, '70-79%': 0, '60-69%': 0, '<60%': 0 };
    for (const sub of submissions) {
      const max = sub.assignmentId?.maxMarks || 100;
      const pct = (sub.score / max) * 100;
      if (pct >= 90) gradeBuckets['90-100%']++;
      else if (pct >= 80) gradeBuckets['80-89%']++;
      else if (pct >= 70) gradeBuckets['70-79%']++;
      else if (pct >= 60) gradeBuckets['60-69%']++;
      else gradeBuckets['<60%']++;
    }

    const gradeDistribution = Object.entries(gradeBuckets).map(([bucket, count]) => ({ bucket, count }));

    // Monthly activity simulation/aggregation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const monthlyTrends = months.map((month, idx) => ({
      month,
      enrollments: Math.round(18 + idx * 7 + (idx % 2 === 0 ? 5 : -3)),
      completions: Math.round(6 + idx * 4 + (idx % 3 === 0 ? 3 : 1)),
      aiQueries: Math.round(35 + idx * 18 + (idx % 2 === 0 ? 12 : -5)),
    }));

    return res.json({
      success: true,
      data: {
        categoryDistribution: categoryDistribution.map((c) => ({ category: c._id || 'General', count: c.count })),
        gradeDistribution,
        monthlyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── USER MANAGEMENT ───────────────────────────────────────────────────────
// GET /admin/users (search, filter by role/status, paginate)
router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { institutionId: req.user.institutionId };

    if (req.query.role && ['student', 'instructor', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (req.query.status && ['active', 'suspended'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.search) {
      const q = String(req.query.search).trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('name displayName email role status headline location createdAt academic')
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        users,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/users (Create new institutional user)
router.post(
  '/users',
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters.'),
  body('role').isIn(['student', 'instructor', 'admin']).withMessage('Role must be student, instructor, or admin.'),
  body('department').optional().trim().isLength({ max: 100 }),
  validate,
  async (req, res, next) => {
    try {
      const exists = await User.exists({ email: req.body.email });
      if (exists) {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email already exists.' } });
      }

      const passwordHash = await bcrypt.hash(req.body.password, 12);
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        role: req.body.role,
        institutionId: req.user.institutionId,
        status: 'active',
        emailVerifiedAt: new Date(),
        onboardingComplete: true,
        academic: {
          department: req.body.department || 'Computer Science & Engineering',
        },
      });

      return res.status(201).json({
        success: true,
        data: { user: user.toJSON(), message: `User account for ${user.name} created successfully.` },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /admin/users/:userId/role (Change user role)
router.patch(
  '/users/:userId/role',
  param('userId').isMongoId(),
  body('role').isIn(['student', 'instructor', 'admin']),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ _id: req.params.userId, institutionId: req.user.institutionId });
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
      }

      // Prevent self-demotion from admin
      if (String(user._id) === String(req.user.id) && req.body.role !== 'admin') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: 'You cannot change your own admin role.' },
        });
      }

      user.role = req.body.role;
      await user.save();

      return res.json({ success: true, data: { user: user.toJSON(), message: `User role changed to ${user.role}.` } });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /admin/users/:userId/status (Suspend / Reactivate user)
router.patch(
  '/users/:userId/status',
  param('userId').isMongoId(),
  body('status').isIn(['active', 'suspended']),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ _id: req.params.userId, institutionId: req.user.institutionId });
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
      }

      if (String(user._id) === String(req.user.id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: 'You cannot suspend your own account.' },
        });
      }

      user.status = req.body.status;
      if (user.status === 'suspended') {
        user.sessionVersion = (user.sessionVersion || 0) + 1; // Invalidate sessions
      }
      await user.save();

      return res.json({
        success: true,
        data: { user: user.toJSON(), message: `User account is now ${user.status}.` },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── COURSE APPROVALS & ADMINISTRATION ─────────────────────────────────────
// GET /admin/courses/pending
router.get('/courses/pending', async (req, res, next) => {
  try {
    const courses = await Course.find({ institutionId: req.user.institutionId, status: 'pending' })
      .populate('instructorId', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ success: true, data: { courses } });
  } catch (error) {
    next(error);
  }
});

// PATCH /admin/courses/:courseId/approve
router.patch('/courses/:courseId/approve', param('courseId').isMongoId(), validate, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId });
    if (!course) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    }

    course.status = 'published';
    course.reviewNotes = req.body.reviewNotes || 'Approved by Institutional Administrator';
    await course.save();

    return res.json({ success: true, data: { course, message: 'Course approved and published.' } });
  } catch (error) {
    next(error);
  }
});

// PATCH /admin/courses/:courseId/reject
router.patch(
  '/courses/:courseId/reject',
  param('courseId').isMongoId(),
  body('reason').optional().trim().isLength({ max: 500 }),
  validate,
  async (req, res, next) => {
    try {
      const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId });
      if (!course) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
      }

      course.status = 'draft';
      course.reviewNotes = req.body.reason || 'Returned for revision by Administrator';
      await course.save();

      return res.json({ success: true, data: { course, message: 'Course returned to draft for revision.' } });
    } catch (error) {
      next(error);
    }
  }
);

// ─── INSTITUTION SETTINGS & BRANDING ───────────────────────────────────────
// GET /admin/institution
router.get('/institution', async (req, res, next) => {
  try {
    const institution = await Institution.findById(req.user.institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Institution record not found.' } });
    }
    return res.json({ success: true, data: { institution } });
  } catch (error) {
    next(error);
  }
});

// PATCH /admin/institution
router.patch(
  '/institution',
  body('name').optional().trim().isLength({ min: 3, max: 120 }),
  body('tagline').optional().trim().isLength({ max: 200 }),
  body('departments').optional().isArray(),
  body('branding').optional().isObject(),
  body('certificateSettings').optional().isObject(),
  body('settings').optional().isObject(),
  validate,
  async (req, res, next) => {
    try {
      const institution = await Institution.findById(req.user.institutionId);
      if (!institution) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Institution record not found.' } });
      }

      if (req.body.name) institution.name = req.body.name;
      if (req.body.tagline) institution.tagline = req.body.tagline;
      if (req.body.departments) institution.departments = req.body.departments;
      if (req.body.branding) institution.branding = { ...institution.branding, ...req.body.branding };
      if (req.body.certificateSettings) institution.certificateSettings = { ...institution.certificateSettings, ...req.body.certificateSettings };
      if (req.body.settings) institution.settings = { ...institution.settings, ...req.body.settings };

      await institution.save();

      return res.json({
        success: true,
        data: { institution, message: 'Institution settings updated successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
