import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Submission from '../models/Submission.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AuthorizationError } from '../middleware/errorHandler.js';

const router = Router();
const failValidation = (req, res) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() } });
};

router.get('/', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ userId: req.user.id, status: { $in: ['active', 'completed'] } }).select('courseId');
      const assignments = await Assignment.find({ institutionId: req.user.institutionId, courseId: { $in: enrollments.map((row) => row.courseId) }, status: 'published' }).populate('courseId', 'title').sort({ dueAt: 1 }).limit(100).lean();
      const submissions = await Submission.find({ studentId: req.user.id, assignmentId: { $in: assignments.map((row) => row._id) } }).sort({ attempt: -1 }).lean();
      const latest = new Map();
      for (const submission of submissions) if (!latest.has(String(submission.assignmentId))) latest.set(String(submission.assignmentId), submission);
      return res.json({ success: true, data: { assignments: assignments.map((assignment) => {
        const submission = latest.get(String(assignment._id));
        const mySubmission = submission && submission.status !== 'published'
          ? { _id: submission._id, attempt: submission.attempt, status: submission.status, submittedAt: submission.submittedAt }
          : submission || null;
        return { ...assignment, mySubmission };
      }) } });
    }
    const filter = req.user.role === 'admin' ? { institutionId: req.user.institutionId } : { institutionId: req.user.institutionId, instructorId: req.user.id };
    const assignments = await Assignment.find(filter).populate('courseId', 'title').sort({ updatedAt: -1 }).limit(100).lean();
    return res.json({ success: true, data: { assignments } });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireRole('instructor', 'admin'), body('courseId').isMongoId(), body('title').trim().isLength({ min: 3, max: 160 }), body('instructions').trim().isLength({ min: 10, max: 10000 }), body('maxMarks').optional().isInt({ min: 1, max: 10000 }), body('maxAttempts').optional().isInt({ min: 1, max: 10 }), async (req, res, next) => {
  const invalid = failValidation(req, res); if (invalid) return invalid;
  try {
    const course = await Course.findOne({ _id: req.body.courseId, institutionId: req.user.institutionId });
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found in your institution.' } });
    if (req.user.role !== 'admin' && String(course.instructorId) !== String(req.user.id)) return next(new AuthorizationError('You can only assign work in your courses.'));
    const assignment = await Assignment.create({ ...req.body, institutionId: req.user.institutionId, instructorId: req.user.id, status: req.body.status === 'published' && req.user.role === 'admin' ? 'published' : (req.body.status === 'published' ? 'published' : 'draft') });
    return res.status(201).json({ success: true, data: { assignment } });
  } catch (error) { next(error); }
});

router.post('/:assignmentId/submit', requireAuth, requireRole('student'), body('content').isString().trim().isLength({ min: 1, max: 20000 }), async (req, res, next) => {
  const invalid = failValidation(req, res); if (invalid) return invalid;
  try {
    const assignment = await Assignment.findOne({ _id: req.params.assignmentId, institutionId: req.user.institutionId, status: 'published' });
    if (!assignment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment unavailable.' } });
    const enrolled = await Enrollment.exists({ userId: req.user.id, institutionId: req.user.institutionId, courseId: assignment.courseId, status: 'active' });
    if (!enrolled) return next(new AuthorizationError('Active course enrollment is required to submit this assignment.'));
    const now = new Date();
    if (assignment.opensAt && now < assignment.opensAt) return res.status(409).json({ success: false, error: { code: 'NOT_OPEN', message: 'This assignment is not open yet.' } });
    if (assignment.status === 'closed' || (assignment.dueAt && now > assignment.dueAt && !assignment.allowLate)) return res.status(409).json({ success: false, error: { code: 'DEADLINE_PASSED', message: 'The submission window has closed.' } });
    const count = await Submission.countDocuments({ assignmentId: assignment.id, studentId: req.user.id });
    if (count >= assignment.maxAttempts) return res.status(409).json({ success: false, error: { code: 'ATTEMPTS_EXHAUSTED', message: 'You have used all available submission attempts.' } });
    const submission = await Submission.create({ institutionId: req.user.institutionId, assignmentId: assignment.id, courseId: assignment.courseId, studentId: req.user.id, attempt: count + 1, content: req.body.content });
    return res.status(201).json({ success: true, data: { submission } });
  } catch (error) { next(error); }
});

router.get('/:assignmentId/submissions', requireAuth, requireRole('instructor', 'admin'), async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.assignmentId, institutionId: req.user.institutionId });
    if (!assignment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found.' } });
    if (req.user.role !== 'admin' && String(assignment.instructorId) !== String(req.user.id)) return next(new AuthorizationError());
    const submissions = await Submission.find({ assignmentId: assignment.id }).populate('studentId', 'name email').sort({ submittedAt: 1 }).lean();
    return res.json({ success: true, data: { submissions } });
  } catch (error) { next(error); }
});

router.patch('/submissions/:submissionId/grade', requireAuth, requireRole('instructor', 'admin'), body('score').isFloat({ min: 0 }), body('feedback').optional().isString().isLength({ max: 5000 }), async (req, res, next) => {
  const invalid = failValidation(req, res); if (invalid) return invalid;
  try {
    const submission = await Submission.findOne({ _id: req.params.submissionId, institutionId: req.user.institutionId }).populate('assignmentId');
    if (!submission || !submission.assignmentId) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found.' } });
    if (req.user.role !== 'admin' && String(submission.assignmentId.instructorId) !== String(req.user.id)) return next(new AuthorizationError());
    if (Number(req.body.score) > submission.assignmentId.maxMarks) return res.status(400).json({ success: false, error: { code: 'INVALID_SCORE', message: `Score cannot exceed ${submission.assignmentId.maxMarks}.` } });
    submission.score = Number(req.body.score); submission.feedback = req.body.feedback || ''; submission.gradedBy = req.user.id; submission.gradedAt = new Date(); submission.status = 'graded';
    await submission.save();
    return res.json({ success: true, data: { submission } });
  } catch (error) { next(error); }
});

router.post('/submissions/:submissionId/publish-grade', requireAuth, requireRole('instructor', 'admin'), async (req, res, next) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.submissionId, institutionId: req.user.institutionId }).populate('assignmentId');
    if (!submission || !submission.assignmentId) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found.' } });
    if (req.user.role !== 'admin' && String(submission.assignmentId.instructorId) !== String(req.user.id)) return next(new AuthorizationError());
    if (submission.status !== 'graded') return res.status(409).json({ success: false, error: { code: 'NOT_READY', message: 'Grade this submission before publishing it.' } });
    submission.status = 'published'; submission.publishedAt = new Date(); await submission.save();
    return res.json({ success: true, data: { submission } });
  } catch (error) { next(error); }
});

export default router;
