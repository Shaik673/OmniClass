# OmniClass LMS — Technical Design Document

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Service Responsibilities](#3-service-responsibilities)
4. [Data Architecture](#4-data-architecture)
5. [API Architecture](#5-api-architecture)
6. [AI Subsystem Design](#6-ai-subsystem-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Low-Level Design](#9-low-level-design)
10. [Security Architecture](#10-security-architecture)
11. [Infrastructure & DevOps](#11-infrastructure--devops)

---

## 1. System Overview

OmniClass is a production-grade, AI-powered, multi-tenant Learning Management System serving colleges, universities, and training organizations. It combines a full institutional learning platform with personalized AI tutoring, academic profile management, developer integrations, analytics, assessments, and administrative control.

### Core Portals

| Portal | Primary Users | Core Capabilities |
|--------|--------------|-------------------|
| Public Website | Visitors, Prospective Students | Course discovery, marketing, enrollment entry |
| Student Portal | Students | Learning, assessments, AI tutoring, progress tracking |
| Instructor Portal | Instructors | Course authoring, grading, analytics, AI Copilot |
| Admin Portal | Administrators | Institutional management, analytics, configuration |
| AI Workspace | All authenticated users | Tutoring, study planning, quiz generation, summarization |

---

## 2. High-Level Architecture

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │              React + Vite SPA (Browser)                      │  │
│   │  Public Site │ Student Portal │ Instructor │ Admin │ AI UI   │  │
│   └──────────────────────┬───────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────────┘
                           │ HTTPS / REST / SSE
┌─────────────────────────▼───────────────────────────────────────────┐
│                       API GATEWAY / REVERSE PROXY                    │
│                  (Nginx / Caddy — TLS termination, routing)          │
└────────┬────────────────────────────────────┬───────────────────────┘
         │                                    │
         ▼                                    ▼
┌────────────────────┐              ┌─────────────────────┐
│   Express.js API   │              │   FastAPI AI Service │
│   (Node.js)        │◄────────────►│   (Python)          │
│                    │  Internal    │                     │
│  Auth & Sessions   │  HTTP/gRPC   │  LLM Orchestration  │
│  Business Logic    │              │  RAG Pipeline       │
│  REST Endpoints    │              │  Embeddings         │
│  Background Jobs   │              │  Vector Search      │
│  File Orchestration│              │  Model Inference    │
│  Notifications     │              │  Gemini Fallback    │
└────────┬───────────┘              └──────────┬──────────┘
         │                                     │
    ┌────▼────┐  ┌──────────┐  ┌────────┐  ┌──▼──────────┐
    │ MongoDB │  │  Redis   │  │  S3 /  │  │  Vector DB  │
    │         │  │  Cache + │  │  Minio │  │  (Qdrant /  │
    │ Primary │  │  Queue   │  │  Object│  │  Weaviate / │
    │ Database│  │  (BullMQ)│  │Storage │  │  pgvector)  │
    └─────────┘  └──────────┘  └────────┘  └─────────────┘
         │
    ┌────▼──────────────────────────┐
    │     External Providers        │
    │  Google OAuth │ GitHub OAuth  │
    │  Facebook OAuth │ Gemini API  │
    │  SendGrid / SMTP │ LeetCode   │
    │  LinkedIn API                 │
    └───────────────────────────────┘
```

### 2.2 Network Zones

| Zone | Components | Access Rules |
|------|-----------|--------------|
| Public | Nginx/Caddy, React SPA | Internet-accessible |
| DMZ | Express API (port 3000) | Public-facing via proxy only |
| Private | FastAPI (port 8000), Redis, MongoDB | No direct external access |
| Storage | S3/MinIO | Access via signed URLs only |

### 2.3 Multi-Tenant Scoping

Every resource is scoped to an `institutionId`. Middleware enforces tenant isolation at the API layer. Cross-institution access is blocked unless explicit super-admin permissions exist.

```
Institution A ──► Departments ──► Programs ──► Courses ──► Enrollments
                                              └──► Instructors
                                              └──► Students
```

---

## 3. Service Responsibilities

### 3.1 Express.js API (Main Backend)

**Responsibilities:**
- Authentication (JWT + refresh tokens, OAuth callbacks)
- Authorization (RBAC middleware, resource ownership checks)
- All REST API endpoints
- Business logic (enrollment rules, grading policies, certificate eligibility)
- Orchestrating AI requests to FastAPI
- Background job scheduling via BullMQ
- Notification dispatch
- File upload orchestration (signed URL generation, metadata storage)
- WebSocket/SSE for real-time notifications

**Key Modules:**
```
src/
├── auth/           # Passport.js strategies, JWT, OAuth
├── users/          # User CRUD, profile management
├── institutions/   # Institution, department, program management
├── courses/        # Course, module, lesson CRUD
├── enrollments/    # Enrollment workflows
├── assessments/    # Assignments, quizzes, submissions
├── grading/        # Grading, rubrics, grade release
├── progress/       # Progress tracking, activity events
├── certificates/   # Certificate generation, verification
├── ai/             # AI request proxy to FastAPI
├── notifications/  # In-app + email notifications
├── discussions/    # Announcements, threads, replies
├── analytics/      # Aggregated reports, dashboards
├── integrations/   # GitHub, LinkedIn, LeetCode OAuth
├── files/          # Upload, download, signed URL handling
├── jobs/           # BullMQ job definitions and processors
├── middleware/      # Auth, tenant, validation, error, rate-limit
└── utils/          # Helpers, constants, formatters
```

### 3.2 FastAPI AI Service

**Responsibilities:**
- LLM orchestration (primary model + Gemini fallback)
- RAG pipeline: ingest, chunk, embed, retrieve, generate
- AI feature endpoints: tutor, study planner, quiz generator, summarizer, copilot, feedback, voice, recommendations
- Vector database management
- Document processing jobs
- Embedding generation and storage
- AI routing logic and fallback decisions

**Key Modules:**
```
app/
├── routers/
│   ├── tutor.py          # AI Learning Tutor
│   ├── planner.py        # Study Planner
│   ├── quiz.py           # Quiz & Flashcard Generator
│   ├── summarizer.py     # Notes & Content Summarizer
│   ├── copilot.py        # Instructor Copilot
│   ├── feedback.py       # Assignment Feedback
│   ├── voice.py          # Voice Tutor
│   └── recommendations.py
├── rag/
│   ├── ingestion.py      # Document chunking & indexing
│   ├── retrieval.py      # Vector search & context assembly
│   └── embeddings.py     # Embedding model interface
├── llm/
│   ├── orchestrator.py   # Primary → fallback routing
│   ├── primary.py        # Local/internal model interface
│   └── gemini.py         # Gemini API client
├── models/               # Pydantic schemas
├── services/             # Business logic per feature
└── utils/                # Tokenization, formatting, validation
```

### 3.3 Frontend (React + Vite)

**Responsibilities:**
- Multi-portal SPA routing (public, student, instructor, admin)
- Reusable component library
- Theme system (dark/light/system)
- API service layer (Axios instances, interceptors)
- State management (Zustand or React Context + useReducer)
- Real-time notifications (SSE or WebSocket)
- File upload UI with progress
- Chart rendering (Recharts or Chart.js)
- Voice interaction (Web Speech API)

---

## 4. Data Architecture

### 4.1 MongoDB Collections

#### Core Identity

```javascript
// institutions
{
  _id: ObjectId,
  name: String,                    // required, unique
  slug: String,                    // URL-safe identifier
  domain: String,                  // email domain for auto-association
  logo: String,                    // storage key
  branding: {
    primaryColor: String,
    secondaryColor: String,
    darkLogo: String,
    lightLogo: String
  },
  settings: {
    enrollmentPolicy: Enum['open','approval','invitation'],
    academicCalendarEnabled: Boolean,
    certificatesEnabled: Boolean,
    aiEnabled: Boolean,
    maxStorageGB: Number,
    allowedFileTypes: [String]
  },
  address: { street, city, state, country, postalCode },
  contactEmail: String,
  status: Enum['active','suspended','trial'],
  createdAt: Date,
  updatedAt: Date
}

// departments
{
  _id: ObjectId,
  institutionId: ObjectId,         // ref: institutions
  name: String,
  code: String,
  headUserId: ObjectId,            // ref: users
  description: String,
  status: Enum['active','inactive'],
  createdAt: Date,
  updatedAt: Date
}

// academicPrograms
{
  _id: ObjectId,
  institutionId: ObjectId,
  departmentId: ObjectId,
  name: String,
  code: String,
  degree: String,
  durationYears: Number,
  description: String,
  status: Enum['active','inactive'],
  createdAt: Date,
  updatedAt: Date
}

// academicTerms
{
  _id: ObjectId,
  institutionId: ObjectId,
  name: String,                    // e.g. "Fall 2026"
  startDate: Date,
  endDate: Date,
  registrationOpenDate: Date,
  registrationCloseDate: Date,
  status: Enum['upcoming','active','completed','archived'],
  createdAt: Date,
  updatedAt: Date
}
```

#### Users & Auth

```javascript
// users
{
  _id: ObjectId,
  institutionId: ObjectId,
  email: String,                   // unique, indexed
  passwordHash: String,            // bcrypt, nullable for OAuth-only
  emailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  roles: [Enum['student','instructor','admin','super_admin']],
  status: Enum['pending','active','suspended','deactivated'],
  lastLoginAt: Date,
  loginAttempts: Number,
  lockUntil: Date,
  onboardingCompleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// userProfiles
{
  _id: ObjectId,
  userId: ObjectId,                // ref: users, unique
  institutionId: ObjectId,
  // Personal
  firstName: String,
  lastName: String,
  displayName: String,
  username: String,                // unique
  avatar: String,                  // storage key
  phone: String,
  location: { city, country },
  bio: String,
  language: String,
  timezone: String,
  profileVisibility: Enum['public','institution','private'],
  profileCompletionScore: Number,
  // Academic
  departmentId: ObjectId,
  programId: ObjectId,
  academicYear: String,
  enrollmentYear: Number,
  expectedGraduation: Number,
  learningGoals: [String],
  interests: [String],
  skills: [String],
  // Professional
  headline: String,
  careerObjective: String,
  portfolioLinks: [{ title: String, url: String }],
  resumeKey: String,               // private storage key
  linkedinUrl: String,
  githubUrl: String,
  leetcodeUsername: String,
  // Learning Preferences
  preferredDifficulty: Enum['beginner','intermediate','advanced'],
  weeklyStudyHours: Number,
  studyReminderEnabled: Boolean,
  studyReminderTime: String,
  aiTutorPreferences: { style: String, language: String },
  // Theme
  themePreference: Enum['dark','light','system'],
  createdAt: Date,
  updatedAt: Date
}

// sessions (refresh token tracking)
{
  _id: ObjectId,
  userId: ObjectId,
  refreshToken: String,            // hashed
  deviceInfo: String,
  ipAddress: String,
  expiresAt: Date,
  revokedAt: Date,
  createdAt: Date
}

// oauthAccounts
{
  _id: ObjectId,
  userId: ObjectId,
  provider: Enum['google','facebook','github','linkedin'],
  providerAccountId: String,
  accessToken: String,             // encrypted at rest
  refreshToken: String,            // encrypted at rest
  tokenExpiry: Date,
  scope: [String],
  profileData: Object,             // provider-specific public data
  status: Enum['connected','disconnected','expired','error'],
  lastSyncAt: Date,
  lastError: String,
  createdAt: Date,
  updatedAt: Date
}

// invitations
{
  _id: ObjectId,
  institutionId: ObjectId,
  email: String,
  role: String,
  invitedBy: ObjectId,
  token: String,                   // hashed, single-use
  expiresAt: Date,
  usedAt: Date,
  status: Enum['pending','accepted','expired','revoked'],
  createdAt: Date
}
```

#### Courses & Content

```javascript
// courses
{
  _id: ObjectId,
  institutionId: ObjectId,
  departmentId: ObjectId,
  termId: ObjectId,
  title: String,
  slug: String,
  description: String,
  longDescription: String,
  thumbnail: String,               // storage key
  category: String,
  tags: [String],
  difficulty: Enum['beginner','intermediate','advanced'],
  language: String,
  duration: Number,                // estimated hours
  prerequisites: [ObjectId],       // ref: courses
  learningOutcomes: [String],
  enrollmentPolicy: Enum['open','approval','invitation'],
  maxEnrollments: Number,
  status: Enum['draft','pending_review','published','archived'],
  publishedAt: Date,
  approvedBy: ObjectId,
  approvalNotes: String,
  totalLessons: Number,            // denormalized counter
  totalDuration: Number,
  rating: Number,
  reviewCount: Number,
  createdBy: ObjectId,
  instructors: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}

// sections
{
  _id: ObjectId,
  courseId: ObjectId,
  title: String,
  description: String,
  order: Number,
  status: Enum['draft','published'],
  createdAt: Date,
  updatedAt: Date
}

// modules
{
  _id: ObjectId,
  courseId: ObjectId,
  sectionId: ObjectId,
  title: String,
  description: String,
  order: Number,
  prerequisiteModuleId: ObjectId,
  unlockCondition: Enum['immediate','on_completion','on_date'],
  unlockDate: Date,
  status: Enum['draft','published'],
  createdAt: Date,
  updatedAt: Date
}

// lessons
{
  _id: ObjectId,
  courseId: ObjectId,
  moduleId: ObjectId,
  title: String,
  description: String,
  type: Enum['video','text','document','presentation','link','download'],
  content: {
    // type=video
    videoUrl: String,
    videoDuration: Number,
    transcript: String,
    // type=text
    richText: String,
    // type=document/presentation
    fileKey: String,
    fileName: String,
    // type=link
    externalUrl: String,
    // type=download
    downloadKey: String,
    downloadName: String
  },
  order: Number,
  estimatedDuration: Number,       // minutes
  isFree: Boolean,                 // accessible without enrollment
  status: Enum['draft','published'],
  vectorIndexed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Enrollments & Progress

```javascript
// enrollments
{
  _id: ObjectId,
  institutionId: ObjectId,
  courseId: ObjectId,
  userId: ObjectId,
  status: Enum['pending','active','waitlisted','rejected','completed','withdrawn'],
  enrolledAt: Date,
  completedAt: Date,
  withdrawnAt: Date,
  completionPercentage: Number,
  grade: Number,
  certificateId: ObjectId,
  approvedBy: ObjectId,
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date,
  // Compound index: { userId, courseId } unique
}

// lessonProgress
{
  _id: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId,
  status: Enum['not_started','in_progress','completed'],
  progressPercent: Number,
  lastPosition: Number,            // video position in seconds
  completedAt: Date,
  timeSpent: Number,               // seconds
  createdAt: Date,
  updatedAt: Date
}

// activityEvents
{
  _id: ObjectId,
  userId: ObjectId,
  institutionId: ObjectId,
  eventType: Enum['lesson_start','lesson_complete','module_complete',
                  'course_enroll','quiz_attempt','assignment_submit',
                  'login','ai_session','streak_update'],
  resourceType: String,
  resourceId: ObjectId,
  metadata: Object,
  timestamp: Date,
  // TTL index: expires after configurable retention period
}
```

#### Assessments

```javascript
// assignments
{
  _id: ObjectId,
  courseId: ObjectId,
  moduleId: ObjectId,
  lessonId: ObjectId,
  createdBy: ObjectId,
  title: String,
  instructions: String,
  attachments: [{ key: String, name: String, size: Number }],
  openDate: Date,
  dueDate: Date,
  latePolicy: Enum['no_late','penalty','allowed'],
  latePenaltyPercent: Number,
  maxMarks: Number,
  passingMarks: Number,
  submissionFormats: [Enum['text','file','link','code']],
  allowedFileTypes: [String],
  maxFileSizeMB: Number,
  maxAttempts: Number,
  groupSubmission: Boolean,
  rubric: [{
    criterion: String,
    description: String,
    maxPoints: Number,
    levels: [{ label: String, points: Number, description: String }]
  }],
  status: Enum['draft','published','closed','archived'],
  aiAssistEnabled: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// submissions
{
  _id: ObjectId,
  assignmentId: ObjectId,
  courseId: ObjectId,
  userId: ObjectId,
  attemptNumber: Number,
  status: Enum['draft','submitted','grading','graded','returned'],
  content: {
    text: String,
    files: [{ key: String, name: String, size: Number, type: String }],
    links: [String],
    code: String,
    language: String
  },
  submittedAt: Date,
  isLate: Boolean,
  grade: {
    totalMarks: Number,
    earnedMarks: Number,
    percentage: Number,
    rubricScores: [{ criterion: String, points: Number, comment: String }],
    feedback: String,
    gradedBy: ObjectId,
    gradedAt: Date,
    aiSuggestedMarks: Number,
    aiSuggestedFeedback: String,
    publishedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}

// quizzes
{
  _id: ObjectId,
  courseId: ObjectId,
  moduleId: ObjectId,
  createdBy: ObjectId,
  title: String,
  description: String,
  instructions: String,
  duration: Number,                // minutes, 0=unlimited
  maxAttempts: Number,
  passingScore: Number,
  shuffleQuestions: Boolean,
  shuffleAnswers: Boolean,
  showResultsImmediately: Boolean,
  showAnswersAfter: Enum['never','submission','passing','release_date'],
  releaseDate: Date,
  openDate: Date,
  closeDate: Date,
  questionBankSize: Number,        // pick N random from bank
  status: Enum['draft','published','closed','archived'],
  totalPoints: Number,
  createdAt: Date,
  updatedAt: Date
}

// questions
{
  _id: ObjectId,
  quizId: ObjectId,
  courseId: ObjectId,
  type: Enum['single_choice','multi_select','true_false','short_answer','essay'],
  text: String,
  richText: String,
  media: { type: String, key: String },
  options: [{
    id: String,
    text: String,
    isCorrect: Boolean,
    explanation: String
  }],
  correctAnswer: String,           // for short_answer
  points: Number,
  difficulty: Enum['easy','medium','hard'],
  explanation: String,
  tags: [String],
  order: Number,
  createdAt: Date,
  updatedAt: Date
}

// quizAttempts
{
  _id: ObjectId,
  quizId: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  attemptNumber: Number,
  status: Enum['in_progress','submitted','graded','expired'],
  startedAt: Date,
  submittedAt: Date,
  expiresAt: Date,
  timeSpent: Number,               // seconds
  responses: [{
    questionId: ObjectId,
    answer: Mixed,                 // String | [String]
    isCorrect: Boolean,
    pointsEarned: Number,
    aiGradeScore: Number,
    instructorGradeScore: Number,
    gradingStatus: Enum['auto','pending_manual','manual_graded']
  }],
  totalScore: Number,
  maxScore: Number,
  percentage: Number,
  passed: Boolean,
  gradedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Grades & Certificates

```javascript
// grades (course-level grade aggregation)
{
  _id: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  institutionId: ObjectId,
  assignments: [{ assignmentId: ObjectId, score: Number, weight: Number }],
  quizzes: [{ quizId: ObjectId, score: Number, weight: Number }],
  participation: Number,
  finalGrade: Number,
  letterGrade: String,
  gpaPoints: Number,
  status: Enum['in_progress','finalized','incomplete'],
  finalizedAt: Date,
  finalizedBy: ObjectId,
  history: [{
    changedAt: Date,
    changedBy: ObjectId,
    previousGrade: Number,
    newGrade: Number,
    reason: String
  }],
  createdAt: Date,
  updatedAt: Date
}

// certificates
{
  _id: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  institutionId: ObjectId,
  enrollmentId: ObjectId,
  verificationId: String,          // unique, public-facing
  templateId: ObjectId,
  studentName: String,
  courseName: String,
  institutionName: String,
  issuedAt: Date,
  expiresAt: Date,
  grade: String,
  fileKey: String,                 // generated PDF storage key
  status: Enum['issued','revoked'],
  revokedAt: Date,
  revokedBy: ObjectId,
  revokedReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### AI & Learning

```javascript
// aiConversations
{
  _id: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId,
  feature: Enum['tutor','planner','quiz_gen','summarizer','copilot','feedback','voice'],
  title: String,
  messages: [{
    role: Enum['user','assistant','system'],
    content: String,
    provider: String,              // 'primary' | 'gemini'
    sourceRefs: [{ lessonId: ObjectId, chunk: String }],
    timestamp: Date,
    tokens: Number
  }],
  status: Enum['active','archived'],
  createdAt: Date,
  updatedAt: Date
}

// studyPlans
{
  _id: ObjectId,
  userId: ObjectId,
  institutionId: ObjectId,
  title: String,
  generatedAt: Date,
  weekStart: Date,
  sessions: [{
    date: Date,
    startTime: String,
    duration: Number,              // minutes
    courseId: ObjectId,
    lessonId: ObjectId,
    topic: String,
    type: Enum['lesson','revision','practice','assessment'],
    completed: Boolean,
    completedAt: Date,
    skipped: Boolean
  }],
  goals: [String],
  preferences: Object,
  status: Enum['active','completed','archived'],
  createdAt: Date,
  updatedAt: Date
}

// vectorDocuments (metadata only; embeddings live in vector DB)
{
  _id: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId,
  institutionId: ObjectId,
  sourceType: Enum['lesson_text','transcript','document','announcement'],
  sourceKey: String,
  chunks: [{
    chunkId: String,               // matches vector DB id
    text: String,
    tokenCount: Number,
    order: Number
  }],
  embeddingModel: String,
  indexedAt: Date,
  status: Enum['pending','indexed','failed'],
  createdAt: Date,
  updatedAt: Date
}
```

#### Gamification & Notifications

```javascript
// achievements
{
  _id: ObjectId,
  userId: ObjectId,
  institutionId: ObjectId,
  type: Enum['badge','streak','milestone','challenge'],
  code: String,                    // e.g. 'first_course_complete'
  title: String,
  description: String,
  iconKey: String,
  points: Number,
  metadata: Object,
  earnedAt: Date,
  createdAt: Date
}

// pointTransactions
{
  _id: ObjectId,
  userId: ObjectId,
  institutionId: ObjectId,
  event: String,
  points: Number,
  balance: Number,                 // running total
  referenceId: ObjectId,
  referenceType: String,
  createdAt: Date
}

// notifications
{
  _id: ObjectId,
  userId: ObjectId,
  institutionId: ObjectId,
  type: String,                    // 'enrollment_confirmed', 'grade_released', etc.
  title: String,
  message: String,
  data: Object,                    // deep link data
  read: Boolean,
  readAt: Date,
  emailSent: Boolean,
  emailSentAt: Date,
  createdAt: Date
}

// announcements
{
  _id: ObjectId,
  courseId: ObjectId,
  institutionId: ObjectId,
  authorId: ObjectId,
  title: String,
  content: String,
  isPinned: Boolean,
  attachments: [{ key: String, name: String }],
  status: Enum['draft','published','archived'],
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// discussions
{
  _id: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId,
  institutionId: ObjectId,
  parentId: ObjectId,              // null for thread roots
  authorId: ObjectId,
  content: String,
  attachments: [{ key: String, name: String }],
  isInstructor: Boolean,
  isPinned: Boolean,
  isResolved: Boolean,
  editedAt: Date,
  deletedAt: Date,
  replyCount: Number,
  createdAt: Date,
  updatedAt: Date
}

// auditLogs
{
  _id: ObjectId,
  institutionId: ObjectId,
  actorId: ObjectId,
  actorRole: String,
  action: String,                  // 'user.suspend', 'course.approve', etc.
  resourceType: String,
  resourceId: ObjectId,
  changes: Object,                 // before/after snapshot
  ipAddress: String,
  userAgent: String,
  timestamp: Date
}
```

### 4.2 Indexes

```javascript
// Critical compound indexes
users: { email: 1 } unique
users: { institutionId: 1, status: 1 }
courses: { institutionId: 1, status: 1, category: 1 }
courses: { slug: 1 } unique
enrollments: { userId: 1, courseId: 1 } unique
enrollments: { courseId: 1, status: 1 }
lessonProgress: { userId: 1, courseId: 1 }
lessonProgress: { userId: 1, lessonId: 1 } unique
submissions: { assignmentId: 1, userId: 1 }
quizAttempts: { quizId: 1, userId: 1, attemptNumber: 1 }
notifications: { userId: 1, read: 1, createdAt: -1 }
activityEvents: { userId: 1, timestamp: -1 }
activityEvents: { timestamp: 1 } TTL
certificates: { verificationId: 1 } unique
aiConversations: { userId: 1, feature: 1, createdAt: -1 }
auditLogs: { institutionId: 1, timestamp: -1 }
oauthAccounts: { userId: 1, provider: 1 } unique
```

---

## 5. API Architecture

### 5.1 Versioned Route Structure

```
/api/v1/
├── auth/
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /logout
│   ├── POST   /refresh-token
│   ├── POST   /forgot-password
│   ├── POST   /reset-password
│   ├── GET    /verify-email/:token
│   ├── GET    /oauth/:provider              # Initiate OAuth
│   └── GET    /oauth/:provider/callback     # OAuth callback
│
├── users/
│   ├── GET    /me
│   ├── PUT    /me
│   ├── GET    /me/profile
│   ├── PUT    /me/profile
│   ├── PUT    /me/password
│   ├── GET    /me/sessions
│   ├── DELETE /me/sessions/:sessionId
│   ├── GET    /me/integrations
│   ├── POST   /me/integrations/:provider/sync
│   ├── DELETE /me/integrations/:provider
│   └── GET    /me/export
│
├── institutions/
│   ├── GET    /                             # Admin only
│   ├── POST   /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── GET    /:id/departments
│   ├── POST   /:id/departments
│   ├── GET    /:id/programs
│   ├── POST   /:id/programs
│   ├── GET    /:id/terms
│   └── POST   /:id/terms
│
├── courses/
│   ├── GET    /                             # Public catalog
│   ├── POST   /                             # Instructor
│   ├── GET    /:id                          # Public detail
│   ├── PUT    /:id                          # Instructor
│   ├── DELETE /:id                          # Admin
│   ├── POST   /:id/publish
│   ├── POST   /:id/archive
│   ├── GET    /:id/sections
│   ├── POST   /:id/sections
│   ├── PUT    /:id/sections/:sectionId
│   ├── DELETE /:id/sections/:sectionId
│   ├── GET    /:id/modules
│   ├── POST   /:id/modules
│   ├── GET    /:id/modules/:moduleId/lessons
│   ├── POST   /:id/modules/:moduleId/lessons
│   ├── PUT    /:id/lessons/:lessonId
│   ├── DELETE /:id/lessons/:lessonId
│   ├── GET    /:id/enrollments              # Instructor/Admin
│   ├── GET    /:id/analytics                # Instructor/Admin
│   └── GET    /:id/discussions
│
├── enrollments/
│   ├── POST   /                             # Student enroll request
│   ├── GET    /my                           # Student's enrollments
│   ├── GET    /:id
│   ├── POST   /:id/approve                  # Instructor/Admin
│   ├── POST   /:id/reject
│   └── POST   /:id/withdraw
│
├── lessons/
│   ├── GET    /:id                          # Enrolled student
│   ├── POST   /:id/progress
│   ├── GET    /:id/progress
│   ├── POST   /:id/bookmark
│   └── DELETE /:id/bookmark
│
├── assignments/
│   ├── GET    /course/:courseId             # Instructor/Student
│   ├── POST   /                             # Instructor
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── DELETE /:id
│   ├── GET    /:id/submissions              # Instructor
│   ├── POST   /:id/submit                  # Student
│   ├── GET    /:id/submissions/:subId
│   └── PUT    /:id/submissions/:subId/grade # Instructor
│
├── quizzes/
│   ├── GET    /course/:courseId
│   ├── POST   /                             # Instructor
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── GET    /:id/questions               # Instructor
│   ├── POST   /:id/questions
│   ├── POST   /:id/start                   # Student
│   ├── PUT    /:id/attempts/:attemptId     # Save responses
│   ├── POST   /:id/attempts/:attemptId/submit
│   └── GET    /:id/attempts/:attemptId/result
│
├── progress/
│   ├── GET    /course/:courseId             # Student's progress
│   ├── GET    /overview                     # Student dashboard data
│   └── GET    /analytics                    # Instructor/Admin analytics
│
├── certificates/
│   ├── GET    /my                           # Student
│   ├── GET    /:id
│   ├── GET    /:id/download
│   └── GET    /verify/:verificationId       # Public
│
├── ai/
│   ├── POST   /tutor/message
│   ├── GET    /tutor/conversations
│   ├── GET    /tutor/conversations/:id
│   ├── DELETE /tutor/conversations/:id
│   ├── POST   /planner/generate
│   ├── PUT    /planner/:id
│   ├── POST   /quiz-generator/generate
│   ├── POST   /summarizer/summarize
│   ├── POST   /copilot/assist
│   ├── POST   /feedback/analyze
│   ├── POST   /voice/transcribe
│   ├── POST   /voice/synthesize
│   └── GET    /recommendations
│
├── notifications/
│   ├── GET    /
│   ├── PUT    /:id/read
│   ├── PUT    /read-all
│   ├── DELETE /:id
│   └── GET    /preferences
│
├── discussions/
│   ├── GET    /course/:courseId
│   ├── POST   /
│   ├── GET    /:id/replies
│   ├── POST   /:id/replies
│   ├── PUT    /:id
│   └── DELETE /:id
│
├── announcements/
│   ├── GET    /course/:courseId
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
│
├── notes/
│   ├── GET    /
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
│
├── files/
│   ├── POST   /upload-url                  # Get signed upload URL
│   └── GET    /download-url/:key           # Get signed download URL
│
└── admin/
    ├── GET    /users
    ├── POST   /users/invite
    ├── PUT    /users/:id/status
    ├── PUT    /users/:id/role
    ├── GET    /courses/pending
    ├── POST   /courses/:id/approve
    ├── POST   /courses/:id/reject
    ├── GET    /analytics/platform
    ├── GET    /analytics/enrollments
    ├── GET    /audit-logs
    ├── GET    /jobs
    └── POST   /jobs/:id/retry
```

### 5.2 Standard Response Format

```javascript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "requestId": "req_abc123"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  },
  "requestId": "req_abc123"
}
```

### 5.3 Middleware Pipeline

```
Request
  └─► requestId (attach UUID)
  └─► cors (allowlist-based)
  └─► helmet (security headers)
  └─► rateLimit (per-IP, per-user tiers)
  └─► bodyParser (JSON, size limits)
  └─► authenticate (JWT verification)
  └─► tenantScope (attach institutionId)
  └─► authorize (role + resource checks)
  └─► validate (Joi/Zod schemas)
  └─► Route Handler
  └─► errorHandler (centralized)
  └─► logger (structured JSON)
Response
```

---

## 6. AI Subsystem Design

### 6.1 AI Routing Architecture

```
Express API ──► FastAPI /ai/route
                    │
                    ▼
           ┌─────────────────┐
           │  AI Orchestrator │
           │  orchestrator.py │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │  RAG Retrieval   │
           │  retrieval.py    │
           │  (vector search) │
           └────────┬────────┘
                    │ context chunks
           ┌────────▼────────┐
           │  Primary Model   │
           │  primary.py      │
           └────────┬────────┘
                    │
              ┌─────▼──────┐
              │   Quality   │
              │   Check     │
              └─────┬───────┘
             pass   │   fail
              │     │
              │  ┌──▼──────────┐
              │  │ Gemini API   │
              │  │ gemini.py    │
              │  └──────────────┘
              │         │
              └────┬────┘
                   │
             ┌─────▼─────┐
             │  Response  │
             │  Normalize │
             └─────────────┘
```

### 6.2 RAG Pipeline

```python
# ingestion.py
async def ingest_lesson(lesson_id: str, content: str, metadata: dict):
    chunks = chunk_text(content, chunk_size=512, overlap=64)
    embeddings = await embed_texts([c.text for c in chunks])
    
    vectors = [
        {
            "id": f"{lesson_id}_{i}",
            "vector": embedding,
            "payload": {
                "lesson_id": lesson_id,
                "course_id": metadata["course_id"],
                "institution_id": metadata["institution_id"],
                "text": chunk.text,
                "order": i
            }
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]
    
    await vector_db.upsert(collection="course_content", vectors=vectors)
    await update_lesson_index_status(lesson_id, "indexed")

# retrieval.py
async def retrieve_context(
    query: str,
    course_id: str,
    institution_id: str,
    top_k: int = 5
) -> list[RetrievedChunk]:
    query_embedding = await embed_text(query)
    
    results = await vector_db.search(
        collection="course_content",
        vector=query_embedding,
        filter={
            "course_id": course_id,
            "institution_id": institution_id   # tenant isolation
        },
        limit=top_k
    )
    
    return [
        RetrievedChunk(
            chunk_id=r.id,
            lesson_id=r.payload["lesson_id"],
            text=r.payload["text"],
            score=r.score
        )
        for r in results if r.score > RETRIEVAL_THRESHOLD
    ]
```

### 6.3 AI Orchestrator

```python
# orchestrator.py
class AIOrchestrator:
    def __init__(self, config: AIConfig):
        self.primary = PrimaryModel(config.primary)
        self.gemini = GeminiClient(config.gemini_api_key, config.gemini_model)
        self.config = config

    async def complete(
        self,
        task: AITask,
        context: list[RetrievedChunk],
        user_id: str,
        feature: str
    ) -> AIResponse:
        
        # Attempt primary model
        try:
            primary_result = await asyncio.wait_for(
                self.primary.complete(task, context),
                timeout=self.config.primary_timeout_seconds
            )
            
            if self._is_adequate(primary_result, task.quality_threshold):
                return AIResponse(
                    content=primary_result.content,
                    provider="primary",
                    sources=context
                )
        except (TimeoutError, PrimaryModelError) as e:
            log_primary_failure(user_id, feature, str(e))

        # Gemini fallback
        if not self.config.gemini_enabled_for(feature):
            raise AIServiceUnavailable("Primary model unavailable, fallback disabled")

        if not self._check_data_sharing_policy(task, feature):
            raise AIServiceUnavailable("Data sharing policy prevents external fallback")

        gemini_result = await self.gemini.complete(task, context)
        
        return AIResponse(
            content=gemini_result.content,
            provider="gemini",
            sources=context,
            fallback_reason="primary_inadequate"
        )

    def _is_adequate(self, result: ModelResult, threshold: float) -> bool:
        if not result.content or len(result.content.strip()) < 20:
            return False
        if result.confidence is not None and result.confidence < threshold:
            return False
        return True
```

### 6.4 AI Feature Endpoints (FastAPI)

```python
# routers/tutor.py
@router.post("/message")
async def tutor_message(
    request: TutorMessageRequest,
    auth: AuthContext = Depends(verify_internal_token)
):
    # Verify course access (passed from Express)
    # Retrieve relevant lesson context
    context = await retrieve_context(
        query=request.message,
        course_id=request.course_id,
        institution_id=request.institution_id
    )
    
    # Build prompt with conversation history
    task = AITask(
        feature="tutor",
        system_prompt=build_tutor_system_prompt(request.lesson_context),
        messages=request.history + [{"role": "user", "content": request.message}],
        context_chunks=context,
        quality_threshold=0.6
    )
    
    response = await orchestrator.complete(task, context, request.user_id, "tutor")
    
    return TutorResponse(
        content=response.content,
        sources=[{"lesson_id": c.lesson_id, "excerpt": c.text[:200]} 
                 for c in response.sources],
        provider=response.provider
    )
```

---

## 7. Authentication & Authorization

### 7.1 JWT Strategy

```javascript
// Token structure
{
  // Access token (short-lived: 15 min)
  header: { alg: "RS256", typ: "JWT" },
  payload: {
    sub: "userId",
    institutionId: "institutionId",
    roles: ["student"],
    type: "access",
    iat: 1700000000,
    exp: 1700000900   // +15 min
  }
}

// Refresh token (long-lived: 7 days)
// Stored in HttpOnly cookie + hashed copy in sessions collection
// Rotation on every use, family-based revocation on reuse detection
```

### 7.2 OAuth 2.0 Flow

```javascript
// auth/strategies/github.js
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  scope: ['user:email', 'read:user']
}, async (accessToken, refreshToken, profile, done) => {
  
  // 1. Check for existing OAuth account
  const oauthAccount = await OAuthAccount.findOne({
    provider: 'github',
    providerAccountId: profile.id
  });
  
  if (oauthAccount) {
    const user = await User.findById(oauthAccount.userId);
    return done(null, user);
  }
  
  // 2. Check for existing email match (DO NOT auto-link)
  const email = profile.emails[0]?.value;
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    // Return special flag — require explicit linking confirmation
    return done(null, false, { 
      type: 'ACCOUNT_EXISTS', 
      email,
      provider: 'github',
      providerAccountId: profile.id
    });
  }
  
  // 3. Create new user
  const user = await createUserFromOAuth('github', profile, accessToken);
  return done(null, user);
}));
```

### 7.3 RBAC Middleware

```javascript
// middleware/authorize.js
const authorize = (...requiredRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  
  const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
  if (!hasRole) return res.status(403).json({ error: 'Forbidden' });
  
  next();
};

// Resource ownership check
const authorizeOwnerOrAdmin = (getResourceOwnerId) => async (req, res, next) => {
  const resource = await getResourceOwnerId(req);
  const isOwner = resource.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.roles.includes('admin');
  
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// Tenant scope enforcement
const enforceInstitution = (req, res, next) => {
  req.institutionId = req.user.institutionId;
  // All subsequent queries MUST include this filter
  next();
};
```

---

## 8. Frontend Architecture

### 8.1 Application Structure

```
src/
├── assets/                    # Static assets, fonts, images
├── components/
│   ├── ui/                    # Primitive components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Modal/
│   │   ├── Drawer/
│   │   ├── Dropdown/
│   │   ├── Table/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Card/
│   │   ├── Skeleton/
│   │   ├── Toast/
│   │   ├── Tooltip/
│   │   ├── Tabs/
│   │   ├── Progress/
│   │   └── EmptyState/
│   ├── forms/                 # Form-specific components
│   │   ├── FormField/
│   │   ├── RichTextEditor/
│   │   ├── FileUpload/
│   │   └── DatePicker/
│   ├── charts/                # Recharts wrappers
│   ├── layout/
│   │   ├── AppShell/
│   │   ├── Sidebar/
│   │   ├── TopBar/
│   │   ├── PageHeader/
│   │   └── MobileNav/
│   └── shared/               # Domain-specific shared components
│       ├── CourseCard/
│       ├── LessonPlayer/
│       ├── AIChat/
│       ├── ProgressRing/
│       └── CertificateCard/
├── pages/
│   ├── public/               # No auth required
│   │   ├── Home/
│   │   ├── Catalog/
│   │   ├── CourseDetail/
│   │   ├── About/
│   │   └── Help/
│   ├── auth/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── ForgotPassword/
│   │   ├── ResetPassword/
│   │   └── VerifyEmail/
│   ├── onboarding/
│   ├── student/
│   │   ├── Dashboard/
│   │   ├── Courses/
│   │   ├── CourseWorkspace/
│   │   ├── Assignments/
│   │   ├── Quizzes/
│   │   ├── Progress/
│   │   ├── Library/
│   │   ├── Calendar/
│   │   └── Certificates/
│   ├── instructor/
│   │   ├── Dashboard/
│   │   ├── Courses/
│   │   ├── CourseBuilder/
│   │   ├── Grading/
│   │   ├── Analytics/
│   │   └── Copilot/
│   ├── admin/
│   │   ├── Dashboard/
│   │   ├── Users/
│   │   ├── Courses/
│   │   ├── Analytics/
│   │   └── Settings/
│   ├── profile/
│   └── ai/
├── hooks/                    # Custom React hooks
│   ├── useAuth.js
│   ├── useTheme.js
│   ├── useNotifications.js
│   ├── useDebounce.js
│   └── usePagination.js
├── services/                 # API layer
│   ├── api.js                # Axios instance + interceptors
│   ├── authService.js
│   ├── courseService.js
│   ├── enrollmentService.js
│   ├── assessmentService.js
│   ├── aiService.js
│   └── fileService.js
├── store/                    # Zustand stores
│   ├── authStore.js
│   ├── notificationStore.js
│   ├── themeStore.js
│   └── uiStore.js
├── router/
│   ├── index.jsx             # Route definitions
│   ├── ProtectedRoute.jsx
│   ├── RoleRoute.jsx
│   └── PublicRoute.jsx
├── theme/
│   ├── tokens.js             # Design tokens
│   ├── darkTheme.js
│   ├── lightTheme.js
│   └── ThemeProvider.jsx
└── utils/
    ├── formatters.js
    ├── validators.js
    ├── constants.js
    └── helpers.js
```

### 8.2 Design Token System

```javascript
// theme/tokens.js
export const tokens = {
  dark: {
    bg: {
      base:      '#0f1117',   // main background
      surface:   '#1a1d27',   // cards, panels
      elevated:  '#1e2235',   // modals, dropdowns
      overlay:   '#252a3a',   // hover backgrounds
      sidebar:   '#13161f',   // navigation sidebar
    },
    text: {
      primary:   '#e8eaf0',
      secondary: '#9da3b4',
      muted:     '#5c6478',
      accent:    '#60a5fa',
    },
    border:      '#2a2f42',
    accent: {
      primary:   '#3b82f6',   // blue
      secondary: '#8b5cf6',   // violet
      ai:        '#06b6d4',   // cyan — AI features
      success:   '#10b981',
      warning:   '#f59e0b',
      error:     '#ef4444',
    },
  },
  light: {
    bg: {
      base:      '#f1f3f7',   // soft gray — NOT white
      surface:   '#ffffff',   // cards
      elevated:  '#f8f9fc',   // modals
      overlay:   '#eef0f6',   // hover
      sidebar:   '#e8eaf2',   // navigation
    },
    text: {
      primary:   '#1e2235',
      secondary: '#4a5068',
      muted:     '#8891a8',
      accent:    '#2563eb',
    },
    border:      '#dde0e8',
    accent: {
      primary:   '#2563eb',
      secondary: '#7c3aed',
      ai:        '#0891b2',
      success:   '#059669',
      warning:   '#d97706',
      error:     '#dc2626',
    },
  }
};
```

### 8.3 API Service Layer

```javascript
// services/api.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  withCredentials: true,   // for HttpOnly refresh token cookie
  timeout: 30000,
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401, refresh token
let isRefreshing = false;
let failedQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const { data } = await api.post('/auth/refresh-token');
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## 9. Low-Level Design

### 9.1 Enrollment Workflow Algorithm

```javascript
// enrollments/enrollmentService.js
async function requestEnrollment(userId, courseId, institutionId) {
  // 1. Load course and validate
  const course = await Course.findOne({ _id: courseId, institutionId });
  if (!course) throw new NotFoundError('Course not found');
  if (course.status !== 'published') throw new ForbiddenError('Course not available');

  // 2. Check existing enrollment
  const existing = await Enrollment.findOne({ userId, courseId });
  if (existing) {
    if (['active','pending','waitlisted'].includes(existing.status)) {
      throw new ConflictError('Already enrolled or pending');
    }
  }

  // 3. Validate prerequisites
  if (course.prerequisites.length > 0) {
    const completedPrereqs = await Enrollment.find({
      userId,
      courseId: { $in: course.prerequisites },
      status: 'completed'
    });
    if (completedPrereqs.length < course.prerequisites.length) {
      throw new ValidationError('Prerequisites not completed');
    }
  }

  // 4. Check capacity
  if (course.maxEnrollments > 0) {
    const activeCount = await Enrollment.countDocuments({
      courseId,
      status: { $in: ['active', 'pending'] }
    });
    if (activeCount >= course.maxEnrollments) {
      // Place on waitlist if enabled
      return createEnrollment(userId, courseId, 'waitlisted');
    }
  }

  // 5. Determine status based on policy
  const status = course.enrollmentPolicy === 'open' ? 'active' : 'pending';
  const enrollment = await createEnrollment(userId, courseId, status);

  // 6. Dispatch notifications and events
  await notificationService.send(userId, 'enrollment_created', { courseId, status });
  if (status === 'active') {
    await activityService.record(userId, 'course_enroll', courseId);
    await gamificationService.checkAchievements(userId, 'enrollment');
  }

  return enrollment;
}
```

### 9.2 Progress Calculation Algorithm

```javascript
// progress/progressService.js
async function calculateCourseProgress(userId, courseId) {
  // Fetch all published lessons in course
  const lessons = await Lesson.find({
    courseId,
    status: 'published'
  }).select('_id moduleId type');

  if (lessons.length === 0) return { percentage: 0, completedLessons: 0, totalLessons: 0 };

  // Fetch completed lesson records
  const completed = await LessonProgress.find({
    userId,
    courseId,
    status: 'completed'
  }).select('lessonId');

  const completedIds = new Set(completed.map(p => p.lessonId.toString()));

  const completedCount = lessons.filter(l => completedIds.has(l._id.toString())).length;
  const percentage = Math.floor((completedCount / lessons.length) * 100);

  // Update enrollment record
  await Enrollment.findOneAndUpdate(
    { userId, courseId },
    {
      completionPercentage: percentage,
      $set: percentage === 100 ? { status: 'completed', completedAt: new Date() } : {}
    }
  );

  // Trigger certificate check if just completed
  if (percentage === 100) {
    await certificateService.checkEligibility(userId, courseId);
  }

  return { percentage, completedLessons: completedCount, totalLessons: lessons.length };
}
```

### 9.3 Certificate Generation

```javascript
// certificates/certificateService.js
async function checkAndIssueCertificate(userId, courseId) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // 1. Verify course completion criteria
    const course = await Course.findById(courseId).session(session);
    const enrollment = await Enrollment.findOne({ userId, courseId }).session(session);
    
    if (!enrollment || enrollment.completionPercentage < 100) {
      await session.abortTransaction();
      return null;
    }

    // 2. Check minimum grade if configured
    const grade = await Grade.findOne({ userId, courseId }).session(session);
    if (course.settings?.minPassingGrade && grade?.finalGrade < course.settings.minPassingGrade) {
      await session.abortTransaction();
      return null;
    }

    // 3. Prevent duplicate issuance
    const existing = await Certificate.findOne({
      userId, courseId, status: 'issued'
    }).session(session);
    if (existing) {
      await session.abortTransaction();
      return existing;
    }

    // 4. Generate unique verification ID
    const verificationId = generateVerificationId(); // UUID v4 + checksum

    // 5. Create certificate record
    const cert = await Certificate.create([{
      userId,
      courseId,
      institutionId: enrollment.institutionId,
      enrollmentId: enrollment._id,
      verificationId,
      studentName: await getUserFullName(userId),
      courseName: course.title,
      institutionName: await getInstitutionName(enrollment.institutionId),
      issuedAt: new Date(),
      status: 'issued'
    }], { session });

    // 6. Queue PDF generation job
    await certificatePdfQueue.add('generate', {
      certificateId: cert[0]._id,
      verificationId
    });

    await enrollment.updateOne({ certificateId: cert[0]._id }).session(session);
    await session.commitTransaction();

    await notificationService.send(userId, 'certificate_issued', {
      courseId,
      certificateId: cert[0]._id
    });

    return cert[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
```

### 9.4 Quiz Attempt Management

```javascript
// assessments/quizService.js
async function startQuizAttempt(userId, quizId, courseId) {
  const quiz = await Quiz.findOne({ _id: quizId, courseId, status: 'published' });
  if (!quiz) throw new NotFoundError('Quiz not found');
  
  // Check availability window
  const now = new Date();
  if (quiz.openDate && now < quiz.openDate) throw new ForbiddenError('Quiz not yet open');
  if (quiz.closeDate && now > quiz.closeDate) throw new ForbiddenError('Quiz is closed');

  // Count existing attempts
  const attemptCount = await QuizAttempt.countDocuments({
    quizId, userId,
    status: { $in: ['submitted', 'graded'] }
  });
  if (quiz.maxAttempts > 0 && attemptCount >= quiz.maxAttempts) {
    throw new ForbiddenError('Maximum attempts reached');
  }

  // Check for in-progress attempt
  const inProgress = await QuizAttempt.findOne({
    quizId, userId, status: 'in_progress'
  });
  if (inProgress) {
    if (inProgress.expiresAt && now > inProgress.expiresAt) {
      await autoSubmitAttempt(inProgress._id);
    } else {
      return inProgress; // Resume existing attempt
    }
  }

  // Select questions (with optional randomization)
  let questions = await Question.find({ quizId });
  if (quiz.shuffleQuestions) questions = shuffleArray(questions);
  if (quiz.questionBankSize > 0) questions = questions.slice(0, quiz.questionBankSize);

  const attempt = await QuizAttempt.create({
    quizId, userId, courseId,
    attemptNumber: attemptCount + 1,
    status: 'in_progress',
    startedAt: now,
    expiresAt: quiz.duration > 0 ? addMinutes(now, quiz.duration) : null,
    responses: questions.map(q => ({
      questionId: q._id,
      answer: null,
      gradingStatus: ['single_choice','multi_select','true_false'].includes(q.type)
        ? 'auto'
        : 'pending_manual'
    }))
  });

  await activityService.record(userId, 'quiz_attempt', quizId);
  return attempt;
}

async function submitQuizAttempt(attemptId, userId) {
  const attempt = await QuizAttempt.findOne({ _id: attemptId, userId, status: 'in_progress' });
  if (!attempt) throw new NotFoundError('Attempt not found');

  const quiz = await Quiz.findById(attempt.quizId);
  const questions = await Question.find({ _id: { $in: attempt.responses.map(r => r.questionId) } });
  const questionMap = Object.fromEntries(questions.map(q => [q._id.toString(), q]));

  let totalScore = 0;
  let maxScore = 0;

  const gradedResponses = attempt.responses.map(response => {
    const question = questionMap[response.questionId.toString()];
    maxScore += question.points;

    let isCorrect = false;
    let pointsEarned = 0;

    if (response.gradingStatus === 'auto') {
      isCorrect = evaluateAutoGrade(question, response.answer);
      pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;
    }

    return { ...response.toObject(), isCorrect, pointsEarned };
  });

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const passed = percentage >= (quiz.passingScore || 0);

  await attempt.updateOne({
    status: 'graded',
    submittedAt: new Date(),
    responses: gradedResponses,
    totalScore,
    maxScore,
    percentage,
    passed,
    gradedAt: new Date()
  });

  await progressService.recordQuizCompletion(userId, attempt.quizId, percentage);
  await gamificationService.checkQuizAchievements(userId, { passed, score: percentage });
}

function evaluateAutoGrade(question, answer) {
  if (answer === null || answer === undefined) return false;
  
  switch (question.type) {
    case 'single_choice':
    case 'true_false':
      const correct = question.options.find(o => o.isCorrect);
      return answer === correct?.id;
    
    case 'multi_select':
      const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id).sort();
      const answerIds = (Array.isArray(answer) ? answer : [answer]).sort();
      return JSON.stringify(correctIds) === JSON.stringify(answerIds);
    
    default:
      return false; // manual grading required
  }
}
```

### 9.5 Background Job Definitions

```javascript
// jobs/processors/reminderProcessor.js
export async function processDeadlineReminders(job) {
  const { lookAheadHours = 24 } = job.data;
  const cutoff = addHours(new Date(), lookAheadHours);

  const upcomingAssignments = await Assignment.find({
    dueDate: { $gte: new Date(), $lte: cutoff },
    status: 'published'
  });

  for (const assignment of upcomingAssignments) {
    const enrollments = await Enrollment.find({
      courseId: assignment.courseId,
      status: 'active'
    });

    for (const enrollment of enrollments) {
      const submitted = await Submission.findOne({
        assignmentId: assignment._id,
        userId: enrollment.userId,
        status: { $in: ['submitted', 'graded'] }
      });

      if (!submitted) {
        await notificationService.send(
          enrollment.userId,
          'assignment_due_soon',
          { assignmentId: assignment._id, dueDate: assignment.dueDate }
        );
      }
    }
  }
}

// jobs/queues.js
export const reminderQueue = new Queue('reminders', { connection: redisClient });
export const certificateQueue = new Queue('certificates', { connection: redisClient });
export const emailQueue = new Queue('emails', { connection: redisClient });
export const aiIndexQueue = new Queue('ai-indexing', { connection: redisClient });
export const analyticsQueue = new Queue('analytics', { connection: redisClient });

// Scheduled jobs
const reminderScheduler = new QueueScheduler('reminders', { connection: redisClient });
reminderQueue.add('check-deadlines', {}, {
  repeat: { cron: '0 * * * *' }  // every hour
});
```

### 9.6 File Upload Flow

```javascript
// files/fileService.js
async function generateUploadUrl(userId, fileInfo, context) {
  const { filename, contentType, size, purpose } = fileInfo;
  
  // Validate
  const allowed = getAllowedTypes(purpose);
  if (!allowed.includes(contentType)) throw new ValidationError('File type not allowed');
  if (size > getMaxSize(purpose)) throw new ValidationError('File too large');

  // Generate secure storage key
  const ext = getExtension(filename);
  const key = `${context.institutionId}/${purpose}/${userId}/${uuidv4()}${ext}`;

  // Get signed upload URL from object storage
  const uploadUrl = await storage.getSignedUploadUrl(key, {
    contentType,
    expiresIn: 300,  // 5 minutes
    metadata: { userId, purpose, originalName: filename }
  });

  // Store pending file metadata
  await PendingUpload.create({
    key,
    userId,
    purpose,
    originalName: filename,
    contentType,
    size,
    expiresAt: addMinutes(new Date(), 10)
  });

  return { uploadUrl, key };
}

async function confirmUpload(key, userId) {
  // Verify the file actually exists in storage
  const exists = await storage.objectExists(key);
  if (!exists) throw new ValidationError('Upload not confirmed in storage');
  
  await PendingUpload.findOneAndDelete({ key, userId });
  return { key, confirmed: true };
}

async function getDownloadUrl(key, userId) {
  // Authorize access based on key prefix and user context
  await authorizeFileAccess(key, userId);
  
  return storage.getSignedDownloadUrl(key, {
    expiresIn: 900  // 15 minutes
  });
}
```

### 9.7 Notification System

```javascript
// notifications/notificationService.js
const NOTIFICATION_TEMPLATES = {
  enrollment_confirmed: {
    title: 'Enrollment Confirmed',
    message: (data) => `You're now enrolled in ${data.courseName}`,
    sendEmail: true,
    emailTemplate: 'enrollment-confirmed'
  },
  grade_released: {
    title: 'Grade Published',
    message: (data) => `Your grade for "${data.assignmentTitle}" has been published`,
    sendEmail: true,
    emailTemplate: 'grade-released'
  },
  certificate_issued: {
    title: 'Certificate Earned!',
    message: (data) => `Congratulations! You've earned a certificate for ${data.courseName}`,
    sendEmail: true,
    emailTemplate: 'certificate-issued'
  }
  // ... more templates
};

async function send(userId, type, data) {
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) throw new Error(`Unknown notification type: ${type}`);

  const user = await User.findById(userId).select('notificationPreferences');
  
  // Create in-app notification
  const notification = await Notification.create({
    userId,
    type,
    title: template.title,
    message: template.message(data),
    data,
    read: false
  });

  // Push real-time notification via SSE
  sseManager.push(userId, { type: 'notification', payload: notification });

  // Queue email if preferences allow
  if (template.sendEmail && user.notificationPreferences?.email?.[type] !== false) {
    await emailQueue.add('send', {
      userId,
      template: template.emailTemplate,
      data
    });
  }

  return notification;
}
```

### 9.8 Gamification Engine

```javascript
// gamification/achievementService.js
const ACHIEVEMENT_RULES = {
  first_enrollment: {
    code: 'first_enrollment',
    title: 'First Step',
    description: 'Enrolled in your first course',
    points: 10,
    check: async (userId) => {
      const count = await Enrollment.countDocuments({ userId, status: 'active' });
      return count >= 1;
    }
  },
  streak_7: {
    code: 'streak_7',
    title: '7-Day Streak',
    description: 'Learned for 7 consecutive days',
    points: 50,
    check: async (userId) => {
      return await checkLearningStreak(userId, 7);
    }
  },
  course_complete: {
    code: 'course_complete',
    title: 'Course Graduate',
    description: 'Completed your first course',
    points: 100,
    check: async (userId) => {
      const count = await Enrollment.countDocuments({ userId, status: 'completed' });
      return count >= 1;
    }
  }
  // ...
};

async function checkAchievements(userId, trigger) {
  const relevantRules = Object.values(ACHIEVEMENT_RULES)
    .filter(r => r.triggers?.includes(trigger) || !r.triggers);

  for (const rule of relevantRules) {
    const alreadyEarned = await Achievement.findOne({ userId, code: rule.code });
    if (alreadyEarned) continue;

    const earned = await rule.check(userId);
    if (earned) {
      await Achievement.create({
        userId,
        code: rule.code,
        title: rule.title,
        description: rule.description,
        points: rule.points,
        earnedAt: new Date()
      });

      await awardPoints(userId, rule.code, rule.points);
      await notificationService.send(userId, 'achievement_unlocked', {
        achievement: rule.title
      });
    }
  }
}

async function awardPoints(userId, event, points) {
  const lastTransaction = await PointTransaction.findOne({ userId })
    .sort({ createdAt: -1 });
  const currentBalance = lastTransaction?.balance || 0;

  await PointTransaction.create({
    userId,
    event,
    points,
    balance: currentBalance + points,
    createdAt: new Date()
  });
}
```

---

## 10. Security Architecture

### 10.1 Security Controls Matrix

| Layer | Control | Implementation |
|-------|---------|----------------|
| Transport | TLS 1.2+ | Nginx/Caddy SSL termination |
| Auth | JWT RS256 | Short-lived access + rotated refresh |
| Secrets | Env vars / secrets manager | Never in source, never in frontend |
| Passwords | bcrypt (cost 12) | Server-side hashing |
| Tokens | Hashed in DB | Never store raw tokens |
| OAuth tokens | AES-256-GCM encrypted | Encrypted before persistence |
| CORS | Allowlist | Configured per environment |
| CSRF | SameSite=Strict cookie | + double-submit for forms |
| Rate limiting | Per IP + per user | express-rate-limit tiers |
| Input validation | Zod/Joi schemas | All API endpoints |
| XSS | Content Security Policy | Helmet + CSP header |
| SQL/NoSQL injection | Mongoose parameterized | Never string-concatenate queries |
| File uploads | Type + size + signature | Validated before storage |
| Audit trail | auditLogs collection | All sensitive operations |
| Tenant isolation | institutionId filter | Middleware-enforced |
| Rate limiting AI | Per-user quota | Token budget enforcement |

### 10.2 Environment Configuration

```bash
# .env.example (placeholders only — never commit real values)

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/omniclass
REDIS_URL=redis://localhost:6379

# Auth
JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/github/callback

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/facebook/callback

# Object Storage
STORAGE_PROVIDER=s3               # s3 | minio
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Email
EMAIL_PROVIDER=sendgrid           # sendgrid | smtp
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourdomain.com

# Encryption
OAUTH_TOKEN_ENCRYPTION_KEY=32_byte_hex_key_here

# AI Service (internal)
FASTAPI_URL=http://localhost:8000
FASTAPI_INTERNAL_SECRET=your_internal_secret

# Gemini AI Fallback
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_FALLBACK_ENABLED=true
GEMINI_TIMEOUT_SECONDS=30
GEMINI_MAX_TOKENS=4096

# AI Primary Model
PRIMARY_MODEL_URL=http://localhost:11434  # e.g. Ollama
PRIMARY_MODEL_NAME=your_primary_model

# Vector Database
VECTOR_DB_URL=http://localhost:6333       # Qdrant
VECTOR_DB_COLLECTION=course_content
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# FastAPI Service (.env for Python service)
FASTAPI_PORT=8000
INTERNAL_AUTH_SECRET=your_internal_secret
MONGODB_URI=mongodb://localhost:27017/omniclass
```

---

## 11. Infrastructure & DevOps

### 11.1 Service Startup Sequence

```
1. MongoDB (required)
2. Redis (required)
3. Vector DB / Qdrant (required for AI)
4. FastAPI AI Service (port 8000)
5. Express API (port 3000)
6. React Dev Server (port 5173) — development only
7. Nginx/Caddy (production proxy)
```

### 11.2 Health Check Endpoints

```
GET /health              → Express API health
GET /api/v1/health       → Full system health (DB, Redis, FastAPI, Vector DB)
GET /ai/health           → FastAPI AI service health
```

### 11.3 Folder Structure

```
omniclass/
├── frontend/            # React + Vite
├── backend/             # Express.js API
├── ai-service/          # FastAPI
├── nginx/               # Reverse proxy config
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```

### 11.4 Docker Compose Services

```yaml
services:
  mongodb:       # Primary database
  redis:         # Cache + job queue
  qdrant:        # Vector database
  ai-service:    # FastAPI (Python)
  api:           # Express.js
  frontend:      # React dev server (dev) / Nginx (prod)
  nginx:         # Reverse proxy + TLS
```

---

*Design Version: 1.0 | Feature: omniclass-lms | Workflow: Design-First (HLD + LLD)*
