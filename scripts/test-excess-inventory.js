#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { EXCESS_INVENTORY_DEFAULT_COLUMNS } from '../src/constants/excessInventoryColumns.js';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const expectedOrder = ['رمز المادة','اسم المادة','الوحدة','الكمية','كمية المشتريات','كمية المبيعات','المبيعات','نسبة المبيعات','فائض المخزون','نسبة الفائض','معد للارجاع','الاحتياج','بيان الفائض'];

    const titles = EXCESS_INVENTORY_DEFAULT_COLUMNS.map(c => c.title);
    const missing = expectedOrder.filter(t => !titles.includes(t));
    if (missing.length > 0) throw new Error(`Missing expected columns: ${missing.join(', ')}`);

    for (let i = 0; i < expectedOrder.length; i++) {
      if (titles[i] !== expectedOrder[i]) throw new Error(`Column order mismatch at index ${i}: expected '${expectedOrder[i]}', found '${titles[i]}'`);
    }

    const hasChildren = EXCESS_INVENTORY_DEFAULT_COLUMNS.some(c => c.children && c.children.length > 0);
    if (hasChildren) throw new Error('Found grouped header columns (children property). Headers must be single-row.');

    const sampleData = [
      { 'رمز المادة': 'X001', 'اسم المادة': 'مادة اختبار', 'الوحدة': 'صندوق', 'الكمية': 10, 'كمية المشتريات': 0, 'كمية المبيعات': 2, 'المبيعات': 5, 'فائض المخزون': 8, 'نسبة الفائض': 80, 'معد للارجاع': 0, 'الاحتياج': 0, 'بيان الفائض': 'مخزون زائد' },
      { 'رمز المادة': 'X002', 'اسم المادة': 'منتج طويل للاختبار', 'الوحدة': 'قطعة', 'الكمية': 200, 'كمية المشتريات': 20, 'كمية المبيعات': 50, 'المبيعات': 120, 'فائض المخزون': 130, 'نسبة الفائض': 65, 'معد للارجاع': 0, 'الاحتياج': 0, 'بيان الفائض': 'مخزون زائد' }
    ];

    const exportColumns = EXCESS_INVENTORY_DEFAULT_COLUMNS;
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
        const len = (val.match(/[-\u06FF\u0600-\u06FF]/g) || []).length * 1.5 + (val.length - (val.match(/[\u0600-\u06FF]/g) || []).length);
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
    const outPath = path.join(outDir, 'test_excess_inventory_export.xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ExcessInventoryTest');
    XLSX.writeFile(wb, outPath);

    console.log('TEST PASS: Excess Inventory columns order and export widths validated — file saved to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();
