import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const URL = process.env.URL || 'http://localhost:3005/';
const outDir = path.resolve(process.cwd(), 'logs', 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const consoleMessages = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.error('PAGE_ERROR:', msg.text());
    } else {
      console.log('PAGE_LOG:', msg.text());
    }
  });

  try {
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Helper to click a menu item by visible text
    async function clickByText(text) {
      const escaped = text.replace(/"/g, '\\"');
      const link = await page.$x(`//a[contains(normalize-space(.), "${escaped}") or contains(normalize-space(.), "${escaped}")]/ancestor::li | //span[contains(normalize-space(.), "${escaped}")]`);
      if (!link || link.length === 0) {
        console.warn('Could not find element with text', text);
        return false;
      }
      await link[0].click();
      await page.waitForTimeout(800); // allow route transition
      return true;
    }

    // Navigate to المخزون النهائي
    console.log('Navigating to المخزون النهائي...');
    await clickByText('المخزون النهائي');
    await page.waitForTimeout(1500);
    const endingShot = path.join(outDir, `ending_inventory_${Date.now()}.png`);
    await page.screenshot({ path: endingShot, fullPage: true });
    console.log('Saved screenshot:', endingShot);

    // Navigate to حركة مورد
    console.log('Navigating to حركة مورد...');
    await clickByText('حركة مورد');
    await page.waitForTimeout(1500);
    const supplierShot = path.join(outDir, `supplier_movement_${Date.now()}.png`);
    await page.screenshot({ path: supplierShot, fullPage: true });
    console.log('Saved screenshot:', supplierShot);

    // Save console messages
    const logFile = path.resolve(process.cwd(), 'logs', 'screenshots', `console_logs_${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(consoleMessages, null, 2));
    console.log('Saved console logs to', logFile);

    // Check for the specific error
    const hasError = consoleMessages.some(m => m.type === 'error' && m.text && m.text.includes('Cannot convert object to primitive value'));
    if (hasError) {
      console.error('FOUND_ERROR: Cannot convert object to primitive value');
      await browser.close();
      process.exit(2);
    }

    console.log('No "Cannot convert object to primitive value" errors found in console.');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('E2E_SCRIPT_ERROR', err);
    await browser.close();
    process.exit(3);
  }
})();