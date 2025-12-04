#!/usr/bin/env node
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const wb = XLSX.utils.book_new();

// purchases sheet
const purchases = [
  ['code', 'name', 'unit', 'quantity', 'inventory_qty', 'unit_price', 'expiry_date', 'supplier', 'transaction_date', 'operation_type', 'record_number', 'notes'],
  ['P001', 'Product A', 'pcs', 10, 10, 5.5, '2026-01-01', 'Supplier X', '2025-11-10', 'purchase', '1001', 'ok'],
  ['P002', 'Product B', 'pcs', 20, 18, 3.25, '', 'Supplier Y', '2025-11-11', 'purchase', '1002', 'partial']
];

// sales sheet
const sales = [
  ['code', 'name', 'unit', 'quantity', 'unit_price', 'transaction_date', 'supplier'],
  ['S001', 'Product A', 'pcs', 5, 6.0, '2025-11-12', 'Customer A']
];

// physicalInventory
const physicalInventory = [
  ['index', 'code', 'name', 'unit', 'quantity', 'inventory_qty'],
  [1, 'P001', 'Product A', 'pcs', 10, 10]
];

// supplierbalances
const supplierbalances = [
  ['supplier', 'balance'],
  ['Supplier X', 1000]
];

XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(purchases), 'purchases');
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sales), 'sales');
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(physicalInventory), 'physicalInventory');
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(supplierbalances), 'supplierbalances');

const outPath = path.join(process.cwd(), 'sample.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Created sample file at', outPath);
