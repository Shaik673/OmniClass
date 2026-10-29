# OmniClass — Complete AI-Powered Institutional Learning Management System

> **OmniClass** is an institutional Learning Management System (LMS) built for universities, colleges, higher-education institutions, and enterprise academies. It unifies academic governance, curriculum authoring, coursework assessments with analytic rubrics, student progress tracking, verifiable digital credentials, and context-grounded AI learning tools into a single, cohesive full-stack platform.

---

## 1. System Architecture & Tech Stack

OmniClass is designed around a multi-tier, decoupled architecture with strict tenant separation, role-based access control (RBAC), and multi-tier AI orchestration:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 + Vite Frontend                        │
│   Tailwind CSS · Design Tokens · Dark & Light Mode · Recharts · Lucide  │
│   Student Portal · Instructor Studio · Admin Portal · AI Study Room    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Reverse Proxy /api/v1
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Node.js / Express.js Backend                      │
│   JWT HTTP-only Cookie Auth · Centralized Validation & Error Handling  │
│   Institutional Scoping · RBAC · BullMQ Scheduled Jobs · REST Endpoints│
└──────────────┬────────────────────┬────────────────────┬───────────────┘
               │                    │                    │
               ▼                    ▼                    ▼
     ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐
     │  MongoDB/Mongoose│  │  Redis / Mock    │  │   AI Orchestration    │
     │  Primary Storage │  │  Queue / Cache   │  │   Multi-tier Router   │
     │ (Memory Fallback)│  │ (Zero-dep mode)  │  │                       │
     └──────────────────┘  └──────────────────┘  └───┬───────────────┬───┘
                                                     │               │
                                                     ▼               ▼
                                            ┌────────────────┐ ┌─────────────┐
                                            │ FastAPI Service│ │ Gemini API  │
                                            │ RAG / Embeddings││ Fallback    │
                                            └────────────────┘ └─────────────┘
```

### Core Technologies

- **Frontend**: React 18 with Vite, JavaScript, Tailwind CSS, Vanilla CSS custom theme tokens, React Router v6, Axios with interceptors, Recharts for academic analytics, and Lucide React icons.
- **Backend**: Node.js with Express.js, express-validator, Helmet security headers, CORS protection, Morgan structured logging, Winston logger, and bcrypt password hashing.
- **Database & Persistence**: MongoDB with Mongoose ODM schemas, validation, compound indexes, and institutional tenancy scoping. Includes an automatic **in-memory MongoDB engine (`mongodb-memory-server`)** for zero-setup, instant local developer execution.
- **Background Jobs**: BullMQ queue architecture with redis-ready queue definitions and a lightweight in-memory fallback queue for zero-dependency execution.
- **AI Microservice & Orchestrator**: Python FastAPI service with vector search capabilities and a **multi-tier intelligent routing layer**:
  1. **Tier 1 (Internal Models / RAG)**: Queries internal embeddings and syllabus context via FastAPI or local inference.
  2. **Tier 2 (Gemini API Fallback)**: Secure server-side fallback forwarding sanitized course context when internal confidence is low and fallback is permitted by policy.
  3. **Tier 3 (Institutional Pedagogical Engine)**: Structured, syllabus-grounded pedagogical fallback ensuring high-availability AI tutoring even when external providers are offline.

---

## 2. Default Seeded Credentials

When starting the application in development, the database automatically boots and seeds the initial **Northstar University** institutional environment:

| Persona | Email Address | Password | Role & Assigned Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@northstar.local` | `ChangeMe123!` | System governance, course approvals, user management, institutional settings |
| **Instructor** | `instructor@northstar.local` | `ChangeMe123!` | Course design, curriculum builder, assignment/rubric publishing, grading workspace, AI Copilot, cohort roster |
| **Student** | `student@northstar.local` | `ChangeMe123!` | Enrolled coursework, interactive lesson player, assignment submissions, quizzes, calendar, AI Study Room, profile & developer integrations |

> **Pro Tip**: The `/login` page provides **1-Click Instant Demo Login buttons** ("Student", "Instructor", "Admin") to instantly switch between personas without typing credentials.

---

## 3. Key Portals & Core Workflows

### A. Public Website & Discovery
- **Hero & Value Proposition**: Modern dark-mode hero banner, clear calls to action, educational philosophy, and community trust metrics.
- **Course Catalog (`/catalog`)**: Real-time keyword search, category filtering, difficulty level, and workload tags.
- **Course Details (`/courses/:courseId`)**: Course overview, learning outcomes, syllabus outline, instructor profile, and institutional enrollment requests.
- **Credential Verification (`/verify/:certificateCode`)**: Cryptographic public verification page checking authenticity, issuing institution, learner name, issue timestamp, and revocation status.

### B. Authentication & Social Identity (`/login`, `/register`)
- Email & password registration with password complexity validation and time-limited verification tokens.
- **Social OAuth Identity**: Google, GitHub, and Facebook buttons with authentic provider workflows.
- Password recovery (`/forgot-password`) and reset (`/reset-password`) with enumeration-safe tokens.
- **First-Time Onboarding Wizard (`/onboarding`)**: 4-step guided configuration:
  1. Personal Profile (Name, headline, biography, language, timezone).
  2. Academic Details (Department, degree program, study level, expected graduation).
  3. Learning Goals & Schedule (Interests, weekly study hours, objectives).
  4. Connected Accounts & Theme (GitHub, LinkedIn, LeetCode, Dark/Light preference).

### C. Comprehensive Profile Page (`/profile`)
Organized into 7 dedicated, interactive tabs:
1. **Personal Information**: Avatar, display name, biography, contact details, timezone, language, and public visibility toggle.
2. **Academic Information**: Department, degree program, study year, enrolled courses, and completed course history.
3. **Professional & Career**: Professional headline, career goals, resume upload container, portfolio links, and technical skill tags.
4. **Connected Accounts & Developer Integrations**:
   - **GitHub Card**: OAuth/username connection, public repository sync, showcase project selection, and commit activity.
   - **LinkedIn Card**: Honest status reporting ("Connected - Link Only") with verified profile link.
   - **LeetCode Card**: Synchronized public problem-solving metrics (Easy, Medium, Hard solved counts, ranking, contest rating).
   - **Status Model**: Displays real backend states: *Not Connected, Syncing, Synced Successfully, Sync Failed, Link Only*.
5. **Learning Preferences**: Study reminder frequency, weekly availability slider, explanation style, and AI tutor behavior.
6. **Achievements & Milestones**: Verified milestone badges (First Course, Course Completer, Certificate Earner, Study Rhythm) awarded via database activity.
7. **Account & Security**: Password change form, email verification status, session management, and GDPR-compliant personal data export (`GET /api/v1/users/me/export-data`).

### D. Student Learning Portal
- **Dashboard (`/dashboard`)**: Momentum snapshot, active course progress bars, upcoming assignment deadlines, and weekly session goals.
- **Course Player (`/learn/:courseId`)**: Sequential curriculum player supporting rich text, videos, and PDFs. Real-time lesson completion persistence and automatic certificate triggering at 100% progress.
- **Assignments & Rubrics (`/assignments`)**: Detailed instructions, due dates, analytic rubrics with criterion points, attempt limits, submission text area, and published grade/feedback views.
- **Quizzes & Assessments (`/assessments`)**: Single/multi-choice questions, randomized options, timed attempt submissions, automated scoring, and detailed answer reviews.
- **Academic Calendar (`/calendar`)**: Month/agenda calendar aggregating assignment deadlines (rose), exam windows (amber), and planned study sessions (emerald) with day-by-day event drilldown.
- **Course Discussions (`/discussions`)**: Threaded discussion forum per course with parent/child replies and moderation capabilities.

### E. AI Study Room (`/ai`) — 8 Core Workflows
A unified, dedicated workspace providing all required AI capabilities:
1. **Context-Aware AI Tutor**: Answers student questions grounded in course syllabus and learning materials.
2. **Personalized Study Planner**: Analyzes student deadlines, incomplete lessons, and weekly availability to generate customized study schedules.
3. **Quiz & Flashcard Generator**: Generates topic-specific multiple-choice questions with correct answer keys, detailed explanations, and flashcards.
4. **Notes & Content Summarizer**: Summarizes lesson text, extracts key definitions, creates formula sheets, and formats study notes.
5. **Pedagogical Copilot**: Available for instructors to draft syllabi, grading rubrics, assignment instructions, and question banks.
6. **Formative Assignment Feedback**: Evaluates student drafts against instructor rubrics, identifying missing concepts without giving away final grades.
7. **Interactive Voice Tutor**: Speech-to-text recognition via Web Speech API, streaming response generation, and text-to-speech audio playback with pause/replay controls.
8. **Smart Course Recommendations**: Suggests next courses based on enrolled subjects, category interests, and skill goals with transparent explanations.

### F. Instructor Studio
- **Teaching Studio Overview (`/teaching`)**: Course portfolio status (draft, pending review, published), active student counts, and pending enrollment review queue.
- **Course & Curriculum Builder (`/teaching/builder`)**: Comprehensive course builder with module ordering, lesson authoring (text/video/doc), learning outcomes, and enrollment policies (open, approval, invite).
- **Instructor Copilot (`/teaching/copilot`)**: AI-assisted generator for syllabi, analytic rubrics, assignment prompts, and exam questions.
- **Student Roster (`/teaching/roster`)**: Cohort roster table with student avatars, emails, enrolled dates, progress indicators, 1-click enrollment approval/decline, and CSV export.
- **Grading Workspace (`/assignments`)**: View student submissions by assignment, inspect submitted text/files, enter rubric scores, provide written feedback, and release grades to students.

### G. Institutional Administration Portal
- **Admin Overview (`/admin`)**: Institutional telemetry metrics and Recharts analytics visualizations:
  - Monthly enrollments, course completions, and AI queries time series.
  - Grade distribution histogram across all cohorts.
  - Course category breakdown.
- **User Management Directory (`/admin/users`)**: Search, filter by role/status, change user roles, suspend/reactivate accounts, and create new institutional users.
- **Course Review Queue (`/admin/approvals`)**: Review courses submitted by instructors with 1-click Approve & Publish or Return for Revision with feedback.
- **Institutional Settings (`/admin/settings`)**: Configure organization profile, primary/accent branding tokens, logo/banner URLs, academic departments, certificate templates & signers, and institutional AI governance policies.

### H. OmniClass Design System & Themes
- **Dark Mode (Default)**: Deep graphite, charcoal, and midnight navy surfaces with restrained indigo/cyan accents, soft border contrasts, and zero eye-strain contrast.
- **Light Mode (Soft Neutral)**: Built with warm off-white, pearl, pale slate, and cool gray surfaces — **never plain harsh white** — maintaining visual hierarchy and typography readability.
- **Theme Selector**: Dark, Light, and System modes with immediate DOM application and persistence in `localStorage` and user database profile.

---

## 4. REST API Endpoint Reference (`/api/v1`)

### Authentication & Identity (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new student account with validated email/password |
| `POST` | `/auth/login` | Public | Authenticate user, issue HTTP-only JWT cookie |
| `POST` | `/auth/demo-login` | Public | Instant 1-click login as student, instructor, or admin |
| `GET` | `/auth/google` | Public | Initiate official Google OAuth authorization flow |
| `GET` | `/auth/github` | Public | Initiate official GitHub OAuth authorization flow |
| `GET` | `/auth/facebook` | Public | Initiate official Facebook OAuth authorization flow |
| `POST` | `/auth/email/verification/request` | Authenticated | Send verification token to signed-in user |
| `POST` | `/auth/email/verify` | Public | Consume email verification token |
| `POST` | `/auth/password/forgot` | Public | Request enumeration-safe password reset token |
| `POST` | `/auth/password/reset` | Public | Reset password with valid token and invalidate old sessions |
| `POST` | `/auth/logout` | Public | Clear session cookie |

### User Management & Profile (`/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Authenticated | Fetch current user profile with academic and integration data |
| `PATCH` | `/users/me` | Authenticated | Update personal profile details and theme |
| `PATCH` | `/users/me/profile` | Authenticated | Comprehensive update across academic, professional, and preferences |
| `PATCH` | `/users/me/onboarding` | Authenticated | Save onboarding wizard data and mark onboarding completed |
| `POST` | `/users/me/change-password` | Authenticated | Change password verifying previous password |
| `GET` | `/users/me/export-data` | Authenticated | GDPR-compliant export of personal data, enrollments, and submissions |
| `GET` | `/users/me/saved-courses` | Authenticated | List bookmarked courses in personal library |
| `POST` | `/users/me/saved-courses/:id` | Authenticated | Add course to personal library |
| `DELETE` | `/users/me/saved-courses/:id` | Authenticated | Remove course from personal library |

### Courses & Curriculum (`/courses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/courses` | Public | Paginated, searchable course catalog with category filters |
| `GET` | `/courses/mine` | Authenticated | List current user's active, pending, and completed courses |
| `GET` | `/courses/managed` | Instructor/Admin | List courses created or managed by the instructor |
| `POST` | `/courses` | Instructor/Admin | Create new course with modules, lessons, and outcomes |
| `PATCH` | `/courses/:id` | Instructor/Admin | Update course curriculum, metadata, and publication status |
| `DELETE` | `/courses/:id` | Instructor/Admin | Soft-delete / archive course |
| `GET` | `/courses/:id` | Public | Course details and syllabus outline (without private lesson text) |
| `POST` | `/courses/:id/enroll` | Authenticated | Enroll or submit enrollment request |
| `GET` | `/courses/:id/learn` | Enrolled | Access full course content, modules, and lessons |
| `POST` | `/courses/:id/lessons/:key/complete`| Student | Mark lesson complete, recalculate progress, auto-issue certificate at 100% |
| `GET` | `/courses/:id/roster` | Instructor/Admin | List enrolled learners, progress, and pending requests |
| `GET` | `/courses/enrollments/pending` | Instructor/Admin | List pending enrollment requests across instructor courses |
| `PATCH` | `/courses/enrollments/:id/decision` | Instructor/Admin | Approve or reject pending enrollment request |

### Coursework & Assessments (`/assignments`, `/quizzes`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/assignments` | Authenticated | List published assignments for enrolled or managed courses |
| `POST` | `/assignments` | Instructor/Admin | Author new assignment with grading rubric criteria and due dates |
| `POST` | `/assignments/:id/submit` | Student | Submit assignment response with attempt tracking |
| `GET` | `/assignments/:id/submissions` | Instructor/Admin | List submissions for assignment |
| `PATCH` | `/assignments/submissions/:id/grade` | Instructor/Admin | Enter rubric scores and feedback comments |
| `POST` | `/assignments/submissions/:id/publish-grade`| Instructor/Admin | Release grade and feedback to student |
| `GET` | `/quizzes` | Authenticated | List objective quizzes for enrolled or managed courses |
| `POST` | `/quizzes` | Instructor/Admin | Publish quiz with multiple-choice questions and options |
| `POST` | `/quizzes/:id/attempts` | Student | Submit quiz attempt, calculate score, and return review |

### AI Studio & Microservices (`/ai`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/ai/tutor/message` | Authenticated | Context-aware tutoring with lesson grounding |
| `POST` | `/ai/planner/generate` | Authenticated | AI customized study schedule generation |
| `POST` | `/ai/quiz/generate` | Authenticated | Synthesize practice MCQs with explanations and flashcards |
| `POST` | `/ai/summarizer/summarize` | Authenticated | Extract key concepts and summarize lesson materials |
| `POST` | `/ai/copilot/draft` | Instructor/Admin | Draft curriculum syllabi, rubrics, and assignment instructions |
| `POST` | `/ai/feedback/analyze` | Authenticated | Formative feedback on assignment drafts against rubrics |
| `POST` | `/ai/voice/interact` | Authenticated | Conversational voice tutor interaction |
| `GET` | `/ai/recommendations` | Authenticated | Personalized course recommendations with explanations |

### Institutional Administration (`/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/overview` | Admin | Institutional overview metrics and summary KPIs |
| `GET` | `/admin/analytics` | Admin | Time-series enrollments, AI queries, and grade distributions |
| `GET` | `/admin/users` | Admin | Search, filter, and paginate institutional user directory |
| `POST` | `/admin/users` | Admin | Provision new user with specified role |
| `PATCH` | `/admin/users/:id/role` | Admin | Reassign user role (student, instructor, admin) |
| `PATCH` | `/admin/users/:id/status` | Admin | Suspend or reactivate user account |
| `GET` | `/admin/courses/pending` | Admin | List courses submitted for review |
| `PATCH` | `/admin/courses/:id/approve` | Admin | Approve and publish submitted course |
| `PATCH` | `/admin/courses/:id/reject` | Admin | Return course to draft with revision notes |
| `GET` | `/admin/institution` | Admin | Get institutional profile, branding, and policy settings |
| `PATCH` | `/admin/institution` | Admin | Update branding tokens, departments, certificates, and AI policies |

### Developer Integrations (`/integrations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/integrations/github/connect` | Authenticated | Connect GitHub username/account |
| `POST` | `/integrations/github/sync` | Authenticated | Fetch public repositories and commit activity via GitHub API |
| `POST` | `/integrations/linkedin/connect` | Authenticated | Link verified LinkedIn public profile URL |
| `POST` | `/integrations/leetcode/connect` | Authenticated | Connect LeetCode profile and sync public contest/problem statistics |
| `DELETE` | `/integrations/:provider/disconnect` | Authenticated | Revoke and disconnect external integration |

### Calendar, Certificates, Discussions, Notifications
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/calendar` | Authenticated | Unified schedule of assignment deadlines, quiz windows, and study sessions |
| `GET` | `/certificates/mine` | Authenticated | List earned course completion certificates |
| `GET` | `/certificates/verify/:code` | Public | Public certificate authenticity verification |
| `GET` | `/discussions/courses/:id` | Authenticated | List threaded course discussion posts and replies |
| `POST` | `/discussions/courses/:id` | Authenticated | Post discussion topic or reply to existing thread |
| `DELETE` | `/discussions/:id` | Authenticated | Moderate or delete discussion post |
| `GET` | `/notifications` | Authenticated | Fetch user notifications and unread badge count |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark notification as read |
| `PATCH` | `/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## 5. Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v20 or later (v22.20 tested)
- **npm**: v10 or later
- **Python**: 3.11 or 3.12 (optional for local FastAPI AI service)

### Step 1: Environment Variables Setup
Copy the example environment files:
```bash
# In backend/
cp .env.example .env

# In frontend/
cp .env.example .env

# In ai-service/ (optional)
cp .env.example .env
```

### Step 2: Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 3: Run the Backend API
```bash
cd backend
npm run dev
```
> **Zero Configuration Notice**: If local MongoDB is not running, the backend automatically launches an embedded in-memory MongoDB database and initializes complete development seed data for Northstar University. The API runs on `http://localhost:3000`.

### Step 4: Run the Frontend
In a separate terminal:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

### Step 5: (Optional) Run the Python AI Microservice
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*(If the FastAPI service is not started, the backend's multi-tier AI Orchestrator seamlessly falls back to Gemini API or the built-in Institutional Pedagogical Engine).*

---

## 6. Implementation Status Checklist

| Feature Area | Status | Implementation Details |
| :--- | :---: | :--- |
| **Public Website & Discovery** | ✅ Completed | Landing hero, values, public course catalog, course details, and certificate verification |
| **Authentication & Sessions** | ✅ Completed | Register, login, logout, verification, password recovery/reset, HTTP-only JWT cookies |
| **Social OAuth Providers** | ✅ Completed | Google, GitHub, and Facebook OAuth initiation endpoints and provider UI |
| **1-Click Demo Accounts** | ✅ Completed | Instant switching between Student, Instructor, and Admin seeded personas |
| **First-Time Onboarding** | ✅ Completed | 4-step wizard: profile, academic program, study goals, integrations, and theme |
| **7-Tab Profile Page** | ✅ Completed | Personal, Academic, Professional, Connected Accounts, Preferences, Achievements, Security |
| **Connected Accounts (Honest Status)** | ✅ Completed | GitHub repo sync, LinkedIn link-only status, LeetCode stats sync & honest status model |
| **GDPR Data Export** | ✅ Completed | `GET /api/v1/users/me/export-data` personal archive endpoint |
| **Course & Curriculum Builder** | ✅ Completed | Sequential module/lesson editor, reordering, learning outcomes, enrollment policies |
| **Interactive Lesson Player** | ✅ Completed | Outline navigation, rich-text lesson renderer, progress persistence across sessions |
| **Assignments & Rubrics** | ✅ Completed | Assignment builder with analytic rubrics, attempt limits, submission tracking, and grading |
| **Quizzes & Assessments** | ✅ Completed | MCQ question builder, options randomized, timed attempts, automated scoring & review |
| **Certificates & Verification** | ✅ Completed | Auto-issuance on 100% course completion, unique certificate code, public verification |
| **Academic Calendar** | ✅ Completed | Month/agenda schedule aggregating assignment deadlines, quiz windows, and study sessions |
| **Course Discussions** | ✅ Completed | Threaded discussions with parent/child replies and instructor moderation |
| **AI Study Tutor (Context-Aware)** | ✅ Completed | Grounded tutoring with course context, custom explanation styles, and conversation reset |
| **AI Study Planner** | ✅ Completed | Customized weekly study schedule generator based on student goals and deadlines |
| **AI Quiz & Flashcard Generator** | ✅ Completed | Automatic MCQ synthesis with answer keys, explanations, and flashcard cards |
| **AI Content Summarizer** | ✅ Completed | Extract key concepts, definitions, formulas, and revision study sheets |
| **AI Pedagogical Copilot** | ✅ Completed | Syllabus drafts, grading rubrics, assignment prompts, and question banks for faculty |
| **AI Formative Feedback** | ✅ Completed | Pre-submission draft evaluation against rubrics with constructive guidance |
| **AI Interactive Voice Tutor** | ✅ Completed | Web Speech API speech-to-text, streaming generation, and speech synthesis playback |
| **AI Course Recommendations** | ✅ Completed | Transparent recommendation engine based on enrolled subjects and stated interests |
| **Multi-Tier AI Routing** | ✅ Completed | FastAPI internal RAG -> Gemini API fallback -> Institutional Pedagogical Engine |
| **Instructor Studio** | ✅ Completed | Overview, curriculum builder, AI copilot, grading queue, cohort roster with CSV export |
| **Admin Governance Portal** | ✅ Completed | Overview telemetry, Recharts analytics, user management, course review, institution settings |
| **Dark & Light Mode Design** | ✅ Completed | Midnight charcoal/navy default; Soft pearl/slate neutral light mode (no plain white) |
| **Automated Background Jobs** | ✅ Completed | BullMQ queues with in-memory fallback for reminders, certificates, emails, and analytics |
| **Zero-Config Database** | ✅ Completed | Dual-mode MongoDB connection with automatic embedded memory fallback & seed bootstrap |

---

## 7. Security & Compliance Architecture

- **Multi-Tenant Isolation**: All database queries enforce institutional scoping (`institutionId`). Users cannot access cross-institution records without authorization.
- **Server-Side Role Enforcement**: Frontend route guards are purely cosmetic; all API routes enforce `requireAuth` and `requireRole('instructor', 'admin')` at the controller layer.
- **Credential Protection**: Passwords hashed with bcrypt (salt rounds: 10). Sensitive tokens, OAuth secrets, and private keys are never exposed in browser bundles or responses.
- **Honest Integration Guarantees**: External integration cards display real verified states from backend database models rather than fabricated green badges.
- **AI Privacy & Safety**: Student personally identifiable information (PII) is stripped prior to any external AI orchestration. Fallback to Gemini can be toggled per institution.
