#!/usr/bin/env node
import { calculateNetPurchases } from '../src/logic/netPurchasesLogic.js';
import { roundToDecimalPlaces } from '../src/utils/financialCalculations.js';

(async () => {
  try {
    console.log('Running net purchases logic tests...');

    // Test 1: expiry-closest preference for supplier-level match (key 7)
    const purchases = [
      { 'م': 1, 'رمز المادة': 'MAT-1', 'اسم المادة': 'مادة 1', 'الوحدة': 'قطعة', 'الكمية': 50, 'الافرادي': 100, 'تاريخ الصلاحية': '2026-02-10', 'المورد': 'SUP-1', 'تاريخ العملية': '2026-01-01', 'نوع العملية': 'مشتريات' },
      { 'م': 2, 'رمز المادة': 'MAT-1', 'اسم المادة': 'مادة 1', 'الوحدة': 'قطعة', 'الكمية': 50, 'الافرادي': 110, 'تاريخ الصلاحية': '2026-03-20', 'المورد': 'SUP-1', 'تاريخ العملية': '2026-01-02', 'نوع العملية': 'مشتريات' }
    ];

    // Return with expiry closer to first purchase (2026-02-12 is closer to 2026-02-10)
    const returns = [
      { 'م': 1, 'رمز المادة': 'MAT-1', 'اسم المادة': 'مادة 1', 'الوحدة': 'قطعة', 'الكمية': 20, 'تاريخ الصلاحية': '2026-02-12', 'المورد': 'SUP-1', 'الافرادي': 105, 'تاريخ العملية': '2026-02-15', 'نوع العملية': 'مرتجعات' }
    ];

    const { netPurchasesList: res1 } = await calculateNetPurchases(purchases, returns, null);

    // Find purchase with expiry 2026-02-10
    const p1 = res1.find(r => r['تاريخ الصلاحية'] === '2026-02-10');
    if (!p1) throw new Error('Expected purchase with expiry 2026-02-10 to exist');

    // Its quantity should be reduced from 50 to 30
    if (parseFloat(p1['الكمية']) !== 30) throw new Error(`Expected quantity 30 after match, got ${p1['الكمية']}`);

    console.log('✔ Test 1 passed: expiry-closest preference applied and quantity reduced on closest expiry record');

    // Test 2: orphan return converts to negative record in main list
    const purchases2 = [
      { 'م': 1, 'رمز المادة': 'MAT-2', 'اسم المادة': 'مادة 2', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 50, 'تاريخ الصلاحية': '2026-08-01', 'المورد': 'SUP-2', 'تاريخ العملية': '2026-01-01', 'نوع العملية': 'مشتريات' }
    ];

    const orphanReturns = [
      { 'م': 1, 'رمز المادة': 'MAT-X', 'اسم المادة': 'مادة مجهولة', 'الوحدة': 'قطعة', 'الكمية': 5, 'تاريخ الصلاحية': '2026-07-01', 'المورد': 'SUP-X', 'الافرادي': 20, 'تاريخ العملية': '2026-06-01', 'نوع العملية': 'مرتجعات' }
    ];

    const { netPurchasesList: res2 } = await calculateNetPurchases(purchases2, orphanReturns, null);

    const neg = res2.find(r => r['القائمة'] === 'B' && parseFloat(r['الكمية']) < 0);
    if (!neg) throw new Error('Expected orphan return to be present as negative record in netPurchasesList');

    if (neg['ملاحظات'] !== 'مرتجع يتيـم') throw new Error('Expected ملاحظات to be مرتجع يتيـم for orphan negative record');

    if (parseFloat(neg['الإجمالي']) >= 0) throw new Error('Expected الإجمالي to be negative for orphan negative record');

    console.log('✔ Test 2 passed: orphan return converted to negative record with proper flags and إجمالي');

    // Test 3: رقم السجل exists on purchase records (fallback to sequence if missing)
    const purchases3 = [
      { 'م': 1, 'رمز المادة': 'MAT-3', 'اسم المادة': 'مادة 3', 'الوحدة': 'قطعة', 'الكمية': 5, 'الافرادي': 30, 'تاريخ الصلاحية': '2026-04-01', 'المورد': 'SUP-3', 'تاريخ العملية': '2026-01-01', 'نوع العملية': 'مشتريات' }
    ];

    const { netPurchasesList: res3 } = await calculateNetPurchases(purchases3, [], null);
    const rec = res3[0];
    if (!rec['رقم السجل']) throw new Error('Expected record to have رقم السجل field');

    console.log('✔ Test 3 passed: رقم السجل present on output records');

    console.log('\nAll net purchases logic tests passed.');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();
