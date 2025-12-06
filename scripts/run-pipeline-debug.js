#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';

import { validateAllTables, normalizeData } from '../src/validator/schemaValidator.js';
import { calculateNetPurchases } from '../src/logic/netPurchasesLogic.js';
import { calculateNetSales } from '../src/logic/netSalesLogic.js';
import { processPhysicalInventory } from '../src/logic/physicalInventoryLogic.js';
import { calculateExcessInventory } from '../src/logic/excessInventoryLogic.js';
import { calculateEndingInventory } from '../src/logic/endingInventoryLogic.js';
import { calculateSalesCost } from '../src/logic/salesCostLogic.js';
import { calculateSupplierPayables } from '../src/logic/supplierPayablesLogic.js';
import { calculateBookInventory } from '../src/logic/bookInventoryLogic.js';

const samplePath = process.argv[2] || path.join(process.cwd(), 'smallSample.xlsx');

function sheetToArray(ws) {
  return XLSX.utils.sheet_to_json(ws, { header: 1 });
}

async function main() {
  if (!fs.existsSync(samplePath)) {
    console.error('Sample file not found:', samplePath);
    process.exit(2);
  }

  const workbook = XLSX.readFile(samplePath);
  console.log('Reading sample file:', samplePath);
  console.log('Sheets found:', workbook.SheetNames.join(', '));

  // Build rawData similar to electronAPI.readExcelFile
  const rawData = {
    purchases: workbook.Sheets['مشتريات'] ? sheetToArray(workbook.Sheets['مشتريات']) : (workbook.Sheets['purchases'] ? sheetToArray(workbook.Sheets['purchases']) : []),
    sales: workbook.Sheets['مبيعات'] ? sheetToArray(workbook.Sheets['مبيعات']) : (workbook.Sheets['sales'] ? sheetToArray(workbook.Sheets['sales']) : []),
    physicalInventory: workbook.Sheets['المخزون'] ? sheetToArray(workbook.Sheets['المخزون']) : (workbook.Sheets['physicalInventory'] ? sheetToArray(workbook.Sheets['physicalInventory']) : []),
    supplierbalances: workbook.Sheets['الارصدة'] ? sheetToArray(workbook.Sheets['الارصدة']) : (workbook.Sheets['supplierbalances'] ? sheetToArray(workbook.Sheets['supplierbalances']) : [])
  };

  console.log('Raw table row counts:', Object.fromEntries(Object.entries(rawData).map(([k,v]) => [k, v.length])));

  // Validate
  console.log('\nRunning validateAllTables...');
  const validation = validateAllTables(rawData);
  console.log('Validation result:', validation.isValid, validation.errors || []);

  // Normalize
  console.log('\nNormalizing data...');
  const normalizedData = {
    purchases: normalizeData(rawData.purchases, 'purchases'),
    sales: normalizeData(rawData.sales, 'sales'),
    physicalInventory: normalizeData(rawData.physicalInventory, 'physicalInventory'),
    supplierbalances: normalizeData(rawData.supplierbalances, 'supplierbalances')
  };

  console.log('Normalized counts:', Object.fromEntries(Object.entries(normalizedData).map(([k,v]) => [k, v.length])));

  try {
    console.log('\nProcessing pipeline...');

    // Filter purchases/sales as ImportDataPage does
    const purchaseHeaders = normalizedData.purchases[0] || [];
    const purchaseOpIdx = purchaseHeaders.indexOf('نوع العملية');
    const allPurchases = purchaseOpIdx !== -1 ? normalizedData.purchases.filter((r,i) => i>0 && String(r[purchaseOpIdx]).trim() === 'مشتريات') : normalizedData.purchases.filter((r,i) => i>0 && r[9] === 'مشتريات');
    const purchaseReturns = purchaseOpIdx !== -1 ? normalizedData.purchases.filter((r,i) => i>0 && String(r[purchaseOpIdx]).trim() === 'مرتجع') : normalizedData.purchases.filter((r,i) => i>0 && r[9] === 'مرتجع');

    const salesHeaders = normalizedData.sales[0] || [];
    const salesOpIdx = salesHeaders.indexOf('نوع العملية');
    const allSales = salesOpIdx !== -1 ? normalizedData.sales.filter((r,i) => i>0 && String(r[salesOpIdx]).trim() === 'مبيعات') : normalizedData.sales.filter((r,i) => i>0 && r[8] === 'مبيعات');
    const salesReturns = salesOpIdx !== -1 ? normalizedData.sales.filter((r,i) => i>0 && String(r[salesOpIdx]).trim() === 'مرتجع') : normalizedData.sales.filter((r,i) => i>0 && r[8] === 'مرتجع');

    console.log('Filtered counts: purchases:', allPurchases.length, 'purchaseReturns:', purchaseReturns.length, 'sales:', allSales.length, 'salesReturns:', salesReturns.length);

    const netPurchasesResult = calculateNetPurchases(allPurchases, purchaseReturns, normalizedData.purchases[0]);
    const netSalesResult = calculateNetSales(allSales, salesReturns, normalizedData.sales[0]);
    const physicalInventoryResult = processPhysicalInventory(normalizedData.physicalInventory);
    const excessInventoryResult = calculateExcessInventory(normalizedData.physicalInventory, normalizedData.sales);
    const endingInventoryResult = calculateEndingInventory(netPurchasesResult, physicalInventoryResult, excessInventoryResult);
    const salesCostResult = calculateSalesCost(netPurchasesResult, netSalesResult);
    const suppliersPayablesResult = calculateSupplierPayables(normalizedData.supplierbalances, endingInventoryResult.endingInventoryList);

    const netPurchasesCombined = [ ...(netPurchasesResult.netPurchasesList || []), ...(netPurchasesResult.orphanReturnsList || []) ];
    const netSalesCombined = [ ...(netSalesResult.netSalesList || []), ...(netSalesResult.orphanReturnsList || []) ];
    const bookInventoryResult = calculateBookInventory(netPurchasesCombined, netSalesCombined);

    console.log('\n=== Processing Summary ===');
    console.log('Net Purchases List:', netPurchasesResult.netPurchasesList?.length || 0);
    console.log('Net Purchases Orphan Returns:', netPurchasesResult.orphanReturnsList?.length || 0);
    console.log('Net Sales List:', netSalesResult.netSalesList?.length || 0);
    console.log('Net Sales Orphan Returns:', netSalesResult.orphanReturnsList?.length || 0);
    console.log('Physical Inventory List (E):', physicalInventoryResult.listE?.length || physicalInventoryResult.processedList?.length || 0);
    console.log('Ending Inventory List:', endingInventoryResult.endingInventoryList?.length || 0);
    // salesCost may be array or object
    const salesCostLen = Array.isArray(salesCostResult) ? salesCostResult.length : (salesCostResult?.costOfSalesList?.length || 0);
    console.log('Sales Cost List:', salesCostLen);
    console.log('Suppliers Payables List:', suppliersPayablesResult?.length || 0);
    console.log('Book Inventory List:', bookInventoryResult?.length || 0);

  } catch (err) {
    console.error('Pipeline error:', err);
  }
}

main();
