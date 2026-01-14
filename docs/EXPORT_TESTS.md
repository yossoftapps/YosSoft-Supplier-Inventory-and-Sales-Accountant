# Export Tests

This document describes automated tests for Excel export functionality.

## Run export column test

- Purpose: Verify exported file includes only visible columns and column widths are applied (auto-fit with a reasonable max).
- Command:

```bash
npm run test:export
```

- Output: saves `logs/export-tests/test_export_columns.xlsx` and prints `TEST PASS` on success.

## Notes

- The export worker computes `!cols` with `wch` values and limits widths to `<= 50` characters.
- Current exports consider the `columnVisibility` prop if provided by the page, ensuring hidden columns are not exported.
- Next steps: Add a UI E2E test that triggers the export from the action bar and validates the downloaded file.

## UI E2E test (Puppeteer)

- Command:

```bash
npm run test:e2e-export
```

- Requirements: A dev server running at http://localhost:3005 (use `npm run dev` or `npm run electron-dev`).
- Output: saves a screenshot to `logs/screenshots/export` and prints `E2E export test completed: PASS` on success.