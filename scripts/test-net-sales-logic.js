#!/usr/bin/env node
import { calculateNetSales } from '../src/logic/netSalesLogic.js';

(async () => {
  try {
    console.log('Running net sales logic tests...');

    // Test 1: key1 enforces return date >= sale date (should NOT match if return date is earlier)
    const sales1 = [
      { 'م': 1, 'رمز المادة': 'S1', 'اسم المادة': 'صنف 1', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 100, 'تاريخ الصلاحية': '2026-02-10', 'تاريخ العملية': '2026-02-10', 'نوع العملية': 'مبيعات' }
    ];

    // Return dated earlier than sale (should not match after fix)
    const returns1 = [
      { 'م': 1, 'رمز المادة': 'S1', 'اسم المادة': 'صنف 1', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 100, 'تاريخ الصلاحية': '2026-02-10', 'تاريخ العملية': '2026-02-01', 'نوع العملية': 'مرتجعات' }
    ];

    const { netSalesList: r1 } = await calculateNetSales(sales1, returns1, null);
    // Since return date < sale date, the sale should remain unchanged and the orphan return becomes a negative record
    const saleRec = r1.find(r => r['القائمة'] === 'C' && r['رمز المادة'] === 'S1');
    if (!saleRec || parseFloat(saleRec['الكمية']) !== 10) throw new Error('Key1 date condition failed: sale was altered');
    const negRec = r1.find(r => r['القائمة'] === 'D' && parseFloat(r['الكمية']) < 0);
    if (!negRec) throw new Error('Key1 date condition failed: expected orphan return to be converted into negative record');

    console.log('✔ Test 1 passed: key1 date condition enforced (no matching; orphan return represented as negative record)');

    // Test 2: expiry-closest preference when matching by material+price (key 8 scenario)
    const sales2 = [
      { 'م': 1, 'رمز المادة': 'S2', 'اسم المادة': 'صنف 2', 'الوحدة': 'قطعة', 'الكمية': 50, 'الافرادي': 100, 'تاريخ الصلاحية': '2026-02-10', 'تاريخ العملية': '2026-01-01', 'نوع العملية': 'مبيعات' },
      { 'م': 2, 'رمز المادة': 'S2', 'اسم المادة': 'صنف 2', 'الوحدة': 'قطعة', 'الكمية': 50, 'الافرادي': 100, 'تاريخ الصلاحية': '2026-03-20', 'تاريخ العملية': '2026-01-02', 'نوع العملية': 'مبيعات' }
    ];

    // Return with expiry closer to 2026-02-10
    const returns2 = [
      { 'م': 1, 'رمز المادة': 'S2', 'اسم المادة': 'صنف 2', 'الوحدة': 'قطعة', 'الكمية': 20, 'الافرادي': 100, 'تاريخ الصلاحية': '2026-02-12', 'تاريخ العملية': '2026-02-15', 'نوع العملية': 'مرتجعات' }
    ];

    const { netSalesList: r2 } = await calculateNetSales(sales2, returns2, null);
    const p1 = r2.find(r => r['تاريخ الصلاحية'] === '2026-02-10');
    if (!p1) throw new Error('Expected earliest expiry record to remain');
    if (parseFloat(p1['الكمية']) !== 30) throw new Error(`Expected 30 remaining on closest expiry, got ${p1['الكمية']}`);

    console.log('✔ Test 2 passed: expiry-closest preference applied for material-level matches');

    // Test 3: orphan return converts to negative record in main list
    const sales3 = [
      { 'م': 1, 'رمز المادة': 'S3', 'اسم المادة': 'صنف 3', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 50, 'تاريخ الصلاحية': '2026-08-01', 'تاريخ العملية': '2026-01-01', 'نوع العملية': 'مبيعات' }
    ];

    const orphanReturns = [
      { 'م': 1, 'رمز المادة': 'S-X', 'اسم المادة': 'صنف مجهول', 'الوحدة': 'قطعة', 'الكمية': 5, 'الافرادي': 20, 'تاريخ الصلاحية': '2026-07-01', 'تاريخ العملية': '2026-06-01', 'نوع العملية': 'مرتجعات' }
    ];

    const { netSalesList: r3 } = await calculateNetSales(sales3, orphanReturns, null);

    const neg = r3.find(r => r['القائمة'] === 'D' && parseFloat(r['الكمية']) < 0);
    if (!neg) throw new Error('Expected orphan return to be present as negative record in netSalesList');
    if (neg['ملاحظات'] !== 'مرتجع يتيـم') throw new Error('Expected ملاحظات to be مرتجع يتيـم for orphan negative record');
    if (parseFloat(neg['الإجمالي']) >= 0) throw new Error('Expected الإجمالي to be negative for orphan negative record');

    console.log('✔ Test 3 passed: orphan return converted to negative record with proper flags and إجمالي');

    // Test 4: رقم السجل exists on output records
    const { netSalesList: r4 } = await calculateNetSales(sales3, [], null);
    const rec = r4[0];
    if (!rec['رقم السجل']) throw new Error('Expected record to have رقم السجل field');

    console.log('✔ Test 4 passed: رقم السجل present on output records');

    console.log('\nAll net sales logic tests passed.');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();