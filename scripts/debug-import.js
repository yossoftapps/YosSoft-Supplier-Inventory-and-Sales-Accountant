#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const samplePath = process.argv[2] || path.join(process.cwd(), 'sample.xlsx');

function printSheetInfo(workbook) {
  console.log('Sheets found:', workbook.SheetNames.join(', '));
  workbook.SheetNames.forEach((name) => {
    const ws = workbook.Sheets[name];
    const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`Sheet: ${name}`);
    console.log('  Rows:', json.length);
    if (json.length > 0) {
      console.log('  Headers:', JSON.stringify(json[0]));
      const sample = json.slice(1, Math.min(6, json.length));
      console.log('  Sample rows:', JSON.stringify(sample, null, 2));
    }
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
    printSheetInfo(workbook);

    // Basic checks: expected sheets (accept Arabic and English aliases)
    const aliases = {
      purchases: ['purchases', 'مشتريات'],
      sales: ['sales', 'مبيعات'],
      physicalInventory: ['physicalInventory', 'المخزون'],
      supplierbalances: ['supplierbalances', 'الارصدة']
    };

    const found = {};
    const missing = [];

    for (const key of Object.keys(aliases)) {
      const possible = aliases[key];
      const match = possible.find(name => workbook.SheetNames.includes(name));
      if (match) {
        found[key] = match;
      } else {
        missing.push(key);
      }
    }

    if (missing.length) {
      console.warn('Warning: some expected logical sheets were not found (by any alias):', missing.join(', '));
      console.log('Available sheets:', workbook.SheetNames.join(', '));
    } else {
      console.log('All expected logical sheets found. Mappings:', JSON.stringify(found));
    }
  } catch (err) {
    console.error('Error reading sample file:', err);
    process.exit(1);
  }
}

main();
