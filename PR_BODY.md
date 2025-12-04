Summary:

- Normalize imported Excel keys to Arabic UI keys to fix cases where import succeeds but reports are empty.
- Add `scripts/debug-import.js` for quick local diagnostics of sample Excel files.
- Show diagnostics/validation summary in `ImportDataPage` UI to reveal validation/sufficiency/processing issues.
- Replace deprecated AntD `Dropdown overlay` usage with `menu` items and remove `Spin tip` usage that caused console warnings.
- Add `@ant-design/icons` to `package.json`.
- Update `TODO.md` and `README.md` with actionable notes (CSP/security).

Checklist:
- [ ] npm install — succeeds
- [ ] Run `node scripts/debug-import.js sample.xlsx` — prints expected sheets/headers
- [ ] Import sample.xlsx via UI — diagnostics appear and reports populate
- [ ] No console warnings for `Spin tip` / `Dropdown overlay`
- [ ] Export and Print buttons work for `NetPurchases` (generate Excel or print preview)

Notes:
- I updated code to normalize keys and added diagnostics; please test with the included sample file.
- I added CSP/security notes to README but did not change runtime CSP behavior; please review before production.

Change summary:
- Files added: `src/utils/dataNormalizer.js`, `scripts/debug-import.js`
- Files updated: `src/App.jsx`, `src/components/PrintExportButtons.jsx`, `src/pages/ImportDataPage.jsx`, `package.json`, `TODO.md`, `README.md`

PR created by automation. Please review and merge when ready.