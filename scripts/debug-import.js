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

    // Basic checks: expected sheets
    const expected = ['purchases', 'sales', 'physicalInventory', 'supplierbalances'];
    const missing = expected.filter(s => !workbook.SheetNames.includes(s));
    if (missing.length) {
      console.warn('Warning: expected sheets missing:', missing.join(', '));
    } else {
      console.log('All expected sheets present.');
    }
  } catch (err) {
    console.error('Error reading sample file:', err);
    process.exit(1);
  }
}

main();
