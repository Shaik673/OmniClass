# OmniClass LMS — Requirements Document

## Introduction

OmniClass is a production-grade, AI-powered, multi-tenant Learning Management System for colleges, universities, and training organizations. This requirements document is derived from the approved technical design and defines the complete functional and non-functional requirements for the system.

The system serves four primary user types: public visitors, students, instructors, and administrators. It combines institutional course management with personalized AI learning tools, academic profiles, developer integrations, analytics, and certificate management.

---

## Glossary

| Term | Definition |
|------|-----------|
| Institution | A college, university, or training organization using OmniClass |
| Tenant | A single institution and all its associated data |
| Course | A structured learning program comprising sections, modules, and lessons |
| Module | A grouped set of related lessons within a course |
| Lesson | An individual learning unit (video, text, document, link, or download) |
| Enrollment | A student's active participation record for a course |
| Assessment | Any graded activity: assignment, quiz, or exam |
| Submission | A student's response to an assignment |
| Attempt | A student's single try at completing a quiz |
| RAG | Retrieval-Augmented Generation — AI technique grounding responses in course content |
| AI Orchestrator | The system component that routes AI tasks between the primary model and Gemini fallback |
| Vector DB | Database storing text embeddings for semantic search |
| Verification ID | A unique public token on a certificate used to confirm authenticity |
| RBAC | Role-Based Access Control |
| SSE | Server-Sent Events for real-time push from server to browser |
| BullMQ | Redis-backed job queue used for background processing |

---

## Requirement 1: Multi-Tenant Institutional Architecture

**User Story:** As an institution administrator, I want OmniClass to fully isolate my institution's data from other institutions, so that student records, courses, and configurations remain private and secure.

### Acceptance Criteria

1. WHEN a resource (course, user, enrollment, assessment, grade, certificate, discussion, notification, or audit log) is created, THEN it MUST be tagged with the creating institution's `institutionId`.
2. WHEN an authenticated API request is processed, THEN the server MUST enforce a tenant scope middleware that injects `institutionId` from the authenticated user's session and applies it as a mandatory filter on all database queries for that request.
3. IF a user attempts to access a resource belonging to a different institution, THEN the API MUST return HTTP 403 Forbidden, regardless of the user's role within their own institution.
4. WHEN an institution is created, THEN the system MUST support configuring: enrollment policy (open, approval, or invitation), AI feature toggle, certificate template settings, maximum storage quota, and allowed file types.
5. WHEN institution-level branding is configured (logo, primary color, secondary color), THEN the student and instructor portals MUST reflect those branding values for users of that institution.
6. WHERE a super-admin role exists, THE system SHALL permit cross-institution access exclusively for that role, and all such access MUST be recorded in the audit log.
7. WHEN an institution's status is set to `suspended`, THEN all associated user logins MUST be rejected with a clear message until the status is restored.

---

## Requirement 2: Public Website and Course Discovery

**User Story:** As a prospective student or visitor, I want to browse and discover courses publicly, so that I can evaluate the platform and decide to register.

### Acceptance Criteria

1. WHEN a visitor navigates to the home page, THEN it MUST display a hero section, featured courses, learning categories, platform capabilities, and calls to action for registration and course exploration — without requiring authentication.
2. WHEN a visitor uses the public course catalog, THEN the system MUST support searching by title, topic, instructor, and keywords, and filtering by category, difficulty, and availability.
3. WHEN a visitor views a course details page, THEN the page MUST display the course description, learning outcomes, syllabus, instructor profile, prerequisites, and enrollment requirements — but MUST NOT expose lesson content, student data, grades, or private resources to unauthenticated users.
4. WHEN an enrollment restriction applies (closed, approval required, invitation only), THEN the course details page MUST display a clear explanation of that restriction.
5. WHEN a visitor accesses a public page, THEN the system MUST render all content without requiring a login, and public pages MUST include About, Contact/Support, Help/FAQ, Privacy Policy, Terms of Service, and Accessibility information.
6. IF a public user attempts to access a protected route (student dashboard, lesson workspace, grades), THEN the system MUST redirect them to the login page.

---

## Requirement 3: Authentication and Account Security

**User Story:** As a user, I want to securely create an account and log in using email/password or a social provider, so that my data is protected and only I can access my account.

### Acceptance Criteria

1. WHEN a user registers with email and password, THEN the password MUST be hashed with bcrypt (cost factor ≥ 12) and the plain-text password MUST never be stored or logged.
2. WHEN a new account is created via email, THEN the system MUST send a time-limited (24-hour), single-use email verification token, and the account MUST remain in `pending` status until the email is verified.
3. WHEN a user logs in, THEN the system MUST issue a short-lived JWT access token (15-minute expiry, RS256 signed) and a long-lived refresh token (7-day expiry) stored in an HttpOnly, SameSite=Strict cookie.
4. WHEN a refresh token is used, THEN the system MUST rotate it (issue a new one) and invalidate the old one; IF a previously-used refresh token is presented again, THEN the entire token family MUST be revoked (refresh token reuse detection).
5. WHEN a user initiates social login via Google, Facebook, or GitHub, THEN the system MUST use the official OAuth 2.0 authorization code flow with state validation, and MUST NOT expose client secrets to the browser.
6. IF an OAuth provider returns an email matching an existing OmniClass account that was not created by that provider, THEN the system MUST NOT automatically merge the accounts; instead it MUST prompt explicit linking confirmation with reauthentication.
7. WHEN a user requests a password reset, THEN the system MUST send a time-limited (1-hour), single-use reset token to the verified email address and invalidate any previously issued reset tokens.
8. WHEN a login attempt fails, THEN the system MUST track failed attempts per account and apply progressive rate limiting; after 10 consecutive failures the account MUST be temporarily locked with a clear recovery message.
9. WHEN a user logs out, THEN the server MUST revoke the current refresh token and clear the session cookie.
10. WHEN an account is suspended by an administrator, THEN all active sessions for that account MUST be invalidated immediately.

---

## Requirement 4: Role-Based Access Control

**User Story:** As a platform designer, I want every API endpoint and resource to be protected by role and ownership checks, so that users can only perform actions permitted for their role.

### Acceptance Criteria

1. WHEN any API request is processed, THEN the server MUST verify the JWT, confirm the user's status is `active`, and enforce the appropriate role authorization — frontend route guards are supplementary and MUST NOT replace server-side checks.
2. WHERE a resource is scoped to a specific user (submission, note, bookmark, conversation), THE system SHALL only permit the owning user or an authorized administrator to read or modify it.
3. WHEN an instructor attempts to access another instructor's private course draft or student data outside their assigned courses, THEN the API MUST return HTTP 403 Forbidden.
4. WHEN an administrator performs a sensitive operation (suspend user, approve course, revoke certificate), THEN the action MUST be recorded in the audit log with actor ID, role, action type, resource reference, IP address, and timestamp.
5. IF a user's role is upgraded or downgraded by an administrator, THEN the change MUST take effect on all subsequent requests; existing active sessions MUST reflect the new role on next token refresh.

---

## Requirement 5: First-Time Onboarding

**User Story:** As a new user, I want to be guided through a setup wizard on first login, so that my profile is configured and the platform can personalize my experience from the start.

### Acceptance Criteria

1. WHEN a user completes their first successful authentication, THEN the system MUST detect `onboardingCompleted: false` and redirect them to the onboarding wizard before any portal dashboard.
2. WHEN a user progresses through onboarding, THEN the wizard MUST collect: basic profile information, academic or professional details, learning interests and goals, notification preferences, and theme preference.
3. WHEN onboarding is completed, THEN `onboardingCompleted` MUST be set to `true` on the user record and the wizard MUST NOT appear again on subsequent logins.
4. WHEN a user skips an optional onboarding step, THEN the system MUST accept the skip, save progress, and allow the user to complete or update skipped fields later from the profile page.
5. WHEN role-specific onboarding fields are shown (student academic details vs. instructor professional details vs. admin institutional config), THEN each role MUST only see fields relevant to their role.

---

## Requirement 6: Comprehensive User Profile

**User Story:** As a user, I want a fully featured profile page where I can view and manage all aspects of my identity, academic record, security, and learning preferences in one place.

### Acceptance Criteria

1. WHEN a user opens their profile page, THEN it MUST present clearly separated sections for: Personal Information, Academic Information, Professional & Career, Account & Security, Learning Preferences, and Achievements & Learning Summary.
2. WHEN a user edits their personal information, THEN the system MUST validate the input, show a loading state on save, and display a success or error notification.
3. WHEN a user requests a profile picture change, THEN the system MUST enforce file-type validation (JPEG, PNG, WebP), enforce a maximum file size of 5 MB, store the image in private object storage, and display the updated avatar without requiring a full page reload.
4. WHEN a user sets profile visibility to `private`, THEN their profile MUST NOT be accessible to other users or publicly; when set to `institution`, it MUST only be visible to authenticated users of the same institution.
5. WHEN the profile's achievements section is displayed, THEN all statistics (courses completed, certificates earned, points, streaks) MUST be derived from verified backend records — never fabricated.
6. WHEN a user requests account deletion, THEN the system MUST present a confirmation dialog explaining the retention policy, and MUST NOT immediately delete records that are subject to institutional retention rules; instead the account MUST enter a deletion-requested state for review.
7. WHEN a user changes their email address, THEN the new address MUST be verified with a confirmation token before becoming active, and the old address MUST receive a security notification of the change.

---

## Requirement 7: External Developer Integrations

**User Story:** As a student, I want to connect my GitHub, LinkedIn, and LeetCode accounts to my OmniClass profile, so that my professional and coding activity can be showcased alongside my academic record.

### Acceptance Criteria

1. WHEN a user connects GitHub, THEN the system MUST use the official GitHub OAuth flow with minimum required scopes (`user:email`, `read:user`), store the encrypted access token server-side, and display the GitHub username, avatar, and public repository list.
2. WHEN a user connects LinkedIn, THEN the system MUST use the official LinkedIn OAuth flow; IF the required API access for profile sync is unavailable, THEN the system MUST offer a link-only option clearly labeled as "Link Only (not auto-synced)".
3. WHEN a user connects LeetCode, THEN the system MUST support link-only integration (LeetCode username and profile URL) with optional manual statistics entry, clearly labeled as manually maintained and not automatically verified; the system MUST NOT request the user's LeetCode password or scrape protected content.
4. WHEN a connected integration is displayed, THEN the status MUST accurately reflect one of: Not Connected, Connected, Syncing, Synced Successfully, Sync Failed, Permission Required, or Link Only — based on actual backend state, not a hardcoded badge.
5. WHEN a user disconnects an integration, THEN the system MUST revoke or delete the stored tokens, remove the integration metadata from the user record, and display a confirmed disconnection status.
6. WHEN an OAuth token expires or is revoked by the provider, THEN the integration status MUST update to `expired` or `error`, and the user MUST be prompted to reconnect.
7. WHEN integration tokens are stored, THEN they MUST be encrypted at rest using AES-256-GCM; raw tokens MUST never be transmitted to the browser or logged.

---

## Requirement 8: Student Learning Portal

**User Story:** As a student, I want a dedicated portal where I can view my courses, track my progress, access lessons, and receive personalized recommendations, so that I can manage my learning efficiently.

### Acceptance Criteria

1. WHEN a student opens their dashboard, THEN it MUST display: active enrolled courses with progress, upcoming assignment deadlines, recent grades, learning streak, earned achievements, recently accessed lessons, and recommended courses — all sourced from real database records.
2. WHEN a student opens the My Courses page, THEN they MUST be able to filter by active, completed, and archived; search by course title; and see progress, instructor name, and next due deadline per course.
3. WHEN a student opens a course workspace, THEN the system MUST display the complete course curriculum (sections → modules → lessons), the student's completion status per lesson, and allow navigation to any accessible lesson.
4. WHEN a student completes a lesson, THEN the completion MUST be persisted to the `lessonProgress` collection, course progress percentage MUST be recalculated, and the student MUST be able to resume from the same point on any device.
5. WHEN a student's course completion percentage reaches 100%, THEN the system MUST automatically trigger certificate eligibility checking in the background.
6. WHEN a student uses personal notes or bookmarks, THEN those items MUST be saved to their account and only visible to them; they MUST support creation, editing, search, and deletion.

---

## Requirement 9: Course Enrollment and Access Control

**User Story:** As a student, I want to enroll in courses and have my access governed by the course's enrollment policy, so that I can only access content I am authorized for.

### Acceptance Criteria

1. WHEN a student requests enrollment in a course with `open` policy, THEN enrollment MUST be granted immediately and an `enrollment_confirmed` notification MUST be sent.
2. WHEN a student requests enrollment in a course with `approval` policy, THEN the enrollment MUST be created in `pending` status and the assigned instructor or administrator MUST receive a notification to review it.
3. WHEN an enrollment is approved, THEN the student's status MUST transition to `active`, course access MUST be granted, and the student MUST receive a confirmation notification.
4. WHEN a student is not enrolled (or enrollment is pending/rejected), THEN the system MUST prevent access to all private lesson content, assignment details, grade information, and discussion threads for that course.
5. WHEN prerequisites are configured for a course, THEN the server MUST verify that the student has `completed` enrollments in all prerequisite courses before granting enrollment; the check MUST NOT rely solely on client-side validation.
6. WHEN a course has a maximum enrollment capacity and that capacity is reached, THEN new enrollment requests MUST be placed on the waitlist (if enabled) or rejected with a clear message.
7. WHEN a student withdraws from a course, THEN their grades, submissions, and progress history MUST be preserved in the database; access MUST be removed but audit records MUST be retained.

---

## Requirement 10: Course and Content Management

**User Story:** As an instructor, I want to create and organize course content using a structured curriculum builder, so that I can deliver well-organized learning experiences to my students.

### Acceptance Criteria

1. WHEN an instructor creates a course, THEN it MUST be saved as a `draft` and only the creating instructor and administrators MUST be able to see or edit it.
2. WHEN an instructor submits a course for publication, THEN IF institutional approval is required, the course MUST transition to `pending_review` and an administrator MUST receive a review notification.
3. WHEN an administrator approves a course, THEN its status MUST transition to `published`, the instructor MUST be notified, and the course MUST appear in the public catalog.
4. WHEN an instructor uses the curriculum builder, THEN they MUST be able to create, edit, reorder, duplicate, and delete sections, modules, and lessons, with drag-and-drop reordering support.
5. WHEN an instructor adds lesson content, THEN the system MUST support the following types: video (URL + optional transcript), rich-text, document (PDF/presentation upload), external link, and downloadable file.
6. WHEN an instructor deletes or edits published lesson content, THEN the system MUST use soft-deletion or versioning so that existing student submissions, progress records, and grades referencing that content are not silently corrupted.
7. WHEN an instructor configures sequential unlocking on a module, THEN the system MUST prevent students from accessing that module until its prerequisite module is marked complete.
8. WHEN an instructor saves changes to a lesson, THEN the system MUST warn about unsaved edits before navigation and persist changes reliably with a clear success confirmation.

---

## Requirement 11: Assignments and Submissions

**User Story:** As a student, I want to submit assignments digitally with a clear understanding of deadlines and requirements, and receive structured feedback from my instructor.

### Acceptance Criteria

1. WHEN an instructor creates an assignment, THEN it MUST include: title, instructions, open date, due date, maximum marks, supported submission formats, late submission policy, maximum file size, and maximum attempts.
2. WHEN a student submits an assignment, THEN the server MUST validate: the assignment is published, the due date enforcement policy, that the maximum attempt limit has not been exceeded, and that the submitted file type and size comply with the assignment configuration.
3. WHEN a student submits an assignment, THEN the system MUST create a `submission` record with a timestamp, return a submission receipt, and prevent duplicate submissions for the same attempt.
4. WHEN a student saves a draft submission, THEN it MUST NOT be visible to the instructor until explicitly submitted.
5. WHEN an instructor grades a submission, THEN they MUST be able to apply rubric criteria scores, enter written feedback, and save a grading draft before publishing grades.
6. WHEN an instructor publishes a grade, THEN the student MUST receive a `grade_released` notification and be able to view their score, rubric breakdown, and written feedback.
7. WHEN grades are published, THEN submission content (files, text) MUST remain accessible to the submitting student and the grading instructor, but MUST NOT be visible to other students.

---

## Requirement 12: Quizzes and Assessments

**User Story:** As an instructor, I want to build quizzes with multiple question types and configurable rules, so that I can assess student understanding effectively with automatic and manual grading.

### Acceptance Criteria

1. WHEN an instructor creates a quiz, THEN it MUST support question types: single-choice, multi-select, true/false, short-answer, and essay.
2. WHEN a quiz is configured with a time limit, THEN the server MUST record the attempt start time and `expiresAt`; IF the time limit is exceeded, THEN the attempt MUST be automatically submitted with answers recorded up to that point.
3. WHEN a student starts a quiz, THEN the server MUST check: the quiz is published, the open/close window is valid, and the maximum attempt count has not been reached.
4. WHEN a quiz attempt is submitted, THEN the server MUST auto-grade single-choice, multi-select, and true/false questions immediately and flag short-answer and essay questions for manual grading.
5. WHEN a quiz is configured with shuffled questions or answer options, THEN the randomization MUST be applied server-side at attempt creation; a student MUST see the same order throughout a single attempt.
6. WHEN result visibility is configured, THEN the system MUST only reveal scores, correct answers, and per-question explanations according to the configured `showAnswersAfter` rule.
7. WHEN an interrupted quiz attempt is resumed within the time window, THEN the system MUST restore the student's saved responses and remaining time.

---

## Requirement 13: Grading and Grade Management

**User Story:** As an instructor, I want a dedicated grading workspace to evaluate submissions, apply rubrics, and manage grade release, so that my students receive timely and transparent feedback.

### Acceptance Criteria

1. WHEN an instructor opens the grading workspace, THEN they MUST be able to filter submissions by assignment, status (ungraded, draft-graded, published), and student name.
2. WHEN an instructor opens a file submission, THEN the file MUST be served via a signed URL with a 15-minute expiry; the raw storage key MUST NOT be exposed to the browser.
3. WHEN grades are changed after initial publication, THEN the `grades` collection MUST record a history entry with the previous value, new value, changed-by reference, and reason.
4. WHEN an instructor publishes grades, THEN the action MUST be explicit (not automatic); grades in draft state MUST NOT be visible to students.
5. WHEN authorized, THEN instructors MUST be able to export grade reports for their courses in CSV format.

---

## Requirement 14: Progress Tracking and Learning Analytics

**User Story:** As a student and instructor, I want accurate progress tracking and meaningful analytics, so that I can understand learning performance and identify areas needing attention.

### Acceptance Criteria

1. WHEN a student starts or completes a lesson, THEN a `lessonProgress` record MUST be created or updated, and a corresponding `activityEvent` MUST be recorded.
2. WHEN course progress is calculated, THEN the percentage MUST be based on completed lessons divided by total published lessons in the course; module completion and overall course completion MUST be tracked separately.
3. WHEN a student views their progress dashboard, THEN it MUST display: overall progress per enrolled course, assignment and quiz history, time-series learning activity (where sufficient data exists), and streak information.
4. WHEN an instructor views class analytics, THEN they MUST see: enrollment counts, completion distribution, overdue assignments, assessment performance summaries, and students who may need support — scoped to courses they are assigned to.
5. WHEN an administrator views platform analytics, THEN they MUST see: active students and instructors, enrollment and completion trends, course engagement, and certificate issuance — scoped to their institution.
6. WHEN an analytics dashboard is loaded with no data (new course, no activity yet), THEN the system MUST display a meaningful empty state rather than blank charts or zero-filled metrics without context.
7. WHEN analytics data is exported, THEN the export MUST use the requesting user's authorization scope and MUST NOT expose data outside the permitted institution or role.

---

## Requirement 15: Certificates and Credential Verification

**User Story:** As a student, I want to automatically receive a certificate when I complete a course, and as an employer or verifier, I want to confirm its authenticity via a public verification page.

### Acceptance Criteria

1. WHEN a student's course completion percentage reaches 100% AND all configured assessment passing criteria are met, THEN the system MUST trigger an idempotent certificate issuance check using a database transaction to prevent duplicate certificates.
2. WHEN a certificate is issued, THEN it MUST contain: student full name, course name, institution name, issue date, and a unique `verificationId` (UUID v4 with checksum).
3. WHEN a PDF certificate is generated, THEN it MUST be produced by a background job, stored in private object storage, and the `fileKey` MUST be saved to the certificate record.
4. WHEN a student downloads their certificate, THEN the download MUST be served via a signed URL; the raw storage key MUST NOT be exposed.
5. WHEN a public user visits the certificate verification page with a valid `verificationId`, THEN the system MUST display: certificate status, course name, institution name, issue date, and student first name — and MUST NOT expose the student's full personal record.
6. WHEN a certificate is revoked by an administrator, THEN its status MUST update to `revoked`, the student MUST receive a notification, and the verification page MUST reflect the revoked status.
7. WHEN a certificate issuance is attempted and the student does not meet the criteria, THEN the system MUST silently skip issuance without creating a partial record.

---

## Requirement 16: AI Learning Tutor

**User Story:** As a student, I want an AI tutor available in my course workspace that can answer questions about the lesson I am studying, so that I can get immediate, contextually relevant help.

### Acceptance Criteria

1. WHEN a student sends a message to the AI tutor, THEN the system MUST retrieve the top-5 most semantically relevant content chunks from the current course's vector index using the student's query as the search key.
2. WHEN relevant content chunks are retrieved, THEN they MUST be passed to the AI orchestrator as context for response generation; the orchestrator MUST attempt the primary model first.
3. IF the primary model returns an empty, invalid, or insufficient response, THEN the orchestrator MUST automatically fall back to the configured Gemini API model without user intervention.
4. WHEN the Gemini fallback is invoked, THEN the system MUST ensure that no private student records, unpublished assessment content, or personal data beyond the necessary query and retrieved context is transmitted to the external provider.
5. WHEN a tutor response is generated, THEN it MUST include source references (lesson title and excerpt) where the retrieved content was used; IF no relevant source exists, the system MUST acknowledge the limitation rather than fabricate course-specific facts.
6. WHEN a student views conversation history, THEN only that student's own conversations MUST be accessible; other students' conversations MUST be inaccessible.
7. WHEN a student deletes a conversation, THEN the conversation and all its messages MUST be permanently deleted from the student's account.
8. IF course access is revoked (enrollment withdrawn or rejected), THEN the vector retrieval MUST respect the enrollment check and return no results from that course's index.

---

## Requirement 17: AI Personalized Study Planner

**User Story:** As a student, I want the AI to generate a weekly study plan based on my deadlines, progress, and availability, so that I can organize my time effectively.

### Acceptance Criteria

1. WHEN a student requests a study plan, THEN the AI MUST use the student's actual data: remaining lessons, assignment due dates, quiz windows, incomplete modules, quiz performance history, and stated study availability.
2. WHEN a study plan is generated, THEN it MUST clearly distinguish AI-suggested study sessions from mandatory institutional deadlines; the planner MUST NOT modify official due dates.
3. WHEN a student marks a session as complete, THEN the record MUST be updated in the database and the plan's completion status MUST be reflected in the UI.
4. WHEN a student's deadlines or progress materially change (new assignment published, course enrolled), THEN the student MUST be offered an option to regenerate the plan; the system MUST NOT auto-overwrite an existing plan without user confirmation.
5. WHEN the study planner is displayed, THEN it MUST support weekly and monthly calendar views with filters by course.

---

## Requirement 18: AI Quiz and Flashcard Generator

**User Story:** As a student, I want to generate practice questions from my course content, so that I can revise key concepts before assessments.

### Acceptance Criteria

1. WHEN a student requests quiz generation, THEN the system MUST use the retrieved lesson content chunks as source material and MUST NOT fabricate question content unsupported by the source.
2. WHEN quiz questions are generated, THEN each question MUST include: question text, answer options (for objective types), the correct answer, and an explanation; the system MUST validate the structure before returning results.
3. WHEN a student saves generated questions, THEN they MUST be stored under the student's account and MUST NOT be visible to other users or instructors unless explicitly shared.
4. WHEN an instructor uses the quiz generator, THEN all generated questions MUST be saved as drafts in the question bank; they MUST NOT be published to a live quiz without explicit instructor review and publication action.
5. WHEN flashcards are generated, THEN each card MUST have a front (concept or question) and back (definition or answer) derived from the source content.

---

## Requirement 19: AI Notes and Content Summarizer

**User Story:** As a student, I want to get AI-generated summaries of lesson content and documents, so that I can quickly review key points and create revision materials.

### Acceptance Criteria

1. WHEN a student requests a lesson summary, THEN the AI MUST process the lesson's content (text, transcript, or indexed document chunks) as the source and produce a summary grounded in that source.
2. WHEN a document is uploaded for summarization, THEN the system MUST validate: file type (PDF, DOCX, TXT), file size (maximum 20 MB), and content readability before processing.
3. WHEN a summary is generated, THEN it MUST reflect the supplied source and MUST NOT introduce claims absent from the source material.
4. WHEN a generated note is saved, THEN it MUST be associated with the student's account and optionally linked to the source lesson or course; it MUST be editable and deletable by the student.
5. WHEN document processing fails (unsupported format, unreadable file, extraction error), THEN the system MUST return a clear error message describing the failure reason, not a generic server error.

---

## Requirement 20: AI Instructor Copilot

**User Story:** As an instructor, I want an AI assistant in my dashboard that helps me draft course materials, generate assessment drafts, and understand student performance, so that I can save time and improve content quality.

### Acceptance Criteria

1. WHEN an instructor requests AI drafting assistance, THEN the copilot MUST be able to generate: course descriptions, learning outcomes, lesson outlines, assignment instructions, quiz question drafts, and rubric suggestions.
2. WHEN the copilot generates content, THEN the instructor MUST be presented with options to accept, edit, regenerate, or discard the suggestion before it is applied to any course resource.
3. WHEN AI-generated content is accepted, THEN it MUST be saved as a draft; it MUST NOT be published to students without the instructor explicitly triggering publication.
4. WHEN the copilot generates assessment drafts, THEN it MUST use the course topic and learning objectives as context; generated questions MUST be saved to the draft question bank, not the live quiz.
5. WHEN the copilot summarizes student performance trends, THEN it MUST only use grade and activity data from courses the requesting instructor is assigned to.

---

## Requirement 21: AI Assignment Feedback

**User Story:** As a student, I want AI-generated formative feedback on my assignment draft before I submit, so that I can improve my work proactively.

### Acceptance Criteria

1. WHEN a student requests AI feedback on an assignment, THEN the system MUST analyze the submission against the assignment instructions and rubric criteria and provide structured suggestions.
2. WHEN AI feedback is provided, THEN it MUST be clearly labeled as "AI Feedback" and distinguished from official instructor feedback; the student MUST be informed it is not a grade.
3. WHEN AI suggests rubric scores, THEN those scores MUST be presented to the instructor as suggestions only; they MUST NOT automatically become the published grade.
4. WHEN AI feedback references a rubric criterion, THEN it MUST accurately cite the criterion text from the instructor's rubric.
5. WHEN an assignment involves code submission and code feedback is configured, THEN code evaluation MUST run in an isolated, resource-limited environment and MUST NOT execute student code inside the main backend service or expose server environment variables.
6. IF the AI cannot confidently evaluate part of the submission, THEN the feedback MUST explicitly acknowledge the limitation rather than provide unsupported assessments.

---

## Requirement 22: AI Voice Tutor

**User Story:** As a student, I want to interact with the AI tutor using my voice, so that I can ask questions hands-free while reviewing content.

### Acceptance Criteria

1. WHEN a student enables voice mode, THEN the system MUST request microphone permission with a clear explanation of why it is needed and how audio is processed.
2. WHEN a student speaks a question, THEN the system MUST convert speech to text, display the transcript for the student to review and edit before submission, and only process the query when the student confirms.
3. WHEN a voice response is generated, THEN the system MUST offer text-to-speech playback with play, pause, stop, and replay controls, and MUST simultaneously display the response as text.
4. WHEN microphone access is denied or voice services are unavailable, THEN the system MUST fall back to standard text input automatically with a clear status message — voice unavailability MUST NOT block the student from using the AI tutor.
5. WHEN audio is processed by an external speech provider, THEN the system MUST inform the student that audio data is sent externally and allow them to opt out of voice mode.
6. WHEN the student is not actively recording, THEN the microphone MUST be inactive; the system MUST NOT record audio continuously.

---

## Requirement 23: AI Course Recommendations

**User Story:** As a student, I want the platform to recommend courses relevant to my interests, goals, and learning history, so that I can discover content worth pursuing next.

### Acceptance Criteria

1. WHEN recommendations are generated, THEN the system MUST use the student's stated interests, completed courses, enrolled courses, performance data, and course prerequisites as inputs.
2. WHEN a recommendation is displayed, THEN it MUST include a brief human-readable explanation of why the course is recommended (e.g., "Matches your interest in Data Science" or "Prerequisite course completed").
3. WHEN a student dismisses a recommendation, THEN it MUST be removed from the active list and MUST NOT reappear unless the student clears their dismissed list.
4. WHEN recommendations are computed, THEN enrollment rules, prerequisites, institutional eligibility, and course availability MUST be respected; unavailable courses MUST NOT be recommended.
5. WHEN a student has no learning history (new account), THEN recommendations MUST be based on stated interests from onboarding rather than returning an empty list.

---

## Requirement 24: Instructor Dashboard

**User Story:** As an instructor, I want a dedicated portal that gives me a real-time overview of my courses, students, and pending tasks, so that I can manage my teaching responsibilities efficiently.

### Acceptance Criteria

1. WHEN an instructor opens their dashboard, THEN it MUST display: assigned courses, enrollment counts, recent submissions requiring grading, upcoming deadlines, student discussion activity, and course engagement summaries — all scoped to that instructor's assigned courses.
2. WHEN an instructor views a course's student roster, THEN they MUST see enrollment status, lesson progress percentage, assignment submission status, and quiz attempt records for students in that course only.
3. WHEN an instructor accesses the grading workspace, THEN they MUST see all ungraded submissions grouped by assignment, with filters for course, submission status, and date.
4. WHEN an instructor creates or publishes a course announcement, THEN all enrolled students MUST receive an in-app notification; email notification MUST be sent according to the student's preferences.
5. WHEN an instructor requests exportable reports, THEN the export MUST be scoped to the instructor's assigned courses and MUST NOT include data from other instructors' courses.

---

## Requirement 25: Administrator Dashboard

**User Story:** As an institutional administrator, I want a comprehensive admin portal to manage users, courses, analytics, and platform configuration, so that I can govern the institution effectively.

### Acceptance Criteria

1. WHEN an administrator views the user management panel, THEN they MUST be able to search, filter, invite, create, update, suspend, and reactivate users within their institution.
2. WHEN an administrator invites a user, THEN the system MUST generate a secure, time-limited (48-hour) invitation token, send an invitation email with an enrollment link, and record the invitation status.
3. WHEN an administrator reviews pending courses, THEN they MUST be able to approve (with optional notes) or reject (with required reason) each submission, and the instructor MUST be notified of the outcome.
4. WHEN an administrator views platform analytics, THEN the data MUST be scoped to the administrator's institution; aggregate metrics MUST be computed server-side and MUST NOT be fabricated.
5. WHEN an administrator configures institutional settings (enrollment policy, AI feature toggle, certificate templates, academic terms), THEN changes MUST take effect immediately and be reflected in the institution record.
6. WHEN a sensitive administrative action is performed (suspend user, revoke certificate, delete resource), THEN the action MUST require explicit confirmation and generate an audit log entry.
7. WHEN an administrator views audit logs, THEN logs MUST be filterable by date range, action type, actor, and resource type, and MUST be read-only.

---

## Requirement 26: Notification and Communication System

**User Story:** As a user, I want to receive timely in-app and email notifications for important events, so that I am always informed about deadlines, grades, and course updates.

### Acceptance Criteria

1. WHEN a notifiable event occurs (enrollment confirmation, grade published, assignment due soon, certificate issued, course announcement), THEN the system MUST create an in-app notification record and push it to the user's notification center via SSE.
2. WHEN an email notification is triggered, THEN it MUST be queued in the background job system (BullMQ) and delivered via the configured email provider; duplicate delivery MUST be prevented.
3. WHEN a user opens the notification center, THEN they MUST see notifications sorted by newest first, with an unread count badge, and the ability to mark individual or all notifications as read.
4. WHEN a user updates notification preferences, THEN those preferences MUST be persisted and respected for future notifications; disabling email notifications for a type MUST prevent that type from being queued.
5. WHEN an instructor posts a course announcement, THEN it MUST be visible in the course workspace for all enrolled students, and enrolled students MUST receive a notification.
6. WHEN a discussion reply is posted, THEN the original thread author MUST receive a notification; moderation and deletion capabilities MUST be scoped to the author (for own posts) and instructors/admins (for any post in their course).

---

## Requirement 27: Gamification and Achievements

**User Story:** As a student, I want to earn points, badges, and achievements as I make learning progress, so that I feel motivated and recognized for my effort.

### Acceptance Criteria

1. WHEN a student completes a verifiable learning event (first enrollment, lesson completion, course completion, quiz pass, 7-day streak), THEN the gamification engine MUST check achievement rules server-side and award the appropriate badge and points.
2. WHEN points are awarded, THEN a `pointTransaction` record MUST be created with the event type, points value, and running balance; duplicate point awards for the same event instance MUST be prevented.
3. WHEN achievements are displayed on the student's profile, THEN only verified, server-awarded achievements MUST be shown; client-side manipulation MUST NOT be able to grant achievements.
4. WHEN an institution disables leaderboards, THEN the leaderboard feature MUST be completely hidden for users in that institution.
5. WHEN gamification events overlap (e.g., course completion also triggers streak update), THEN each event type MUST be processed independently without double-counting.

---

## Requirement 28: Calendar and Scheduling

**User Story:** As a student, I want a calendar view of all my deadlines, events, and study sessions, so that I can plan my time effectively.

### Acceptance Criteria

1. WHEN a student views the calendar, THEN it MUST display: assignment deadlines, quiz open/close windows, course release dates, personal study sessions, and institutional academic dates — all in the student's configured timezone.
2. WHEN a deadline or event is displayed, THEN clicking it MUST navigate the student to the relevant assignment, quiz, or course resource.
3. WHEN dates are stored in the database, THEN they MUST be stored in UTC; timezone conversion MUST be applied at the presentation layer using the user's configured timezone.
4. WHEN calendar views are toggled (monthly, weekly, agenda), THEN the selected view MUST persist across navigation within the same session.

---

## Requirement 29: File Management and Security

**User Story:** As a user, I want to upload and access files securely, knowing that access is controlled and my uploaded content is protected.

### Acceptance Criteria

1. WHEN a file upload is initiated, THEN the backend MUST generate a signed upload URL with a 5-minute expiry; the frontend MUST upload directly to object storage using that URL.
2. WHEN a file download is requested, THEN the backend MUST authorize the requesting user's access to that file, then return a signed download URL with a 15-minute expiry; raw storage keys MUST NOT be exposed in API responses.
3. WHEN a file is uploaded, THEN the server MUST validate: MIME type against the allowed list, file size against the configured maximum, and (where supported) verify the file signature matches the declared type.
4. WHEN a user deletes an account or withdraws from a course, THEN file metadata MUST be preserved in the database according to retention rules; actual storage deletion MUST only occur after the applicable retention period.

---

## Requirement 30: Design System and Theme Architecture

**User Story:** As a user, I want a polished, responsive interface with dark and light mode options that I can persist, so that my visual experience is comfortable and consistent across all pages.

### Acceptance Criteria

1. WHEN the application loads, THEN it MUST apply the user's persisted theme preference (dark, light, or system) without a visible flash of the incorrect theme.
2. WHEN dark mode is active, THEN all backgrounds, surfaces, text, borders, charts, modals, and form inputs MUST use the dark design token values; pure black backgrounds MUST be avoided in favor of deep charcoal or midnight navy.
3. WHEN light mode is active, THEN all surfaces MUST use the soft-neutral design token values (off-white, mist gray, or pale slate); plain white (#ffffff) backgrounds MUST be used only for elevated card surfaces, not as the base background.
4. WHEN a user changes their theme preference, THEN the change MUST be applied instantly across the entire application, persisted to the user's profile, and reflected on next login.
5. WHEN a user selects "system" theme, THEN the application MUST use the `prefers-color-scheme` media query to detect the OS preference and apply the corresponding theme.
6. WHEN interactive elements (buttons, cards, navigation items, table rows, dropdowns) are hovered, THEN they MUST provide clear visual feedback via smooth color, shadow, or elevation transitions.
7. WHEN a loading state is active, THEN skeleton loaders MUST be used for content-heavy screens and spinner indicators for shorter async operations; no blank or unresponsive screens MUST be shown during data fetching.
8. WHEN an animation is shown, THEN the system MUST respect the `prefers-reduced-motion` media query and suppress non-essential animations for users who have enabled that accessibility preference.

---

## Requirement 31: API Design and Background Processing

**User Story:** As a platform engineer, I want a clean, versioned, and secured REST API with background job processing, so that the system is maintainable, reliable, and handles asynchronous tasks correctly.

### Acceptance Criteria

1. WHEN an API endpoint is called, THEN it MUST return a consistent JSON response structure with `success`, `data`, `meta` (for paginated responses), and `requestId` fields.
2. WHEN a validation error occurs, THEN the API MUST return HTTP 400 with an `error` object containing a `code`, human-readable `message`, and per-field `details` array.
3. WHEN a background job is created (certificate generation, email delivery, AI indexing, reminder scheduling), THEN it MUST be added to the appropriate BullMQ queue and MUST NOT block the HTTP response.
4. WHEN a background job fails, THEN the job MUST be retried according to the queue's retry policy; after exhausting retries, it MUST be moved to a dead-letter state and visible to administrators.
5. WHEN scheduled jobs run (hourly deadline reminders, nightly analytics aggregation), THEN duplicate execution MUST be prevented using job deduplication keys.
6. WHEN the AI FastAPI service is called by the Express API, THEN the request MUST include an internal authentication secret; the FastAPI service MUST reject requests lacking a valid internal secret to prevent direct public access.
7. WHEN rate limiting is applied, THEN unauthenticated requests MUST have a lower limit than authenticated requests, and authenticated AI feature requests MUST have per-user quota enforcement.

---

## Non-Functional Requirements

### Performance

- API endpoints for non-AI operations MUST respond within 500 ms at the 95th percentile under normal load.
- Database queries on large collections MUST use the defined compound indexes and MUST NOT perform full collection scans in production.
- Paginated endpoints MUST default to a maximum of 50 items per page and support cursor-based or offset-based pagination.

### Scalability

- The multi-tenant design MUST support adding new institutions without schema changes.
- Background job queues MUST be configurable with worker concurrency to support horizontal scaling.

### Reliability

- The AI orchestrator MUST implement circuit breakers and exponential backoff for provider failures.
- Database transactions MUST be used for certificate issuance, enrollment state changes, and grade finalization to prevent partial writes.

### Security

- All secrets (API keys, OAuth credentials, encryption keys) MUST be stored in environment variables or a secrets manager and MUST NOT appear in source code or client bundles.
- The `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security` headers MUST be set on all responses.

### Accessibility

- All interactive elements MUST have keyboard-accessible focus states and ARIA labels where native semantics are insufficient.
- Color MUST NOT be the sole means of conveying status or selection; supporting icons, labels, or patterns MUST be used.

### Observability

- All API requests MUST be logged with a `requestId`, endpoint, status code, and duration.
- Health check endpoints MUST be available at `/health` (Express) and `/ai/health` (FastAPI).
- Failed background jobs MUST be visible in an administrative monitoring interface.

---

*Requirements Version: 1.0 | Feature: omniclass-lms | Workflow: Design-First | Derived from: design.md v1.0*
