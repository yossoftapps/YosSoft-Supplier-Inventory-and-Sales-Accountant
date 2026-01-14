#!/usr/bin/env node
/**
 * GUI Import Test - Simulates the ImportDataPage workflow programmatically
 * Captures all console logs and diagnostic output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import all logic functions
import { calculateNetPurchases } from '../src/logic/netPurchasesLogic.js';
import { calculateNetSales } from '../src/logic/netSalesLogic.js';
import { processPhysicalInventory } from '../src/logic/physicalInventoryLogic.js';
import { calculateExcessInventory } from '../src/logic/excessInventoryLogic.js';
import { calculateEndingInventory } from '../src/logic/endingInventoryLogic.js';
import { calculateSalesCost } from '../src/logic/salesCostLogic.js';
import { calculateSupplierPayables } from '../src/logic/supplierPayablesLogic.js';
import { calculateBookInventory } from '../src/logic/bookInventoryLogic.js';

// Import validation
import { validateAllTables } from '../src/validator/schemaValidator.js';

// Create a log capture system
const logs = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  logs.push({ level: 'log', args });
  originalLog('[LOG]', ...args);
};

console.error = (...args) => {
  logs.push({ level: 'error', args });
  originalError('[ERROR]', ...args);
};

console.warn = (...args) => {
  logs.push({ level: 'warn', args });
  originalWarn('[WARN]', ...args);
};

async function runGuiImportTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         GUI IMPORT TEST - Simulating ImportDataPage         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    // Load sample Excel file
    const filePath = path.join(__dirname, '../smallSample.xlsx');
    console.log(`Loading file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    console.log('Workbook sheets:', workbook.SheetNames);

    // Read sheets with Arabic name support - IMPORTANT: header: 1 gives arrays, we need to preserve raw format
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
        // Use header: 1 to get raw array format (preserves exact data structure)
        const rawArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        rawData[dataKey] = rawArray;
        console.log(`✓ Loaded ${dataKey}: ${rawArray.length - 1} rows`);
      }
    }

    // Ensure all required sheets are present
    const requiredKeys = ['purchases', 'sales', 'physicalInventory', 'supplierbalances'];
    for (const key of requiredKeys) {
      if (!rawData[key]) {
        throw new Error(`Missing required sheet: ${key}`);
      }
    }

    console.log('\n📋 RAW DATA LOADED');
    console.log('─'.repeat(60));

    // Validate data
    console.log('\n🔍 VALIDATING DATA SCHEMA');
    console.log('─'.repeat(60));
    const validationResults = validateAllTables(rawData);
    console.log('Validation result:', validationResults.isValid ? '✓ VALID' : '✗ INVALID');
    
    if (!validationResults.isValid) {
      console.error('Validation errors:', validationResults.errors);
      return;
    }

    console.log('\n🔄 USING RAW DATA DIRECTLY (No normalizeData call)');
    console.log('─'.repeat(60));
    
    // Do NOT call normalizeData here - pass raw arrays directly to logic functions
    // The logic functions have convertToObjects to handle arrays with headers in row[0]
    const purchasesData = rawData.purchases.slice(1);
    const salesData = rawData.sales.slice(1);
    const inventoryData = rawData.physicalInventory.slice(1);
    const balancesData = rawData.supplierbalances.slice(1);

    console.log(`✓ Purchases rows: ${purchasesData.length}`);
    console.log(`✓ Sales rows: ${salesData.length}`);
    console.log(`✓ Inventory rows: ${inventoryData.length}`);
    console.log(`✓ Balances rows: ${balancesData.length}`);
    
    // Log headers and first row to debug
    console.log('\n📋 DATA STRUCTURE DEBUG:');
    console.log('Purchases headers:', rawData.purchases[0]);
    console.log('Purchases first row:', rawData.purchases[1]);
    console.log('Sales headers:', rawData.sales[0]);
    console.log('Sales first row:', rawData.sales[1]);

    // 1. Net Purchases
    console.log('\n1️⃣  Calculate Net Purchases...');
    const purchaseReturns = purchasesData.filter(row => row[9] === 'مرتجع' || row[9] === 'Return');
    const mainPurchases = purchasesData.filter(row => row[9] !== 'مرتجع' && row[9] !== 'Return');

    const netPurchasesResult = await calculateNetPurchases(mainPurchases, purchaseReturns, rawData.purchases[0]);
    console.log(`   ✓ Net Purchases: ${netPurchasesResult.netPurchasesList.length}`);
    console.log(`   ✓ Orphan Returns: ${netPurchasesResult.orphanReturnsList.length}`);

    // 2. Net Sales
    console.log('\n2️⃣  Calculate Net Sales...');
    const salesReturns = salesData.filter(row => row[8] === 'مرتجع' || row[8] === 'Return');
    const mainSales = salesData.filter(row => row[8] !== 'مرتجع' && row[8] !== 'Return');

    const netSalesResult = await calculateNetSales(mainSales, salesReturns, rawData.sales[0]);
    console.log(`   ✓ Net Sales: ${netSalesResult.netSalesList.length}`);
    console.log(`   ✓ Orphan Returns: ${netSalesResult.orphanReturnsList.length}`);

    // 3. Physical Inventory
    console.log('\n3️⃣  Process Physical Inventory...');
    const physicalInventoryResult = await processPhysicalInventory(rawData.physicalInventory, rawData.purchases);
    console.log(`   ✓ List E: ${physicalInventoryResult.listE.length}`);
    console.log(`   ✓ List F: ${physicalInventoryResult.listF.length}`);

    // Prepare combined net lists for downstream reports
    const netPurchasesCombined = [ ...(netPurchasesResult.netPurchasesList || []), ...(netPurchasesResult.orphanReturnsList || []) ];
    const netSalesCombined = [ ...(netSalesResult.netSalesList || []), ...(netSalesResult.orphanReturnsList || []) ];

    // 3.5. Excess Inventory (depends on physicalInventory and sales)
    console.log('\n3.5️⃣  Calculate Excess Inventory...');
    const excessInventoryResult = await calculateExcessInventory(rawData.physicalInventory, rawData.sales, netPurchasesCombined, netSalesCombined);
    console.log(`   ✓ Excess Inventory: ${excessInventoryResult.length}`);

    // 4. Ending Inventory
    console.log('\n4️⃣  Calculate Ending Inventory...');
    // Pass combined purchases array and physical inventory listE to the ending inventory calculator
    const endingInventoryResult = await calculateEndingInventory(
      netPurchasesCombined,
      physicalInventoryResult.listE,
      excessInventoryResult
    );
    console.log(`   ✓ Ending Inventory List: ${endingInventoryResult.endingInventoryList.length}`);
    console.log(`   ✓ List B: ${endingInventoryResult.listB.length}`);

    // Diagnostic: how many items are marked as 'معد للارجاع' > 0
    const returnsCount = endingInventoryResult.endingInventoryList.filter(item => (parseFloat(item['معد للارجاع']) || 0) > 0).length;
    console.log(`   ✓ Items with 'معد للارجاع' > 0: ${returnsCount}`);

    // 5. Book Inventory
    console.log('\n5️⃣  Calculate Book Inventory...');
    const bookInventoryResult = calculateBookInventory(
      netPurchasesCombined,
      netSalesCombined
    );
    console.log(`   ✓ Book Inventory: ${bookInventoryResult.length}`);

    // 6. Sales Cost
    console.log('\n6️⃣  Calculate Sales Cost...');
    const salesCostResult = await calculateSalesCost(
      netPurchasesCombined,
      netSalesCombined
    );
    // Note: Sales Cost returns { costOfSalesList: [...] }, not an array
    const salesCostList = salesCostResult.costOfSalesList || (Array.isArray(salesCostResult) ? salesCostResult : []);
    console.log(`   ✓ Sales Cost: ${salesCostList.length}`);

    // 7. Supplier Payables
    console.log('\n7️⃣  Calculate Supplier Payables...');
    const supplierPayablesResult = await calculateSupplierPayables(
      balancesData,
      endingInventoryResult.endingInventoryList
    );
    console.log(`   ✓ Supplier Payables: ${supplierPayablesResult.length}`);

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ FINAL PROCESSING SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Net Purchases List: ${netPurchasesResult.netPurchasesList.length}`);
    console.log(`Net Purchases Orphan Returns: ${netPurchasesResult.orphanReturnsList.length}`);
    console.log(`Net Sales List: ${netSalesResult.netSalesList.length}`);
    console.log(`Net Sales Orphan Returns: ${netSalesResult.orphanReturnsList.length}`);
    console.log(`Physical Inventory List (E): ${physicalInventoryResult.listE.length}`);
    console.log(`Physical Inventory List (F): ${physicalInventoryResult.listF.length}`);
    console.log(`Excess Inventory List: ${excessInventoryResult.length}`);
    console.log(`Ending Inventory List: ${endingInventoryResult.endingInventoryList.length}`);
    console.log(`Ending Inventory List (B): ${endingInventoryResult.listB.length}`);
    console.log(`Book Inventory List: ${bookInventoryResult.length}`);
    console.log(`Sales Cost List: ${salesCostList.length}`);
    console.log(`Suppliers Payables List: ${supplierPayablesResult.length}`);
    console.log('═'.repeat(60));

    // Sample outputs
    console.log('\n📄 SAMPLE OUTPUTS');
    console.log('─'.repeat(60));
    
    if (netPurchasesResult.netPurchasesList.length > 0) {
      console.log('\nFirst Net Purchase:');
      console.log(netPurchasesResult.netPurchasesList[0]);
    }

    if (netSalesResult.netSalesList.length > 0) {
      console.log('\nFirst Net Sale:');
      console.log(netSalesResult.netSalesList[0]);
    }

    if (salesCostList.length > 0) {
      console.log('\nFirst Sales Cost:');
      console.log(salesCostList[0]);
    }

    if (supplierPayablesResult.length > 0) {
      console.log('\nFirst Supplier Payable:');
      console.log(supplierPayablesResult[0]);
    }

    console.log('\n✅ GUI IMPORT TEST COMPLETED SUCCESSFULLY');

  } catch (error) {
    console.error('\n❌ ERROR DURING GUI IMPORT TEST:');
    console.error(error.message);
    console.error(error.stack);
  }

  // Save logs to file
  const logsPath = path.join(__dirname, '../logs', 'gui-import-test.log');
  const logsDir = path.dirname(logsPath);
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logContent = logs.map(log => {
    const timestamp = new Date().toISOString();
    return `[${log.level.toUpperCase()}] ${log.args.join(' ')}`;
  }).join('\n');

  fs.writeFileSync(logsPath, logContent);
  console.log(`\n📝 Logs saved to: ${logsPath}`);
}

runGuiImportTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
