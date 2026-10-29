import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Quiz from '../assessments/Quiz.js';
import QuizAttempt from '../assessments/QuizAttempt.js';
import { gradeAnswers } from '../assessments/scoring.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const validation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() } });
};
const publicQuiz = (quiz) => ({ ...quiz, questions: (quiz.questions || []).map(({ correctIndex, ...question }) => question) });

router.get('/', requireAuth, async (req, res, next) => {
  try {
    let filter = { institutionId: req.user.institutionId };
    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ userId: req.user.id, institutionId: req.user.institutionId, status: { $in: ['active', 'completed'] } }).select('courseId').lean();
      filter = { ...filter, courseId: { $in: enrollments.map((enrollment) => enrollment.courseId) }, status: 'published' };
    } else if (req.user.role === 'instructor') filter.instructorId = req.user.id;
    const quizzes = await Quiz.find(filter).populate('courseId', 'title').sort({ updatedAt: -1 }).limit(100).lean();
    const attempts = req.user.role === 'student' ? await QuizAttempt.find({ studentId: req.user.id, quizId: { $in: quizzes.map((quiz) => quiz._id) } }).sort({ attempt: -1 }).lean() : [];
    const latest = new Map();
    for (const attempt of attempts) if (!latest.has(String(attempt.quizId))) latest.set(String(attempt.quizId), { attempt: attempt.attempt, score: attempt.score, submittedAt: attempt.submittedAt });
    return res.json({ success: true, data: { quizzes: quizzes.map((quiz) => ({ ...publicQuiz(quiz), latestAttempt: latest.get(String(quiz._id)) || null })) } });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireRole('instructor', 'admin'), body('courseId').isMongoId(), body('title').trim().isLength({ min: 3, max: 160 }), body('questions').isArray({ min: 1, max: 50 }), body('maxAttempts').optional().isInt({ min: 1, max: 10 }), validation, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.body.courseId, institutionId: req.user.institutionId });
    if (!course) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    if (req.user.role !== 'admin' && String(course.instructorId) !== String(req.user.id)) return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_ERROR', message: 'You can only create quizzes for your courses.' } });
    const questions = req.body.questions.map((question) => ({ prompt: String(question.prompt || '').trim(), options: Array.isArray(question.options) ? question.options.map((option) => String(option).trim()) : [], correctIndex: Number(question.correctIndex) }));
    const invalid = questions.find((question) => question.prompt.length < 3 || question.options.length < 2 || question.options.length > 8 || question.options.some((option) => !option || option.length > 300) || !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.options.length);
    if (invalid) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Each question needs a prompt, two to eight options, and a valid correct option.' } });
    const quiz = await Quiz.create({ institutionId: req.user.institutionId, courseId: course.id, instructorId: req.user.id, title: req.body.title, instructions: req.body.instructions || '', questions, maxAttempts: req.body.maxAttempts || 1, status: req.body.status === 'draft' ? 'draft' : 'published' });
    return res.status(201).json({ success: true, data: { quiz: publicQuiz(quiz.toObject()) } });
  } catch (error) { next(error); }
});

router.post('/:quizId/attempts', requireAuth, requireRole('student'), body('answers').isArray({ min: 1, max: 50 }), validation, async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, institutionId: req.user.institutionId, status: 'published' }).select('+questions.correctIndex');
    if (!quiz) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Quiz is unavailable.' } });
    const enrolled = await Enrollment.exists({ userId: req.user.id, institutionId: req.user.institutionId, courseId: quiz.courseId, status: { $in: ['active', 'completed'] } });
    if (!enrolled) return res.status(403).json({ success: false, error: { code: 'ENROLLMENT_REQUIRED', message: 'Enroll in the course before taking this quiz.' } });
    const answers = req.body.answers.map(Number);
    if (answers.length !== quiz.questions.length || answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= quiz.questions[index].options.length)) return res.status(400).json({ success: false, error: { code: 'INVALID_ANSWERS', message: 'Choose one valid answer for every question.' } });
    const attemptCount = await QuizAttempt.countDocuments({ quizId: quiz.id, studentId: req.user.id });
    if (attemptCount >= quiz.maxAttempts) return res.status(409).json({ success: false, error: { code: 'ATTEMPTS_EXHAUSTED', message: 'You have used all available attempts.' } });
    const result = gradeAnswers(quiz.questions, answers);
    const attempt = await QuizAttempt.create({ institutionId: req.user.institutionId, quizId: quiz.id, courseId: quiz.courseId, studentId: req.user.id, attempt: attemptCount + 1, answers, score: result.score });
    return res.status(201).json({ success: true, data: { attempt: { _id: attempt.id, attempt: attempt.attempt, score: attempt.score, submittedAt: attempt.submittedAt }, review: result.review } });
  } catch (error) { next(error); }
});

export default router;
