#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { normalizeProcessedData } from '../src/utils/dataNormalizer.js';
import { validateAllTables } from '../src/validator/schemaValidator.js';
import { calculateNetPurchases } from '../src/logic/netPurchasesLogic.js';
import { calculateNetSales } from '../src/logic/netSalesLogic.js';
import { processPhysicalInventory } from '../src/logic/physicalInventoryLogic.js';
import { calculateExcessInventory } from '../src/logic/excessInventoryLogic.js';
import { calculateEndingInventory } from '../src/logic/endingInventoryLogic.js';
import { calculateSalesCost } from '../src/logic/salesCostLogic.js';
import { calculateItemProfitability } from '../src/logic/itemProfitabilityLogic.js';
import { calculateInventoryABC } from '../src/logic/inventoryABCLogic.js';

const samplePath = process.argv[2] || path.join(process.cwd(), 'smallSample.xlsx');

function convertToObjects(data) {
  if (!data || data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

async function main() {
  if (!fs.existsSync(samplePath)) {
    console.error('Sample file not found:', samplePath);
    process.exit(2);
  }

  try {
    console.log('Reading sample file:', samplePath);
    const workbook = XLSX.readFile(samplePath);
    
    // Convert to arrays for processing
    const rawData = {
      purchases: XLSX.utils.sheet_to_json(workbook.Sheets['مشتريات'], { header: 1 }),
      sales: XLSX.utils.sheet_to_json(workbook.Sheets['مبيعات'], { header: 1 }),
      physicalInventory: XLSX.utils.sheet_to_json(workbook.Sheets['المخزون'], { header: 1 }),
      supplierbalances: XLSX.utils.sheet_to_json(workbook.Sheets['الارصدة'], { header: 1 })
    };

    console.log('Raw table row counts:', {
      purchases: rawData.purchases.length,
      sales: rawData.sales.length,
      physicalInventory: rawData.physicalInventory.length,
      supplierbalances: rawData.supplierbalances.length
    });

    // Validate data
    console.log('\nRunning validateAllTables...');
    const validationResult = validateAllTables(rawData);
    console.log('Validation result:', validationResult.isValid, validationResult.errors);

    if (!validationResult.isValid) {
      console.error('Validation failed:', validationResult.errors);
      process.exit(1);
    }

    // Process pipeline
    console.log('\nProcessing pipeline...');
    
    // Filter data
    const allPurchases = rawData.purchases.slice(1); // Skip header
    const purchaseOpIdx = rawData.purchases[0].indexOf('نوع العملية');
    const purchaseReturns = purchaseOpIdx !== -1 ? rawData.purchases.filter((r,i) => i>0 && String(r[purchaseOpIdx]).trim() === 'مرتجع') : rawData.purchases.filter((r,i) => i>0 && r[9] === 'مرتجع');
    
    const allSales = rawData.sales.slice(1); // Skip header
    const salesOpIdx = rawData.sales[0].indexOf('نوع العملية');
    const salesReturns = salesOpIdx !== -1 ? rawData.sales.filter((r,i) => i>0 && String(r[salesOpIdx]).trim() === 'مرتجع') : rawData.sales.filter((r,i) => i>0 && r[8] === 'مرتجع');

    console.log('Filtered counts: purchases:', allPurchases.length, 'purchaseReturns:', purchaseReturns.length, 'sales:', allSales.length, 'salesReturns:', salesReturns.length);

    // Calculate intermediate results
    const netPurchasesResult = calculateNetPurchases(allPurchases, purchaseReturns, rawData.purchases[0]);
    const netSalesResult = calculateNetSales(allSales, salesReturns, rawData.sales[0]);
    const physicalInventoryResult = processPhysicalInventory(rawData.physicalInventory, rawData.purchases);
    const excessInventoryResult = calculateExcessInventory(rawData.physicalInventory, rawData.sales);
    
    // Prepare combined lists for ending inventory
    const netPurchasesCombined = [ ...(netPurchasesResult.netPurchasesList || []), ...(netPurchasesResult.orphanReturnsList || []) ];
    
    // Calculate reports in correct order
    const endingInventoryResult = calculateEndingInventory(
      netPurchasesCombined,
      physicalInventoryResult.listE,
      excessInventoryResult
    );
    
    // Calculate sales cost with the correct parameters
    const salesCostResult = calculateSalesCost(
      netPurchasesResult.netPurchasesList || [],  // Just the array, not the full object
      netSalesResult.netSalesList || []           // Just the array, not the full object
    );
    
    console.log('\n=== Report Data Debug ===');
    
    // Debug Sales Cost data
    console.log('Sales Cost Result Type:', typeof salesCostResult);
    console.log('Sales Cost Keys:', Object.keys(salesCostResult || {}));
    
    if (salesCostResult && salesCostResult.costOfSalesList) {
      console.log('Sales Cost List Length:', salesCostResult.costOfSalesList.length);
      if (salesCostResult.costOfSalesList.length > 0) {
        console.log('First Sales Cost Item:', salesCostResult.costOfSalesList[0]);
      }
    }
    
    // Test Item Profitability Report
    console.log('\n--- Item Profitability Report ---');
    try {
      const itemProfitabilityResult = calculateItemProfitability(
        salesCostResult.costOfSalesList || [], 
        netSalesResult.netSalesList || []
      );
      console.log('Item Profitability Result Length:', itemProfitabilityResult.length);
      if (itemProfitabilityResult.length > 0) {
        console.log('First Item Profitability Item:', itemProfitabilityResult[0]);
        console.log('Item Profitability Report GENERATED SUCCESSFULLY');
      } else {
        console.log('⚠️  Item Profitability Report is EMPTY');
      }
    } catch (err) {
      console.error('❌ Error calculating Item Profitability:', err.message);
      console.error(err.stack);
    }
    
    // Test Inventory ABC Report
    console.log('\n--- Inventory ABC Report ---');
    try {
      const inventoryABCResult = calculateInventoryABC(salesCostResult.costOfSalesList || []);
      console.log('Inventory ABC Result Length:', inventoryABCResult.length);
      if (inventoryABCResult.length > 0) {
        console.log('First Inventory ABC Item:', inventoryABCResult[0]);
        console.log('Inventory ABC Report GENERATED SUCCESSFULLY');
      } else {
        console.log('⚠️  Inventory ABC Report is EMPTY');
      }
    } catch (err) {
      console.error('❌ Error calculating Inventory ABC:', err.message);
      console.error(err.stack);
    }

  } catch (err) {
    console.error('Pipeline error:', err);
    process.exit(1);
  }
}

main();