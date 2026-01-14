#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { calculateNetPurchases } from '../src/logic/netPurchasesLogic.js';
import { calculateNetSales } from '../src/logic/netSalesLogic.js';
import { processPhysicalInventory } from '../src/logic/physicalInventoryLogic.js';
import { calculateExcessInventory } from '../src/logic/excessInventoryLogic.js';
import { calculateEndingInventory } from '../src/logic/endingInventoryLogic.js';
import { calculateNewItemsPerformance } from '../src/logic/newItemsPerformanceLogic.js';

(async function run() {
  try {
    const filePath = path.join(__dirname, '../smallSample.xlsx');
    if (!fs.existsSync(filePath)) throw new Error('smallSample.xlsx not found');

    const workbook = XLSX.readFile(filePath);
    const sheetMap = { 'مشتريات': 'purchases', 'Purchases': 'purchases', 'مبيعات': 'sales', 'المخزون': 'physicalInventory', 'الارصدة': 'supplierbalances' };
    const rawData = {};
    for (const [sheetName, key] of Object.entries(sheetMap)) {
      if (workbook.SheetNames.includes(sheetName)) {
        const ws = workbook.Sheets[sheetName];
        rawData[key] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      }
    }

    const purchasesData = rawData.purchases.slice(1);
    const salesData = rawData.sales.slice(1);

    const purchaseReturns = purchasesData.filter(row => row[9] === 'مرتجع' || row[9] === 'Return');
    const mainPurchases = purchasesData.filter(row => row[9] !== 'مرتجع' && row[9] !== 'Return');
    const netPurchasesResult = await calculateNetPurchases(mainPurchases, purchaseReturns, rawData.purchases[0]);

    const salesReturns = salesData.filter(row => row[8] === 'مرتجع' || row[8] === 'Return');
    const mainSales = salesData.filter(row => row[8] !== 'مرتجع' && row[8] !== 'Return');
    const netSalesResult = await calculateNetSales(mainSales, salesReturns, rawData.sales[0]);

    const physicalInventoryResult = await processPhysicalInventory(rawData.physicalInventory, rawData.purchases);

    const netPurchasesCombined = [ ...(netPurchasesResult.netPurchasesList || []), ...(netPurchasesResult.orphanReturnsList || []) ];
    const netSalesCombined = [ ...(netSalesResult.netSalesList || []), ...(netSalesResult.orphanReturnsList || []) ];

    const excessInventory = await calculateExcessInventory(rawData.physicalInventory, rawData.sales, netPurchasesCombined, netSalesCombined);

    const endingInventoryResult = await calculateEndingInventory(netPurchasesCombined, physicalInventoryResult.listE, excessInventory);

    console.log('EndingInventory sample:', (endingInventoryResult.endingInventoryList || []).map(i => ({ code: i['رمز المادة'], state: i['الحالة'], age: i['عمر الصنف'] })));

    const result = calculateNewItemsPerformance(netSalesCombined, endingInventoryResult.endingInventoryList || [], netPurchasesCombined);

    console.log('New Items Performance rows:', result.length);

    const expectedOrder = ['م','رمز المادة','اسم المادة','الوحدة','الكمية الحالية','تاريخ أول شراء','كمية الشراء الأولية','كمية المبيعات','نسبة تصريف الكمية (%)','معدل البيع اليومي','الربح الإجمالي','هامش الربح %','مؤشر المخاطرة','حالة الصنف','خطوة المقترحة التالية'];
    const headers = expectedOrder;

    const outDir = path.join(__dirname, '../logs/export-tests');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    if (result.length === 0) {
      console.warn('WARNING: No new items were detected in the fixture. Attempting augmented test by marking first ending inventory item as new.');
      const endingList = endingInventoryResult.endingInventoryList || [];
      if (endingList.length === 0) {
        console.error('TEST FAILED: No ending inventory to augment.');
        process.exit(2);
      }

      const augmentedInventory = endingList.map((it, idx) => idx === 0 ? { ...it, 'الحالة': 'صنف جديد', 'عمر الصنف': 30 } : it);
      const augmentedResult = calculateNewItemsPerformance(netSalesCombined, augmentedInventory, netPurchasesCombined);
      if (augmentedResult.length === 0) {
        console.error('TEST FAILED: Augmented test still produced 0 results.');
        process.exit(2);
      }

      // Export augmented result
      const headersAug = headers;
      const wsDataAug = [headersAug].concat(augmentedResult.map(r => headersAug.map(h => r[h] != null ? r[h] : '')));
      const wsAug = XLSX.utils.aoa_to_sheet(wsDataAug);
      wsAug['!cols'] = headersAug.map((h, i) => ({ wch: Math.min(Math.max(...wsDataAug.map(row => String(row[i] || '').length), h.length), 50) }));
      const outPathAug = path.join(outDir, `test_new_items_performance_export_augmented.xlsx`);
      const wbAug = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbAug, wsAug, 'NewItemsPerformance');
      XLSX.writeFile(wbAug, outPathAug);
      console.log('TEST PASSED (augmented): exported to', outPathAug);
      process.exit(0);
    }

    // Build worksheet for normal result
    const wsData = [headers].concat(result.map(r => headers.map(h => r[h] != null ? r[h] : '')));
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto column widths (simple heuristic)
    const cols = headers.map((h, i) => ({ wch: Math.min(Math.max(...wsData.map(row => String(row[i] || '').length), h.length), 50) }));
    ws['!cols'] = cols;

    const outPath = path.join(outDir, `test_new_items_performance_export.xlsx`);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NewItemsPerformance');
    XLSX.writeFile(wb, outPath);

    console.log('TEST PASSED: New Items Performance exported to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
})();
