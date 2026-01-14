#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ENDING_INVENTORY_DEFAULT_COLUMNS } from '../src/constants/endingInventoryColumns.js';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const expectedOrder = [
      'م','رمز المادة','اسم المادة','الوحدة','الكمية','الافرادي','الاجمالي','تاريخ الصلاحية','المورد','تاريخ الشراء','عمر الصنف','كمية المبيعات','مخزون مثالي','فائض المخزون','قيمة فائض المخزون','معد للارجاع','قيمة معد للارجاع','صنف جديد','الاحتياج','قيمة الاحتياج','نسبة الفائض','بيان الصلاحية','بيان الحركة','بيان الحالة','البيان','قيمة مخزون مثالي','قيمة فائض المخزون','قيمة معد للارجاع','قيمة صنف جديد','قيمة الاحتياج','القائمة','رقم السجل','ملاحظات'
    ];

    const titles = ENDING_INVENTORY_DEFAULT_COLUMNS.map(c => c.title);
    const missing = expectedOrder.filter(t => !titles.includes(t));
    if (missing.length > 0) throw new Error(`Missing expected columns: ${missing.join(', ')}`);

    for (let i = 0; i < expectedOrder.length; i++) {
      if (titles[i] !== expectedOrder[i]) throw new Error(`Column order mismatch at index ${i}: expected '${expectedOrder[i]}', found '${titles[i]}'`);
    }

    const hasChildren = ENDING_INVENTORY_DEFAULT_COLUMNS.some(c => c.children && c.children.length > 0);
    if (hasChildren) throw new Error('Found grouped header columns (children property). Headers must be single-row.');

    const sampleData = [
      { 'م':1, 'رمز المادة':'E001','اسم المادة':'مادة اختبار','الوحدة':'صندوق','الكمية':10,'الافرادي':5,'الاجمالي':50,'تاريخ الصلاحية':'2026-02-01','المورد':'مورد 1','تاريخ الشراء':'2025-09-01','عمر الصنف':120,'نسبة الفائض':20,'معد للارجاع':0,'الاحتياج':0,'القائمة':'A','رقم السجل':123,'ملاحظات':'' },
      { 'م':2, 'رمز المادة':'E002','اسم المادة':'منتج طويل','الوحدة':'قطعة','الكمية':200,'الافرادي':2,'الاجمالي':400,'تاريخ الصلاحية':'2026-05-01','المورد':'مورد 2','تاريخ الشراء':'2025-12-01','عمر الصنف':30,'نسبة الفائض':10,'معد للارجاع':1,'الاحتياج':5,'القائمة':'B','رقم السجل':124,'ملاحظات':'ملاحظة'}
    ];

    const exportColumns = ENDING_INVENTORY_DEFAULT_COLUMNS;
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
    const outPath = path.join(outDir, 'test_ending_inventory_export.xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EndingInventoryTest');
    XLSX.writeFile(wb, outPath);

    console.log('TEST PASS: Ending Inventory columns order and export widths validated — file saved to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();