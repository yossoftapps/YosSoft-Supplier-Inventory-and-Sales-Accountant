#!/usr/bin/env node
import { calculateSalesCost } from '../src/logic/salesCostLogic.js';

(async () => {
  try {
    console.log('Running sales cost logic tests...');

    // Test 1: Simple match - single purchase fully or partially consumed
    const purchases1 = [
      { 'م': 1, 'رمز المادة': 'A1', 'اسم المادة': 'صنف A1', 'الوحدة': 'قطعة', 'الكمية': 10, 'الافرادي': 10, 'تاريخ الصلاحية': '2026-01-01', 'تاريخ العملية': '2026-01-01', 'رقم السجل': 'P-1', '_uid': 1 }
    ];

    const sales1 = [
      { 'م': 1, 'رمز المادة': 'A1', 'اسم المادة': 'صنف A1', 'الوحدة': 'قطعة', 'الكمية': 5, 'الافرادي': 20, 'تاريخ الصلاحية': '2026-01-01', 'تاريخ العملية': '2026-01-02' }
    ];

    const { costOfSalesList: out1 } = await calculateSalesCost(purchases1, sales1);
    const rec1 = out1[0];
    const percent1 = parseInt(rec1['نسبة الربح'].replace(/[^0-9\-]/g, ''), 10);
    const totalProfit1 = parseInt(rec1['اجمالي الربح'].replace(/[^0-9\-]/g, ''), 10);

    if (percent1 !== 50) throw new Error(`Test 1 failed: expected نسبة الربح 50%, got ${rec1['نسبة الربح']}`);
    if (totalProfit1 !== 50) throw new Error(`Test 1 failed: expected اجمالي الربح 50, got ${rec1['اجمالي الربح']}`);

    console.log('✔ Test 1 passed: simple match produces correct cost percent and profit total');

    // Test 2: Sale consumes multiple purchase batches
    const purchases2 = [
      { 'م': 1, 'رمز المادة': 'B1', 'اسم المادة': 'صنف B1', 'الوحدة': 'قطعة', 'الكمية': 3, 'الافرادي': 10, 'تاريخ الصلاحية': '2026-01-01', 'تاريخ العملية': '2026-01-01', 'رقم السجل': 'P-1', '_uid': 'p1' },
      { 'م': 2, 'رمز المادة': 'B1', 'اسم المادة': 'صنف B1', 'الوحدة': 'قطعة', 'الكمية': 2, 'الافرادي': 12, 'تاريخ الصلاحية': '2026-01-01', 'تاريخ العملية': '2026-01-05', 'رقم السجل': 'P-2', '_uid': 'p2' }
    ];

    const sales2 = [
      { 'م': 1, 'رمز المادة': 'B1', 'اسم المادة': 'صنف B1', 'الوحدة': 'قطعة', 'الكمية': 4, 'الافرادي': 20, 'تاريخ الصلاحية': '2026-01-10', 'تاريخ العملية': '2026-01-10' }
    ];

    const { costOfSalesList: out2, purchaseUsageMap } = await calculateSalesCost(purchases2, sales2);
    const rec2 = out2[0];
    const percent2 = parseInt(rec2['نسبة الربح'].replace(/[^0-9\-]/g, ''), 10);
    // total cost = 3*10 + 1*12 = 42 ; sale value = 4*20 = 80 ; costPercent = 42/80*100 = 52.5 => rounded 53% (ROUND_HALF_UP)
    if (percent2 !== 53) throw new Error(`Test 2 failed: expected نسبة الربح 53%, got ${rec2['نسبة الربح']}`);

    // Verify purchase usage map shows p1 consumed 3 and p2 consumed 1
    const usageP1 = purchaseUsageMap.get('p1') || purchaseUsageMap.get(1);
    const usageP2 = purchaseUsageMap.get('p2') || purchaseUsageMap.get(2);
    const u1 = usageP1 ? parseFloat(String(usageP1)) : 0;
    const u2 = usageP2 ? parseFloat(String(usageP2)) : 0;
    if (Math.abs(u1 - 3) > 0.001) throw new Error(`Test 2 failed: expected p1 usage ~3, got ${u1}`);
    if (Math.abs(u2 - 1) > 0.001) throw new Error(`Test 2 failed: expected p2 usage ~1, got ${u2}`);

    console.log('✔ Test 2 passed: multi-batch consumption and cost percent calculation are correct');

    // Test 3: no matching purchases -> notes and cost 0
    const purchases3 = [];
    const sales3 = [
      { 'م': 1, 'رمز المادة': 'C1', 'اسم المادة': 'صنف C1', 'الوحدة': 'قطعة', 'الكمية': 2, 'الافرادي': 50, 'تاريخ الصلاحية': '', 'تاريخ العملية': '2026-02-01' }
    ];

    const { costOfSalesList: out3 } = await calculateSalesCost(purchases3, sales3);
    const rec3 = out3[0];
    if (rec3['ملاحظات'] !== 'لايوجد مشتريات') throw new Error(`Test 3 failed: expected notes 'لايوجد مشتريات', got '${rec3['ملاحظات']}'`);
    const percent3 = parseInt(rec3['نسبة الربح'].replace(/[^0-9\-]/g, ''), 10);
    if (percent3 !== 0) throw new Error(`Test 3 failed: expected نسبة الربح 0%, got ${rec3['نسبة الربح']}`);

    console.log('✔ Test 3 passed: no purchases handled correctly with zero cost percent');

    console.log('\nAll sales cost logic tests passed.');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    process.exit(1);
  }
})();