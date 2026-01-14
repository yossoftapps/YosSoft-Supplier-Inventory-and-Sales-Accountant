#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import http from 'http';

import { IDEAL_REPLENISHMENT_GAP_DEFAULT_COLUMNS } from '../src/constants/idealReplenishmentGapColumns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    console.log('Exporting processed data fixture...');
    execSync('node scripts/export-processed-data.js', { stdio: 'inherit' });

    const processedPath = path.join(__dirname, '../public/dev/processedData.json');
    if (!fs.existsSync(processedPath)) throw new Error('processedData.json not found after export');

    const processed = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
    const excess = processed.excessInventory || [];
    const hasNeed = (excess || []).some(it => (it['بيان الفائض'] || '').toString() === 'احتياج');

    if (!hasNeed) {
      console.log('No items marked as احتياج; augmenting first excess inventory item for E2E test.');
      if (!excess || excess.length === 0) throw new Error('No excessInventory records to augment');
      excess[0]['بيان الفائض'] = 'احتياج';
      excess[0]['الاحتياج'] = 10;
      processed.excessInventory = excess;
      fs.writeFileSync(processedPath, JSON.stringify(processed, null, 2));
      console.log('Augmented processedData written to', processedPath);
    }

    // Launch headless browser and attempt to open the app (retry on failures)
    const baseUrl = 'http://localhost:3005';
    console.log('Attempting to open app at', baseUrl);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);

    let navigated = false;
    const maxAttempts = 12; // total ~60s with 5s timeout per attempt
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Navigation attempt ${attempt}/${maxAttempts} to ${baseUrl}`);
        await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 5000 });
        navigated = true;
        break;
      } catch (err) {
        console.warn(`Navigation attempt ${attempt} failed: ${err && err.message}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!navigated) {
      await browser.close();
      throw new Error(`E2E FAILED: Could not navigate to ${baseUrl} after ${maxAttempts} attempts`);
    }

    // Wait for app ready marker
    await page.waitForFunction(() => window?.processedData || document.querySelector('.unified-table'), { timeout: 10000 });

    // Click on menu item with text 'فجوة الشراء' or exact phrase
    const menuSelector = 'a, button, span';
    const elements = await page.$$(menuSelector);
    let clicked = false;
    for (const el of elements) {
      try {
        const text = (await page.evaluate(el => el.textContent || '', el)).trim();
        if (text && (text.includes('فجوة الشراء') || text.includes('فجوة الشراء المثالية'))) {
          await el.click();
          clicked = true;
          break;
        }
      } catch (err) { }
    }

    if (!clicked) {
      throw new Error("Could not navigate to Ideal Replenishment page (menu item not found)");
    }

    // Wait for table rows
    await page.waitForSelector('.unified-table table tbody tr', { timeout: 15000 });
    const rows = await page.$$('.unified-table table tbody tr');
    console.log('Found Ideal Replenishment rows:', rows.length);

    const screenshotsDir = path.join(__dirname, '../logs/screenshots/ideal-replenishment');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    const screenshotPath = path.join(screenshotsDir, `ideal_replenishment_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to', screenshotPath);

    if (rows.length === 0) {
      throw new Error('E2E FAILED: Ideal Replenishment showed 0 rows');
    }

    // Verify header order matches canonical titles at least for the main columns
    const headers = await page.$$eval('.unified-table table thead th', els => els.map(e => (e.textContent || '').trim()));
    const canonical = IDEAL_REPLENISHMENT_GAP_DEFAULT_COLUMNS.map(c => c.title);
    console.log('Table headers:', headers.slice(0, canonical.length));
    const firstN = canonical.length;
    const normalizedTableHeaders = headers.slice(0, firstN).map(h => h.replace(/\s+/g, ' ').trim());
    const normalizedCanonical = canonical.map(h => h.replace(/\s+/g, ' ').trim());

    let headerMismatch = false;
    for (let i = 0; i < Math.min(firstN, normalizedTableHeaders.length); i++) {
      if (normalizedTableHeaders[i] !== normalizedCanonical[i]) {
        headerMismatch = true;
        break;
      }
    }

    if (headerMismatch) {
      console.warn('Header order mismatch between UI and canonical columns; failing E2E.');
      console.log('Canonical:', normalizedCanonical);
      console.log('UI headers:', normalizedTableHeaders);
      throw new Error('E2E FAILED: Table header order does not match canonical columns');
    }

    await browser.close();
    console.log('E2E test completed: PASS');
    process.exit(0);
  } catch (err) {
    console.error('E2E test failed:', err && err.message);
    console.error(err && err.stack);
    process.exit(1);
  }
})();
