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

    const returnsCount = endingInventoryResult.endingInventoryList.filter(item => (parseFloat(item['معد للارجاع']) || 0) > 0).length;

    console.log('Ending Inventory:', endingInventoryResult.endingInventoryList.length);
    console.log('List B:', endingInventoryResult.listB.length);
    console.log("Items with 'معد للارجاع' > 0:", returnsCount);

    if (returnsCount > 0) {
      console.log('TEST PASSED: Preparing Returns items found.');
      process.exit(0);
    } else {
      console.error('TEST FAILED: No Preparing Returns items were found.');
      process.exit(2);
    }
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
})();