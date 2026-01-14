#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { NET_SALES_DEFAULT_COLUMNS } from '../src/constants/netSalesColumns.js';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const expectedOrder = ['م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'الافرادي', 'الاجمالي', 'تاريخ الصلاحية', 'تاريخ العملية', 'نوع العملية', 'ملاحظات', 'القائمة'];

    const titles = NET_SALES_DEFAULT_COLUMNS.map(c => c.title);
    const missing = expectedOrder.filter(t => !titles.includes(t));
    if (missing.length > 0) throw new Error(`Missing expected columns: ${missing.join(', ')}`);

    for (let i = 0; i < expectedOrder.length; i++) {
      if (titles[i] !== expectedOrder[i]) throw new Error(`Column order mismatch at index ${i}: expected '${expectedOrder[i]}', found '${titles[i]}'`);
    }

    const hasChildren = NET_SALES_DEFAULT_COLUMNS.some(c => c.children && c.children.length > 0);
    if (hasChildren) throw new Error('Found grouped header columns (children property). Headers must be single-row.');

    const sampleData = [
      { 'م': 1, 'رمز المادة': 'B001', 'اسم المادة': 'مادة اختبار', 'الوحدة': 'قطعة', 'الكمية': 5, 'الافرادي': 10.0, 'ملاحظات': '' },
      { 'م': 2, 'رمز المادة': 'B002', 'اسم المادة': 'منتج آخر', 'الوحدة': 'علبة', 'الكمية': 20, 'الافرادي': 2.5, 'ملاحظات': 'نص' }
    ];

    const exportColumns = NET_SALES_DEFAULT_COLUMNS;
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

    const colWidths = {};
    exportData.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = row[key] ? String(row[key]) : '';
        const len = (val.match(/[\u0600-\u06FF]/g) || []).length * 1.5 + (val.length - (val.match(/[\u0600-\u06FF]/g) || []).length);
        colWidths[key] = Math.max(colWidths[key] || 0, len);
      });
    });
    ws['!cols'] = Object.keys(colWidths).map(key => ({ wch: Math.min(colWidths[key] + 5, 50) }));

    const headers = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' })[0];
    const missingHeaders = expectedOrder.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) throw new Error(`Missing headers in export: ${missingHeaders.join(', ')}`);

    const widthsOk = ws['!cols'].every(c => c && typeof c.wch === 'number' && c.wch > 0 && c.wch <= 50);
    if (!widthsOk) throw new Error('Column widths are invalid or exceed max allowed (50 wch)');

    const outDir = path.join(__dirname, '../logs/export-tests');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'test_net_sales_export.xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NetSalesTest');
    XLSX.writeFile(wb, outPath);

    console.log('TEST PASS: Net Sales columns order and export widths validated — file saved to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();