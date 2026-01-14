#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { EXPIRY_RISK_DEFAULT_COLUMNS } from '../src/constants/expiryRiskColumns.js';
import { calculateExpiryRiskForecast } from '../src/logic/expiryRiskLogic.js';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addDays = (d, days) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

(async () => {
  try {
    const expectedOrder = ['م','رمز المادة','اسم المادة','الوحدة','رقم السجل','الكمية الحالية','تاريخ الصلاحية','الأيام المتبقية','معدل البيع اليومي','الكمية المتوقعة للبيع','الخطر المتوقع','نسبة الخطر %','بيان الانتهاء'];

    const titles = EXPIRY_RISK_DEFAULT_COLUMNS.map(c => c.title);
    const missing = expectedOrder.filter(t => !titles.includes(t));
    if (missing.length > 0) throw new Error(`Missing expected columns: ${missing.join(', ')}`);

    for (let i = 0; i < expectedOrder.length; i++) {
      if (titles[i] !== expectedOrder[i]) throw new Error(`Column order mismatch at index ${i}: expected '${expectedOrder[i]}', found '${titles[i]}'`);
    }

    const hasChildren = EXPIRY_RISK_DEFAULT_COLUMNS.some(c => c.children && c.children.length > 0);
    if (hasChildren) throw new Error('Found grouped header columns (children property). Headers must be single-row.');

    const today = new Date();

    // Build sales data to create average daily rates
    // E1 -> avg daily rate 9
    // E2 -> avg daily rate 7
    // E3 -> avg daily rate 1
    // E4 -> avg daily rate 3
    const salesData = [
      // E1 two days
      { 'رمز المادة': 'E1', 'تاريخ العملية': addDays(today, -2), 'الكمية': 9 },
      { 'رمز المادة': 'E1', 'تاريخ العملية': addDays(today, -1), 'الكمية': 9 },
      // E2 one day
      { 'رمز المادة': 'E2', 'تاريخ العملية': addDays(today, -1), 'الكمية': 7 },
      // E3 one day
      { 'رمز المادة': 'E3', 'تاريخ العملية': addDays(today, -1), 'الكمية': 1 },
      // E4 one day
      { 'رمز المادة': 'E4', 'تاريخ العملية': addDays(today, -1), 'الكمية': 3 }
    ];

    // Inventory batches with expiry in a set number of days from today
    const inventoryData = [
      // E1: qty 100, expiry in 10 days -> expectedSale 9*10=90 -> risk=10 -> percentage = (expectedSale/currentQty)*100 = 90% => خطير جدا
      { 'رمز المادة': 'E1', 'اسم المادة': 'مادة عالية الخطر', 'الوحدة': 'قطعة', 'رقم السجل': '1001', 'الكمية': 100, 'تاريخ الصلاحية': addDays(today, 10) },
      // E2: qty 100, expiry in 10 days -> expectedSale 7*10=70 -> percentage 70% => خطير
      { 'رمز المادة': 'E2', 'اسم المادة': 'مادة خطيرة', 'الوحدة': 'قطعة', 'رقم السجل': '1002', 'الكمية': 100, 'تاريخ الصلاحية': addDays(today, 10) },
      // E3: qty 100, expiry in 10 days -> expectedSale 1*10=10 -> percentage 10% => قليل جدا
      { 'رمز المادة': 'E3', 'اسم المادة': 'مادة منخفضة الخطر', 'الوحدة': 'قطعة', 'رقم السجل': '1003', 'الكمية': 100, 'تاريخ الصلاحية': addDays(today, 10) },
      // E4: qty 100, expiry in 10 days -> expectedSale 3*10=30 -> percentage 30% => قليل
      { 'رمز المادة': 'E4', 'اسم المادة': 'مادة وسط', 'الوحدة': 'قطعة', 'رقم السجل': '1004', 'الكمية': 100, 'تاريخ الصلاحية': addDays(today, 10) }
    ];

    const results = calculateExpiryRiskForecast(salesData, inventoryData);

    if (!Array.isArray(results) || results.length !== 4) throw new Error('Expected 4 result rows from calculateExpiryRiskForecast');

    const expectedStatements = {
      'E1': 'خطير جدا',
      'E2': 'خطير',
      'E3': 'قليل جدا',
      'E4': 'قليل'
    };

    results.forEach(r => {
      const code = r['رمز المادة'];
      const expected = expectedStatements[code];
      // Determine statement using the same classification rules
      const riskPercent = parseFloat(r['نسبة الخطر %']) || 0;
      let actual;
      if (riskPercent > 80) actual = 'خطير جدا';
      else if (riskPercent > 60) actual = 'خطير';
      else if (riskPercent > 40) actual = 'متوسط';
      else if (riskPercent > 20) actual = 'قليل';
      else actual = 'قليل جدا';
      if (actual !== expected) throw new Error(`Statement mismatch for ${code}: expected ${expected}, got ${actual}`);
    });

    // Export to XLSX and validate headers and widths
    const exportColumns = EXPIRY_RISK_DEFAULT_COLUMNS;
    const exportData = results.map(row => {
      const out = {};
      exportColumns.forEach(col => {
        const title = col.title;
        const key = col.dataIndex || col.key;
        out[title] = row[key] === undefined || row[key] === null ? '' : row[key];
      });
      // Add computed statement for export
      out['بيان الانتهاء'] = (function(code) { return expectedStatements[code]; })(row['رمز المادة']);
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
    const outPath = path.join(outDir, 'test_expiry_risk_export.xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ExpiryRiskTest');
    XLSX.writeFile(wb, outPath);

    console.log('TEST PASS: Expiry Risk statements, columns order and export widths validated — file saved to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();
