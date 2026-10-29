import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Discussion from '../discussions/Discussion.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() } });
};

async function canAccessCourse(user, course) {
  if (String(user.institutionId) !== String(course.institutionId)) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'instructor' && String(course.instructorId) === String(user.id)) return true;
  return Boolean(await Enrollment.exists({ userId: user.id, institutionId: course.institutionId, courseId: course.id, status: { $in: ['active', 'completed'] } }));
}

router.get('/courses/:courseId', requireAuth, param('courseId').isMongoId(), validate, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId, status: 'published' }).select('_id institutionId instructorId title');
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    if (!(await canAccessCourse(req.user, course))) return res.status(403).json({ success: false, error: { code: 'ENROLLMENT_REQUIRED', message: 'Course enrollment is required to view discussions.' } });
    const page = Math.max(1, Number(req.query.page) || 1);
    const roots = await Discussion.find({ institutionId: course.institutionId, courseId: course.id, parentId: null, status: 'active' }).populate('authorId', 'name role').sort({ pinnedAt: -1, createdAt: -1 }).skip((page - 1) * 20).limit(20).lean();
    const replies = roots.length ? await Discussion.find({ institutionId: course.institutionId, courseId: course.id, parentId: { $in: roots.map((thread) => thread._id) }, status: { $in: ['active', 'removed'] } }).populate('authorId', 'name role').sort({ createdAt: 1 }).limit(200).lean() : [];
    const byParent = new Map(roots.map((thread) => [String(thread._id), []]));
    for (const reply of replies) byParent.get(String(reply.parentId))?.push(reply);
    return res.json({ success: true, data: { course: { _id: course.id, title: course.title }, discussions: roots.map((thread) => ({ ...thread, replies: byParent.get(String(thread._id)) || [] })), page } });
  } catch (error) { next(error); }
});

router.post('/courses/:courseId', requireAuth, param('courseId').isMongoId(), body('body').isString().trim().isLength({ min: 1, max: 5000 }), body('parentId').optional({ nullable: true }).isMongoId(), validate, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, institutionId: req.user.institutionId, status: 'published' }).select('_id institutionId instructorId');
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    if (!(await canAccessCourse(req.user, course))) return res.status(403).json({ success: false, error: { code: 'ENROLLMENT_REQUIRED', message: 'Course enrollment is required to post.' } });
    let parentId = req.body.parentId || null;
    if (parentId) {
      const parent = await Discussion.findOne({ _id: parentId, institutionId: course.institutionId, courseId: course.id, parentId: null, status: 'active' }).select('_id');
      if (!parent) return res.status(404).json({ success: false, error: { code: 'THREAD_NOT_FOUND', message: 'Discussion thread not found.' } });
    }
    const discussion = await Discussion.create({ institutionId: course.institutionId, courseId: course.id, authorId: req.user.id, parentId, body: req.body.body });
    await discussion.populate('authorId', 'name role');
    return res.status(201).json({ success: true, data: { discussion } });
  } catch (error) { next(error); }
});

router.delete('/:discussionId', requireAuth, param('discussionId').isMongoId(), validate, async (req, res, next) => {
  try {
    const discussion = await Discussion.findOne({ _id: req.params.discussionId, institutionId: req.user.institutionId, status: 'active' });
    if (!discussion) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Discussion not found.' } });
    const course = await Course.findOne({ _id: discussion.courseId, institutionId: req.user.institutionId }).select('_id instructorId');
    const isOwner = String(discussion.authorId) === String(req.user.id);
    const canModerate = req.user.role === 'admin' || (req.user.role === 'instructor' && String(course?.instructorId) === String(req.user.id));
    if (!isOwner && !canModerate) return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_ERROR', message: 'You can only remove your own posts.' } });
    discussion.status = 'removed';
    await discussion.save();
    return res.json({ success: true, data: { removed: true, discussionId: discussion.id } });
  } catch (error) { next(error); }
});

export default router;
