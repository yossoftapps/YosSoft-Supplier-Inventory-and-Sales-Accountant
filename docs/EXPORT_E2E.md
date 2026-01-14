# Export E2E Test (Puppeteer)

## Purpose

This script runs a Puppeteer E2E that navigates to the "Preparing Returns" page, triggers the UI export for the current report, and verifies that a success message appears.

## How it works

- Generates `public/dev/processedData.json` via `scripts/export-processed-data.js`.
- Opens the app at `http://localhost:3005` (the dev server must be running).
- Navigates to "تجهيز المرتجعات" (Preparing Returns), triggers `تصدير إلى Excel` → `تصدير التقرير الحالي`.
- Waits for the success toast and captures a screenshot at `logs/screenshots/export`.

## How to run locally

1. Start the dev server (recommended):

   npm run dev

   or start Electron dev which starts the Vite server for you:

   npm run electron-dev

2. In another shell, run:

   npm run test:e2e-export

3. Check `logs/screenshots/export` for a screenshot and the process exit code for PASS/FAIL.

## Notes for CI

- The E2E test requires a stable dev server on `http://localhost:3005`.
- Best practices:
  - Start the Vite server in the CI job and ensure it's up (use `wait-on http://localhost:3005` or similar).
  - Avoid running the server in a conflicting environment that kills it during the test.
  - Consider using a dedicated script (or `concurrently`) to start the server in background and wait-on in the job.
