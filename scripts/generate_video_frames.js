import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const framesDir = path.resolve(__dirname, '..', 'temp_video_frames');
if (fs.existsSync(framesDir)) {
  fs.rmSync(framesDir, { recursive: true, force: true });
}
fs.mkdirSync(framesDir, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
let frameIndex = 0;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureSceneFrames(page, label, count = 20, scrollDelta = 0) {
  for (let i = 0; i < count; i++) {
    if (scrollDelta !== 0) {
      await page.evaluate((delta) => window.scrollBy({ top: delta, behavior: 'smooth' }), scrollDelta);
      await wait(80);
    } else {
      await wait(100);
    }
    const framePath = path.join(framesDir, `frame_${String(frameIndex++).padStart(5, '0')}.jpg`);
    await page.screenshot({ path: framePath, type: 'jpeg', quality: 80 });
    // Write metadata file for banner
    fs.writeFileSync(framePath.replace('.jpg', '.json'), JSON.stringify({ label }));
  }
}

async function run() {
  console.log('Starting automated video recording session...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  try {
    // 1. Landing Page Hero
    console.log('Recording: Landing Page Hero & Navigation');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await wait(800);
    await captureSceneFrames(page, 'Landing Page: Next-Gen LMS Platform & Navigation', 24);

    // 2. Landing Page Scroll to Features & Courses
    console.log('Recording: Landing Page Feature Showcase & Courses');
    await captureSceneFrames(page, 'Landing Page: Curated Courses & Micro-Interactions', 20, 180);

    // 3. Landing Page Footer
    console.log('Recording: Landing Page 4-Column Footer');
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await wait(800);
    await captureSceneFrames(page, 'Landing Page: Comprehensive 4-Column Institutional Footer', 20);

    // 4. Login Page & OAuth
    console.log('Recording: Login Page & Social Auth');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await wait(800);
    await captureSceneFrames(page, 'Authentication: Social OAuth (Google, GitHub, Facebook) & Form', 22);

    // Perform Student Login
    console.log('Performing Student Login...');
    await page.type('input[type="email"]', 'student@northstar.local', { delay: 15 });
    await page.type('input[type="password"]', 'ChangeMe123!', { delay: 15 });
    await page.click('button.auth-submit');
    await wait(2500);

    // 5. Student Dashboard
    console.log('Recording: Student Learning Dashboard');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await wait(1200);
    await captureSceneFrames(page, 'Student Dashboard: Weekly Study Velocity & Mastery Analytics', 25);
    await captureSceneFrames(page, 'Student Dashboard: Enrolled Courses & Upcoming Deadlines', 18, 120);

    // 6. Course Catalog & Pro Tier
    console.log('Recording: Course Catalog');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle0' });
    await wait(1200);
    await captureSceneFrames(page, 'Course Catalog: Search, Filters & Pro Razorpay Tier (₹1,999)', 25);

    // 7. Course Player (5 Modules Curriculum)
    console.log('Recording: Course Player & 5 Modules');
    await page.goto(`${BASE_URL}/learn/6ae215f550aff857923e49f9`, { waitUntil: 'networkidle0' });
    await wait(1800);
    await captureSceneFrames(page, 'Course Player: 5 Sequential Modules & Markdown Lessons', 25);
    await captureSceneFrames(page, 'Course Player: Syntax-Highlighted Code Cards & Reading Progress', 18, 120);

    // 8. 30-MCQ Final Proctored Exam
    console.log('Recording: 30-MCQ Final Proctored Exam');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const examBtn = btns.find(b => b.textContent.includes('Final Proctored Exam') || b.textContent.includes('Exam'));
      if (examBtn) examBtn.click();
    });
    await wait(1200);
    await captureSceneFrames(page, 'Assessments: 30-MCQ Final Proctored Exam (Passing >= 70%)', 24);

    // 9. AI Study Room (Omni Tutor)
    console.log('Recording: AI Omni Tutor');
    await page.goto(`${BASE_URL}/ai`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await captureSceneFrames(page, 'AI Study Room: Omni Tutor with Live Streaming & Speech Voice', 25);

    // 10. AI Study Room - Summarizer (3 Modes)
    console.log('Recording: 3-Mode Content Summarizer');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent.includes('Summarizer') || b.textContent.includes('Notes'));
      if (tab) tab.click();
    });
    await wait(1200);
    await captureSceneFrames(page, 'Notes & Summarizer: 3 Modes (File Drop, YouTube URL, Manual Paste)', 25);

    // 11. AI Study Room - 3-Part Quiz & Flashcards
    console.log('Recording: 3-Part AI Quiz & Flashcards');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent.includes('Quiz') || b.textContent.includes('Flashcard'));
      if (tab) tab.click();
    });
    await wait(1200);
    await captureSceneFrames(page, 'AI Quiz Engine: 3-Part Active Recall & Interactive Flashcards', 25);

    // 12. Certificates Page & Modal
    console.log('Recording: Verified A4 Certificate Modal');
    await page.goto(`${BASE_URL}/certificates`, { waitUntil: 'networkidle0' });
    await wait(1200);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find(b => b.textContent.includes('View Certificate') || b.textContent.includes('Certificate'));
      if (viewBtn) viewBtn.click();
    });
    await wait(1500);
    await captureSceneFrames(page, 'Credentials: A4 Landscape Certificate with QR Code & LinkedIn Share', 28);

    // 13. Public Verification Page
    console.log('Recording: Public Verification Ledger');
    await page.goto(`${BASE_URL}/verify/OC-UX-2026-88421`, { waitUntil: 'networkidle0' });
    await wait(1200);
    await captureSceneFrames(page, 'Public Verification: Cryptographic Validation & Proctored Status', 24);

    // 14. Student Profile Page & LeetCode Verification
    console.log('Recording: Student Profile & LeetCode Validation');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle0' });
    await wait(1200);
    await captureSceneFrames(page, 'Profile: Hero Banner Upload & LeetCode Verification Token', 24);

    // 15. Instructor Studio
    console.log('Recording: Instructor Studio');
    await page.deleteCookie({ name: 'oc_session', domain: 'localhost' });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await wait(500);
    await page.type('input[type="email"]', 'instructor@northstar.local', { delay: 10 });
    await page.type('input[type="password"]', 'ChangeMe123!', { delay: 10 });
    await page.click('button.auth-submit');
    await wait(2200);
    await page.goto(`${BASE_URL}/teaching/builder`, { waitUntil: 'networkidle0' });
    await wait(1200);
    await captureSceneFrames(page, 'Instructor Studio: 5-Module Curriculum Builder & Rubrics', 24);

    // 16. Admin Dashboard
    console.log('Recording: Admin Dashboard');
    await page.deleteCookie({ name: 'oc_session', domain: 'localhost' });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await wait(500);
    await page.type('input[type="email"]', 'admin@northstar.local', { delay: 10 });
    await page.type('input[type="password"]', 'ChangeMe123!', { delay: 10 });
    await page.click('button.auth-submit');
    await wait(2200);
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await wait(1200);
    await captureSceneFrames(page, 'Admin Governance: Institutional Health KPIs & Approvals Queue', 24);

    console.log(`RECORDING COMPLETED: ${frameIndex} frames captured.`);
  } catch (err) {
    console.error('Error during video recording:', err);
  } finally {
    await browser.close();
  }
}

run();

