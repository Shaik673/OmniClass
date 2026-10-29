import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { connectDB, stopDB } from '../config/database.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Institution from '../models/Institution.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Quiz from '../assessments/Quiz.js';
import QuizAttempt from '../assessments/QuizAttempt.js';
import Discussion from '../discussions/Discussion.js';
import Certificate from '../certificates/Certificate.js';
import Notification from '../models/Notification.js';
import StudySession from '../progress/StudySession.js';
import { coursesData } from './coursesSeedData.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Development seed data cannot run in production.');
}

export async function seedDatabase() {
  console.log('Seeding institution: Northstar University...');
const institution = await Institution.findOneAndUpdate(
  { slug: 'northstar-university' },
  {
    $set: {
      name: 'Northstar University',
      slug: 'northstar-university',
      tagline: 'Empowering curious minds through intentional learning & AI innovation',
      domain: 'northstar.edu',
      departments: [
        'Computer Science & Engineering',
        'Artificial Intelligence & Data Systems',
        'Human-Centered Design & Media',
        'Sustainable Sciences & Energy',
        'Business Analytics & Management',
      ],
      branding: {
        logoText: 'Northstar',
        primaryColor: '#b7a6ff',
        accentColor: '#8ad9d4',
        welcomeBanner: 'Welcome to Northstar University OmniClass Learning Hub',
      },
      certificateSettings: {
        issuerTitle: 'Office of Academic Affairs & AI Learning',
        signatoryName: 'Dr. Eleanor Vance, Vice Chancellor',
        templateStyle: 'modern-academic',
      },
      settings: {
        enrollmentPolicy: 'open',
        externalAiEnabled: true,
        autoIssueCertificates: true,
        allowPublicRankings: true,
        allowStudentDiscussionCreation: true,
      },
    },
  },
  { new: true, upsert: true }
);

const password = process.env.DEV_SEED_PASSWORD || 'ChangeMe123!';
const passwordHash = await bcrypt.hash(password, 12);

console.log('Seeding users (Admin, Instructor, Student)...');

// 1. Admin
const admin = await User.findOneAndUpdate(
  { email: 'admin@northstar.local' },
  {
    $set: {
      name: 'Dean Arthur Pendelton',
      displayName: 'Dean Arthur',
      email: 'admin@northstar.local',
      passwordHash,
      role: 'admin',
      institutionId: institution.id,
      headline: 'Dean of Academic Technology & Institutional Planning',
      bio: 'Leading institutional academic transformation and ethical AI integration across colleges.',
      location: 'Cambridge, MA',
      status: 'active',
      emailVerifiedAt: new Date(),
      onboardingComplete: true,
      theme: 'dark',
      academic: {
        department: 'Academic Technology',
        degree: 'Ph.D. in Educational Informatics',
      },
    },
  },
  { new: true, upsert: true }
);

// 2. Instructor
const instructor = await User.findOneAndUpdate(
  { email: 'instructor@northstar.local' },
  {
    $set: {
      name: 'Dr. Maya Chen',
      displayName: 'Dr. Maya',
      email: 'instructor@northstar.local',
      passwordHash,
      role: 'instructor',
      institutionId: institution.id,
      headline: 'Professor of AI Architecture & Cognitive Systems',
      bio: 'Author of "Foundations of Human-Centered Intelligence" and principal investigator at Northstar AI Lab.',
      location: 'Boston, MA',
      status: 'active',
      emailVerifiedAt: new Date(),
      onboardingComplete: true,
      theme: 'dark',
      interests: ['AI', 'System Design', 'Neural Networks', 'Cognitive Science'],
      academic: {
        department: 'Artificial Intelligence & Data Systems',
        degree: 'Ph.D. in Computer Science',
      },
    },
  },
  { new: true, upsert: true }
);

// 3. Student
const student = await User.findOneAndUpdate(
  { email: 'student@northstar.local' },
  {
    $set: {
      name: 'Alex Morgan',
      displayName: 'Alex M.',
      username: 'alexmorgan',
      email: 'student@northstar.local',
      passwordHash,
      role: 'student',
      institutionId: institution.id,
      headline: 'Software Engineering & AI Systems Undergraduate',
      bio: 'Passionate about full-stack engineering, distributed systems, and applying generative AI to institutional learning.',
      location: 'Boston, MA',
      phone: '+1 (555) 234-5678',
      status: 'active',
      emailVerifiedAt: new Date(),
      onboardingComplete: true,
      theme: 'dark',
      interests: ['Machine Learning', 'Full-Stack Web', 'UI/UX Design', 'Cloud Architecture'],
      academic: {
        department: 'Computer Science & Engineering',
        degree: 'B.S. in Software Systems',
        studyLevel: 'Undergraduate',
        academicYear: 'Year 3',
        enrollmentYear: 2023,
        graduationYear: 2027,
        specializations: ['Machine Learning', 'Distributed Systems'],
      },
      professional: {
        careerObjective: 'Full-stack software architect specializing in scalable educational and enterprise AI platforms.',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'FastAPI', 'MongoDB', 'Docker', 'Tailwind CSS'],
        portfolioUrl: 'https://github.com/alexmorgan',
      },
      preferences: {
        preferredDifficulty: 'Intermediate',
        weeklyHoursGoal: 8,
        aiTutorStyle: 'clear',
        voiceSpeed: 1.0,
        studyReminders: true,
      },
      gamification: {
        points: 480,
        streakDays: 5,
        lastActiveAt: new Date(),
        badges: [
          { id: 'first_course', title: 'First Steps', description: 'Enrolled in your first course at Northstar.', icon: 'BookOpen', earnedAt: new Date(Date.now() - 10 * 86400000) },
          { id: 'quiz_master', title: 'Quiz Ace', description: 'Scored 90%+ on an objective module quiz.', icon: 'CircleHelp', earnedAt: new Date(Date.now() - 5 * 86400000) },
          { id: 'course_completer', title: 'Course Completer', description: 'Finished every lesson and earned a completion certificate.', icon: 'GraduationCap', earnedAt: new Date(Date.now() - 2 * 86400000) },
          { id: 'streak_5', title: 'Momentum Champion', description: 'Maintained a 5-day continuous learning streak.', icon: 'Flame', earnedAt: new Date() },
        ],
      },
      integrations: {
        github: {
          connected: true,
          username: 'alexmorgan-dev',
          profileUrl: 'https://github.com/alexmorgan-dev',
          avatarUrl: 'https://github.com/alexmorgan-dev.png',
          reposCount: 8,
          languages: ['TypeScript', 'JavaScript', 'Python', 'Rust'],
          pinnedRepos: [
            { name: 'omniclass-study-copilot', description: 'Context-aware study planner with Gemini integration', stars: 24, language: 'Python', url: 'https://github.com/alexmorgan-dev/omniclass-study-copilot' },
            { name: 'neural-graph-visualizer', description: 'Interactive WebGL visualization of neural activation layers', stars: 42, language: 'TypeScript', url: 'https://github.com/alexmorgan-dev/neural-graph-visualizer' },
          ],
          lastSyncAt: new Date(Date.now() - 3600000),
          status: 'Synced Successfully',
        },
        linkedin: {
          connected: true,
          profileUrl: 'https://www.linkedin.com/in/alexmorgan-cs',
          headline: 'Software Engineering Student @ Northstar | AI & Full-Stack Developer',
          lastSyncAt: new Date(Date.now() - 7200000),
          status: 'Connected (Link Only)',
          isLinkOnly: true,
        },
        leetcode: {
          connected: true,
          username: 'alex_codes_fast',
          profileUrl: 'https://leetcode.com/alex_codes_fast/',
          ranking: 64210,
          solvedTotal: 218,
          solvedEasy: 95,
          solvedMedium: 104,
          solvedHard: 19,
          lastSyncAt: new Date(Date.now() - 14400000),
          status: 'Synced Successfully',
          isManualVerified: false,
        },
      },
    },
  },
  { new: true, upsert: true }
);

console.log('Seeding courses with full curriculum modules and lessons...');

const createdCourses = [];
for (const entry of coursesData) {
  const course = await Course.findOneAndUpdate(
    { institutionId: institution.id, title: entry.title },
    {
      $set: {
        ...entry,
        institutionId: institution.id,
        instructorId: instructor.id,
        instructorName: instructor.name,
        status: 'published',
      },
    },
    { new: true, upsert: true }
  );
  createdCourses.push(course);
}

console.log('Seeding student enrollments and completed progress...');

// Enroll student in Course 0 (AI & ML) - In Progress (50%)
const aiCourse = createdCourses[0];
const aiEnrollment = await Enrollment.findOneAndUpdate(
  { userId: student.id, courseId: aiCourse.id },
  {
    $set: {
      institutionId: institution.id,
      userId: student.id,
      courseId: aiCourse.id,
      status: 'active',
      progress: 50,
      completedLessons: ['0.0', '0.1'],
      enrolledAt: new Date(Date.now() - 14 * 86400000),
      lastActivityAt: new Date(),
    },
  },
  { new: true, upsert: true }
);

// Enroll student in Course 1 (UI/UX) - Completed (100%) & Issued Certificate
const uxCourse = createdCourses[1];
const uxEnrollment = await Enrollment.findOneAndUpdate(
  { userId: student.id, courseId: uxCourse.id },
  {
    $set: {
      institutionId: institution.id,
      userId: student.id,
      courseId: uxCourse.id,
      status: 'completed',
      progress: 100,
      completedLessons: ['0.0', '0.1', '1.0'],
      enrolledAt: new Date(Date.now() - 30 * 86400000),
      completedAt: new Date(Date.now() - 2 * 86400000),
      lastActivityAt: new Date(Date.now() - 2 * 86400000),
    },
  },
  { new: true, upsert: true }
);

// Enroll student in Course 2 (Cloud) - Pending Approval
const cloudCourse = createdCourses[2];
await Enrollment.findOneAndUpdate(
  { userId: student.id, courseId: cloudCourse.id },
  {
    $set: {
      institutionId: institution.id,
      userId: student.id,
      courseId: cloudCourse.id,
      status: 'pending',
      progress: 0,
      completedLessons: [],
      enrolledAt: new Date(),
    },
  },
  { upsert: true }
);

// Save course to student library
student.savedCourseIds = [createdCourses[2]._id];
await student.save();

console.log('Seeding completion certificate for Alex Morgan...');
const certificateCode = 'OC-UX-2026-88421';
await Certificate.findOneAndUpdate(
  { certificateCode },
  {
    $set: {
      institutionId: institution.id,
      studentId: student.id,
      courseId: uxCourse.id,
      certificateCode,
      learnerName: student.name,
      courseTitle: uxCourse.title,
      institutionName: institution.name,
      issuedAt: new Date(Date.now() - 2 * 86400000),
      status: 'valid',
    },
  },
  { upsert: true }
);

console.log('Seeding published assignments with grading rubrics...');

const assignment1 = await Assignment.findOneAndUpdate(
  { courseId: aiCourse.id, title: 'Mathematical Formulation of Gradient Descent' },
  {
    $set: {
      institutionId: institution.id,
      courseId: aiCourse.id,
      instructorId: instructor.id,
      title: 'Mathematical Formulation of Gradient Descent',
      instructions: `Please provide a thorough written analysis (800-1,200 words) of the Gradient Descent optimization family.\n\n1. Contrast standard Batch Gradient Descent, Stochastic Gradient Descent (SGD), and Mini-batch SGD in terms of convergence stability and computational complexity.\n2. Explain the role of the learning rate hyperparameter and describe how momentum-based optimizers (e.g. Adam) navigate saddle points and ill-conditioned ravines.\n3. Include mathematical equations for the parameter update rule.`,
      dueAt: new Date(Date.now() + 5 * 86400000),
      maxMarks: 100,
      maxAttempts: 2,
      allowLate: true,
      status: 'published',
      rubric: [
        { criterion: 'Theoretical Depth & Mathematical Accuracy', maxPoints: 40, description: 'Correct update equations and clear distinction between batch, SGD, and mini-batch.' },
        { criterion: 'Optimization & Convergence Analysis', maxPoints: 35, description: 'Insightful discussion of learning rate schedules, momentum, and saddle point escape.' },
        { criterion: 'Formatting & Conceptual Clarity', maxPoints: 25, description: 'Professional scientific presentation and structured argumentation.' },
      ],
    },
  },
  { new: true, upsert: true }
);

const assignment2 = await Assignment.findOneAndUpdate(
  { courseId: uxCourse.id, title: 'Design System Token Architecture Specification' },
  {
    $set: {
      institutionId: institution.id,
      courseId: uxCourse.id,
      instructorId: instructor.id,
      title: 'Design System Token Architecture Specification',
      instructions: `Create an architectural specification document for an institutional dual-theme design system.\n\nExplain how semantic tokens (backgrounds, surfaces, borders, text, brand accents) bridge Figma design files to CSS Custom Properties. Address dark/light mode balance, accessibility contrast ratios, and interactive states.`,
      dueAt: new Date(Date.now() - 3 * 86400000),
      maxMarks: 100,
      maxAttempts: 2,
      allowLate: false,
      status: 'published',
      rubric: [
        { criterion: 'Token Architecture & Hierarchy', maxPoints: 40, description: 'Clear separation of global, semantic, and component-level tokens.' },
        { criterion: 'Accessibility & Contrast Compliance', maxPoints: 35, description: 'Explicit adherence to WCAG 2.1 AA standards for both dark and light modes.' },
        { criterion: 'Implementation Feasibility', maxPoints: 25, description: 'Drop-in CSS variables and practical component mappings.' },
      ],
    },
  },
  { new: true, upsert: true }
);

console.log('Seeding student submissions and released grades...');

// Graded & Published Submission for UX assignment
await Submission.findOneAndUpdate(
  { assignmentId: assignment2.id, studentId: student.id, attempt: 1 },
  {
    $set: {
      institutionId: institution.id,
      assignmentId: assignment2.id,
      courseId: uxCourse.id,
      studentId: student.id,
      attempt: 1,
      content: `OmniClass Design Token Architecture Specification\n\n1. Abstract\nThis specification establishes a robust design token system for institutional web applications. Rather than hardcoding static hex codes, tokens provide a single source of truth that translates design intentions across platforms.\n\n2. Three-Tier Token Hierarchy\n- Tier 1: Global Tokens (e.g., color-indigo-500, spacing-4)\n- Tier 2: Semantic Tokens (e.g., surface-primary, text-muted, border-subtle)\n- Tier 3: Component Tokens (e.g., card-radius, button-hover-bg)\n\n3. Dual-Theme Strategy\nDark mode utilizes a charcoal-slate palette (#11131a, #1b1d26) with 12px glassmorphic panels and subtle glowing borders. Light mode adopts warm off-white and mist pearl slate (#f0f1f4, #f8f8fa) rather than pure harsh white, ensuring comfortable readability and 7.2:1 contrast ratios.`,
      status: 'published',
      score: 96,
      feedback: 'Outstanding work, Alex! Your three-tier hierarchy is exceptionally well-articulated, and the decision to avoid blinding pure white in light mode demonstrates mature design sensibility.',
      rubricScores: [
        { criterion: 'Token Architecture & Hierarchy', pointsAwarded: 39, feedback: 'Comprehensive 3-tier hierarchy structure.' },
        { criterion: 'Accessibility & Contrast Compliance', pointsAwarded: 34, feedback: 'Strictly exceeds WCAG AA standards.' },
        { criterion: 'Implementation Feasibility', pointsAwarded: 23, feedback: 'Clean CSS custom property examples.' },
      ],
      aiFeedback: {
        analyzedAt: new Date(Date.now() - 4 * 86400000),
        strengths: ['Clear three-tier token architecture', 'Strong grounding in WCAG accessibility contrast requirements'],
        improvements: ['Could include automated CI token linting recommendations'],
        suggestedScore: 95,
        feedbackText: 'Very well-constructed design specification. Addresses all key design system challenges.',
      },
      gradedBy: instructor.id,
      gradedAt: new Date(Date.now() - 3 * 86400000),
      publishedAt: new Date(Date.now() - 3 * 86400000),
    },
  },
  { upsert: true }
);

console.log('Seeding quizzes and student attempts...');

const quiz1 = await Quiz.findOneAndUpdate(
  { courseId: aiCourse.id, title: 'Machine Learning Core Principles Check' },
  {
    $set: {
      institutionId: institution.id,
      courseId: aiCourse.id,
      title: 'Machine Learning Core Principles Check',
      instructions: 'Demonstrate your understanding of supervised learning workflows, loss metrics, and overfitting.',
      maxAttempts: 3,
      status: 'published',
      questions: [
        {
          prompt: 'Which loss function is most commonly utilized for binary logistic classification models?',
          options: ['Binary Cross-Entropy (Log Loss)', 'Mean Squared Error (MSE)', 'Huber Loss', 'Cosine Proximity'],
          correctIndex: 0,
        },
        {
          prompt: 'What is the primary indicator of high variance (overfitting) during training?',
          options: [
            'Both training and validation error remain equally high',
            'Low training error paired with significantly higher validation error',
            'The learning rate automatically decays to zero',
            'Model weights fail to change during gradient descent',
          ],
          correctIndex: 1,
        },
        {
          prompt: 'Why are non-linear activation functions necessary in multi-layer neural networks?',
          options: [
            'Without non-linearities, multiple linear layers collapse mathematically into a single linear transformation',
            'To accelerate matrix multiplication in GPUs',
            'To ensure that all weight values remain positive',
            'They are only needed when using stochastic gradient descent',
          ],
          correctIndex: 0,
        },
      ],
    },
  },
  { new: true, upsert: true }
);

// Quiz attempt for student
await QuizAttempt.findOneAndUpdate(
  { quizId: quiz1.id, studentId: student.id, attempt: 1 },
  {
    $set: {
      institutionId: institution.id,
      quizId: quiz1.id,
      studentId: student.id,
      attempt: 1,
      answers: [0, 1, 0],
      score: 100,
      submittedAt: new Date(Date.now() - 5 * 86400000),
    },
  },
  { upsert: true }
);

console.log('Seeding course discussions...');

const discThread = await Discussion.findOneAndUpdate(
  { courseId: aiCourse.id, parentId: null },
  {
    $set: {
      institutionId: institution.id,
      courseId: aiCourse.id,
      authorId: student.id,
      body: 'In Lesson 1.2 on cross-validation, how do we best balance K-fold partition count when working with highly imbalanced healthcare datasets? Should we always default to Stratified K-Fold?',
      status: 'active',
      replies: [
        {
          institutionId: institution.id,
          courseId: aiCourse.id,
          authorId: instructor.id,
          body: 'Excellent question, Alex! Yes, for imbalanced datasets Stratified K-Fold is practically mandatory because it ensures each fold preserves the identical class distribution as the complete population. Pair this with precision-recall AUC rather than raw ROC curves.',
          status: 'active',
          createdAt: new Date(Date.now() - 24 * 3600000),
        },
      ],
    },
  },
  { new: true, upsert: true }
);

console.log('Seeding notifications...');

const sampleNotifications = [
  {
    title: 'Grade Released: Design Tokens Specification',
    message: 'Dr. Maya Chen released your grade: 96 / 100 with comprehensive rubric feedback.',
    readAt: null,
  },
  {
    title: 'Certificate Issued: Human-Centered UI/UX',
    message: 'Congratulations! You have completed all course requirements and earned your verified credential (ID: OC-UX-2026-88421).',
    readAt: new Date(Date.now() - 86400000),
  },
  {
    title: 'Upcoming Deadline: Gradient Descent Analysis',
    message: 'Your assignment is due in 5 days. Remember to test your draft with the AI Feedback tool before submitting.',
    readAt: null,
  },
];

for (const notif of sampleNotifications) {
  await Notification.findOneAndUpdate(
    { userId: student.id, title: notif.title },
    { $set: { institutionId: institution.id, userId: student.id, ...notif, createdAt: new Date() } },
    { upsert: true }
  );
}

console.log('Seeding study planner sessions on the calendar...');

const sampleSessions = [
  { title: 'Neural Networks Architecture Review', plannedFor: new Date(Date.now() + 86400000), completed: false },
  { title: 'Gradient Descent Mathematical Derivations', plannedFor: new Date(Date.now() + 3 * 86400000), completed: false },
  { title: 'Distributed Systems CAP Theorem Reading', plannedFor: new Date(Date.now() + 6 * 86400000), completed: false },
  { title: 'UI/UX Accessibility Audit Practice', plannedFor: new Date(Date.now() - 2 * 86400000), completed: true },
];

for (const s of sampleSessions) {
  await StudySession.findOneAndUpdate(
    { userId: student.id, title: s.title },
    { $set: { institutionId: institution.id, userId: student.id, ...s } },
    { upsert: true }
  );
}

console.log('\n======================================================');
console.log(' OmniClass Seed Data Completed Successfully!');
console.log('======================================================');
console.log(`Institution:  Northstar University (northstar-university)`);
console.log(`Admin User:   admin@northstar.local      / ${password}`);
console.log(`Instructor:   instructor@northstar.local / ${password}`);
console.log(`Student User: student@northstar.local    / ${password}`);
  console.log('======================================================\n');
}

const isCLI = process.argv[1]?.includes('seed.js');
if (isCLI) {
  console.log('Connecting to database for seeding...');
  await connectDB();
  await seedDatabase();
  await stopDB();
  process.exit(0);
}
