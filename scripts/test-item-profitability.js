#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ITEM_PROFITABILITY_DEFAULT_COLUMNS } from '../src/constants/itemProfitabilityColumns.js';
import { calculateItemProfitability } from '../src/logic/itemProfitabilityLogic.js';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const expectedOrder = ['م','رمز المادة','اسم المادة','الوحدة','عدد عمليات البيع','إجمالي الكمية المباعة','إجمالي قيمة المبيعات','إجمالي تكلفة المبيعات','إجمالي الربح','نسبة هامش الربح %','نسبة المساهمة في أرباح الشركة %','بيان الربحية'];

    const titles = ITEM_PROFITABILITY_DEFAULT_COLUMNS.map(c => c.title);
    const missing = expectedOrder.filter(t => !titles.includes(t));
    if (missing.length > 0) throw new Error(`Missing expected columns: ${missing.join(', ')}`);

    for (let i = 0; i < expectedOrder.length; i++) {
      if (titles[i] !== expectedOrder[i]) throw new Error(`Column order mismatch at index ${i}: expected '${expectedOrder[i]}', found '${titles[i]}'`);
    }

    const hasChildren = ITEM_PROFITABILITY_DEFAULT_COLUMNS.some(c => c.children && c.children.length > 0);
    if (hasChildren) throw new Error('Found grouped header columns (children property). Headers must be single-row.');

    // Prepare synthetic salesCostData and netPurchases to exercise different profit cases
    const salesCostData = [
      { 'رمز المادة': 'P1', 'اسم المادة': 'مادة ربحية عالية', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 200 }, // sells at 200, cost from purchases
      { 'رمز المادة': 'P2', 'اسم المادة': 'مادة ربح ضعيف', 'الوحدة': 'قطعة', 'الكمية': 5, 'الافرادي': 105 },
      { 'رمز المادة': 'P3', 'اسم المادة': 'مادة خسارة', 'الوحدة': 'قطعة', 'الكمية': 3, 'الافرادي': 50 }
    ];

    const netPurchasesData = [
      { 'رمز المادة': 'P1', 'الكمية': 10, 'الافرادي': 100 }, // high profit
      { 'رمز المادة': 'P2', 'الكمية': 5, 'الافرادي': 100 }, // low margin
      { 'رمز المادة': 'P3', 'الكمية': 3, 'الافرادي': 60 }  // loss (selling < cost)
    ];

    const results = calculateItemProfitability(salesCostData, [], netPurchasesData);

    if (!Array.isArray(results) || results.length !== 3) throw new Error('Expected 3 result rows from calculateItemProfitability');

    // Check profit statement rules
    const statements = results.map(r => {
      const totalProfit = parseFloat(r['إجمالي الربح']) || 0;
      const margin = parseFloat(r['نسبة هامش الربح %']) || 0;
      if (totalProfit <= 0) return 'خسارة';
      if (totalProfit > 0 && margin >= 5) return 'ربح';
      if (totalProfit > 0 && margin < 5) return 'ربح ضعيف';
      return '-';
    });

    // Expected mapping based on synthetic data
    const expectedMap = {
      'P1': 'ربح',
      'P2': 'ربح',
      'P3': 'خسارة'
    };

    results.forEach(r => {
      const code = r['رمز المادة'];
      const expected = expectedMap[code];
      const actual = (function() {
        const totalProfit = parseFloat(r['إجمالي الربح']) || 0;
        const margin = parseFloat(r['نسبة هامش الربح %']) || 0;
        if (totalProfit <= 0) return 'خسارة';
        if (totalProfit > 0 && margin >= 5) return 'ربح';
        if (totalProfit > 0 && margin < 5) return 'ربح ضعيف';
        return '-';
      })();
      if (actual !== expected) throw new Error(`Profit statement mismatch for ${code}: expected ${expected}, got ${actual}`);
    });

    // Export to XLSX to validate headers and widths
    const exportColumns = ITEM_PROFITABILITY_DEFAULT_COLUMNS;
    const exportData = results.map(row => {
      const out = {};
      exportColumns.forEach(col => {
        const title = col.title;
        const key = col.dataIndex || col.key;
        out[title] = row[key] === undefined || row[key] === null ? '' : row[key];
      });
      // Add computed statement for export
      const code = row['رمز المادة'];
      out['بيان الربحية'] = expectedMap[code];
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
    const outPath = path.join(outDir, 'test_item_profitability_export.xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ItemProfitTest');
    XLSX.writeFile(wb, outPath);

    console.log('TEST PASS: Item Profitability columns order, statements and export widths validated — file saved to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();
