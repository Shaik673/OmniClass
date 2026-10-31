import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
const artifactScreenshotsDir = 'C:\\Users\\shaik\\.gemini\\antigravity\\brain\\cd8987eb-cb9c-4198-8ade-faa455abf231\\screenshots';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log('Launching browser for Admin Dashboard capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  try {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await wait(600);

    // Clear and enter admin credentials
    const emailInput = await page.$('input[type="email"]');
    await emailInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await emailInput.type('admin@northstar.local', { delay: 15 });

    const passInput = await page.$('input[type="password"]');
    await passInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await passInput.type('ChangeMe123!', { delay: 15 });

    await page.click('button.auth-submit');
    await wait(3500);

    // 1. Admin Main Governance Dashboard
    console.log('Capturing: 16_admin_dashboard.png');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await wait(2000);
    const p1 = path.join(screenshotsDir, '16_admin_dashboard.png');
    await page.screenshot({ path: p1 });
    fs.copyFileSync(p1, path.join(artifactScreenshotsDir, '16_admin_dashboard.png'));

    // 2. Admin User Directory
    console.log('Capturing: 16b_admin_users.png');
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle0' });
    await wait(2000);
    const p2 = path.join(screenshotsDir, '16b_admin_users.png');
    await page.screenshot({ path: p2 });
    fs.copyFileSync(p2, path.join(artifactScreenshotsDir, '16b_admin_users.png'));

    // 3. Admin Course Approvals
    console.log('Capturing: 16c_admin_approvals.png');
    await page.goto(`${BASE_URL}/admin/approvals`, { waitUntil: 'networkidle0' });
    await wait(2000);
    const p3 = path.join(screenshotsDir, '16c_admin_approvals.png');
    await page.screenshot({ path: p3 });
    fs.copyFileSync(p3, path.join(artifactScreenshotsDir, '16c_admin_approvals.png'));

    // 4. Admin Institutional Settings
    console.log('Capturing: 16d_admin_settings.png');
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle0' });
    await wait(2000);
    const p4 = path.join(screenshotsDir, '16d_admin_settings.png');
    await page.screenshot({ path: p4 });
    fs.copyFileSync(p4, path.join(artifactScreenshotsDir, '16d_admin_settings.png'));

    console.log('ALL ADMIN DASHBOARD SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during admin capture:', err);
  } finally {
    await browser.close();
  }
}

run();

