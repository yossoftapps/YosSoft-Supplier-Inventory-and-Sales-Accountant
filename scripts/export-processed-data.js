#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import logic functions
import { calculateNetPurchases } from '../src/logic/netPurchasesLogic.js';
import { calculateNetSales } from '../src/logic/netSalesLogic.js';
import { processPhysicalInventory } from '../src/logic/physicalInventoryLogic.js';
import { calculateExcessInventory } from '../src/logic/excessInventoryLogic.js';
import { calculateEndingInventory } from '../src/logic/endingInventoryLogic.js';
import { calculateSalesCost } from '../src/logic/salesCostLogic.js';
import { calculateSupplierPayables } from '../src/logic/supplierPayablesLogic.js';
import { calculateBookInventory } from '../src/logic/bookInventoryLogic.js';
import { calculateAbnormalItems } from '../src/logic/abnormalItemsLogic.js';
import { calculatePreparingReturns } from '../src/logic/preparingReturnsLogic.js';
import { calculateMainAccountsSummary } from '../src/logic/mainAccountsLogic.js';

import { validateAllTables, normalizeData } from '../src/validator/schemaValidator.js';

async function exportProcessedData() {
  try {
    const filePath = path.join(__dirname, '../smallSample.xlsx');

    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetMap = {
      'مشتريات': 'purchases',
      'Purchases': 'purchases',
      'مبيعات': 'sales',
      'Sales': 'sales',
      'المخزون': 'physicalInventory',
      'Physical_Inventory': 'physicalInventory',
      'الارصدة': 'supplierbalances',
      'Supplier_Balances': 'supplierbalances'
    };

    const rawData = {};
    for (const [sheetName, dataKey] of Object.entries(sheetMap)) {
      if (workbook.SheetNames.includes(sheetName)) {
        const ws = workbook.Sheets[sheetName];
        const rawArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        rawData[dataKey] = rawArray;
      }
    }

    const requiredKeys = ['purchases', 'sales', 'physicalInventory', 'supplierbalances'];
    for (const key of requiredKeys) {
      if (!rawData[key]) throw new Error(`Missing required sheet: ${key}`);
    }

    const validationResults = validateAllTables(rawData);
    if (!validationResults.isValid) {
      console.error('Validation failed:', validationResults.errors);
      process.exit(2);
    }

    const normalizedData = {
      purchases: normalizeData(rawData.purchases, 'purchases'),
      sales: normalizeData(rawData.sales, 'sales'),
      physicalInventory: normalizeData(rawData.physicalInventory, 'physicalInventory'),
      supplierbalances: normalizeData(rawData.supplierbalances, 'supplierbalances')
    };

    // Compute pipeline
    const netPurchasesResult = await calculateNetPurchases(normalizedData.purchases, [], rawData.purchases[0]);
    const netSalesResult = await calculateNetSales(normalizedData.sales, [], rawData.sales[0]);
    const physicalInventoryResult = await processPhysicalInventory(normalizedData.physicalInventory);
    const netPurchasesCombined = [ ...(netPurchasesResult.netPurchasesList || []), ...(netPurchasesResult.orphanReturnsList || []) ];
    const netSalesCombined = [ ...(netSalesResult.netSalesList || []), ...(netSalesResult.orphanReturnsList || []) ];
    const excessInventoryResult = await calculateExcessInventory(normalizedData.physicalInventory, normalizedData.sales, netPurchasesCombined, netSalesCombined);
    const endingInventoryResult = await calculateEndingInventory(netPurchasesCombined, physicalInventoryResult.listE, excessInventoryResult);
    const salesCostResult = await calculateSalesCost(endingInventoryResult.updatedNetPurchasesList, netSalesCombined);
    const suppliersPayablesResult = await calculateSupplierPayables(normalizedData.supplierbalances, endingInventoryResult.endingInventoryList);
    const bookInventoryResult = calculateBookInventory(netPurchasesCombined, netSalesCombined);
    const abnormalItemsResult = await calculateAbnormalItems(netPurchasesResult, netSalesResult, physicalInventoryResult);
    const preparingReturnsResult = await calculatePreparingReturns(endingInventoryResult.endingInventoryList);
    const mainAccountsResult = await calculateMainAccountsSummary(suppliersPayablesResult);

    const processedData = {
      netPurchases: netPurchasesResult,
      netSales: netSalesResult,
      physicalInventory: physicalInventoryResult,
      excessInventory: excessInventoryResult,
      endingInventory: endingInventoryResult,
      salesCost: salesCostResult,
      suppliersPayables: suppliersPayablesResult,
      bookInventory: bookInventoryResult,
      abnormalItems: abnormalItemsResult,
      preparingReturns: preparingReturnsResult,
      mainAccounts: mainAccountsResult
    };

    const outDir = path.join(__dirname, '../public/dev');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'processedData.json');
    fs.writeFileSync(outPath, JSON.stringify(processedData, null, 2));
    console.log('✅ Exported processedData to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('Export failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

exportProcessedData();
