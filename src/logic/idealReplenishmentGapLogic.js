import Decimal from 'decimal.js';
import { roundToInteger } from '../utils/financialCalculations.js';
import safeString from '../utils/safeString.js';

const DAYS_4_MONTHS = 120;
const DAYS_DEFAULT_WINDOW = 90; // used to compute average daily consumption

function parseDateSafe(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d)) return null;
  return d;
}

function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / msPerDay);
}

function selectPurchaseRecord(purchases, referenceDate = new Date()) {
  // purchases: array of purchase records for a given material
  if (!purchases || purchases.length === 0) return null;

  if (purchases.length === 1) return purchases[0];

  const recentCutoff = new Date(referenceDate.getTime() - DAYS_4_MONTHS * 24 * 60 * 60 * 1000);
  const recent = purchases.filter(r => {
    const d = parseDateSafe(r['تاريخ العملية'] || r['تاريخ الشراء']);
    return d && d >= recentCutoff;
  });

  if (recent.length === 1) return recent[0];

  const candidates = recent.length > 0 ? recent : purchases;

  // choose record with minimal unit price (الافرادي); if multiple, take the one with largest quantity
  let minPrice = null;
  candidates.forEach(r => {
    const p = parseFloat(r['الافرادي']) || 0;
    if (minPrice === null || p < minPrice) minPrice = p;
  });
  const minRecords = candidates.filter(r => (parseFloat(r['الافرادي']) || 0) === minPrice);
  if (minRecords.length === 1) return minRecords[0];

  // tie-breaker: largest quantity
  return minRecords.reduce((best, cur) => {
    const bq = parseFloat(best['الكمية']) || 0;
    const cq = parseFloat(cur['الكمية']) || 0;
    return cq > bq ? cur : best;
  }, minRecords[0]);
}

export const calculateIdealReplenishmentGap = (excessInventoryList = [], netSalesList = [], netPurchasesList = [], options = {}) => {
  const now = new Date();
  const salesWindowDays = options.salesWindowDays || DAYS_DEFAULT_WINDOW;

  // index purchases and sales by material code for quick lookup
  const purchasesByCode = new Map();
  for (const p of (netPurchasesList || [])) {
    const code = p['رمز المادة'];
    if (!code) continue;
    if (!purchasesByCode.has(code)) purchasesByCode.set(code, []);
    purchasesByCode.get(code).push(p);
  }

  const salesByCode = new Map();
  for (const s of (netSalesList || [])) {
    const code = s['رمز المادة'];
    if (!code) continue;
    if (!salesByCode.has(code)) salesByCode.set(code, []);
    salesByCode.get(code).push(s);
  }

  const rows = [];
  const candidates = (excessInventoryList || []).filter(r => safeString(r['بيان الفائض']).toLowerCase() === 'احتياج');

  for (const rec of candidates) {
    const code = rec['رمز المادة'];
    const name = rec['اسم المادة'];
    const unit = rec['الوحدة'];
    const qty = parseFloat(rec['الكمية']) || 0;
    const salesQty = parseFloat(rec['كمية المبيعات']) || 0;
    const salesVal = parseFloat(rec['المبيعات']) || 0;
    const need = parseFloat(rec['الاحتياج']) || 0;

    // compute average daily consumption using netSales in last salesWindowDays
    let soldInWindow = 0;
    const salesList = salesByCode.get(code) || [];
    const cutoff = new Date(now.getTime() - salesWindowDays * 24 * 60 * 60 * 1000);
    for (const s of salesList) {
      const d = parseDateSafe(s['تاريخ العملية'] || s['تاريخ']);
      if (!d) continue;
      if (d >= cutoff) soldInWindow += parseFloat(s['الكمية']) || 0;
    }
    const avgDaily = salesWindowDays > 0 ? (soldInWindow / salesWindowDays) : 0;

    // ideal purchase qty: choose max between reported need and 30 days of consumption
    const idealByConsumption = Math.ceil(avgDaily * 30);
    const idealQty = Math.max(Math.ceil(need), idealByConsumption || 0);

    // consumption duration = currentQty / avgDaily (in days)
    const consumptionDuration = avgDaily > 0 ? Math.floor(qty / avgDaily) : Number.POSITIVE_INFINITY;

    // need classification
    let needClassification = 'احتياج مؤجل';
    if (consumptionDuration <= 30) needClassification = 'احتياج عاجل';
    else if (consumptionDuration <= 60) needClassification = 'احتياج قريب';
    else if (consumptionDuration <= 90) needClassification = 'احتياج مناسب';

    // select purchase record per the 3-step rule
    const purchases = purchasesByCode.get(code) || [];
    const chosenPurchase = selectPurchaseRecord(purchases, now);
    const chosenPrice = chosenPurchase ? parseFloat(chosenPurchase['الافرادي']) || 0 : null;
    const chosenSupplier = chosenPurchase ? chosenPurchase['المورد'] : null;
    const chosenDate = chosenPurchase ? (chosenPurchase['تاريخ العملية'] || chosenPurchase['تاريخ الشراء'] || '') : '';

    rows.push({
      'م': rows.length + 1,
      'رمز المادة': code,
      'اسم المادة': name,
      'الوحدة': unit,
      'الكمية': qty,
      'كمية المبيعات': salesQty,
      'المبيعات': salesVal,
      'الاحتياج': need,
      'متوسط الاستهلاك اليومي': Number(avgDaily.toFixed(4)),
      'الكمية المثالية للشراء': idealQty,
      'مدة استهلاك المخزون': isFinite(consumptionDuration) ? consumptionDuration : '-',
      'بيان الاحتياج': needClassification,
      // debug fields (not in canonical spec but helpful for export/debug)
      'سعر الشراء المختار': chosenPrice,
      'اسم المورد المختار': chosenSupplier,
      'تاريخ الشراء المختار': chosenDate
    });
  }

  return rows;
};
