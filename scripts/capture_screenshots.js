import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log('Launching browser with Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  try {
    // 1. Landing Page Hero
    console.log('Capturing: 01_landing_hero.png');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '01_landing_hero.png') });

    // 2. Landing Page Footer
    console.log('Capturing: 02_landing_footer.png');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await wait(1200);
    await page.screenshot({ path: path.join(screenshotsDir, '02_landing_footer.png') });

    // 3. Login Page
    console.log('Capturing: 03_login_page.png');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '03_login_page.png') });

    // 4. Register Page
    console.log('Capturing: 04_register_page.png');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '04_register_page.png') });

    // Log in as student
    console.log('Logging in as student...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await wait(500);

    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    if (emailInput && passwordInput) {
      await emailInput.type('student@northstar.local', { delay: 20 });
      await passwordInput.type('ChangeMe123!', { delay: 20 });
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
    }
    await wait(2500);

    // 5. Student Dashboard
    console.log('Capturing: 05_student_dashboard.png');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '05_student_dashboard.png') });

    // 6. Course Catalog
    console.log('Capturing: 06_course_catalog.png');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '06_course_catalog.png') });

    // 7. Course Player (5 Modules)
    console.log('Capturing: 07_course_player.png');
    await page.goto(`${BASE_URL}/learn/6ae215f550aff857923e49f9`, { waitUntil: 'networkidle0' });
    await wait(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '07_course_player.png') });

    // 8. 30-MCQ Final Proctored Exam
    console.log('Capturing: 08_proctored_exam.png');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const examBtn = btns.find(b => b.textContent.includes('Final Proctored Exam') || b.textContent.includes('Exam'));
      if (examBtn) examBtn.click();
    });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '08_proctored_exam.png') });

    // 9. AI Study Room (Omni Tutor)
    console.log('Capturing: 09_ai_omni_tutor.png');
    await page.goto(`${BASE_URL}/ai`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '09_ai_omni_tutor.png') });

    // 10. AI Study Room (Summarizer)
    console.log('Capturing: 10_ai_summarizer.png');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent.includes('Summarizer') || b.textContent.includes('Notes'));
      if (tab) tab.click();
    });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '10_ai_summarizer.png') });

    // 11. AI Study Room (Quiz & Flashcards)
    console.log('Capturing: 11_ai_quiz_flashcards.png');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent.includes('Quiz') || b.textContent.includes('Flashcard'));
      if (tab) tab.click();
    });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '11_ai_quiz_flashcards.png') });

    // 12. Certificates Page
    console.log('Capturing: 12_certificates_page.png');
    await page.goto(`${BASE_URL}/certificates`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '12_certificates_page.png') });

    // 12b. Certificate Modal
    console.log('Capturing: 12b_certificate_modal.png');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find(b => b.textContent.includes('View Certificate') || b.textContent.includes('Certificate'));
      if (viewBtn) viewBtn.click();
    });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '12b_certificate_modal.png') });

    // 13. Public Verification Page
    console.log('Capturing: 13_certificate_verification.png');
    await page.goto(`${BASE_URL}/verify/OC-UX-2026-88421`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '13_certificate_verification.png') });

    // 14. Student Profile Page
    console.log('Capturing: 14_student_profile.png');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '14_student_profile.png') });

    // Switch to Instructor
    console.log('Logging in as instructor...');
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await wait(500);

    const iEmail = await page.$('input[type="email"]');
    const iPass = await page.$('input[type="password"]');
    if (iEmail && iPass) {
      await iEmail.type('instructor@northstar.local', { delay: 20 });
      await iPass.type('ChangeMe123!', { delay: 20 });
      const submit = await page.$('button[type="submit"]');
      if (submit) await submit.click();
    }
    await wait(2500);

    // 15. Instructor Studio
    console.log('Capturing: 15_instructor_studio.png');
    await page.goto(`${BASE_URL}/teaching/builder`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '15_instructor_studio.png') });

    // Switch to Admin
    console.log('Logging in as admin...');
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await wait(500);

    const aEmail = await page.$('input[type="email"]');
    const aPass = await page.$('input[type="password"]');
    if (aEmail && aPass) {
      await aEmail.type('admin@northstar.local', { delay: 20 });
      await aPass.type('ChangeMe123!', { delay: 20 });
      const submit = await page.$('button[type="submit"]');
      if (submit) await submit.click();
    }
    await wait(2500);

    // 16. Admin Dashboard
    console.log('Capturing: 16_admin_dashboard.png');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '16_admin_dashboard.png') });

    console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error capturing screenshots:', err);
  } finally {
    await browser.close();
  }
}

run();
