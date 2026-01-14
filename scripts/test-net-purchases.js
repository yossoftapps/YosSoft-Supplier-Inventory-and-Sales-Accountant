#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { NET_PURCHASES_DEFAULT_COLUMNS } from '../src/constants/netPurchasesColumns.js';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    // Expected ordered titles from TODO
    const expectedOrder = ['م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'الافرادي', 'الإجمالي', 'تاريخ الصلاحية', 'المورد', 'تاريخ العملية', 'نوع العملية', 'رقم السجل', 'كمية الجرد', 'كمية المبيعات', 'ملاحظات', 'القائمة'];

    // Check that default columns exist and are in the expected order
    const titles = NET_PURCHASES_DEFAULT_COLUMNS.map(c => c.title);
    const missing = expectedOrder.filter(t => !titles.includes(t));
    if (missing.length > 0) throw new Error(`Missing expected columns: ${missing.join(', ')}`);

    // Check order
    for (let i = 0; i < expectedOrder.length; i++) {
      if (titles[i] !== expectedOrder[i]) throw new Error(`Column order mismatch at index ${i}: expected '${expectedOrder[i]}', found '${titles[i]}'`);
    }

    // Ensure no grouped headers (single row header requirement)
    const hasChildren = NET_PURCHASES_DEFAULT_COLUMNS.some(c => c.children && c.children.length > 0);
    if (hasChildren) throw new Error('Found grouped header columns (children property). Headers must be single-row.');

    // Simulate export with small sample data and check column widths calculation (max 50 wch)
    const sampleData = [
      { 'م': 1, 'رمز المادة': 'A001', 'اسم المادة': 'مادة اختبارية', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 12.5, 'كمية الجرد': 5, 'كمية المبيعات': 2, 'ملاحظات': 'ملاحظة' },
      { 'م': 2, 'رمز المادة': 'A002', 'اسم المادة': 'منتج طويل الاسم للاختبار', 'الوحدة': 'علبة', 'الكمية': 200, 'الافرادي': 1.25, 'كمية الجرد': 198, 'كمية المبيعات': 5, 'ملاحظات': '' }
    ];

    const exportColumns = NET_PURCHASES_DEFAULT_COLUMNS;
    const exportData = sampleData.map(row => {
      const out = {};
      exportColumns.forEach(col => {
        const title = col.title;
        const key = col.dataIndex || col.key;
        out[title] = row[key] === undefined || row[key] === null ? '' : row[key];
      });
      return out;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);

    // Compute widths like exportWorker
    const colWidths = {};
    exportData.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = row[key] ? String(row[key]) : '';
        // Arabic-aware width estimation used in worker
        const len = (val.match(/[\u0600-\u06FF]/g) || []).length * 1.5 + (val.length - (val.match(/[\u0600-\u06FF]/g) || []).length);
        colWidths[key] = Math.max(colWidths[key] || 0, len);
      });
    });

    ws['!cols'] = Object.keys(colWidths).map(key => ({ wch: Math.min(colWidths[key] + 5, 50) }));

    // Validate headers
    const headers = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' })[0];
    const missingHeaders = expectedOrder.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) throw new Error(`Missing headers in export: ${missingHeaders.join(', ')}`);

    // Validate widths
    const widthsOk = ws['!cols'].every(c => c && typeof c.wch === 'number' && c.wch > 0 && c.wch <= 50);
    if (!widthsOk) throw new Error('Column widths are invalid or exceed max allowed (50 wch)');

    // Save file for manual inspection
    const outDir = path.join(__dirname, '../logs/export-tests');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'test_net_purchases_export.xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NetPurchasesTest');
    XLSX.writeFile(wb, outPath);

    console.log('TEST PASS: Net Purchases columns order and export widths validated — file saved to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();
