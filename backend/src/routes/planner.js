import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import StudySession from '../progress/StudySession.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() } });
};

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const sessions = await StudySession.find({ userId: req.user.id, institutionId: req.user.institutionId }).sort({ plannedFor: 1 }).limit(200).lean();
    return res.json({ success: true, data: { sessions } });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, body('title').trim().isLength({ min: 1, max: 160 }), body('plannedFor').optional().isISO8601(), validate, async (req, res, next) => {
  try {
    const session = await StudySession.create({ institutionId: req.user.institutionId, userId: req.user.id, title: req.body.title, plannedFor: req.body.plannedFor || new Date() });
    return res.status(201).json({ success: true, data: { session } });
  } catch (error) { next(error); }
});

router.patch('/:sessionId', requireAuth, param('sessionId').isMongoId(), body('completed').isBoolean(), validate, async (req, res, next) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.sessionId, institutionId: req.user.institutionId, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Study session not found.' } });
    session.completed = req.body.completed;
    session.completedAt = session.completed ? new Date() : undefined;
    await session.save();
    return res.json({ success: true, data: { session } });
  } catch (error) { next(error); }
});

router.delete('/:sessionId', requireAuth, param('sessionId').isMongoId(), validate, async (req, res, next) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.sessionId, institutionId: req.user.institutionId, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Study session not found.' } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) { next(error); }
});

export default router;
