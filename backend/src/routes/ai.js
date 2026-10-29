import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { AIOrchestrator } from '../services/aiOrchestrator.js';
import Enrollment from '../models/Enrollment.js';

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

// ─── 1. AI TUTOR MESSAGE ───────────────────────────────────────────────────
router.post(
  '/tutor/message',
  requireAuth,
  aiLimiter,
  body('message').isString().trim().isLength({ min: 1, max: 4000 }),
  body('courseId').optional().isMongoId(),
  body('explanationStyle').optional().isIn(['clear', 'step_by_step', 'examples']),
  body('history').optional().isArray({ max: 20 }),
  validate,
  async (req, res, next) => {
    try {
      if (req.body.courseId) {
        const enrolled = await Enrollment.exists({
          userId: req.user.id,
          institutionId: req.user.institutionId,
          courseId: req.body.courseId,
          status: { $in: ['active', 'completed', 'pending'] },
        });
        if (!enrolled && req.user.role === 'student') {
          return res.status(403).json({
            success: false,
            error: { code: 'COURSE_ACCESS_REQUIRED', message: 'Enroll in this course before using its materials with the tutor.' },
          });
        }
      }

      const result = await AIOrchestrator.tutorMessage({
        userId: req.user.id,
        institutionId: req.user.institutionId,
        courseId: req.body.courseId,
        message: req.body.message,
        style: req.body.explanationStyle || 'clear',
        history: req.body.history || [],
      });

      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 2. AI STUDY PLANNER GENERATOR ─────────────────────────────────────────
router.post(
  '/planner/generate',
  requireAuth,
  aiLimiter,
  body('weeklyHours').optional().isInt({ min: 1, max: 40 }),
  body('goals').optional().trim().isLength({ max: 300 }),
  validate,
  async (req, res, next) => {
    try {
      const result = await AIOrchestrator.generateStudyPlan({
        userId: req.user.id,
        institutionId: req.user.institutionId,
        weeklyHours: req.body.weeklyHours || 6,
        goals: req.body.goals || 'Master current coursework and maintain learning streak',
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 3. AI QUIZ & FLASHCARD GENERATOR ──────────────────────────────────────
router.post(
  '/quiz/generate',
  requireAuth,
  aiLimiter,
  body('topic').trim().isLength({ min: 2, max: 200 }).withMessage('Provide a topic to generate practice questions for.'),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All levels']),
  body('questionCount').optional().isInt({ min: 1, max: 30 }),
  validate,
  async (req, res, next) => {
    try {
      const result = await AIOrchestrator.generateQuiz({
        topic: req.body.topic,
        difficulty: req.body.difficulty || 'Intermediate',
        questionCount: req.body.questionCount || 15,
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 4. AI NOTES & CONTENT SUMMARIZER ──────────────────────────────────────
router.post(
  '/summarizer/summarize',
  requireAuth,
  aiLimiter,
  body('text').optional().trim(),
  body('youtubeUrl').optional().trim(),
  body('fileType').optional().trim(),
  body('format').optional().isIn(['standard', 'cheat_sheet', 'bullet_points']),
  validate,
  async (req, res, next) => {
    try {
      const { text = '', youtubeUrl = '', fileType = '', format = 'standard' } = req.body;
      if (!text && !youtubeUrl) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Provide text, a document upload, or a YouTube URL to summarize.' },
        });
      }
      const result = await AIOrchestrator.summarizeContent({
        text,
        youtubeUrl,
        fileType,
        format,
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 5. AI INSTRUCTOR COPILOT ──────────────────────────────────────────────
router.post(
  '/copilot/draft',
  requireAuth,
  requireRole('instructor', 'admin'),
  aiLimiter,
  body('taskType').isIn(['syllabus', 'rubric', 'assignment', 'questions', 'announcement']).withMessage('Invalid task type.'),
  body('title').trim().isLength({ min: 3, max: 160 }),
  body('category').optional().trim().isLength({ max: 80 }),
  body('context').optional().trim().isLength({ max: 2000 }),
  validate,
  async (req, res, next) => {
    try {
      const result = await AIOrchestrator.instructorCopilot({
        taskType: req.body.taskType,
        title: req.body.title,
        category: req.body.category || 'General Studies',
        context: req.body.context || '',
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 6. AI ASSIGNMENT FEEDBACK ─────────────────────────────────────────────
router.post(
  '/feedback/analyze',
  requireAuth,
  aiLimiter,
  body('submissionContent').trim().isLength({ min: 10, max: 20000 }),
  body('instructions').optional().trim().isLength({ max: 5000 }),
  body('maxMarks').optional().isInt({ min: 1 }),
  validate,
  async (req, res, next) => {
    try {
      const result = await AIOrchestrator.analyzeFeedback({
        submissionContent: req.body.submissionContent,
        instructions: req.body.instructions || 'Review this submission for clarity, accuracy, and completeness.',
        maxMarks: req.body.maxMarks || 100,
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 7. AI VOICE TUTOR ─────────────────────────────────────────────────────
router.post(
  '/voice/interact',
  requireAuth,
  aiLimiter,
  body('transcript').trim().isLength({ min: 1, max: 2000 }).withMessage('Transcript required.'),
  body('courseId').optional().isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const result = await AIOrchestrator.tutorMessage({
        userId: req.user.id,
        institutionId: req.user.institutionId,
        courseId: req.body.courseId,
        message: req.body.transcript,
        style: 'clear',
      });

      return res.json({
        success: true,
        data: {
          transcript: req.body.transcript,
          spokenResponse: result.content,
          provider: result.provider,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 8. AI COURSE RECOMMENDATIONS ──────────────────────────────────────────
router.get('/recommendations', requireAuth, async (req, res, next) => {
  try {
    const result = await AIOrchestrator.recommendCourses({
      userId: req.user.id,
      institutionId: req.user.institutionId,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
