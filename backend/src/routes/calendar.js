import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Assignment from '../models/Assignment.js';
import Enrollment from '../models/Enrollment.js';
import StudySession from '../progress/StudySession.js';
import Quiz from '../assessments/Quiz.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    // Get user's enrolled course IDs
    const enrollments = await Enrollment.find({
      userId: req.user.id,
      institutionId,
      status: { $in: ['active', 'completed', 'pending'] },
    }).distinct('courseId');

    const [assignments, sessions, quizzes] = await Promise.all([
      Assignment.find({
        institutionId,
        courseId: { $in: enrollments },
        status: 'published',
        dueAt: { $exists: true, $ne: null },
      }).populate('courseId', 'title category').lean(),

      StudySession.find({
        userId: req.user.id,
        institutionId,
      }).lean(),

      Quiz.find({
        institutionId,
        courseId: { $in: enrollments },
        status: 'published',
      }).populate('courseId', 'title').lean(),
    ]);

    const events = [];

    // Assignment deadlines
    for (const a of assignments) {
      events.push({
        id: `assignment-${a._id}`,
        title: `${a.title} (Due)`,
        courseTitle: a.courseId?.title || 'Coursework',
        type: 'deadline',
        start: a.dueAt,
        end: a.dueAt,
        completed: false,
        link: '/assignments',
        details: `${a.maxMarks} points · Max attempts: ${a.maxAttempts}`,
      });
    }

    // Study sessions
    for (const s of sessions) {
      events.push({
        id: `session-${s._id}`,
        title: s.title,
        courseTitle: 'Personal Study',
        type: 'study-session',
        start: s.plannedFor,
        end: s.plannedFor,
        completed: s.completed,
        link: '/planner',
        details: s.completed ? 'Completed' : 'Planned Session',
      });
    }

    // Quizzes
    for (const q of quizzes) {
      events.push({
        id: `quiz-${q._id}`,
        title: `${q.title} (Quiz Window)`,
        courseTitle: q.courseId?.title || 'Assessment',
        type: 'quiz',
        start: q.createdAt,
        end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Open for 2 weeks
        completed: false,
        link: '/assessments',
        details: `${q.questions?.length || 0} questions`,
      });
    }

    return res.json({
      success: true,
      data: { events },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
