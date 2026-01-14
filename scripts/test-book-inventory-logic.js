#!/usr/bin/env node
import { calculateBookInventory } from '../src/logic/bookInventoryLogic.js';
import { roundToDecimalPlaces } from '../src/utils/financialCalculations.js';

(async () => {
  try {
    console.log('Running book inventory logic tests...');

    // Test 1: key1 exact expiry and equal quantity
    const purchases1 = [
      { 'م': 1, 'رمز المادة': 'B1', 'اسم المادة': 'بند 1', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 50, 'تاريخ الصلاحية': '2026-02-10', 'المورد': 'SUP', 'تاريخ العملية': '2026-01-01', 'نوع العملية': 'مشتريات', 'كمية الجرد': 0 }
    ];
    const sales1 = [
      { 'م': 1, 'رمز المادة': 'B1', 'اسم المادة': 'بند 1', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 50, 'تاريخ الصلاحية': '2026-02-10', 'تاريخ العملية': '2026-02-15', 'نوع العملية': 'مبيعات' }
    ];

    const res1 = await calculateBookInventory(purchases1, sales1);
    const matched1 = res1.find(r => r['كمية المبيعات'] && parseFloat(r['كمية المبيعات']) === 10);
    if (!matched1) throw new Error('Test1 failed: expected a full match for key1');

    console.log('✔ Test 1 passed: key1 full match (expiry + equal qty)');

    // Test 2: sale > purchase (split)
    const purchases2 = [
      { 'م': 1, 'رمز المادة': 'B2', 'اسم المادة': 'بند 2', 'الوحدة': 'قطعة', 'الكمية': 30, 'الافرادي': 20, 'تاريخ الصلاحية': '2026-03-01', 'المورد': 'SUP', 'تاريخ العملية': '2026-01-01', 'نوع العملية': 'مشتريات', 'كمية الجرد': 0 }
    ];
    const sales2 = [
      { 'م': 1, 'رمز المادة': 'B2', 'اسم المادة': 'بند 2', 'الوحدة': 'قطعة', 'الكمية': 50, 'الافرادي': 20, 'تاريخ الصلاحية': '2026-03-01', 'تاريخ العملية': '2026-02-01', 'نوع العملية': 'مبيعات' }
    ];

    const res2 = await calculateBookInventory(purchases2, sales2);
    const matched2 = res2.filter(r => r['رمز المادة'] === 'B2' && r['نوع العملية'] === 'مشتريات');
    if (matched2.length === 0) throw new Error('Test2 failed: expected matched purchase rows');
    const leftover = res2.find(r => r['رمز المادة'] === 'B2' && r['نوع العملية'] === 'مبيعات');
    if (!leftover || parseFloat(leftover['الكمية']) !== 20) throw new Error(`Test2 failed: expected leftover sale qty 20, got ${leftover && leftover['الكمية']}`);

    console.log('✔ Test 2 passed: sale > purchase splits and leftover added');

    // Test 3: key4 (purchase within 3 days after sale)
    const purchases3 = [
      { 'م': 1, 'رمز المادة': 'B3', 'اسم المادة': 'بند 3', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 5, 'تاريخ الصلاحية': '2026-04-01', 'المورد': 'SUP', 'تاريخ العملية': '2026-02-05', 'نوع العملية': 'مشتريات', 'كمية الجرد': 0 }
    ];
    const sales3 = [
      { 'م': 1, 'رمز المادة': 'B3', 'اسم المادة': 'بند 3', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 5, 'تاريخ الصلاحية': '2026-04-01', 'تاريخ العملية': '2026-02-03', 'نوع العملية': 'مبيعات' }
    ];

    const res3 = await calculateBookInventory(purchases3, sales3);
    const matched3 = res3.find(r => r['رمز المادة'] === 'B3' && r['كمية المبيعات'] && parseFloat(r['كمية المبيعات']) === 10);
    if (!matched3) throw new Error('Test3 failed: expected key4 match (purchase within 3 days)');

    console.log('✔ Test 3 passed: key4 match (purchase within 3 days)');

    // Test 4: unmatched sale becomes no-purchases
    const purchases4 = [];
    const sales4 = [
      { 'م': 1, 'رمز المادة': 'B4', 'اسم المادة': 'بند 4', 'الوحدة': 'قطعة', 'الكمية': 5, 'الافرادي': 10, 'تاريخ الصلاحية': '2026-06-01', 'تاريخ العملية': '2026-05-01', 'نوع العملية': 'مبيعات' }
    ];

    const res4 = await calculateBookInventory(purchases4, sales4);
    const noPurchases = res4.find(r => r['رمز المادة'] === 'B4' && r['ملاحظات'] === 'لايوجد مشتريات');
    if (!noPurchases) throw new Error('Test4 failed: expected unmatched sale as no-purchases record');

    console.log('✔ Test 4 passed: unmatched sale recorded as no-purchases');

    console.log('\nAll book inventory logic tests passed.');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();