# Net Purchases Report Fixes Summary

## Issues Identified

The net purchases report was showing empty data due to incorrect column indexing when filtering the Excel data:

1. **Incorrect Column Index for Purchases Transaction Type**:
   - The code was checking index 9 (row[9]) for the transaction type in the purchases sheet
   - According to Specifications.md, the correct index is 8 (0-based) for "نوع_العملية"

2. **Incorrect Column Index for Sales Transaction Type**:
   - The code was checking index 8 (row[8]) for the transaction type in the sales sheet
   - According to Specifications.md, the correct index is 7 (0-based) for "نوع_العملية"

## Fixes Applied

### 1. Updated ImportDataPage.jsx File

Fixed the column indexing for both purchases and sales data filtering:

```javascript
// Before:
const allPurchases = rawData.purchases.filter(row => row[9] === 'مشتريات');
const purchaseReturns = rawData.purchases.filter(row => row[9] === 'مرتجع');
const allSales = rawData.sales.filter(row => row[8] === 'مبيعات');
const salesReturns = rawData.sales.filter(row => row[8] === 'مرتجع');

// After:
const allPurchases = rawData.purchases.filter(row => row[8] === 'مشتريات');
const purchaseReturns = rawData.purchases.filter(row => row[8] === 'مرتجع');
const allSales = rawData.sales.filter(row => row[7] === 'مبيعات');
const salesReturns = rawData.sales.filter(row => row[7] === 'مرتجع');
```

## Files Responsible for Net Purchases Report

1. **src/pages/NetPurchasesPage.jsx** - The UI component that displays the report
2. **src/pages/ImportDataPage.jsx** - The data processing component that filters and processes the data
3. **src/logic/netPurchasesLogic.js** - The business logic that calculates the net purchases
4. **electron.js** - The Electron backend that reads the Excel file
5. **src/App.jsx** - The main application component that passes data between components

## Data Flow

1. **Electron Backend** reads Excel sheets and converts them to arrays
2. **ImportDataPage** receives raw data and filters purchases/sales by transaction type
3. **netPurchasesLogic.js** processes the filtered data to calculate net purchases
4. **App.jsx** passes the processed data to NetPurchasesPage for display
5. **NetPurchasesPage** renders the data in a table format

## Expected Impact

With these fixes, the net purchases report should now correctly display data when a properly formatted Excel file is imported. The filtering will now correctly separate "مشتريات" (purchases) from "مرتجع" (returns) based on the correct column indices.