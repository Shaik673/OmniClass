# OmniClass LMS — Implementation Task List

## Task Dependency Graph

```
Phase 1: Foundation
  T01 (Project Scaffold) ──► T02 (DB Schemas) ──► T03 (Auth API) ──► T04 (Auth Frontend)

Phase 2: Core Platform
  T02 ──► T05 (User Profile API)
  T04 ──► T06 (User Profile Frontend)
  T03 ──► T07 (Institution & Admin API)
  T07 ──► T08 (Admin Frontend)

Phase 3: Course System
  T02 ──► T09 (Course/Content API)
  T07 ──► T10 (Enrollment API)
  T09 ──► T11 (Course Builder Frontend)
  T10 ──► T12 (Student Portal Frontend)

Phase 4: Assessments & Grading
  T09 ──► T13 (Assignments API)
  T09 ──► T14 (Quiz API)
  T13, T14 ──► T15 (Grading API)
  T13, T14 ──► T16 (Assessment Frontend)

Phase 5: Progress, Analytics & Certificates
  T10, T13, T14 ──► T17 (Progress & Analytics API)
  T17 ──► T18 (Certificate System)
  T17 ──► T19 (Analytics Frontend)

Phase 6: AI Subsystem
  T02 ──► T20 (FastAPI AI Service)
  T20 ──► T21 (RAG Pipeline)
  T21 ──► T22 (AI Tutor)
  T21 ──► T23 (Study Planner)
  T21 ──► T24 (Quiz & Flashcard Generator)
  T21 ──► T25 (Notes Summarizer)
  T21 ──► T26 (Instructor Copilot)
  T21 ──► T27 (Assignment Feedback)
  T22 ──► T28 (Voice Tutor)
  T22 ──► T29 (Course Recommendations)
  T22, T23, T24, T25, T26, T27, T28, T29 ──► T30 (AI Frontend)

Phase 7: Communication, Gamification & Scheduling
  T03 ──► T31 (Notification System)
  T17 ──► T32 (Gamification Engine)
  T31, T32 ──► T33 (Communication Frontend)

Phase 8: Integrations & Public Site
  T05 ──► T34 (External Integrations)
  T09 ──► T35 (Public Website)

Phase 9: Quality & Delivery
  T01..T35 ──► T36 (Testing & QA)
  T36 ──► T37 (Security Hardening)
  T37 ──► T38 (Documentation & README)
```

---

## Phase 1: Foundation

### Task 1: Project Scaffold and Infrastructure Setup

**Requirement refs:** R31 (API standards), R30 (design system)

- [ ] 1.1 Initialize monorepo folder structure: `frontend/`, `backend/`, `ai-service/`, `nginx/`
- [ ] 1.2 Scaffold React + Vite + JavaScript frontend with Tailwind CSS, React Router, and Axios
- [ ] 1.3 Scaffold Node.js + Express.js backend with ES modules, Helmet, CORS, Morgan, and dotenv
- [ ] 1.4 Scaffold Python FastAPI AI service with uvicorn, pydantic, httpx, and python-dotenv
- [ ] 1.5 Create `.env.example` files for all three services with placeholder values only (no real secrets)
- [ ] 1.6 Set up `docker-compose.yml` defining services: mongodb, redis, qdrant, api, ai-service, frontend, nginx
- [ ] 1.7 Set up `docker-compose.dev.yml` for local development with hot-reload mounts
- [ ] 1.8 Configure centralized structured JSON logging for Express (winston) and FastAPI (structlog)
- [ ] 1.9 Implement health check endpoints: `GET /health` (Express) and `GET /ai/health` (FastAPI)
- [ ] 1.10 Configure Nginx reverse proxy to route `/api/` → Express `:3000` and `/ai/` → FastAPI `:8000`
- [ ] 1.11 Set up RSA key pair for JWT RS256 signing and configure key paths in environment
- [ ] 1.12 Implement request ID middleware (attach UUID to every request; include in all responses and logs)
- [ ] 1.13 Implement centralized Express error handler returning consistent `{ success, error, requestId }` format
- [ ] 1.14 Set up BullMQ with Redis connection and define queue stubs: `reminders`, `certificates`, `emails`, `ai-indexing`, `analytics`
- [ ] 1.15 Configure Tailwind design token system in `frontend/src/theme/tokens.js` with dark/light palettes (deep charcoal base, soft-gray light base)
- [ ] 1.16 Implement `ThemeProvider` context, `useTheme` hook, and `prefers-color-scheme` system detection with localStorage persistence
- [ ] 1.17 Prevent theme flash on initial load (inline script in `index.html` before React hydration)
- [ ] 1.18 Build primitive UI component library: Button, Input, Select, Modal, Drawer, Dropdown, Table, Badge, Avatar, Card, Skeleton, Toast, Tooltip, Tabs, Progress, EmptyState
- [ ] 1.19 Build AppShell layout with collapsible sidebar, responsive TopBar (search, notifications, profile, theme toggle), and MobileNav
- [ ] 1.20 Implement Axios API service layer (`api.js`) with base URL, `withCredentials`, timeout, request interceptor (attach access token), and response interceptor (401 → refresh token → retry with queue)

---

### Task 2: Database Schemas and Indexes

**Requirement refs:** R1 (multi-tenant), R17 (data architecture)

- [ ] 2.1 Connect Mongoose to MongoDB with connection pooling, retry on disconnect, and environment-based URI
- [ ] 2.2 Create `Institution` schema: name (unique), slug, domain, branding, settings (enrollmentPolicy, aiEnabled, certificatesEnabled, maxStorageGB, allowedFileTypes), status, timestamps
- [ ] 2.3 Create `Department` schema: institutionId ref, name, code, headUserId, status, timestamps
- [ ] 2.4 Create `AcademicProgram` schema: institutionId, departmentId, name, code, degree, durationYears, status, timestamps
- [ ] 2.5 Create `AcademicTerm` schema: institutionId, name, startDate, endDate, registrationDates, status, timestamps
- [ ] 2.6 Create `User` schema: institutionId, email (unique index), passwordHash, emailVerified, verificationToken/expiry, resetToken/expiry, roles array, status, loginAttempts, lockUntil, onboardingCompleted, timestamps
- [ ] 2.7 Create `UserProfile` schema: userId (unique), institutionId, personal fields, academic fields, professional fields, learning preferences, themePreference, profileVisibility, profileCompletionScore, timestamps
- [ ] 2.8 Create `Session` schema: userId, refreshToken (hashed), deviceInfo, ipAddress, expiresAt, revokedAt, createdAt
- [ ] 2.9 Create `OAuthAccount` schema: userId, provider enum, providerAccountId, accessToken/refreshToken (encrypted), tokenExpiry, scope array, profileData, status, lastSyncAt, lastError; compound unique index `{ userId, provider }`
- [ ] 2.10 Create `Invitation` schema: institutionId, email, role, invitedBy, token (hashed), expiresAt, status, timestamps
- [ ] 2.11 Create `Course` schema: institutionId, departmentId, termId, title, slug (unique), description, thumbnail, category, tags, difficulty, prerequisites array, learningOutcomes, enrollmentPolicy, maxEnrollments, status, instructors array, createdBy, timestamps
- [ ] 2.12 Create `Section`, `Module`, `Lesson` schemas with proper parent refs, order fields, content type union, vectorIndexed flag, and status fields
- [ ] 2.13 Create `Enrollment` schema: userId, courseId, institutionId, status, completionPercentage, certificateId; compound unique index `{ userId, courseId }`
- [ ] 2.14 Create `LessonProgress` schema: userId, courseId, lessonId, status, progressPercent, lastPosition, timeSpent, completedAt; compound unique index `{ userId, lessonId }`
- [ ] 2.15 Create `ActivityEvent` schema: userId, institutionId, eventType enum, resourceId, metadata, timestamp with TTL index
- [ ] 2.16 Create `Assignment` schema: courseId, moduleId, createdBy, title, instructions, attachments, openDate, dueDate, latePolicy, maxMarks, rubric array, submissionFormats, maxAttempts, status
- [ ] 2.17 Create `Submission` schema: assignmentId, courseId, userId, attemptNumber, status, content (text/files/links/code), submittedAt, isLate, grade sub-document (marks, rubricScores, feedback, gradedBy, publishedAt)
- [ ] 2.18 Create `Quiz` schema: courseId, moduleId, createdBy, duration, maxAttempts, passingScore, shuffleQuestions/Answers, showAnswersAfter, openDate, closeDate, questionBankSize, status, totalPoints
- [ ] 2.19 Create `Question` schema: quizId, courseId, type enum, text, options array (id/text/isCorrect/explanation), points, difficulty, order, tags
- [ ] 2.20 Create `QuizAttempt` schema: quizId, userId, courseId, attemptNumber, status, startedAt, submittedAt, expiresAt, responses array (questionId/answer/isCorrect/pointsEarned/gradingStatus), totalScore, maxScore, percentage, passed
- [ ] 2.21 Create `Grade` schema: userId, courseId, institutionId, assignments array, quizzes array, finalGrade, letterGrade, status, history array (changedAt/changedBy/previousGrade/newGrade/reason), timestamps
- [ ] 2.22 Create `Certificate` schema: userId, courseId, institutionId, enrollmentId, verificationId (unique), studentName, courseName, institutionName, issuedAt, fileKey, status, revokedAt/revokedBy/revokedReason
- [ ] 2.23 Create `AIConversation` schema: userId, courseId, lessonId, feature enum, messages array (role/content/provider/sourceRefs/timestamp/tokens), status
- [ ] 2.24 Create `StudyPlan` schema: userId, institutionId, sessions array (date/duration/courseId/lessonId/topic/type/completed), goals, status
- [ ] 2.25 Create `VectorDocument` schema: courseId, lessonId, institutionId, sourceType, chunks array (chunkId/text/tokenCount), embeddingModel, indexedAt, status
- [ ] 2.26 Create `Achievement`, `PointTransaction`, `Notification`, `Announcement`, `Discussion`, `AuditLog`, `Note`, `Bookmark` schemas with appropriate fields and indexes
- [ ] 2.27 Apply all compound indexes from design spec: enrollments `{userId,courseId}` unique, courses `{institutionId,status,category}`, notifications `{userId,read,createdAt}`, certificates `{verificationId}` unique, oauthAccounts `{userId,provider}` unique, etc.
- [ ] 2.28 Create database seed script: one institution, admin/instructor/student users, sample courses, modules, lessons, and enrollments for development testing

---

### Task 3: Authentication API

**Requirement refs:** R3 (auth security), R4 (RBAC)

- [ ] 3.1 Implement `POST /api/v1/auth/register`: validate input (Zod), check duplicate email, hash password (bcrypt cost 12), create User + UserProfile, generate email verification token, queue verification email
- [ ] 3.2 Implement `GET /api/v1/auth/verify-email/:token`: validate token expiry, mark email as verified, clear token fields, return success
- [ ] 3.3 Implement `POST /api/v1/auth/login`: validate credentials, check account status/lock, verify password, issue RS256 JWT access token (15 min), issue refresh token (hashed copy in Sessions), set HttpOnly SameSite=Strict cookie
- [ ] 3.4 Implement `POST /api/v1/auth/refresh-token`: read refresh token from cookie, find session, verify expiry, rotate token (issue new, revoke old), detect reuse (revoke entire family), return new access token
- [ ] 3.5 Implement `POST /api/v1/auth/logout`: revoke current refresh token, clear session, clear cookie
- [ ] 3.6 Implement `POST /api/v1/auth/forgot-password`: validate email, generate 1-hour reset token, queue password reset email, invalidate any prior reset tokens
- [ ] 3.7 Implement `POST /api/v1/auth/reset-password`: validate token, enforce password strength, hash new password, invalidate all sessions (force re-login), clear reset token
- [ ] 3.8 Configure Passport.js Google OAuth strategy: state validation, callback handling, new-user creation, duplicate-email conflict detection (return ACCOUNT_EXISTS flag, do NOT auto-merge)
- [ ] 3.9 Configure Passport.js GitHub OAuth strategy (same pattern as Google): scopes `user:email read:user`, conflict handling
- [ ] 3.10 Configure Passport.js Facebook OAuth strategy: same pattern, handle missing email scenario
- [ ] 3.11 Implement OAuth callback routes `GET /api/v1/auth/oauth/:provider` and `GET /api/v1/auth/oauth/:provider/callback` with secure state cookie, session creation, and redirect to frontend with token exchange
- [ ] 3.12 Implement `authenticate` middleware: verify JWT signature, check expiry, load user from DB, attach `req.user`
- [ ] 3.13 Implement `authorize(...roles)` middleware: check `req.user.roles` against required roles, return 403 if insufficient
- [ ] 3.14 Implement `enforceInstitution` middleware: attach `req.institutionId` from `req.user.institutionId`; all resource queries must use this value
- [ ] 3.15 Implement `authorizeOwnerOrAdmin(getResourceOwnerId)` middleware factory for resource-level ownership checks
- [ ] 3.16 Implement login rate limiting: track failed attempts per account, lock after 10 failures with `lockUntil` timestamp, unlock after 30 minutes
- [ ] 3.17 Write integration tests for all auth flows: register → verify → login → refresh → logout; OAuth flows; duplicate email conflict; password reset; account lock/unlock

---

### Task 4: Authentication Frontend

**Requirement refs:** R3, R5 (onboarding redirect)

- [ ] 4.1 Build Login page: email/password form with validation, social login buttons (Google/Facebook/GitHub) with official provider icons, loading states, error messages, forgot-password link
- [ ] 4.2 Build Register page: email/password/confirm form with strength indicator, social signup buttons, terms acceptance, validation, success state with "check your email" message
- [ ] 4.3 Build ForgotPassword page: email input, submission with success confirmation
- [ ] 4.4 Build ResetPassword page: token from URL params, new password + confirm with strength validation
- [ ] 4.5 Build EmailVerification page: display status based on token response (success / expired / already verified)
- [ ] 4.6 Implement `authStore` (Zustand): `accessToken`, `user`, `isAuthenticated`, `setAccessToken`, `setUser`, `logout`
- [ ] 4.7 Implement `ProtectedRoute` component: redirect unauthenticated users to `/login`
- [ ] 4.8 Implement `RoleRoute` component: check role, redirect unauthorized users to appropriate dashboard
- [ ] 4.9 Implement `PublicRoute` component: redirect already-authenticated users away from auth pages to their portal
- [ ] 4.10 Implement OAuth account-linking conflict UI: when backend returns `ACCOUNT_EXISTS`, show modal explaining conflict and prompting explicit re-authentication before linking
- [ ] 4.11 Apply smooth page transition animations on route changes (Framer Motion or CSS transitions)
- [ ] 4.12 Ensure all auth pages are fully responsive and use the correct theme tokens for both dark and light modes

---

## Phase 2: Core Platform

### Task 5: User Profile API

**Requirement refs:** R6 (profile), R7 (integrations)

- [ ] 5.1 Implement `GET /api/v1/users/me` and `PUT /api/v1/users/me`: return/update core user fields with validation
- [ ] 5.2 Implement `GET /api/v1/users/me/profile` and `PUT /api/v1/users/me/profile`: full profile CRUD with section-level validation (personal, academic, professional, preferences)
- [ ] 5.3 Implement `PUT /api/v1/users/me/password`: verify current password, validate new password strength, hash and update, invalidate all other sessions
- [ ] 5.4 Implement avatar upload: `POST /files/upload-url` for `purpose=avatar`, validate JPEG/PNG/WebP ≤ 5 MB, confirm upload, update `userProfile.avatar`
- [ ] 5.5 Implement `GET /api/v1/users/me/sessions`: list active sessions with device info and IP; `DELETE /api/v1/users/me/sessions/:id`: revoke a specific session
- [ ] 5.6 Implement profile completion score calculation: count filled optional fields, compute percentage, update `profileCompletionScore` on profile save
- [ ] 5.7 Implement `GET /api/v1/users/me/integrations`: return all OAuthAccount records for the user with status, lastSyncAt, available capabilities
- [ ] 5.8 Implement GitHub integration OAuth flow: connect (initiate OAuth), callback (store encrypted tokens, fetch public repos via GitHub API, save to profile), sync (refresh public repo data), disconnect (delete tokens, update status)
- [ ] 5.9 Implement LinkedIn integration: OAuth connect flow where API permits; fallback to link-only (store `linkedinUrl`); label status as `link_only` when full sync unavailable
- [ ] 5.10 Implement LeetCode integration: link-only flow (store `leetcodeUsername` + profile URL + optional manual stats); label as `link_only` with manual update; MUST NOT scrape or request password
- [ ] 5.11 Implement `POST /api/v1/users/me/integrations/:provider/sync`: refresh provider data within permitted scopes; update `lastSyncAt`, `status`; handle expired/revoked tokens → set status to `expired`
- [ ] 5.12 Implement `DELETE /api/v1/users/me/integrations/:provider`: revoke/delete stored tokens, clear integration record, update status to `disconnected`
- [ ] 5.13 Implement `GET /api/v1/users/me/export`: generate authorized personal data export (profile, enrollments, grades, certificates — no other users' data)
- [ ] 5.14 Implement account deletion request: set user status to `deletion_requested`, record timestamp, prevent login while preserving institutional records per retention policy

---

### Task 6: User Profile Frontend

**Requirement refs:** R6, R7

- [ ] 6.1 Build Profile page shell with tabbed navigation: Personal Info, Academic Info, Professional, Security, Preferences, Achievements
- [ ] 6.2 Build Personal Information tab: avatar upload (drag-and-drop + click), all personal fields with inline edit, profile completion progress ring, visibility settings
- [ ] 6.3 Build Academic Information tab: institution/department/program display, enrollment year, learning goals, interests, skills — with edit mode and validation
- [ ] 6.4 Build Professional & Career tab: headline, career objective, portfolio links (add/remove), resume upload (private), LinkedIn/GitHub URL fields
- [ ] 6.5 Build Account & Security tab: change password form, connected providers list (show provider icon + account ID + disconnect button), active sessions list with revoke action, email change flow with verification notice
- [ ] 6.6 Build Learning Preferences tab: difficulty preference, weekly study hours, study reminder toggle + time picker, AI tutor style, theme selector (Dark/Light/System)
- [ ] 6.7 Build Achievements & Summary tab: courses completed, active enrollments, certificates earned (with view/download links), points balance, learning streak, badges grid — all from API
- [ ] 6.8 Build Connected Accounts section with three integration cards (GitHub, LinkedIn, LeetCode): each showing provider icon, connection status badge, last sync time, automation features list, connect/disconnect/sync buttons, clear Link Only label where applicable
- [ ] 6.9 Implement integration status state machine in UI: Not Connected → Awaiting → Connected/Link Only → Syncing → Synced/Failed; status from API only, never hardcoded
- [ ] 6.10 Implement "Preview Public Profile" modal showing only publicly visible fields based on current visibility settings
- [ ] 6.11 Implement form unsaved-changes guard: show confirmation dialog on navigation if profile has unsaved edits
- [ ] 6.12 Apply hover states, loading skeletons, success/error toasts, and confirmation dialogs for all destructive actions (disconnect, delete request)

---

### Task 7: Institution and Administration API

**Requirement refs:** R1 (multi-tenant), R25 (admin)

- [ ] 7.1 Implement institution CRUD: `POST /institutions` (super-admin), `GET /institutions/:id`, `PUT /institutions/:id` with branding and settings
- [ ] 7.2 Implement department CRUD: scoped to `institutionId`, with head user assignment
- [ ] 7.3 Implement academic program CRUD: scoped to institution and department
- [ ] 7.4 Implement academic term CRUD: create, list, update status (upcoming/active/completed/archived)
- [ ] 7.5 Implement `GET /admin/users`: paginated, filterable by role/status/department/search term, scoped to institution
- [ ] 7.6 Implement `POST /admin/users/invite`: generate 48-hour hashed invitation token, queue invitation email, record Invitation document
- [ ] 7.7 Implement `PUT /admin/users/:id/status`: suspend/activate user, invalidate all sessions on suspension, record audit log
- [ ] 7.8 Implement `PUT /admin/users/:id/role`: change role, validate permitted role transitions, record audit log
- [ ] 7.9 Implement `GET /admin/courses/pending`: list courses in `pending_review` status for the institution
- [ ] 7.10 Implement `POST /admin/courses/:id/approve`: set status to `published`, record approvedBy + approvalNotes, notify instructor, record audit log
- [ ] 7.11 Implement `POST /admin/courses/:id/reject`: set status to `draft`, record rejection reason, notify instructor, record audit log
- [ ] 7.12 Implement `GET /admin/analytics/platform`: aggregate enrollment counts, completion trends, active users, certificate issuance — all scoped to institution
- [ ] 7.13 Implement `GET /admin/audit-logs`: paginated, filterable by date/action/actor/resource, read-only, scoped to institution
- [ ] 7.14 Implement `GET /admin/jobs`: list recent BullMQ job statuses, failed jobs, dead-letter queue entries; `POST /admin/jobs/:id/retry` for manual retry
- [ ] 7.15 Enforce audit log creation for all sensitive admin operations via post-action middleware

---

### Task 8: Admin Dashboard Frontend

**Requirement refs:** R25

- [ ] 8.1 Build Admin portal layout with role-guarded route entry (`/admin/*` requires `admin` or `super_admin` role)
- [ ] 8.2 Build Admin Dashboard overview: key metrics cards (active students, instructors, pending courses, recent enrollments), enrollment trend chart, quick action buttons — all from API
- [ ] 8.3 Build User Management page: searchable/filterable data table, invite user modal (email + role), user detail panel (status, roles, last login), suspend/activate/role-change actions with confirmation dialogs
- [ ] 8.4 Build Course Administration page: pending courses queue with approve/reject actions and reason input, published/archived course list with publish/archive toggles, instructor assignment
- [ ] 8.5 Build Platform Analytics page: enrollment trends line chart, completion rates bar chart, assessment stats, certificate issuance table, date range filter, CSV export button
- [ ] 8.6 Build Institution Settings page: branding fields (logo upload, colors), enrollment policy selector, academic term management, AI toggle, certificate template upload
- [ ] 8.7 Build Audit Logs page: read-only table with filters (date range, action type, actor), expandable row for full change details
- [ ] 8.8 Build Job Monitor page: table of recent background jobs with status, retry button for failed jobs, dead-letter count
- [ ] 8.9 Apply admin-specific color treatment in both themes: slightly more neutral/professional than student portal while sharing the same design token system

---

## Phase 3: Course System

### Task 9: Course and Content Management API

**Requirement refs:** R10 (course management)

- [ ] 9.1 Implement `GET /api/v1/courses` (public catalog): paginated, full-text search (title/description/tags), filter by category/difficulty/status/department, sort by relevance/newest — return only `published` courses to unauthenticated users
- [ ] 9.2 Implement `GET /api/v1/courses/:id` (public detail): return course info, instructor public profiles, syllabus outline (no lesson content), enrollment status for authenticated users
- [ ] 9.3 Implement `POST /api/v1/courses`: instructor creates course as `draft`, validate all required fields with Zod
- [ ] 9.4 Implement `PUT /api/v1/courses/:id`: update course fields, authorize instructor ownership or admin; warn if changing published course details
- [ ] 9.5 Implement `POST /api/v1/courses/:id/publish`: if institution requires approval → set `pending_review` and notify admin; otherwise → set `published`
- [ ] 9.6 Implement `POST /api/v1/courses/:id/archive` and unpublish: verify no active enrollments blocked by policy; update status; notify enrolled students
- [ ] 9.7 Implement Section CRUD: `POST/PUT/DELETE /courses/:id/sections` with order management
- [ ] 9.8 Implement Module CRUD: `POST/PUT/DELETE /courses/:id/modules` with section assignment, order, prerequisite module, unlock condition
- [ ] 9.9 Implement Lesson CRUD: `POST/PUT/DELETE /courses/:id/modules/:moduleId/lessons` with content type variants; on create/update of indexed lesson content, queue `ai-indexing` job
- [ ] 9.10 Implement `POST /api/v1/courses/:id/duplicate`: deep-clone course as draft (sections, modules, lessons) for the same instructor
- [ ] 9.11 Implement drag-and-drop reorder endpoint: `PUT /courses/:id/reorder` accepting `{ type: 'section'|'module'|'lesson', items: [{id, order}] }` in bulk update
- [ ] 9.12 Implement lesson access control middleware: verify enrollment status before returning lesson content; `isFree` lessons bypass enrollment check

---

### Task 10: Enrollment API

**Requirement refs:** R9 (enrollment)

- [ ] 10.1 Implement `POST /api/v1/enrollments`: full enrollment workflow — load course, check status, check duplicate, validate prerequisites (server-side), check capacity/waitlist, set status by policy, create record, dispatch notifications, record activity event
- [ ] 10.2 Implement `GET /api/v1/enrollments/my`: return student's enrollments with course info, progress percentage, and next due deadline
- [ ] 10.3 Implement `GET /api/v1/enrollments/:id`: return enrollment detail (authorized: owner or instructor/admin of course)
- [ ] 10.4 Implement `POST /api/v1/enrollments/:id/approve`: instructor/admin approve pending enrollment, transition to `active`, notify student
- [ ] 10.5 Implement `POST /api/v1/enrollments/:id/reject`: instructor/admin reject enrollment with reason, transition to `rejected`, notify student
- [ ] 10.6 Implement `POST /api/v1/enrollments/:id/withdraw`: student withdrawal — transition to `withdrawn`, preserve grades/submissions/progress, remove course access, record timestamp
- [ ] 10.7 Implement `GET /api/v1/courses/:id/enrollments`: instructor/admin view of all enrollments for a course with filters (status, search, department)
- [ ] 10.8 Implement waitlist promotion job: when an active enrollment is withdrawn or rejected, check if waitlisted students exist; promote first eligible waitlisted student to `pending` or `active` per policy

---

### Task 11: Course Builder Frontend (Instructor)

**Requirement refs:** R10

- [ ] 11.1 Build Instructor portal layout with role-guarded routes and instructor-specific sidebar navigation
- [ ] 11.2 Build Instructor Dashboard: course cards with enrollment counts, pending submissions badge, quick stats (students, completion rate, upcoming deadlines), AI Copilot entry point
- [ ] 11.3 Build Course List page: grid/list toggle, create course button, draft/published/archived tabs, search, status badges
- [ ] 11.4 Build Course Creation wizard: multi-step form (basic info → learning outcomes → settings → review), save draft at each step
- [ ] 11.5 Build Course Editor with tabbed sections: Info, Curriculum, Enrollments, Assignments, Quizzes, Analytics, Settings
- [ ] 11.6 Build Curriculum Builder: drag-and-drop tree (react-dnd or dnd-kit) for sections/modules/lessons; inline add/rename/delete; reorder via drag with server sync on drop
- [ ] 11.7 Build Lesson Editor: type selector (video/text/document/link/download), rich text editor (Tiptap or Quill), video URL input with thumbnail preview, file upload component with progress, external link validator
- [ ] 11.8 Build Course Preview mode: renders course as a student would see it (read-only, no instructor controls)
- [ ] 11.9 Build Publish/Submit for Review flow: confirmation dialog, status transition feedback, notification of approval requirement
- [ ] 11.10 Implement unsaved-changes guard in Lesson Editor with autosave draft every 30 seconds and explicit save button
- [ ] 11.11 Apply instructor-specific hover states, active section highlighting, drag preview, and smooth accordion transitions in curriculum tree

---

### Task 12: Student Portal Frontend

**Requirement refs:** R8 (student portal), R9 (enrollment)

- [ ] 12.1 Build Student portal layout with sidebar (My Courses, AI Tutor, Progress, Calendar, Library, Achievements, Profile)
- [ ] 12.2 Build Student Dashboard: enrolled course cards with progress rings, upcoming deadlines list, recent grades feed, streak counter, AI recommendations strip, recently accessed lesson shortcut
- [ ] 12.3 Build My Courses page: tabbed (Active/Completed/Archived), course card with thumbnail/instructor/progress/next-lesson button, search and filter
- [ ] 12.4 Build Course Workspace: left panel (collapsible curriculum tree with completion checkmarks), center panel (lesson content renderer), right panel (AI Tutor sidebar, Notes panel, Bookmarks)
- [ ] 12.5 Build lesson content renderers: VideoPlayer (with play/pause/seek/fullscreen/transcript toggle), RichTextRenderer, DocumentViewer (PDF.js embed), ExternalLinkCard, DownloadCard
- [ ] 12.6 Implement lesson progress persistence: auto-mark lesson in progress on open, mark complete on explicit action or video end; sync to API; restore last video position on re-open
- [ ] 12.7 Build Course Enrollment flow: public catalog → course detail → enroll button → handle open/approval/waitlist states with clear status messaging
- [ ] 12.8 Build Personal Library: tabbed (Notes/Bookmarks/Flashcards/AI Summaries); search, create, edit, delete each item type; link notes/bookmarks to source lessons
- [ ] 12.9 Build Certificates page: grid of earned certificates, each with course name, issue date, download button, and share/verify link
- [ ] 12.10 Apply polished card hover effects (lift + border glow), progress ring animations on dashboard load, and lesson completion micro-interactions (checkmark animation)

---

## Phase 4: Assessments and Grading

### Task 13: Assignments API

**Requirement refs:** R11 (assignments)

- [ ] 13.1 Implement `POST /api/v1/assignments`: instructor creates assignment with full validation (Zod schema covering all fields from design); save as `draft`
- [ ] 13.2 Implement `GET /api/v1/assignments/course/:courseId`: return assignments list (instructor sees all; student sees only published + within open window)
- [ ] 13.3 Implement `PUT /api/v1/assignments/:id` and status transitions (draft → published → closed → archived)
- [ ] 13.4 Implement `POST /api/v1/assignments/:id/submit`: validate enrollment, open/due date server-side, attempt count, file type/size, create Submission record with timestamp, return receipt; prevent duplicate submissions for same attempt
- [ ] 13.5 Implement draft submission save: `PUT /assignments/:id/submissions/draft` — save without changing status to `submitted`; only owner can read draft
- [ ] 13.6 Implement `GET /api/v1/assignments/:id/submissions`: instructor sees all submissions with status filters; student sees only their own
- [ ] 13.7 Implement `PUT /api/v1/assignments/:id/submissions/:subId/grade`: instructor saves draft grade (rubric scores + feedback); `POST .../publish-grade`: explicitly publish grade, trigger `grade_released` notification
- [ ] 13.8 Implement late submission detection: compare `submittedAt` to `dueDate` server-side; set `isLate: true`; apply penalty to marks if policy is `penalty`
- [ ] 13.9 Implement assignment resubmission: increment `attemptNumber`, enforce `maxAttempts` server-side; prior attempts remain in history

---

### Task 14: Quiz API

**Requirement refs:** R12 (quizzes)

- [ ] 14.1 Implement `POST /api/v1/quizzes` and `PUT /api/v1/quizzes/:id`: instructor quiz CRUD with all configuration fields; save as `draft`
- [ ] 14.2 Implement `POST /api/v1/quizzes/:id/questions` and `PUT/DELETE /quizzes/:id/questions/:qId`: instructor question bank management; support all 5 question types
- [ ] 14.3 Implement `POST /api/v1/quizzes/:id/start`: check enrollment, open/close window, attempt count; select questions (apply server-side shuffle if configured; slice to `questionBankSize`); create `QuizAttempt` with `expiresAt`; return attempt with questions (no answer keys)
- [ ] 14.4 Implement `PUT /api/v1/quizzes/:id/attempts/:attemptId`: save in-progress response array; validate attempt is `in_progress` and not expired; idempotent updates
- [ ] 14.5 Implement `POST /api/v1/quizzes/:id/attempts/:attemptId/submit`: call `submitQuizAttempt` — auto-grade objective questions, flag subjective for manual; calculate score/percentage/passed; record activity event
- [ ] 14.6 Implement auto-submit expired attempts: BullMQ job processor checks `in_progress` attempts past `expiresAt` every 5 minutes and force-submits them
- [ ] 14.7 Implement `GET /api/v1/quizzes/:id/attempts/:attemptId/result`: enforce `showAnswersAfter` policy before returning answer keys and explanations; student sees own result only
- [ ] 14.8 Implement manual grading endpoint for short-answer/essay: `PUT /quizzes/:id/attempts/:attemptId/grade-response` for instructor per-question scoring

---

### Task 15: Grading API

**Requirement refs:** R13 (grading)

- [ ] 15.1 Implement course-level grade aggregation: `PUT /api/v1/progress/course/:courseId/finalize-grade` — aggregate assignment/quiz scores with configured weights, compute `finalGrade` and `letterGrade`, update Grade document
- [ ] 15.2 Implement grade history tracking: every change to a published grade MUST append to `grades.history` array with previous/new value, changedBy, reason; implement via Mongoose pre-save hook
- [ ] 15.3 Implement `GET /api/v1/assignments/:id/submissions` with grading filters: ungraded / draft-graded / published, sortable by submission date and student name
- [ ] 15.4 Implement grade export: `GET /api/v1/courses/:id/grades/export` — returns CSV with student name, assignment scores, quiz scores, final grade; scoped to requesting instructor's courses
- [ ] 15.5 Implement AI-suggested grade workflow: store `aiSuggestedMarks` and `aiSuggestedFeedback` on Submission; these fields MUST NOT appear in student-facing grade response until instructor explicitly publishes their own grade

---

### Task 16: Assessment Frontend

**Requirement refs:** R11, R12, R13

- [ ] 16.1 Build Instructor Assignment Builder: form with all fields (rich text instructions, date pickers, rubric builder — add/remove criteria with levels), file attachment upload, status toggle, preview
- [ ] 16.2 Build Student Assignment View: instructions + attachments (secured download), deadline countdown, submission form (text editor / file upload / link input / code editor with language selector), draft save, submit with confirmation
- [ ] 16.3 Build Student Submission Status: show submission timestamp, status badge, resubmission button (if allowed), and grade/feedback panel (only after instructor publishes)
- [ ] 16.4 Build Instructor Quiz Builder: quiz settings form, question bank editor (add/edit/delete/reorder questions per type), question preview, publish toggle
- [ ] 16.5 Build Student Quiz Interface: countdown timer (animated), question navigator sidebar, per-question answer UI (radio / checkbox / true-false toggle / text area), save draft response on each answer, submit with confirmation dialog
- [ ] 16.6 Build Quiz Result page: score display, pass/fail indicator, per-question breakdown (respecting `showAnswersAfter` policy — conditionally show correct answers and explanations)
- [ ] 16.7 Build Instructor Grading Workspace: submission list with filter sidebar, submission detail view (secure file viewer via signed URL), rubric scoring panel (click criteria levels), feedback textarea, draft save, publish grade button with confirmation
- [ ] 16.8 Build AI Feedback panel in submission view: show AI feedback with "AI Feedback" label and disclaimer; show AI-suggested marks as reference only; instructor must still enter official grade
- [ ] 16.9 Apply timer urgency animations (red pulsing border when < 2 minutes remaining), rubric level hover highlights, and grade publish confirmation modal

---

## Phase 5: Progress, Analytics, and Certificates

### Task 17: Progress and Analytics API

**Requirement refs:** R14 (analytics)

- [ ] 17.1 Implement `POST /api/v1/lessons/:id/progress`: upsert LessonProgress (status, progressPercent, lastPosition, timeSpent); on completion, record ActivityEvent `lesson_complete`; trigger async course progress recalculation
- [ ] 17.2 Implement `GET /api/v1/progress/course/:courseId`: return per-lesson completion status, module completion flags, overall percentage for the requesting student
- [ ] 17.3 Implement `GET /api/v1/progress/overview`: student dashboard data — active enrollments with progress, streak (consecutive days with ActivityEvent), recent activity list, upcoming deadlines
- [ ] 17.4 Implement `GET /api/v1/progress/analytics` (instructor/admin): class-level report — enrollment count, completion distribution, overdue assignments list, quiz performance averages, students with < 30% progress
- [ ] 17.5 Implement `GET /api/v1/admin/analytics/platform`: institution-level aggregate — active users (last 30 days), enrollment trend (last 12 months), top 5 courses by enrollment, certificate issuance count, assessment average scores
- [ ] 17.6 Implement learning streak calculation: query ActivityEvents for the user, count consecutive calendar days with at least one `lesson_complete` or `quiz_attempt` event; update streak in UserProfile
- [ ] 17.7 Implement analytics aggregation background job: runs nightly via BullMQ cron; pre-compute institution-level stats into a `AnalyticsCache` document to avoid live aggregation on every admin dashboard load
- [ ] 17.8 Implement CSV export endpoints: `GET /courses/:id/progress/export` (instructor) with enrollment/progress/grade columns, scoped to instructor's courses

---

### Task 18: Certificate System

**Requirement refs:** R15 (certificates)

- [ ] 18.1 Implement `certificateService.checkAndIssueCertificate(userId, courseId)`: full idempotent workflow using MongoDB session/transaction — verify 100% completion, check minimum grade if configured, prevent duplicate via atomic findOne-or-create, generate `verificationId`, create Certificate record, queue PDF generation job
- [ ] 18.2 Implement BullMQ `certificates` queue processor: generate PDF using PDFKit or Puppeteer with certificate template (student name, course, institution, date, verificationId), upload to private object storage, update `fileKey` on Certificate record
- [ ] 18.3 Implement `GET /api/v1/certificates/my`: return student's issued certificates with course name, issue date, and download eligibility
- [ ] 18.4 Implement `GET /api/v1/certificates/:id/download`: authorize requesting user is certificate owner; generate signed download URL; log download event
- [ ] 18.5 Implement `GET /api/v1/certificates/verify/:verificationId` (public, no auth required): return certificate status, course name, institution name, issue date, student first name only — no private data
- [ ] 18.6 Implement `POST /admin/certificates/:id/revoke`: set status to `revoked`, record revokedAt/revokedBy/reason, notify student, update verification page response
- [ ] 18.7 Trigger `checkAndIssueCertificate` from: lesson progress completion calculation (when percentage hits 100%), and as a background job that re-checks recently completed enrollments

---

### Task 19: Analytics and Progress Frontend

**Requirement refs:** R14

- [ ] 19.1 Build Student Progress page: per-course progress bars, module-level completion checklist, assignment submission status timeline, quiz attempt history with scores
- [ ] 19.2 Build Student Dashboard charts: learning activity heatmap (last 30 days), weekly study time bar chart, course completion trend — all using Recharts; graceful empty state for new users
- [ ] 19.3 Build Learning Streak widget: current streak counter, longest streak, streak freeze status, animated flame icon with streak milestone celebrations
- [ ] 19.4 Build Instructor Analytics page: enrollment funnel chart, completion distribution histogram, assignment submission rate table, overdue work list with student names, at-risk students filter (< 30% progress)
- [ ] 19.5 Build Admin Analytics page: platform overview KPI cards, enrollment trend line chart (12 months), top courses table, certificate issuance chart, active user count, CSV export buttons
- [ ] 19.6 Implement responsive chart behavior: charts collapse to compact view on mobile; tooltips on hover/touch; legend toggle; theme-aware colors from design tokens
- [ ] 19.7 Implement empty state components for all chart areas: meaningful message + call to action (e.g., "Enroll in a course to start tracking progress")

---

## Phase 6: AI Subsystem

### Task 20: FastAPI AI Service Foundation

**Requirement refs:** R16-R23 (AI features)

- [ ] 20.1 Set up FastAPI app with routers, middleware, lifespan events (startup/shutdown), and structured logging
- [ ] 20.2 Implement internal authentication: `verify_internal_token` dependency that validates `X-Internal-Secret` header against `FASTAPI_INTERNAL_SECRET` env var; reject all requests without valid secret
- [ ] 20.3 Implement Qdrant vector DB client connection with collection initialization on startup: `course_content` collection with configured vector dimensions
- [ ] 20.4 Implement embedding service: load sentence-transformer model (configurable via env), `embed_text(text)` and `embed_texts(texts)` async functions with batching
- [ ] 20.5 Implement `GeminiClient`: initialize with `GEMINI_API_KEY` and `GEMINI_MODEL` from env; implement `complete(task, context)` with timeout, retry (exponential backoff, max 3 attempts), circuit breaker; validate and normalize response; MUST NOT log API key
- [ ] 20.6 Implement `AIOrchestrator`: primary model attempt → quality check (`_is_adequate`) → Gemini fallback (only if enabled for feature and data-sharing policy permits); log provider, latency, fallback reason; raise `AIServiceUnavailable` if all providers fail
- [ ] 20.7 Implement per-user token quota enforcement: track daily token usage per `userId` in Redis; reject requests exceeding configured limit with clear error
- [ ] 20.8 Implement feature-level Gemini fallback enable/disable: read from institution AI settings passed in request context; short-circuit fallback for institutions with `aiEnabled=false` or `externalFallbackEnabled=false`

---

### Task 21: RAG Pipeline

**Requirement refs:** R16 (RAG grounding)

- [ ] 21.1 Implement `chunk_text(content, chunk_size=512, overlap=64)`: split text into overlapping token chunks preserving sentence boundaries; return list of `TextChunk` with text and token count
- [ ] 21.2 Implement `ingest_lesson(lesson_id, content, metadata)`: chunk → embed → upsert to Qdrant with payload `{lesson_id, course_id, institution_id, text, order}`; update `VectorDocument` record status via MongoDB
- [ ] 21.3 Implement `ingest_document(file_key, metadata)`: download file from object storage, extract text (PDF → pypdf2/pdfplumber, DOCX → python-docx, TXT → direct), chunk and index; handle extraction failures gracefully
- [ ] 21.4 Implement `retrieve_context(query, course_id, institution_id, top_k=5)`: embed query, search Qdrant with `course_id` + `institution_id` filters (tenant isolation MUST be enforced), apply score threshold, return `RetrievedChunk` list
- [ ] 21.5 Implement BullMQ consumer in Express `ai-indexing` queue: when new lesson content is saved, call FastAPI `POST /ai/internal/index-lesson` endpoint with lesson content and metadata
- [ ] 21.6 Implement `POST /ai/internal/index-lesson` and `POST /ai/internal/index-document` FastAPI endpoints: protected by internal secret, accept content + metadata, run ingestion async, return job acknowledgment
- [ ] 21.7 Implement re-indexing on lesson update: when lesson content changes, delete old vectors for `lesson_id` from Qdrant and re-index new content
- [ ] 21.8 Implement context assembly: retrieved chunks → deduplicated → sorted by order → formatted as numbered context block for prompt injection

---

### Task 22: AI Learning Tutor

**Requirement refs:** R16

- [ ] 22.1 Implement `POST /ai/tutor/message` FastAPI endpoint: receive `{message, course_id, lesson_id, history, user_id, institution_id}`; retrieve context; build prompt with system instructions + history + context + message; call orchestrator; return `{content, sources, provider}`
- [ ] 22.2 Implement `POST /api/v1/ai/tutor/message` Express proxy: authenticate user, verify course enrollment server-side, forward to FastAPI with internal secret, persist message + response to `AIConversation` document
- [ ] 22.3 Implement conversation history management: `GET /api/v1/ai/tutor/conversations` (list, scoped to user), `GET /conversations/:id` (detail), `DELETE /conversations/:id` (permanent delete, user can only delete own)
- [ ] 22.4 Implement source reference display: parse `sources` from response, link each to `GET /lessons/:id` endpoint for navigation; display as collapsible citation panel below AI response
- [ ] 22.5 Implement "cannot verify" handling: when primary model has no relevant context and Gemini fallback is disabled, return a clear explanation ("I don't have enough course material to answer this reliably") rather than hallucinating

---

### Task 23: AI Personalized Study Planner

**Requirement refs:** R17

- [ ] 23.1 Implement `POST /ai/planner/generate` FastAPI endpoint: receive `{user_id, courses, deadlines, progress, preferences, institution_id}`; generate structured weekly plan with sessions array; validate output structure before returning
- [ ] 23.2 Implement `POST /api/v1/ai/planner/generate` Express proxy: aggregate student data (active enrollments, upcoming deadlines, lesson completion gaps, quiz results, stated study hours), forward to FastAPI, save returned plan as `StudyPlan` document
- [ ] 23.3 Implement `PUT /api/v1/ai/planner/:id`: student edits plan (mark sessions complete, skip sessions, reschedule); validate changes do not modify official institutional deadlines
- [ ] 23.4 Implement plan regeneration trigger: check if active enrollments changed or deadlines changed since last plan generation; offer regeneration prompt via notification (do NOT auto-overwrite without user action)

---

### Task 24: AI Quiz and Flashcard Generator

**Requirement refs:** R18

- [ ] 24.1 Implement `POST /ai/quiz-generator/generate` FastAPI endpoint: receive `{topic, course_id, difficulty, question_types, count, user_id, institution_id}`; retrieve RAG context for topic; generate questions with answer keys and explanations; validate each question structure (has text, has correct answer, options count correct per type)
- [ ] 24.2 Implement `POST /api/v1/ai/quiz-generator/generate` Express proxy: authenticate user, verify enrollment (for student) or course ownership (for instructor), forward, save valid questions to `AIConversation` with `feature=quiz_gen`
- [ ] 24.3 Implement instructor quiz-draft promotion: `POST /api/v1/ai/quiz-generator/promote-to-draft` — save AI-generated questions to the `questions` collection with `quizId` from a new draft quiz; require instructor to publish explicitly
- [ ] 24.4 Implement flashcard generation: same RAG pipeline, generate `{front, back}` pairs from source content, save to `Bookmark` records with `type=flashcard`

---

### Task 25: AI Notes and Content Summarizer

**Requirement refs:** R19

- [ ] 25.1 Implement `POST /ai/summarizer/summarize` FastAPI endpoint: receive `{source_type, content_or_key, user_id, institution_id, course_id}`; for lesson source use RAG chunks; for document source extract text first; generate summary, key concepts, and revision points grounded in source
- [ ] 25.2 Implement `POST /api/v1/ai/summarizer/summarize` Express proxy: validate source type; for document uploads validate file type (PDF/DOCX/TXT) and size ≤ 20 MB; forward to FastAPI; save returned summary as `Note` document linked to source lesson/course
- [ ] 25.3 Implement document text extraction failure handling: catch extraction errors, return specific error messages ("PDF is encrypted and cannot be processed", "File contains no extractable text") — never return generic 500 to user
- [ ] 25.4 Implement `GET/PUT/DELETE /api/v1/notes`: note CRUD scoped to authenticated user; support search by title/content, filter by courseId, sort by createdAt

---

### Task 26: AI Instructor Copilot

**Requirement refs:** R20

- [ ] 26.1 Implement `POST /ai/copilot/assist` FastAPI endpoint: receive `{task_type, context, course_id, user_id}`; route to appropriate generation function (describe/outline/rubric/question/announcement/summary); return structured draft with confidence
- [ ] 26.2 Implement `POST /api/v1/ai/copilot/assist` Express proxy: authenticate instructor, verify course ownership, forward to FastAPI; return draft for instructor review — NEVER auto-apply to any course resource
- [ ] 26.3 Implement copilot UI integration points: "Generate with AI" buttons in Course Description editor, Lesson Outline section, Assignment Instructions field, Quiz Question Bank, Announcement composer; each opens a side panel with the AI draft + accept/edit/regenerate/discard actions
- [ ] 26.4 Implement performance summary assistant: copilot task type `performance_summary` — aggregate the instructor's course grade data, submission rates, common missed quiz topics, pass to FastAPI with summary request; return narrative summary (no external student PII transmitted beyond aggregated stats)

---

### Task 27: AI Assignment Feedback

**Requirement refs:** R21

- [ ] 27.1 Implement `POST /ai/feedback/analyze` FastAPI endpoint: receive `{submission_content, assignment_instructions, rubric, user_id, institution_id}`; analyze submission against rubric; return `{rubric_feedback: [{criterion, observation, suggestion}], overall_suggestions, ai_suggested_marks, limitations}`
- [ ] 27.2 Implement `POST /api/v1/ai/feedback/analyze` Express proxy: authenticate student, verify enrollment and submission ownership, strip any PII beyond submission content and rubric before forwarding to FastAPI; store result in `submission.grade.aiSuggestedFeedback`
- [ ] 27.3 Implement code feedback (optional): if submission `language` is set and code execution environment is configured, run code in isolated container (Docker sandbox); collect stdout/stderr/test results; pass to feedback analyzer; MUST NOT execute inside main backend process
- [ ] 27.4 Implement feedback display: show AI feedback panel labeled "AI Feedback (not an official grade)"; display rubric observations and suggestions; show ai_suggested_marks as reference; disable student from submitting AI feedback as official grade

---

### Task 28: AI Voice Tutor

**Requirement refs:** R22

- [ ] 28.1 Implement `POST /api/v1/ai/voice/transcribe` Express endpoint: receive audio blob from browser, forward to configured STT provider (Whisper API or similar via env config); return transcript text; log that audio was processed externally
- [ ] 28.2 Implement `POST /api/v1/ai/voice/synthesize` Express endpoint: receive text response, forward to configured TTS provider (Google TTS or similar via env config); return audio URL or base64; apply caching for identical text responses
- [ ] 28.3 Implement frontend voice capture: request microphone permission with explicit permission dialog; record audio on press-and-hold or push-to-talk; display real-time audio visualization; stop on release; send to transcribe endpoint
- [ ] 28.4 Implement transcript review step: display transcript in editable text box before submitting to AI tutor; student can edit transcript or cancel; only submit confirmed transcript to tutor message flow
- [ ] 28.5 Implement TTS playback controls: play/pause/stop/replay; display response text alongside audio; support speed adjustment (0.75x / 1x / 1.25x / 1.5x)
- [ ] 28.6 Implement graceful fallback: if microphone permission denied or STT/TTS provider unavailable, disable voice controls and show informational message; text input remains fully functional
- [ ] 28.7 Ensure microphone is inactive when not actively recording; show clear recording indicator when mic is live; provide opt-out from voice mode with confirmation that audio is sent externally

---

### Task 29: AI Course Recommendations

**Requirement refs:** R23

- [ ] 29.1 Implement `POST /ai/recommendations` FastAPI endpoint: receive `{user_id, interests, completed_courses, enrolled_courses, performance, institution_id}`; use content-based similarity (course tags vs. interests) + prerequisite satisfaction check + availability filter; return ranked list with reason strings
- [ ] 29.2 Implement `GET /api/v1/ai/recommendations` Express proxy: aggregate student data (profile interests, enrollments, grades), forward to FastAPI, filter results against enrollment eligibility (prerequisites, capacity, institution scope), cache results for 6 hours in Redis
- [ ] 29.3 Implement dismiss recommendation: `DELETE /api/v1/ai/recommendations/:courseId` — store dismissal in UserProfile; excluded from future recommendation results until user clears dismissed list
- [ ] 29.4 Implement cold-start fallback: for users with no learning history, use onboarding interests to seed recommendations; return curated popular courses if no interests set

---

### Task 30: AI Frontend (Unified AI Workspace)

**Requirement refs:** R16-R23

- [ ] 30.1 Build AI Tutor chat interface: message thread with user/assistant bubbles (distinct styling), source citation chips, timestamp, conversation list sidebar, new conversation button, delete conversation action with confirmation
- [ ] 30.2 Implement AI provider indicator: subtle label on each AI response showing "AI" with optional tooltip distinguishing primary vs. fallback — informational only, not alarming
- [ ] 30.3 Build Study Planner UI: weekly calendar grid showing planned sessions, session detail drawer (course/topic/duration), mark complete toggle, reschedule button, regenerate plan button with confirmation
- [ ] 30.4 Build AI Quiz Generator UI: topic input, difficulty selector, question type checkboxes, count input, generate button, question review list (each with edit/delete), save to library / promote to quiz draft actions
- [ ] 30.5 Build AI Summarizer UI: source selector (current lesson / upload document), generate button with progress indicator, formatted summary output (sections: Summary / Key Concepts / Revision Points), save as note button
- [ ] 30.6 Build Instructor Copilot side panel (embedded in course editor): task type selector, context input, generate button, draft output with rich text preview, accept/edit/regenerate/discard actions
- [ ] 30.7 Build Voice Tutor controls: mic button with press-to-record UI, audio waveform visualization, transcript review panel, submit/cancel, TTS playback bar with controls, voice mode toggle, external processing notice
- [ ] 30.8 Apply AI-specific design treatment: subtle cyan/teal accent for all AI feature panels, animated gradient border on active AI chat, typing indicator (three-dot animation) while waiting for AI response, streaming text effect for AI responses

---

## Phase 7: Communication, Gamification, and Scheduling

### Task 31: Notification System

**Requirement refs:** R26 (notifications)

- [ ] 31.1 Implement `notificationService.send(userId, type, data)`: look up template, create Notification document, push via SSE, queue email if preferences permit
- [ ] 31.2 Implement SSE endpoint `GET /api/v1/notifications/stream`: establish per-user SSE connection; use Redis pub/sub to forward notifications from any API instance to the correct user's SSE stream
- [ ] 31.3 Implement notification REST endpoints: `GET /notifications` (paginated, newest first), `PUT /:id/read`, `PUT /read-all`, `DELETE /:id`
- [ ] 31.4 Implement `GET/PUT /notifications/preferences`: read and update per-type email preferences
- [ ] 31.5 Implement email BullMQ processor: consume from `emails` queue, render template (Handlebars or MJML), send via configured provider (SendGrid API key from env), mark `emailSent` on Notification document; implement deduplication key to prevent duplicate sends
- [ ] 31.6 Implement all notification templates: enrollment_confirmed, enrollment_approved, enrollment_rejected, grade_released, assignment_due_soon, assignment_overdue, certificate_issued, achievement_unlocked, course_announcement, discussion_reply, account_security, invitation
- [ ] 31.7 Implement deadline reminder scheduled job: `reminders` queue cron every hour; query assignments due within 24 hours; filter students who haven't submitted; send `assignment_due_soon` notification per user (idempotent — track sent reminders to prevent duplicates)

---

### Task 32: Gamification Engine

**Requirement refs:** R27

- [ ] 32.1 Implement `achievementService.checkAchievements(userId, trigger)`: iterate relevant achievement rules, check `alreadyEarned`, call rule's async `check` function, award badge + points if earned, prevent duplicate awards
- [ ] 32.2 Implement `awardPoints(userId, event, points)`: create PointTransaction with running balance; use `findOneAndUpdate` for atomic balance update
- [ ] 32.3 Define achievement rules: first_enrollment (10 pts), first_lesson_complete (5 pts), streak_3 (20 pts), streak_7 (50 pts), streak_30 (200 pts), first_quiz_pass (15 pts), first_assignment_submit (10 pts), course_complete (100 pts), perfect_quiz (50 pts)
- [ ] 32.4 Integrate achievement triggers: call `checkAchievements` from enrollment service, lesson completion, quiz submission, and streak update
- [ ] 32.5 Implement leaderboard: `GET /api/v1/institutions/:id/leaderboard` — return top-N students by points within institution; respect institution `leaderboardEnabled` setting (if disabled return 403)
- [ ] 32.6 Build Achievements page frontend: badge grid (earned badges full color, unearned greyed with lock icon), point transaction history list, leaderboard table (if enabled), streak calendar heatmap
- [ ] 32.7 Implement achievement unlock animation: toast notification with badge icon and confetti burst (CSS animation); respect `prefers-reduced-motion`

---

### Task 33: Discussions, Announcements, and Calendar Frontend

**Requirement refs:** R26, R28

- [ ] 33.1 Implement Announcement API: `POST/PUT/DELETE /announcements` (instructor/admin), `GET /announcements/course/:courseId` (enrolled students); notify enrolled students on publish
- [ ] 33.2 Implement Discussion API: thread CRUD, reply CRUD, `isPinned` and `isResolved` toggling (instructor), soft-delete with `deletedAt`, edit with `editedAt` timestamp
- [ ] 33.3 Build Announcement feed component: pinned announcements at top, sorted by date, collapsible long content, file attachment download links
- [ ] 33.4 Build Discussion board: nested thread list, reply composer with rich text, instructor badge on instructor posts, resolve/pin controls for instructors, report action for students
- [ ] 33.5 Build in-app Notification Center: slide-out drawer from TopBar bell icon, unread count badge, notification list with type icons, mark-as-read on click, link to relevant resource, mark-all-read button, notification preferences link
- [ ] 33.6 Build Calendar page: monthly/weekly/agenda view toggle (persistent), events from API (assignments/quizzes/announcements/study sessions), color-coded by type, click-to-navigate to resource, timezone display in user's configured timezone
- [ ] 33.7 Implement `iCalendar` export: `GET /api/v1/calendar/export` — generate `.ics` file with user's upcoming assignment deadlines and events for import into external calendar apps

---

## Phase 8: External Integrations and Public Website

### Task 34: External Integrations

**Requirement refs:** R7 (integrations)

- [ ] 34.1 Finalize GitHub integration backend: OAuth app credentials via env, encrypted token storage (AES-256-GCM with `OAUTH_TOKEN_ENCRYPTION_KEY`), public repo fetch via GitHub REST API v3, sync job processor in BullMQ
- [ ] 34.2 Implement integration token encryption utilities: `encryptToken(plaintext)` and `decryptToken(ciphertext)` using AES-256-GCM with IV; never log decrypted values
- [ ] 34.3 Implement LinkedIn link-only fallback: if `LINKEDIN_API_ENABLED=false` in env, skip OAuth flow entirely; present manual URL input; validate URL format; store in UserProfile; display as `link_only` status
- [ ] 34.4 Implement LeetCode integration: store username + URL in UserProfile; optional manual stats fields (problems solved, rating, contest rating); display with manual maintenance disclaimer
- [ ] 34.5 Implement integration sync job: `integrations` BullMQ queue; on manual sync trigger, re-fetch data within permitted scopes; update integration status, `lastSyncAt`, `lastError`; handle expired token → set status `expired`; notify user to reconnect
- [ ] 34.6 Implement integration audit: log all connect/disconnect/sync events to `AuditLog` with provider, user, timestamp, outcome

---

### Task 35: Public Website

**Requirement refs:** R2 (public site)

- [ ] 35.1 Build public Home page: hero section with headline and CTAs (Explore Courses / Sign Up / Sign In), feature highlights (AI tutoring, progress tracking, certificates), course category grid, trusted-by/stats section, footer with links
- [ ] 35.2 Build public Course Catalog page: search bar with debounce, filter sidebar (category, difficulty, department, availability), sortable course grid (relevance/newest), pagination, course card (thumbnail, title, instructor, description excerpt, difficulty badge, enrollment status)
- [ ] 35.3 Build public Course Detail page: full course info (description, outcomes, syllabus accordion, instructor card, prerequisites list), enrollment CTA with policy handling (open/approval/invitation/closed messaging), rating display (only if reviews exist)
- [ ] 35.4 Build About, Contact/Support, Help/FAQ, Privacy Policy, Terms of Service, and Accessibility pages with appropriate static content
- [ ] 35.5 Build Certificate Verification page (public): URL param `verificationId`, call `GET /certificates/verify/:id`, display card (student first name, course, institution, issue date, status); show revoked status clearly; expose no private data
- [ ] 35.6 Implement SEO basics for public pages: `<title>` and `<meta description>` per page, Open Graph tags for course pages, sitemap generation
- [ ] 35.7 Apply responsive behavior for all public pages: mobile navigation hamburger menu, fluid course grid (1/2/3 columns at breakpoints), readable typography on small screens

---

## Phase 9: Quality, Security, and Documentation

### Task 36: Testing and QA

**Requirement refs:** R20 (testing)

- [ ] 36.1 Write API integration tests (Jest + Supertest) for all auth flows: register/verify/login/refresh/logout, Google/GitHub/Facebook OAuth callback mocks, duplicate email conflict, password reset, account lock
- [ ] 36.2 Write API tests for enrollment workflows: open enrollment, approval workflow, prerequisite check, capacity/waitlist, withdraw
- [ ] 36.3 Write API tests for course content access control: unauthenticated → 401, enrolled student → 200, non-enrolled student → 403, instructor owner → 200, cross-institution → 403
- [ ] 36.4 Write API tests for assessment submission: submit on time, submit late (penalty applied), exceed attempt limit → 403, submit after close → 403
- [ ] 36.5 Write API tests for quiz: start, save responses, submit (auto-grade verification), expire attempt (auto-submit job), result visibility respects `showAnswersAfter`
- [ ] 36.6 Write API tests for certificate issuance: eligibility met → issued, duplicate → returns existing, eligibility not met → no record created
- [ ] 36.7 Write API tests for AI proxy endpoints: FastAPI unavailable → graceful error, Gemini fallback triggered, enrollment check blocks RAG access on non-enrolled student
- [ ] 36.8 Write API tests for admin operations: user suspension (session invalidation), course approval/rejection with notifications, audit log creation
- [ ] 36.9 Write API tests for integration connect/disconnect/sync: token encryption verification, expired token handling, LeetCode link-only flow
- [ ] 36.10 Write API tests for notification delivery: SSE push, email queue entry, duplicate prevention, preference opt-out
- [ ] 36.11 Write frontend component tests (Vitest + Testing Library): auth forms validation, course enrollment flow, quiz timer, assignment submission, AI tutor message rendering, theme switching
- [ ] 36.12 Write E2E tests (Playwright) for critical paths: student complete-course-to-certificate flow, instructor create-publish-grade flow, admin user-management flow
- [ ] 36.13 Test empty states: new user with no enrollments, course with no students, analytics with no data
- [ ] 36.14 Test responsive layouts at 375px (mobile), 768px (tablet), 1280px (desktop) for student dashboard, course workspace, and admin panels
- [ ] 36.15 Test theme persistence: verify correct theme applied on page load (no flash), verify charts and icons adapt to theme change

---

### Task 37: Security Hardening

**Requirement refs:** R3, R4, R19 (file security), R31 (API security)

- [ ] 37.1 Verify all API routes have explicit authentication and authorization middleware — no route reachable without intended access control
- [ ] 37.2 Confirm `institutionId` tenant scope enforced on every MongoDB query in all route handlers (automated query analysis or test coverage)
- [ ] 37.3 Apply Helmet.js with Content-Security-Policy, X-Frame-Options `SAMEORIGIN`, X-Content-Type-Options `nosniff`, Strict-Transport-Security
- [ ] 37.4 Configure CORS allowlist from environment variable; reject requests from unlisted origins
- [ ] 37.5 Verify OAuth tokens stored with AES-256-GCM encryption; write test asserting raw token is not stored in DB
- [ ] 37.6 Verify no secret values appear in API responses, logs, or error messages; add log scrubber for known secret patterns
- [ ] 37.7 Audit all file download endpoints: confirm signed URL generation, confirm raw storage key never returned to client
- [ ] 37.8 Verify Gemini API calls never include: passwords, full student PII beyond necessary query context, unpublished assessment answers, or OAuth tokens
- [ ] 37.9 Implement input sanitization: strip HTML from rich-text inputs before storage in non-rich-text fields; validate all enum fields against allowed values
- [ ] 37.10 Verify `prefers-reduced-motion` respected: test animation suppression with reduced-motion preference set
- [ ] 37.11 Run OWASP dependency check on all three services; resolve or document any high-severity findings
- [ ] 37.12 Validate `.env.example` contains only placeholder values; add CI check to confirm no `.env` files with real secrets are committed

---

### Task 38: Documentation and README

**Requirement refs:** R (README requirement)

- [ ] 38.1 Write root `README.md` covering: project purpose, major features overview, architecture diagram reference, service responsibilities summary
- [ ] 38.2 Document prerequisites: Node.js version, Python version, MongoDB, Redis, Qdrant, Docker
- [ ] 38.3 Document folder and module organization for all three services
- [ ] 38.4 Document `.env` setup: link to `.env.example`, explain each variable group (auth, database, OAuth, storage, email, AI)
- [ ] 38.5 Document startup procedures: MongoDB + Redis + Qdrant start → FastAPI start → Express API start → React dev server start; include exact commands
- [ ] 38.6 Document AI provider setup: primary model (Ollama or other), Gemini API key, vector DB collection initialization, embedding model selection
- [ ] 38.7 Document email and file storage setup: SendGrid key, S3 or MinIO bucket creation, CORS policy for direct uploads
- [ ] 38.8 Document database initialization: run seed script command, list seed data created (users, courses, enrollments)
- [ ] 38.9 Document test execution: API tests, frontend tests, E2E tests with commands and expected output
- [ ] 38.10 Document production deployment: Docker Compose production profile, environment variable management, Nginx TLS configuration, health check verification
- [ ] 38.11 Write implementation status checklist: mark each major feature as Completed / Partial (with notes) / Requires External Config — accurately reflecting actual build state
- [ ] 38.12 Document key API route groups with required permissions, request examples, and response shape
- [ ] 38.13 Document known limitations and optional integrations (LinkedIn full sync, LeetCode official API, code execution sandbox)

---

*Tasks Version: 1.0 | Feature: omniclass-lms | Total Tasks: 38 phases, ~250 sub-tasks*
