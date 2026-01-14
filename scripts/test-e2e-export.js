#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    console.log('Exporting processed data fixture...');
    execSync('node scripts/export-processed-data.js', { stdio: 'inherit' });

    const url = 'http://localhost:3005';
    console.log('Waiting for dev server at', url);
    // Wait-on to ensure the server is ready (30s timeout)
    try {
      execSync(`npx wait-on ${url} --timeout 30000`, { stdio: 'inherit' });
    } catch (e) {
      console.warn('wait-on timed out or failed, continuing and hoping server is available');
    }

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Navigate to Preparing Returns page by clicking menu item
    const menuItems = await page.$$('a, button, span');
    let clicked = false;
    for (const el of menuItems) {
      const text = await page.evaluate(e => e.textContent || '', el);
      if (text && text.trim().includes('تجهيز المرتجعات')) {
        await el.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) throw new Error('Could not find Preparing Returns menu item');

    // Wait for table to render
    await page.waitForSelector('.unified-table table tbody tr', { timeout: 15000 });

    // Click the export button (text: تصدير إلى Excel)
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(e => (e.textContent || '').trim(), b);
      if (text === 'تصدير إلى Excel' || text === 'Export to Excel') {
        await b.click();
        break;
      }
    }

    // Wait for dropdown menu and click 'تصدير التقرير الحالي'
    await page.waitForTimeout(500); // small delay for menu animation
    const menuItemsDom = await page.$$('li');
    let clickedExportCurrent = false;
    for (const li of menuItemsDom) {
      const txt = await page.evaluate(el => el.textContent || '', li);
      if (txt && (txt.includes('تصدير التقرير الحالي') || txt.includes('Export Current Report'))) {
        await li.click();
        clickedExportCurrent = true;
        break;
      }
    }

    if (!clickedExportCurrent) throw new Error('Could not find export current report menu item');

    // Wait for success message (partial text match 'تم تصدير' )
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('.ant-message span')).some(n => /تم تصدير|Exported/.test(n.textContent || ''));
    }, { timeout: 20000 });

    // Save screenshot
    const screenshotsDir = path.join(__dirname, '../logs/screenshots/export');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    const screenshotPath = path.join(screenshotsDir, `export_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to', screenshotPath);

    await browser.close();
    console.log('E2E export test completed: PASS');
    process.exit(0);
  } catch (err) {
    console.error('E2E export test failed:', err && err.message);
    console.error(err && err.stack);
    process.exit(1);
  }
})();