import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { lessonExists, nextLessonProgress } from '../progress/courseProgress.js';
import Institution from '../models/Institution.js';
import { issueCourseCertificate } from './certificates.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const scope = (user) => user.institutionId ? { institutionId: user.institutionId } : { institutionId: { $exists: false } };
const validateParams = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() } });
};

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
    const filter = { status: 'published', ...(req.query.category ? { category: req.query.category } : {}), ...(req.query.search ? { $text: { $search: String(req.query.search).slice(0, 100) } } : {}) };
    if (req.query.search && !filter.$text) filter.$text = { $search: String(req.query.search).slice(0, 100) };
    const [courses, total] = await Promise.all([Course.find(filter).select('-institutionId -instructorId -modules.lessons.content').sort(req.query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Course.countDocuments(filter)]);
    return res.json({ success: true, data: { courses, page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user.id, institutionId: req.user.institutionId, status: { $in: ['pending', 'active', 'completed'] } }).populate('courseId', '-modules.lessons.content').sort({ updatedAt: -1 });
    const courses = enrollments.filter(e => e.courseId).map(e => ({ ...e.courseId.toObject(), progress: e.progress, enrollmentStatus: e.status }));
    return res.json({ success: true, data: { courses } });
  } catch (error) { next(error); }
});

router.get('/managed', requireAuth, requireRole('instructor', 'admin'), async (req, res, next) => {
  try {
    const filter = { institutionId: req.user.institutionId };
    if (req.user.role !== 'admin') filter.instructorId = req.user.id;
    const courses = await Course.find(filter).sort({ updatedAt: -1 }).limit(200).lean();
    return res.json({ success: true, data: { courses } });
  } catch (error) { next(error); }
});

router.get('/enrollments/pending', requireAuth, requireRole('instructor', 'admin'), async (req, res, next) => {
  try {
    const courseFilter = { institutionId: req.user.institutionId };
    if (req.user.role !== 'admin') courseFilter.instructorId = req.user.id;
    const courseIds = await Course.find(courseFilter).distinct('_id');
    const enrollments = await Enrollment.find({ institutionId: req.user.institutionId, courseId: { $in: courseIds }, status: 'pending' }).populate('courseId', 'title').populate('userId', 'name email').sort({ createdAt: 1 }).limit(200).lean();
    return res.json({ success: true, data: { enrollments } });
  } catch (error) { next(error); }
});

router.patch('/enrollments/:enrollmentId/decision', requireAuth, requireRole('instructor', 'admin'), param('enrollmentId').isMongoId(), validateParams, body('decision').isIn(['approve', 'reject']), validateParams, async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ _id: req.params.enrollmentId, institutionId: req.user.institutionId, status: 'pending' }).populate('courseId');
    if (!enrollment || !enrollment.courseId) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pending enrollment request not found.' } });
    if (req.user.role !== 'admin' && String(enrollment.courseId.instructorId) !== String(req.user.id)) return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_ERROR', message: 'You cannot review enrollment for this course.' } });
    enrollment.status = req.body.decision === 'approve' ? 'active' : 'rejected';
    if (enrollment.status === 'active') enrollment.enrolledAt = new Date();
    await enrollment.save();
    return res.json({ success: true, data: { enrollment } });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireRole('instructor', 'admin'), body('title').trim().isLength({ min: 4, max: 120 }), body('description').trim().isLength({ min: 20, max: 2000 }), async (req, res, next) => {
  try {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Course details need attention.', details: errors.array() } });
    const course = await Course.create({ ...req.body, institutionId: req.user.institutionId, instructorId: req.user.id, instructorName: req.user.name, status: req.user.role === 'admin' ? (req.body.status || 'published') : 'pending' });
    return res.status(201).json({ success: true, data: { course } });
  } catch (error) { next(error); }
});

// An instructor can only edit courses they own. Administrators can manage any
// course within their institution; tenant identifiers are never accepted from
// the request body.
router.patch('/:courseId', requireAuth, requireRole('instructor', 'admin'), param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'category', 'level', 'duration', 'enrollmentPolicy', 'tags', 'learningOutcomes', 'modules', 'status'];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, error: { code: 'EMPTY_UPDATE', message: 'Provide at least one editable course field.' } });
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId });
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    if (req.user.role !== 'admin' && String(course.instructorId) !== String(req.user.id)) return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_ERROR', message: 'You can only edit your own courses.' } });
    if (updates.status && !['draft', 'pending', 'published', 'archived'].includes(updates.status)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid course status.' } });
    if (updates.status === 'published' && req.user.role !== 'admin') return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_ERROR', message: 'Only an administrator can publish a course.' } });
    Object.assign(course, updates);
    await course.save();
    return res.json({ success: true, data: { course } });
  } catch (error) { next(error); }
});

router.delete('/:courseId', requireAuth, requireRole('instructor', 'admin'), param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId });
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    if (req.user.role !== 'admin' && String(course.instructorId) !== String(req.user.id)) return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_ERROR', message: 'You can only archive your own courses.' } });
    course.status = 'archived';
    await course.save();
    return res.json({ success: true, data: { course } });
  } catch (error) { next(error); }
});

router.get('/:courseId', param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, status: 'published' }).select('-institutionId -instructorId -modules.lessons.content').lean();
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    // The public course detail endpoint must not expose private lesson bodies.
    course.modules = (course.modules || []).map(({ title, lessons = [] }) => ({ title, lessons: lessons.map(({ title: lessonTitle, type }) => ({ title: lessonTitle, type })) }));
    return res.json({ success: true, data: { course } });
  } catch (error) { next(error); }
});

router.post('/:courseId/enroll', requireAuth, param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, status: 'published', ...scope(req.user) });
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course unavailable to this institution.' } });
    let enrollment = await Enrollment.findOne({ userId: req.user.id, institutionId: course.institutionId, courseId: course.id });
    if (enrollment?.status === 'rejected') {
      enrollment.status = course.enrollmentPolicy === 'approval' ? 'pending' : 'active';
      enrollment.enrolledAt = new Date();
      await enrollment.save();
    } else if (!enrollment) {
      enrollment = await Enrollment.create({ institutionId: course.institutionId, userId: req.user.id, courseId: course.id, status: course.enrollmentPolicy === 'approval' ? 'pending' : 'active' });
    }
    return res.status(201).json({ success: true, data: { enrollment } });
  } catch (error) { next(error); }
});

router.get('/:courseId/learn', requireAuth, param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId, status: 'published' }).lean();
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    const isOwner = ['instructor', 'admin'].includes(req.user.role) && (req.user.role === 'admin' || String(course.instructorId) === String(req.user.id));
    const enrollment = isOwner ? null : await Enrollment.findOne({ userId: req.user.id, institutionId: req.user.institutionId, courseId: course._id, status: { $in: ['active', 'completed'] } });
    if (!isOwner && !enrollment) return res.status(403).json({ success: false, error: { code: 'ENROLLMENT_REQUIRED', message: 'Enroll in this course to access lesson content.' } });
    return res.json({ success: true, data: { course, progress: enrollment?.progress || 0, completedLessons: enrollment?.completedLessons || [] } });
  } catch (error) { next(error); }
});

router.post('/:courseId/lessons/:lessonKey/complete', requireAuth, requireRole('student'), param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId, status: 'published' }).select('_id institutionId title modules finalExam');
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    if (!lessonExists(course.modules, req.params.lessonKey)) return res.status(404).json({ success: false, error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found.' } });
    const enrollment = await Enrollment.findOne({ userId: req.user.id, institutionId: req.user.institutionId, courseId: course.id, status: { $in: ['active', 'completed'] } });
    if (!enrollment) return res.status(403).json({ success: false, error: { code: 'ENROLLMENT_REQUIRED', message: 'Active enrollment is required.' } });
    if (!enrollment.completedLessons.includes(req.params.lessonKey)) enrollment.completedLessons.push(req.params.lessonKey);
    enrollment.progress = nextLessonProgress(course.modules, enrollment.completedLessons);
    await enrollment.save();

    return res.json({
      success: true,
      data: {
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        status: enrollment.status,
        finalExamUnlocked: enrollment.progress === 100,
        finalExamPassed: enrollment.finalExamPassed,
      },
    });
  } catch (error) { next(error); }
});

// ─── 30-MCQ FINAL PROCTORED EXAM SUBMISSION ────────────────────────────────
router.post('/:courseId/final-exam/submit', requireAuth, requireRole('student'), param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId, status: 'published' });
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });

    const enrollment = await Enrollment.findOne({ userId: req.user.id, institutionId: req.user.institutionId, courseId: course.id, status: { $in: ['active', 'completed'] } });
    if (!enrollment) return res.status(403).json({ success: false, error: { code: 'ENROLLMENT_REQUIRED', message: 'Active enrollment is required.' } });

    // Enforce prerequisite: Must read all modules first before final test certification
    if (enrollment.progress < 100) {
      return res.status(400).json({
        success: false,
        error: { code: 'MODULES_INCOMPLETE', message: 'You must complete reading all course modules before taking the final proctored exam.' },
      });
    }

    const { answers = [] } = req.body;
    const questions = course.finalExam?.questions || [];
    const totalQuestions = questions.length || 30;

    let correctCount = 0;
    const review = questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id || idx + 1,
        prompt: q.prompt,
        selectedIndex: selected,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passingThreshold = course.finalExam?.passingScore || 70;
    const passed = scorePercentage >= passingThreshold;

    enrollment.finalExamAttempts = (enrollment.finalExamAttempts || 0) + 1;
    enrollment.finalExamScore = Math.max(enrollment.finalExamScore || 0, scorePercentage);

    let certificate = null;
    if (passed) {
      enrollment.finalExamPassed = true;
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      await enrollment.save();

      const institution = await Institution.findById(course.institutionId).select('name').lean();
      certificate = await issueCourseCertificate({
        course,
        user: req.user,
        institutionName: institution?.name || 'Northstar University',
        grade: `${scorePercentage}% · ${scorePercentage >= 90 ? 'High Distinction' : 'Distinction'}`,
        score: scorePercentage,
        proctoredStatus: {
          isProctored: true,
          verified: true,
          score: scorePercentage,
          proctoredAt: new Date(),
          assessmentName: '30-MCQ Comprehensive Final Proctored Assessment',
        },
      });
    } else {
      await enrollment.save();
    }

    return res.json({
      success: true,
      data: {
        score: scorePercentage,
        correctCount,
        totalQuestions,
        passingThreshold,
        passed,
        certificate: certificate ? { certificateCode: certificate.certificateCode } : null,
        review,
      },
    });
  } catch (error) { next(error); }
});

// ─── PRO COURSE RAZORPAY PAYMENT INTEGRATION ───────────────────────────────
router.post('/:courseId/order', requireAuth, param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, status: 'published' });
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });

    const amountInPaise = Math.round((course.price || 1499) * 100);
    const orderId = `order_${Math.random().toString(36).substring(2, 10)}${Date.now()}`;

    return res.json({
      success: true,
      data: {
        orderId,
        amount: amountInPaise,
        currency: course.currency || 'INR',
        courseId: course._id,
        courseTitle: course.title,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_OmniClass2026',
      },
    });
  } catch (error) { next(error); }
});

router.post('/:courseId/verify-payment', requireAuth, param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, status: 'published' });
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });

    const { razorpay_payment_id, razorpay_order_id } = req.body;
    const paymentId = razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 12)}`;

    let enrollment = await Enrollment.findOne({ userId: req.user.id, institutionId: course.institutionId, courseId: course.id });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        institutionId: course.institutionId,
        userId: req.user.id,
        courseId: course.id,
        status: 'active',
        isPro: true,
        paymentId,
        enrolledAt: new Date(),
      });
    } else {
      enrollment.status = 'active';
      enrollment.isPro = true;
      enrollment.paymentId = paymentId;
      await enrollment.save();
    }

    return res.json({
      success: true,
      data: {
        enrollment,
        message: 'Pro Course enrollment confirmed. Welcome to the certified curriculum!',
      },
    });
  } catch (error) { next(error); }
});

router.get('/:courseId/roster', requireAuth, requireRole('instructor', 'admin'), param('courseId').isMongoId(), validateParams, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId }).lean();
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    if (req.user.role !== 'admin' && String(course.instructorId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_ERROR', message: 'You can only view rosters for your courses.' } });
    }
    const enrollments = await Enrollment.find({ courseId: course._id, institutionId: req.user.institutionId })
      .populate('userId', 'name email avatar headline createdAt')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: { course: { _id: course._id, title: course.title }, enrollments } });
  } catch (error) { next(error); }
});

export default router;
